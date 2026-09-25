import { Check, PenLine, RotateCcw, Share2, ZoomIn, ZoomOut } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

interface DCAHistoryChartControlsProps {
  subtitle: string;
  interactive: boolean;
  annotationMode: boolean;
  hasAnnotations: boolean;
  isExporting: boolean;
  exportSuccess: boolean;
  isZoomed: boolean;
  onToggleAnnotation: () => void;
  onExport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export function DCAHistoryChartControls({
  subtitle,
  interactive,
  annotationMode,
  hasAnnotations,
  isExporting,
  exportSuccess,
  isZoomed,
  onToggleAnnotation,
  onExport,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: DCAHistoryChartControlsProps) {
  const c = useThemeColors();
  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-[18px] mb-1" style={{ fontWeight: 500, color: c.text1 }}>
            Lịch Sử Danh Mục
          </h3>
          <p className="text-[14px]" style={{ color: c.text2 }}>
            {subtitle}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Annotation toggle */}
          {interactive && (
            <button
              onClick={() => onToggleAnnotation()}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: annotationMode
                  ? c.primary
                  : hasAnnotations
                    ? 'rgba(59,130,246,0.1)'
                    : 'transparent',
                color: annotationMode ? 'white' : hasAnnotations ? c.primary : c.text2,
              }}
              aria-label={annotationMode ? 'Tắt ghi chú' : 'Bật ghi chú'}
              title="Ghi chú trên biểu đồ"
            >
              <PenLine className="w-4 h-4" />
            </button>
          )}

          {/* Export / Share */}
          <button
            onClick={onExport}
            disabled={isExporting}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
            style={{
              background: exportSuccess ? 'rgba(16,185,129,0.1)' : 'transparent',
            }}
            aria-label="Chia sẻ biểu đồ"
            title="Tải ảnh / Chia sẻ"
          >
            {isExporting ? (
              <div
                className="w-4 h-4 border-2 border-t-transparent rounded-full"
                style={{
                  borderColor: c.text3,
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : exportSuccess ? (
              <Check className="w-4 h-4" style={{ color: c.buy }} />
            ) : (
              <Share2 className="w-4 h-4" style={{ color: c.text2 }} />
            )}
          </button>

          {/* Zoom controls (interactive, not annotating) */}
          {interactive && !annotationMode && (
            <div
              className="flex items-center gap-1 ml-1 pl-1 border-l"
              style={{ borderColor: c.border }}
            >
              <button
                onClick={onZoomIn}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Phóng to"
              >
                <ZoomIn className="w-4 h-4" style={{ color: c.text2 }} />
              </button>
              <button
                onClick={onZoomOut}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" style={{ color: c.text2 }} />
              </button>
              {isZoomed && (
                <button
                  onClick={onResetZoom}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  aria-label="Đặt lại zoom"
                >
                  <RotateCcw className="w-4 h-4" style={{ color: c.primary }} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Interaction hint */}
      {interactive && !isZoomed && !annotationMode && (
        <p className="text-[11px] mb-3 text-center" style={{ color: c.text3 }}>
          Giữ ngón để xem giá trị · Chụm để zoom · Chạm 2 lần để reset
        </p>
      )}

      {/* Annotation mode banner */}
      {annotationMode && (
        <div
          className="mb-3 px-3 py-2 rounded-lg"
          style={{ background: c.primaryAlpha08, border: `1px solid ${c.primaryAlpha15}` }}
        >
          <p className="text-[12px] text-center" style={{ fontWeight: 500, color: c.primary }}>
            Chế độ ghi chú — Vẽ, viết, đánh dấu, di chuyển, nhân đôi hoặc xóa
          </p>
        </div>
      )}
    </>
  );
}

interface DCAHistoryChartLegendProps {
  interactive: boolean;
  isZoomed: boolean;
  annotationMode: boolean;
  visibleStart: number;
  visibleEnd: number;
}

export function DCAHistoryChartLegend({
  interactive,
  isZoomed,
  annotationMode,
  visibleStart,
  visibleEnd,
}: DCAHistoryChartLegendProps) {
  const c = useThemeColors();
  return (
    <>
      {/* Zoom level indicator */}
      {interactive && isZoomed && !annotationMode && (
        <div className="flex items-center justify-center mt-2">
          <div className="relative w-32 h-1.5 rounded-full" style={{ background: c.surface2 }}>
            <div
              className="absolute top-0 h-full rounded-full opacity-60"
              style={{
                background: c.primary,
                left: `${visibleStart * 100}%`,
                width: `${(visibleEnd - visibleStart) * 100}%`,
              }}
            />
          </div>
          <span className="ml-2 text-[11px]" style={{ color: c.text3 }}>
            {Math.round((visibleEnd - visibleStart) * 100)}%
          </span>
        </div>
      )}

      {/* Legend */}
      <div
        className="flex items-center justify-center gap-6 mt-5 pt-5 border-t"
        style={{ borderColor: c.border }}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5" style={{ background: c.primary }} />
          <span className="text-[12px]" style={{ color: c.text2 }}>
            Giá trị danh mục
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5" style={{ background: c.text3, borderTop: '2px dashed' }} />
          <span className="text-[12px]" style={{ color: c.text2 }}>
            Đã đầu tư
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: c.primary }} />
          <span className="text-[12px]" style={{ color: c.text2 }}>
            Điểm mua
          </span>
        </div>
      </div>
    </>
  );
}
