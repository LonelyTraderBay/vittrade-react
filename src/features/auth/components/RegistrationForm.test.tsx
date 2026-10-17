import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes, useLocation } from 'react-router';
import { fireEvent, renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { RegistrationForm } from './RegistrationForm';
import { authApi } from '../api/auth-api-instance';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

function CurrentPath() {
  return <output data-testid="current-path">{useLocation().pathname}</output>;
}

function ChallengePreview() {
  const { state } = useLocation();
  return <output data-testid="challenge-state">{JSON.stringify(state)}</output>;
}

function renderForm() {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/w/auth/register" element={<RegistrationForm />} />
        <Route path="/w/auth/otp" element={<ChallengePreview />} />
      </Routes>
      <CurrentPath />
    </>,
    { routerProps: { initialEntries: ['/w/auth/register'] } },
  );
}

async function fillValidEmailForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Họ và tên'), 'Nguyen Van A');
  await user.type(screen.getByLabelText('Email'), 'new-user@example.com');
  await user.type(screen.getByLabelText('Mật khẩu'), 'StrongPass1!');
  await user.type(screen.getByLabelText('Xác nhận mật khẩu'), 'StrongPass1!');
  await user.click(screen.getByRole('checkbox'));
  return user;
}

describe('RegistrationForm', () => {
  it('keeps a rejected registration on the form with editable data and safe validation feedback', async () => {
    const request = vi.fn(() => HttpResponse.json({ code: 'VALIDATION_ERROR' }, { status: 400 }));
    server.use(http.post('http://localhost:3000/api/auth/register', request));
    renderForm();
    const user = await fillValidEmailForm();
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    expect(
      await screen.findByText(
        'Thông tin đăng ký chưa được chấp nhận. Vui lòng kiểm tra và thử lại.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/register');
    expect(screen.getByLabelText('Email')).toHaveValue('new-user@example.com');
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeEnabled();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('contains an unexpected adapter rejection without displaying its private details', async () => {
    const request = vi
      .spyOn(authApi, 'register')
      .mockRejectedValue(new Error('private adapter failure'));
    renderForm();
    const user = await fillValidEmailForm();
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    expect(
      await screen.findByText('Chưa thể bắt đầu xác minh. Kiểm tra kết nối rồi thử lại.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('private adapter failure')).not.toBeInTheDocument();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/register');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('validates required fields and consent before making a request', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    expect(screen.getByText('Vui lòng nhập họ tên')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập email')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu tối thiểu 8 ký tự')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng đồng ý điều khoản dịch vụ')).toBeInTheDocument();
  });

  it('validates malformed email and a mismatched password confirmation', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText('Họ và tên'), 'Nguyen Van A');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Mật khẩu'), 'StrongPass1!');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), 'DifferentPass1!');

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu xác nhận không khớp')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng đồng ý điều khoản dịch vụ')).toBeInTheDocument();
  });

  it('validates phone contact when the phone channel is selected', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Điện thoại' }));
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    expect(screen.getByText('Vui lòng nhập số điện thoại')).toBeInTheDocument();
    expect(screen.queryByText('Vui lòng nhập email')).not.toBeInTheDocument();
  });

  it('sends a typed registration request and keeps raw contact and password out of route state', async () => {
    let submittedBody: unknown;
    let idempotencyKey: string | null = null;
    server.use(
      http.post('http://localhost:3000/api/auth/register', async ({ request }) => {
        submittedBody = await request.json();
        idempotencyKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json(
          {
            challengeId: 'registration-challenge-001',
            channel: 'email',
            maskedDestination: 'n***@example.com',
            expiresAt: '2099-01-01T00:05:00.000Z',
          },
          { status: 202 },
        );
      }),
    );
    renderForm();
    const user = await fillValidEmailForm();

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    expect(await screen.findByTestId('current-path')).toHaveTextContent('/w/auth/otp');
    expect(submittedBody).toEqual({
      fullName: 'Nguyen Van A',
      channel: 'email',
      contact: 'new-user@example.com',
      password: 'StrongPass1!',
      acceptedTerms: true,
    });
    expect(idempotencyKey).toMatch(/^[\da-f-]{36}$/i);
    const routeState = screen.getByTestId('challenge-state').textContent ?? '';
    expect(routeState).toContain('registration-challenge-001');
    expect(routeState).toContain('n***@example.com');
    expect(routeState).not.toContain('new-user@example.com');
    expect(routeState).not.toContain('StrongPass1!');
  });

  it('submits a phone registration with an optional referral code', async () => {
    let submittedBody: unknown;
    server.use(
      http.post('http://localhost:3000/api/auth/register', async ({ request }) => {
        submittedBody = await request.json();
        return HttpResponse.json(
          {
            challengeId: 'phone-registration-challenge-001',
            channel: 'phone',
            maskedDestination: '+856 ** *** 123',
            expiresAt: '2099-01-01T00:05:00.000Z',
          },
          { status: 202 },
        );
      }),
    );
    renderForm();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Họ và tên'), 'Nguyen Van A');
    await user.click(screen.getByRole('button', { name: 'Điện thoại' }));
    await user.type(screen.getByLabelText('Số điện thoại'), '+8562012345678');
    await user.type(screen.getByLabelText('Mật khẩu'), 'StrongPass1!');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), 'StrongPass1!');
    await user.type(screen.getByLabelText('Mã giới thiệu (tuỳ chọn)'), 'ref-001');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    expect(await screen.findByTestId('current-path')).toHaveTextContent('/w/auth/otp');
    expect(submittedBody).toEqual({
      fullName: 'Nguyen Van A',
      channel: 'phone',
      contact: '+8562012345678',
      password: 'StrongPass1!',
      referralCode: 'REF-001',
      acceptedTerms: true,
    });
    expect(screen.getByTestId('challenge-state')).toHaveTextContent(
      'phone-registration-challenge-001',
    );
  });

  it('shows and hides the entered password', async () => {
    const user = userEvent.setup();
    renderForm();
    const password = screen.getByLabelText('Mật khẩu');

    await user.type(password, 'StrongPass1!');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('shows rate-limit feedback without claiming that an account was created', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/register', () =>
        HttpResponse.json({ code: 'RATE_LIMITED' }, { status: 429 }),
      ),
    );
    renderForm();
    const user = await fillValidEmailForm();

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    expect(
      await screen.findByText('Bạn đã gửi quá nhiều yêu cầu. Hãy chờ một lúc rồi thử lại.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/register');
  });

  it('reuses the request key when the same registration is safely retried', async () => {
    const keys: string[] = [];
    const handler = vi.fn(async ({ request }: { request: Request }) => {
      keys.push(request.headers.get('Idempotency-Key') ?? '');
      if (keys.length === 1) {
        return HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 });
      }
      return HttpResponse.json(
        {
          challengeId: 'retry-registration-challenge-001',
          channel: 'email',
          maskedDestination: 'n***@example.com',
          expiresAt: '2099-01-01T00:05:00.000Z',
        },
        { status: 202 },
      );
    });
    server.use(http.post('http://localhost:3000/api/auth/register', handler));
    renderForm();
    const user = await fillValidEmailForm();
    const submit = screen.getByRole('button', { name: 'Tiếp tục' });

    await user.click(submit);
    expect(
      await screen.findByText('Chưa thể bắt đầu xác minh. Kiểm tra kết nối rồi thử lại.'),
    ).toBeInTheDocument();
    await user.click(submit);

    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/otp'),
    );
    expect(handler).toHaveBeenCalledTimes(2);
    expect(keys[0]).toMatch(/^[\da-f-]{36}$/i);
    expect(keys[1]).toBe(keys[0]);
  });

  it('does not issue duplicate requests for synchronous repeated submits', async () => {
    let resolveRequest!: (response: Response) => void;
    let requestCount = 0;
    const requestReceived = new Promise<void>((resolve) => {
      server.use(
        http.post('http://localhost:3000/api/auth/register', () => {
          requestCount += 1;
          resolve();
          return new Promise<Response>((complete) => {
            resolveRequest = complete;
          });
        }),
      );
    });
    renderForm();
    await fillValidEmailForm();
    const form = screen.getByRole('button', { name: 'Tiếp tục' }).closest('form');
    expect(form).not.toBeNull();

    fireEvent.submit(form!);
    await requestReceived;
    fireEvent.submit(form!);
    expect(requestCount).toBe(1);
    expect(resolveRequest).toBeTypeOf('function');

    resolveRequest(
      HttpResponse.json(
        {
          challengeId: 'single-registration-challenge-001',
          channel: 'email',
          maskedDestination: 'n***@example.com',
          expiresAt: '2099-01-01T00:05:00.000Z',
        },
        { status: 202 },
      ) as unknown as Response,
    );
    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/otp'),
    );
  });
});
