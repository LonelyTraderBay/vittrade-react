import type { ComponentProps } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { P2P2FASettingsView } from '../components/P2P2FASettingsView';
import type { P2P2FASettingsResponse } from '../model/p2p-types';
import { P2P2FASettingsPage } from './P2P2FASettingsPage';

const mutations = vi.hoisted(() => ({
  method: vi.fn(),
  primary: vi.fn(),
  threshold: vi.fn(),
  setup: vi.fn(),
  confirm: vi.fn(),
}));
const settings: P2P2FASettingsResponse = {
  methods: [
    {
      id: '2fa_sms',
      label: 'SMS',
      description: 'SMS',
      enabled: true,
      isPrimary: true,
      setupRequired: false,
      color: '#3B82F6',
    },
  ],
  thresholds: [
    {
      id: 'release',
      label: 'Release order',
      description: 'Require MFA',
      value: 1000,
      unit: 'USDT',
      enabled: true,
    },
  ],
};
vi.mock('../model/p2p-security-queries', () => ({
  useP2P2FASettingsQuery: () => ({ data: settings, isLoading: false, error: null }),
  useP2P2FAMethodMutation: () => ({ mutateAsync: mutations.method, isPending: false }),
  useP2P2FAPrimaryMutation: () => ({ mutateAsync: mutations.primary, isPending: false }),
  useP2P2FAThresholdMutation: () => ({ mutateAsync: mutations.threshold, isPending: false }),
  useP2PAuthenticatorSetupMutation: () => ({ mutateAsync: mutations.setup, isPending: false }),
  useP2PAuthenticatorConfirmMutation: () => ({ mutateAsync: mutations.confirm, isPending: false }),
}));

// A consumer can emit an invalid intent; authorization and validation belong to the page owner.
vi.mock('../components/P2P2FASettingsView', () => ({
  P2P2FASettingsView: (props: ComponentProps<typeof P2P2FASettingsView>) => (
    <>
      <button onClick={() => props.onToggleMethod(props.methods[0])}>Toggle method intent</button>
      <button onClick={() => props.onSetPrimary(props.methods[0])}>Primary method intent</button>
      <button onClick={() => props.onToggleThreshold('release', false)}>Threshold intent</button>
      <button onClick={() => props.onEditThreshold(props.thresholds[0])}>Edit intent</button>
      <button onClick={props.onSaveThreshold}>Save intent</button>
      <button onClick={props.onConfirmSetup}>Confirm intent</button>
      <input
        aria-label="Raw authenticator code"
        value={props.setupCode}
        onChange={(event) => props.onSetupCodeChange(event.target.value)}
      />
      <output data-testid="editing">{props.editingThreshold ?? 'idle'}</output>
    </>
  ),
}));

beforeEach(() => {
  Object.values(mutations).forEach((fn) => fn.mockReset());
});

describe('P2P MFA owner intent boundary', () => {
  it('rejects all security mutation intents without write permission', () => {
    renderWithProviders(<P2P2FASettingsPage />, {
      authAdapter: {
        ...testAuthAdapter,
        initialSession: {
          ...testAuthAdapter.initialSession!,
          user: { ...testAuthAdapter.initialSession!.user, permissions: ['p2p:read'] },
        },
      },
    });
    for (const label of [
      'Toggle method intent',
      'Primary method intent',
      'Threshold intent',
      'Edit intent',
      'Save intent',
      'Confirm intent',
    ]) {
      fireEvent.click(screen.getByRole('button', { name: label }));
    }
    expect(screen.getByTestId('editing')).toHaveTextContent('idle');
    for (const mutation of Object.values(mutations)) expect(mutation).not.toHaveBeenCalled();
  });

  it('rejects a save without an editing threshold and a malformed authenticator code', () => {
    const errorToast = vi.spyOn(toast, 'error');
    renderWithProviders(<P2P2FASettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Save intent' }));
    fireEvent.change(screen.getByLabelText('Raw authenticator code'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm intent' }));
    expect(mutations.threshold).not.toHaveBeenCalled();
    expect(mutations.confirm).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalledWith('Nhập mã Authenticator gồm 6 chữ số.', {
      duration: 2000,
    });
  });
});
