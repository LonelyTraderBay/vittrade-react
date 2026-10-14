import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithRouter, mockNavigate } from '@/test/test-utils-navigation';
import { ProfileContractPage } from './ProfileContractPage';
import { useProfileQuery } from '../model/profile-queries';

vi.mock('../model/profile-queries', () => ({ useProfileQuery: vi.fn() }));

const profileQuery = vi.mocked(useProfileQuery);
afterEach(() => mockNavigate.mockClear());
const profile = {
  id: 'usr001',
  email: 'user@example.com',
  phone: '+84 900',
  fullName: 'Nguyễn Văn A',
  username: 'vana',
  avatar: null,
  kycLevel: 2,
  kycStatus: 'verified' as const,
  referralCode: 'VITTA',
  vipLevel: 1,
  joinDate: '2023-08-15',
  has2FA: true,
  totalBalance: 54276.79,
};

describe('ProfileContractPage', () => {
  it('announces the loading state while the server-owned profile is pending', () => {
    profileQuery.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
      refetch: vi.fn(),
    } as never);

    renderWithRouter(<ProfileContractPage />);

    expect(screen.getByText('Đang tải profile…')).toBeInTheDocument();
  });

  it('follows each profile link in the current shell and sends sign-out back to login', async () => {
    profileQuery.mockReturnValue({
      isPending: false,
      isError: false,
      data: profile,
      refetch: vi.fn(),
    } as never);
    mockNavigate.mockClear();
    renderWithRouter(<ProfileContractPage />, { initialRoute: '/w/profile' });
    for (const [label, suffix] of [
      ['Chỉnh sửa hồ sơ', 'edit'],
      ['Bảo mật', 'security'],
      ['Hoạt động tài khoản', 'activity'],
      ['Thiết bị đăng nhập', 'devices'],
      ['Tài khoản phụ', 'sub-accounts'],
    ]) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }));
      expect(mockNavigate).toHaveBeenLastCalledWith(`/w/profile/${suffix}`);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenLastCalledWith('/w/auth/login', { replace: true }),
    );
  });
  it('renders server-owned profile information and feature routes', () => {
    profileQuery.mockReturnValue({
      isPending: false,
      isError: false,
      data: profile,
      refetch: vi.fn(),
    } as never);
    renderWithRouter(<ProfileContractPage />);
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('N').style.color).toBe('var(--tr-text-on-color)');
    expect(screen.getByText('$54,276.79')).toBeInTheDocument();
    expect(screen.getByText('Bảo mật')).toBeInTheDocument();
  });

  it('surfaces the query retry state instead of rendering fixture fallbacks', () => {
    const refetch = vi.fn();
    profileQuery.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
      refetch,
    } as never);
    renderWithRouter(<ProfileContractPage />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
