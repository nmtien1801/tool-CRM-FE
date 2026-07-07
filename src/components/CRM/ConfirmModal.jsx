import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  open,
  title = 'Xác nhận',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này không?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  danger = false,
  onConfirm,
  onCancel
}) {
  const confirmBtnRef = useRef(null);

  // Tự động focus nút xác nhận khi mở modal (thay vì để trình duyệt mất focus như window.confirm)
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => confirmBtnRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Cho phép đóng bằng phím ESC, xác nhận bằng Enter
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') onConfirm?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  // Dùng createPortal để thoát hẳn khỏi cây DOM/stacking context của modal cha
  // (ví dụ CustomerDetailModal có z-50). Nhờ vậy z-[100] ở đây luôn được so sánh
  // trực tiếp với các phần tử con của <body>, không bị "kẹt" bên trong modal cha.
  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-900/45 px-4 flex items-center justify-center"
      onMouseDown={(e) => {
        // Bấm ra ngoài modal để hủy, giống hành vi quen thuộc
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 flex items-start gap-3 border-b border-slate-100">
          <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${danger ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3.5 bg-slate-50/70 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${danger
              ? 'bg-rose-500 hover:bg-rose-600'
              : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}