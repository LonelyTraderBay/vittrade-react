import { fireEvent, screen } from '@testing-library/react';
import { Link, Route, Routes, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { PageTransition } from './PageTransition';

function PairPage() {
  const navigate = useNavigate();
  return (
    <PageTransition>
      <h1>Pair detail</h1>
      <Link to="/trade/settings">Open settings</Link>
      <button type="button" onClick={() => navigate(-1)}>
        Go back
      </button>
    </PageTransition>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  return (
    <PageTransition>
      <h1>Settings</h1>
      <button type="button" onClick={() => navigate(-1)}>
        Go back
      </button>
      <button type="button" onClick={() => navigate('/trade/replaced', { replace: true })}>
        Replace destination
      </button>
    </PageTransition>
  );
}

function TransitionRoutes() {
  return (
    <Routes>
      <Route
        path="/trade"
        element={
          <PageTransition>
            <h1>Trade</h1>
            <Link to="/trade/pair">Open pair</Link>
          </PageTransition>
        }
      />
      <Route path="/trade/pair" element={<PairPage />} />
      <Route path="/trade/settings" element={<SettingsPage />} />
      <Route
        path="/trade/replaced"
        element={
          <PageTransition>
            <h1>Replacement</h1>
            <Link to="/profile">Continue to profile</Link>
          </PageTransition>
        }
      />
      <Route
        path="/profile"
        element={
          <PageTransition>
            <h1>Profile</h1>
            <Link to="/profile/security">Open security</Link>
          </PageTransition>
        }
      />
      <Route
        path="/profile/security"
        element={
          <PageTransition>
            <h1>Security</h1>
          </PageTransition>
        }
      />
    </Routes>
  );
}

describe('PageTransition', () => {
  it('renders push, pop, replace, and root-tab navigation destinations', async () => {
    renderWithProviders(<TransitionRoutes />, { routerProps: { initialEntries: ['/trade'] } });

    expect(screen.getByRole('heading', { name: 'Trade' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Open pair' }));
    expect(await screen.findByRole('heading', { name: 'Pair detail' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Open settings' }));
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(await screen.findByRole('heading', { name: 'Pair detail' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Open settings' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Replace destination' }));
    expect(await screen.findByRole('heading', { name: 'Replacement' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Continue to profile' }));
    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Open security' }));
    expect(await screen.findByRole('heading', { name: 'Security' })).toBeInTheDocument();
  });
});
