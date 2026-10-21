import { useState, type ImgHTMLAttributes } from 'react';

interface Props extends Pick<ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'referrerPolicy'> {
  icon: string;
  symbol: string;
  alt?: string;
  size?: 24 | 28 | 32;
  rounded?: boolean;
}

/** One image attempt per source; a changed source gets its own failure state. */
export function DcaPlanCoinIcon(props: Props) {
  return <CoinImage key={props.icon.trim()} {...props} />;
}

function CoinImage({
  icon,
  symbol,
  alt = '',
  size = 24,
  rounded = false,
  loading,
  referrerPolicy,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const source = icon.trim();
  const isImageSource = /^(?:https?:\/\/|\/|\.\.?\/|data:image\/)/i.test(source);
  const geometry = { width: size, height: size, borderRadius: rounded ? size / 2 : undefined };

  if (!source || !isImageSource || imageFailed) {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className="inline-flex shrink-0 items-center justify-center text-xs font-bold"
        style={geometry}
      >
        {symbol}
      </span>
    );
  }

  return (
    <img
      src={source}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      loading={loading}
      referrerPolicy={referrerPolicy}
      className="shrink-0 object-contain"
      style={geometry}
      onError={() => setImageFailed(true)}
    />
  );
}
