import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DcaPlanCoinIcon } from './DcaPlanCoinIcon';

const icon = 'https://images.example.test/btc.png';

describe('DcaPlanCoinIcon', () => {
  it.each([24, 28, 32] as const)('keeps the %i px box when the image fails', (size) => {
    render(<DcaPlanCoinIcon icon={icon} symbol="BTC" alt="Bitcoin" size={size} rounded />);
    const image = screen.getByRole('img', { name: 'Bitcoin' });
    expect(image).toHaveAttribute('src', icon);
    const geometry = { width: `${size}px`, height: `${size}px`, borderRadius: `${size / 2}px` };
    expect(image).toHaveStyle(geometry);

    fireEvent.error(image);

    expect(image).not.toBeInTheDocument();
    const fallback = screen.getByRole('img', { name: 'Bitcoin' });
    expect(fallback).toHaveTextContent('BTC');
    expect(fallback).toHaveStyle(geometry);
    expect(fallback).not.toHaveAttribute('src');
  });

  it.each(['', '   ', '₿', 'not-an-image'])('uses a local fallback for %j', (source) => {
    const { container } = render(<DcaPlanCoinIcon icon={source} symbol="BTC" alt="Bitcoin" />);
    expect(screen.getByRole('img', { name: 'Bitcoin' })).toHaveTextContent('BTC');
    expect(container.querySelector('img')).toBeNull();
  });

  it('starts a fresh attempt for a new source and ignores errors from the old image', () => {
    const view = render(<DcaPlanCoinIcon icon={icon} symbol="BTC" alt="Bitcoin" />);
    const oldImage = screen.getByRole('img', { name: 'Bitcoin' });
    fireEvent.error(oldImage);
    expect(screen.getByRole('img', { name: 'Bitcoin' })).toHaveTextContent('BTC');

    const nextIcon = 'https://images.example.test/eth.png';
    view.rerender(<DcaPlanCoinIcon icon={nextIcon} symbol="ETH" alt="Ethereum" />);
    const newImage = screen.getByRole('img', { name: 'Ethereum' });
    expect(newImage).toHaveAttribute('src', nextIcon);
    fireEvent.error(oldImage);
    expect(newImage).toBeInTheDocument();
    expect(newImage).toHaveAttribute('src', nextIcon);

    fireEvent.error(newImage);
    expect(screen.getByRole('img', { name: 'Ethereum' })).toHaveTextContent('ETH');
  });

  it('does not retry a failed source when only labels or whitespace change', () => {
    const view = render(<DcaPlanCoinIcon icon={icon} symbol="BTC" alt="Bitcoin" />);
    fireEvent.error(screen.getByRole('img', { name: 'Bitcoin' }));

    view.rerender(<DcaPlanCoinIcon icon={` ${icon} `} symbol="XBT" alt="Bitcoin mới" />);

    expect(screen.getByRole('img', { name: 'Bitcoin mới' })).toHaveTextContent('XBT');
    expect(screen.getByRole('img', { name: 'Bitcoin mới' })).not.toHaveAttribute('src');
  });

  it('keeps decorative icons out of the accessibility tree before and after failure', () => {
    const { container } = render(
      <DcaPlanCoinIcon icon={icon} symbol="BTC" loading="lazy" referrerPolicy="no-referrer" />,
    );
    const image = container.querySelector('img')!;
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(screen.queryByRole('img')).toBeNull();

    fireEvent.error(image);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('BTC')).toHaveAttribute('aria-hidden', 'true');
  });
});
