import { createContext } from 'react';

/** Shells register an optional preview region; app code never imports development controls. */
export const PreviewChromeContext = createContext<((host: HTMLElement | null) => void) | null>(
  null,
);
