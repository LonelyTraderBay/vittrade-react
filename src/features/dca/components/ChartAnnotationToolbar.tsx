import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ReactNode } from 'react';
import {
  Check,
  Copy,
  Eraser,
  MousePointer2,
  MoveUpRight,
  Pen,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import {
  PEN_WIDTHS,
  PRESET_COLORS,
  type Annotation,
  type AnnotationTool,
  type SnapPoint,
} from './chart-annotation-canvas';

interface Props {
  tool: AnnotationTool;
  setTool: Dispatch<SetStateAction<AnnotationTool>>;
  color: string;
  setColor: Dispatch<SetStateAction<string>>;
  penWidth: number;
  setPenWidth: Dispatch<SetStateAction<number>>;
  annotations: Annotation[];
  selectedIndex: number | null;
  canvasSnapPoints: SnapPoint[];
  onClose: () => void;
  handleUndo: () => void;
  handleDuplicate: () => void;
  handleDeleteSelected: () => void;
  handleClear: () => void;
}

export function ChartAnnotationToolbar({
  tool,
  setTool,
  color,
  setColor,
  penWidth,
  setPenWidth,
  annotations,
  selectedIndex,
  canvasSnapPoints,
  onClose,
  handleUndo,
  handleDuplicate,
  handleDeleteSelected,
  handleClear,
}: Props) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);

  useEffect(() => {
    setShowWidthPicker(false);
    setShowColorPicker(false);
  }, [tool]);

  return (
    <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
      <div
        className="bg-[rgba(0,0,0,0.85)] backdrop-blur-sm rounded-2xl px-2 py-2 flex items-center gap-1"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
      >
        {/* ── Tools ──────────────────────────────────────── */}
        <ToolButton
          active={tool === 'select'}
          onClick={() => setTool('select')}
          label="Chọn / Di chuyển"
        >
          <MousePointer2 className="w-4 h-4" />
        </ToolButton>

        {/* Pen button with width indicator */}
        <div className="relative">
          <ToolButton
            active={tool === 'pen'}
            onClick={() => {
              setTool('pen');
              if (tool === 'pen') setShowWidthPicker((p) => !p);
            }}
            label="Vẽ tay"
          >
            <Pen className="w-4 h-4" />
          </ToolButton>
          {/* Width dot indicator */}
          {tool === 'pen' && (
            <div
              className="absolute -top-0.5 -right-0.5 rounded-full bg-white"
              style={{
                width: PEN_WIDTHS.find((w) => w.value === penWidth)?.dotSize ?? 5,
                height: PEN_WIDTHS.find((w) => w.value === penWidth)?.dotSize ?? 5,
              }}
            />
          )}
          {/* Width picker popup */}
          {showWidthPicker && tool === 'pen' && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[rgba(0,0,0,0.9)] rounded-xl p-2 flex items-center gap-2">
              {PEN_WIDTHS.map((w) => (
                <button
                  key={w.key}
                  onClick={() => {
                    setPenWidth(w.value);
                    setShowWidthPicker(false);
                  }}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
                    penWidth === w.value
                      ? 'bg-[rgba(59,130,246,0.3)] ring-1 ring-[#3B82F6]'
                      : 'hover:bg-[rgba(255,255,255,0.1)]'
                  }`}
                  aria-label={w.label}
                  title={w.label}
                >
                  <div
                    className="rounded-full bg-white"
                    style={{ width: w.dotSize * 2, height: w.dotSize * 2 }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <ToolButton active={tool === 'text'} onClick={() => setTool('text')} label="Ghi chú">
          <Type className="w-4 h-4" />
        </ToolButton>

        <ToolButton active={tool === 'arrow'} onClick={() => setTool('arrow')} label="Mũi tên">
          <MoveUpRight className="w-4 h-4" />
        </ToolButton>

        <ToolButton
          active={tool === 'eraser'}
          onClick={() => setTool('eraser')}
          label="Xóa ghi chú"
        >
          <Eraser className="w-4 h-4" />
        </ToolButton>

        {/* ── Separator ──────────────────────────────────── */}
        <div className="w-px h-6 bg-[rgba(255,255,255,0.15)] mx-0.5" />

        {/* ── Color picker ───────────────────────────────── */}
        <div className="relative">
          <button
            onClick={() => {
              setShowColorPicker((p) => !p);
              setShowWidthPicker(false);
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors"
            aria-label="Chọn màu"
          >
            <div
              className="w-5 h-5 rounded-full border-2 border-white"
              style={{ background: color }}
            />
          </button>
          {showColorPicker && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[rgba(0,0,0,0.9)] rounded-xl p-2 flex gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setColor(c.value);
                    setShowColorPicker(false);
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c.value
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ background: c.value }}
                  aria-label={c.label}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Separator ──────────────────────────────────── */}
        <div className="w-px h-6 bg-[rgba(255,255,255,0.15)] mx-0.5" />

        {/* ── Actions: Undo / Duplicate / Delete / Clear ── */}
        <ToolButton
          active={false}
          onClick={handleUndo}
          label="Hoàn tác"
          disabled={annotations.length === 0}
        >
          <Undo2 className="w-4 h-4" />
        </ToolButton>

        {selectedIndex !== null && (
          <ToolButton
            active={false}
            onClick={handleDuplicate}
            label="Nhân đôi ghi chú"
            variant="accent"
          >
            <Copy className="w-4 h-4" />
          </ToolButton>
        )}

        {selectedIndex !== null ? (
          <ToolButton
            active={false}
            onClick={handleDeleteSelected}
            label="Xóa mục đã chọn"
            variant="danger"
          >
            <Trash2 className="w-4 h-4" />
          </ToolButton>
        ) : (
          <ToolButton
            active={false}
            onClick={handleClear}
            label="Xóa tất cả"
            disabled={annotations.length === 0}
          >
            <Trash2 className="w-4 h-4" />
          </ToolButton>
        )}

        {/* ── Spacer + Done ──────────────────────────────── */}
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="h-8 px-3.5 rounded-xl text-white text-[13px] flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          style={{ fontWeight: 600, background: '#3B82F6' }}
        >
          <Check className="w-3.5 h-3.5" />
          Xong
        </button>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-center gap-3 mt-1.5">
        {annotations.length > 0 && (
          <span className="text-[11px] text-[rgba(255,255,255,0.5)]">
            {annotations.length} ghi chú
          </span>
        )}
        {tool === 'eraser' && (
          <span className="text-[11px] text-[rgba(239,68,68,0.7)]">Chạm vào ghi chú để xóa</span>
        )}
        {tool === 'select' && selectedIndex !== null && (
          <span className="text-[11px] text-[rgba(59,130,246,0.8)]">
            Kéo để di chuyển
            {annotations[selectedIndex]?.type === 'arrow'
              ? ' · Kéo đầu mũi tên để thay đổi hướng'
              : ''}
          </span>
        )}
        {tool === 'select' && selectedIndex === null && annotations.length > 0 && (
          <span className="text-[11px] text-[rgba(255,255,255,0.4)]">Chạm vào ghi chú để chọn</span>
        )}
        {tool === 'arrow' && canvasSnapPoints.length > 0 && (
          <span className="text-[11px] text-[rgba(59,130,246,0.6)]">
            Mũi tên tự bắt điểm dữ liệu trên biểu đồ
          </span>
        )}
        {tool === 'pen' && (
          <span className="text-[11px] text-[rgba(255,255,255,0.4)]">
            Chạm vào bút lần nữa để đổi độ dày nét
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── ToolButton ─────────────────────────────────────────── */
/* ══════════════════════════════════════════════════════════ */

function ToolButton({
  active,
  onClick,
  label,
  children,
  disabled = false,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
  disabled?: boolean;
  variant?: 'danger' | 'accent';
}) {
  const baseClass =
    variant === 'danger'
      ? 'bg-[rgba(239,68,68,0.2)] text-[#EF4444]'
      : variant === 'accent'
        ? 'bg-[rgba(59,130,246,0.2)] text-[#60A5FA]'
        : active
          ? 'bg-[#3B82F6] text-white'
          : 'text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.1)]';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${baseClass} disabled:opacity-30 disabled:pointer-events-none`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
