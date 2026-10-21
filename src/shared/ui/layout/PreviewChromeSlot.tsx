import { useContext } from 'react';
import { PreviewChromeContext } from './preview-chrome-context';

/** The collapsed mock warning occupies shell space instead of covering page content or actions. */
export function PreviewChromeSlot() {
  const registerHost = useContext(PreviewChromeContext);
  return registerHost ? (
    <div ref={registerHost} className="shrink-0" data-preview-chrome-host />
  ) : null;
}
