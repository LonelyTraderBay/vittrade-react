import { useCallback } from 'react';
import { trackSheetOpen } from '../utils/sheetAnalytics';

/**
 * Hook that returns a stable `onAfterOpen` callback for BottomSheetV2.
 * Pass the returned callback directly to `<BottomSheetV2 onAfterOpen={onAfterOpen} />`.
 *
 * @param sheetName — unique identifier, e.g. "p2p-chat-image-upload"
 */
export function useSheetAnalytics(sheetName: string) {
  const onAfterOpen = useCallback(() => {
    trackSheetOpen(sheetName);
  }, [sheetName]);

  return { onAfterOpen };
}
