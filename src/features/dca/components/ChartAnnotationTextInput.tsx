import type { Dispatch, SetStateAction } from 'react';
import { Check, X } from 'lucide-react';

export interface ChartAnnotationTextInputState {
  active: boolean;
  x: number;
  y: number;
  value: string;
}

interface Props {
  textInput: ChartAnnotationTextInputState | null;
  width: number;
  height: number;
  setTextInput: Dispatch<SetStateAction<ChartAnnotationTextInputState | null>>;
  confirmTextInput: () => void;
}

export function ChartAnnotationTextInput({
  textInput,
  width,
  height,
  setTextInput,
  confirmTextInput,
}: Props) {
  if (!textInput?.active) return null;
  return (
    <div
      className="absolute z-30 flex items-center gap-1"
      style={{
        left: `${(textInput.x / (width * 2)) * 100}%`,
        top: `${(textInput.y / (height * 2)) * 100}%`,
        transform: 'translate(-4px, -4px)',
      }}
    >
      <input
        autoFocus
        type="text"
        value={textInput.value}
        onChange={(e) => setTextInput((prev) => (prev ? { ...prev, value: e.target.value } : null))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirmTextInput();
          if (e.key === 'Escape') setTextInput(null);
        }}
        placeholder="Ghi chú..."
        className="bg-[rgba(0,0,0,0.7)] text-white text-[13px] px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.2)] outline-none min-w-[120px] max-w-[200px]"
        style={{ fontWeight: 500 }}
      />
      <button
        onClick={confirmTextInput}
        className="w-7 h-7 rounded-md text-white flex items-center justify-center flex-shrink-0"
        style={{ background: '#3B82F6' }}
        aria-label="Xác nhận"
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTextInput(null)}
        className="w-7 h-7 rounded-md bg-[rgba(255,255,255,0.15)] text-white flex items-center justify-center flex-shrink-0"
        aria-label="Hủy"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
