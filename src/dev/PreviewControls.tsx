import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { isApiError } from '@/shared/api/api-error';
import { queryClient } from '@/shared/api/query-client';
import { env, isDevelopmentBuild } from '@/shared/config/env';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useAuth } from '@/shared/session/useAuth';
import {
  DEV_PREVIEW_DOMAINS,
  getDevPreviewScenario,
  setDevPreviewScenario,
} from './mocks/scenario-runtime';
import type { DevPreviewDomain } from './mocks/scenario-runtime';
import { DEV_PREVIEW_PERSONAS } from './mocks/personas';
import type { DevPreviewPersonaId } from './mocks/personas';

const personaById = new Map(DEV_PREVIEW_PERSONAS.map((persona) => [persona.id, persona]));

const screenScenarios = [
  { id: 'home', label: 'Trang chủ', path: '/home' },
  { id: 'markets', label: 'Thị trường', path: '/markets' },
  { id: 'earn', label: 'Earn · danh mục tiết kiệm', path: '/earn/savings/portfolio' },
  { id: 'earnHistory', label: 'Earn · lịch sử tiết kiệm', path: '/earn/savings/history' },
  { id: 'discovery', label: 'Khám phá · tìm kiếm', path: '/search' },
  { id: 'dca', label: 'DCA', path: '/dca' },
  { id: 'p2p', label: 'P2P', path: '/p2p' },
] as const;

type PersonaSelection = 'guest' | DevPreviewPersonaId;
type ScreenScenarioId = (typeof screenScenarios)[number]['id'];
type InjectableScenarioState =
  | 'success'
  | 'empty'
  | 'loading'
  | 'error'
  | 'unauthorized'
  | 'forbidden'
  | 'pending'
  | 'duplicate';

function isInjectableScenarioState(state: string): state is InjectableScenarioState {
  return scenarioStates.some((candidate) => candidate.id === state);
}

const scenarioStates: { id: InjectableScenarioState; label: string }[] = [
  { id: 'success', label: 'Thành công · fixture hiện có' },
  { id: 'empty', label: 'Dữ liệu rỗng · GET theo hợp đồng' },
  { id: 'pending', label: 'Đang xử lý · receipt hoặc request-in-flight theo hợp đồng' },
  { id: 'loading', label: 'Đang tải · trì hoãn phản hồi 2 giây' },
  { id: 'error', label: 'Lỗi dịch vụ · HTTP/transport mô phỏng' },
  { id: 'unauthorized', label: 'Chưa xác thực · HTTP 401' },
  { id: 'forbidden', label: 'Không đủ quyền · HTTP 403' },
  { id: 'duplicate', label: 'Xung đột đơn · HTTP 409 theo contract' },
];

function supportsScenarioState(domain: DevPreviewDomain, state: InjectableScenarioState): boolean {
  if (state === 'empty')
    return [
      'auth',
      'market',
      'admin',
      'arena',
      'dca',
      'earn',
      'launchpad',
      'discovery',
      'p2p',
      'predictions',
      'profile',
      'referral',
      'support',
      'trading',
      'wallet',
    ].includes(domain);
  if (state === 'pending')
    return ['earn', 'p2p', 'predictions', 'trading', 'wallet'].includes(domain);
  if (state === 'duplicate') return ['p2p', 'predictions'].includes(domain);
  return true;
}

const domainLabels: Record<DevPreviewDomain, string> = {
  admin: 'Quản trị',
  arena: 'Arena',
  auth: 'Xác thực',
  dca: 'DCA',
  discovery: 'Khám phá',
  earn: 'Earn',
  launchpad: 'Launchpad',
  market: 'Thị trường',
  p2p: 'P2P',
  predictions: 'Dự đoán',
  profile: 'Hồ sơ',
  referral: 'Giới thiệu',
  support: 'Hỗ trợ',
  trading: 'Giao dịch',
  wallet: 'Ví',
};

const shellStyle: CSSProperties = {
  position: 'fixed',
  right: 16,
  bottom: 16,
  zIndex: 1200,
  width: 'min(360px, calc(100vw - 24px))',
  color: '#172033',
  font: '13px/1.45 system-ui, sans-serif',
};

const panelStyle: CSSProperties = {
  maxHeight: 'min(68vh, 560px)',
  overflowY: 'auto',
  marginTop: 8,
  padding: 16,
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  background: '#fff',
  boxShadow: '0 12px 36px rgba(15, 23, 42, .24)',
};

const fieldStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 5,
  padding: '8px 10px',
  border: '1px solid #94a3b8',
  borderRadius: 7,
  background: '#fff',
  color: '#172033',
  font: 'inherit',
};

const actionStyle: CSSProperties = {
  width: '100%',
  marginTop: 10,
  padding: '9px 12px',
  border: 0,
  borderRadius: 7,
  background: '#1d4ed8',
  color: '#fff',
  font: 'inherit',
  fontWeight: 650,
  cursor: 'pointer',
};

export function PreviewControls() {
  const storedScenario = getDevPreviewScenario();
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [personaSelection, setPersonaSelection] = useState<PersonaSelection>('guest');
  const [scenarioId, setScenarioId] = useState<ScreenScenarioId>('home');
  const [scenarioDomain, setScenarioDomain] = useState<DevPreviewDomain>(
    () => storedScenario?.domain ?? 'wallet',
  );
  const [scenarioState, setScenarioState] = useState<InjectableScenarioState>(() => {
    const state = storedScenario?.state;
    return state &&
      isInjectableScenarioState(state) &&
      supportsScenarioState(storedScenario.domain, state)
      ? state
      : 'error';
  });
  const [activeScenario, setActiveScenario] = useState(() => storedScenario);
  const [notice, setNotice] = useState('');

  if (!isDevelopmentBuild || !env.isDev || env.dataSource !== 'mock') return null;

  const applyPersona = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setNotice('');
    queryClient.clear();

    try {
      await signOut();
      queryClient.clear();

      if (personaSelection === 'guest') {
        navigate(`${routePrefix}/auth/login`);
        setNotice('Đã chuyển sang phiên khách và mở màn hình đăng nhập.');
        return;
      }

      const persona = personaById.get(personaSelection);
      if (!persona) return;

      const result = await signIn({ email: persona.email, password: persona.password });
      queryClient.clear();

      if (result.status === 'mfa_required') {
        const { challenge } = result;
        navigate(`${routePrefix}/auth/otp`, {
          replace: true,
          state: {
            challengeId: challenge.id,
            method: challenge.method,
            maskedDestination: challenge.maskedDestination,
            expiresAt: challenge.expiresAt,
          },
        });
        setNotice('Mock đã tạo thử thách MFA; dùng mã 123456 để hoàn tất.');
        return;
      }

      navigate(`${routePrefix}/home`);
      setNotice(`Đang xem bằng persona ${persona.label}.`);
    } catch (error) {
      queryClient.clear();
      if (isApiError(error) && error.status === 423) {
        navigate(`${routePrefix}/auth/account-locked`, { replace: true });
        setNotice('Mock từ chối đăng nhập tài khoản này (HTTP 423).');
      } else {
        setNotice(error instanceof Error ? error.message : 'Không thể đổi persona mock.');
      }
    } finally {
      setIsBusy(false);
    }
  };

  const openScenario = () => {
    const scenario = screenScenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) return;
    navigate(`${routePrefix}${scenario.path}`);
    setNotice(
      `Đã mở ${scenario.label}. Lối tắt này chỉ chuyển trang, không đổi trạng thái dữ liệu.`,
    );
  };

  const resetPreview = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setNotice('Đang đăng xuất, xóa cache và nạp lại fixture mock…');
    setDevPreviewScenario(null);
    queryClient.clear();
    try {
      await signOut();
    } finally {
      queryClient.clear();
      window.location.reload();
    }
  };

  const applyScenario = async () => {
    if (!supportsScenarioState(scenarioDomain, scenarioState)) {
      setNotice('Trạng thái này chưa được xác minh cho miền API đã chọn.');
      return;
    }
    const scenario = { domain: scenarioDomain, state: scenarioState };
    setDevPreviewScenario(scenario);
    setActiveScenario(scenario);
    await queryClient.invalidateQueries({ queryKey: [scenarioDomain] });
  };

  const clearScenario = async () => {
    setDevPreviewScenario(null);
    setActiveScenario(null);
    await queryClient.invalidateQueries({ queryKey: [scenarioDomain] });
  };

  return (
    <aside
      aria-label="Điều khiển xem trước mock"
      data-testid="dev-preview-controls"
      style={shellStyle}
    >
      <div
        role="status"
        aria-label="Mock data warning"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '9px 12px',
          border: '1px solid #f59e0b',
          borderRadius: 10,
          background: '#fffbeb',
          color: '#78350f',
          boxShadow: '0 4px 18px rgba(15, 23, 42, .16)',
        }}
      >
        <strong>DỮ LIỆU MÔ PHỎNG · KHÔNG PHẢI GIAO DỊCH THẬT</strong>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="dev-preview-panel"
          onClick={() => setIsOpen((open) => !open)}
          style={{
            flex: '0 0 auto',
            padding: '4px 7px',
            border: '1px solid #b45309',
            borderRadius: 6,
            background: '#fff',
            color: '#78350f',
            cursor: 'pointer',
          }}
        >
          {isOpen ? 'Thu gọn' : 'Mở công cụ xem trước'}
        </button>
      </div>

      {isOpen && (
        <section id="dev-preview-panel" aria-label="Công cụ xem trước" style={panelStyle}>
          <p style={{ margin: '0 0 12px' }}>
            Phiên hiện tại: <strong>{user?.email ?? 'khách chưa đăng nhập'}</strong>
          </p>

          <label htmlFor="preview-persona" style={{ display: 'block', fontWeight: 650 }}>
            Tài khoản xem trước
          </label>
          <select
            id="preview-persona"
            value={personaSelection}
            onChange={(event) => setPersonaSelection(event.target.value as PersonaSelection)}
            style={fieldStyle}
          >
            <option value="guest">Khách · đăng xuất</option>
            {DEV_PREVIEW_PERSONAS.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void applyPersona()}
            style={actionStyle}
          >
            {isBusy ? 'Đang xử lý…' : 'Áp dụng tài khoản'}
          </button>

          <hr style={{ margin: '16px 0', border: 0, borderTop: '1px solid #e2e8f0' }} />

          <label htmlFor="preview-scenario" style={{ display: 'block', fontWeight: 650 }}>
            Kịch bản màn hình
          </label>
          <select
            id="preview-scenario"
            value={scenarioId}
            onChange={(event) => setScenarioId(event.target.value as ScreenScenarioId)}
            style={fieldStyle}
          >
            {screenScenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.label}
              </option>
            ))}
          </select>
          <p data-testid="preview-scenario-note" style={{ margin: '6px 0 0', color: '#475569' }}>
            Lối tắt hiện chỉ chuyển trang, không đổi trạng thái dữ liệu.
          </p>
          <button type="button" onClick={openScenario} style={actionStyle}>
            Mở màn hình
          </button>

          <hr style={{ margin: '16px 0', border: 0, borderTop: '1px solid #e2e8f0' }} />

          <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>Trạng thái API mock</h3>
          <label htmlFor="preview-domain" style={{ display: 'block', fontWeight: 650 }}>
            Miền API
          </label>
          <select
            id="preview-domain"
            value={scenarioDomain}
            onChange={(event) => {
              const domain = event.target.value as DevPreviewDomain;
              setScenarioDomain(domain);
              if (!supportsScenarioState(domain, scenarioState)) {
                setScenarioState('error');
              }
            }}
            style={fieldStyle}
          >
            {DEV_PREVIEW_DOMAINS.map((domain) => (
              <option key={domain} value={domain}>
                {domainLabels[domain]}
              </option>
            ))}
          </select>

          <label
            htmlFor="preview-state"
            style={{ display: 'block', marginTop: 10, fontWeight: 650 }}
          >
            Trạng thái phản hồi
          </label>
          <select
            id="preview-state"
            value={scenarioState}
            onChange={(event) => setScenarioState(event.target.value as InjectableScenarioState)}
            style={fieldStyle}
          >
            {scenarioStates.map((state) => (
              <option
                key={state.id}
                value={state.id}
                disabled={!supportsScenarioState(scenarioDomain, state.id)}
              >
                {state.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={applyScenario} style={actionStyle}>
            Áp dụng trạng thái API
          </button>
          <p style={{ margin: '7px 0 0', color: '#475569' }}>
            Trạng thái được lưu và chỉ làm mới dữ liệu của miền đã chọn. Thành công dùng
            handler/fixture hiện có; dữ liệu rỗng chỉ áp dụng các GET đã có response rỗng theo hợp
            đồng: Auth session null, Market pairs, Arena discovery, Earn snapshot/transactions,
            Discovery search, Profile collections, Trading open orders/history/positions, DCA
            snapshot và Wallet activity. Pending mô phỏng receipt Earn/Wallet theo contract hoặc
            request release P2P đang bay, không phải trạng thái cuối của backend. 401/403 của Thị
            trường chỉ nhắm đến watchlist và price alerts. Unknown/duplicate cần semantics và
            reconciliation đúng hợp đồng của từng luồng.
          </p>
          {activeScenario && (
            <div role="status" data-testid="active-preview-scenario" style={{ marginTop: 8 }}>
              Đang áp dụng: <strong>{`${activeScenario.domain}.${activeScenario.state}`}</strong>
              <button
                type="button"
                onClick={clearScenario}
                style={{ ...actionStyle, background: '#475569' }}
              >
                Tắt trạng thái API
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={isBusy}
            onClick={() => void resetPreview()}
            style={{ ...actionStyle, background: '#475569' }}
          >
            Đặt lại dữ liệu mock
          </button>
          <p style={{ margin: '7px 0 0', color: '#475569' }}>
            Đặt lại sẽ đăng xuất, xóa query cache và tải lại trang để tạo lại fixture trong bộ nhớ.
          </p>

          {notice && (
            <p role="status" aria-live="polite" style={{ margin: '12px 0 0', color: '#166534' }}>
              {notice}
            </p>
          )}
        </section>
      )}
    </aside>
  );
}
