import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes, useLocation } from 'react-router';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { RegistrationForm } from './RegistrationForm';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
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
  it('validates required fields and consent before making a request', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    expect(screen.getByText('Vui lòng nhập họ tên')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập email')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu tối thiểu 8 ký tự')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng đồng ý điều khoản dịch vụ')).toBeInTheDocument();
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
});
