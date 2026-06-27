import React, { useState } from 'react';
import { Maximize2, X, Save } from 'lucide-react';

export default function ExpandableInput({ 
    value, 
    onChange, 
    placeholder = "Nhập nội dung...", 
    title = "Chi tiết nội dung" 
}) {
    const [isOpen, setIsOpen] = useState(false);
    // State tạm thời để quản lý nội dung trong popup trước khi bấm lưu
    const [tempValue, setTempValue] = useState(value);

    // Mở popup và sao chép giá trị hiện tại vào biến tạm
    const handleOpen = () => {
        setTempValue(value);
        setIsOpen(isOpen => !isOpen);
    };

    // Xác nhận lưu từ popup ra ngoài ô input chính
    const handleSave = () => {
        onChange(tempValue);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full group">
            {/* Ô Input chính trên dòng của bảng */}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-2.5 pr-8 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800"
            />

            {/* Nút nhỏ ở góc phải dưới của Input */}
            <button
                type="button"
                onClick={handleOpen}
                title="Mở rộng xem toàn bộ"
                className="absolute right-1.5 bottom-1.5 text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-colors bg-white/80 backdrop-blur-xs"
            >
                <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* POPUP MODAL LỚN (Chỉ hiển thị khi isOpen = true) */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    {/* Hộp thoại Popup */}
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                        
                        {/* Tiêu đề Popup */}
                        <div className="px-4 py-3 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                            <h4 className="text-sm font-bold text-slate-800">{title}</h4>
                            <button 
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Vùng chứa đoạn văn lớn (Textarea) */}
                        <div className="p-4 flex-1">
                            <textarea
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                placeholder={placeholder}
                                rows={12}
                                className="w-full p-3 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-800 leading-relaxed resize-none"
                            />
                        </div>

                        {/* Thanh thao tác dưới đáy Popup */}
                        <div className="px-4 py-3 border-t border-slate-150 flex items-center justify-end gap-2 bg-slate-50">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-100 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 border border-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 shadow-xs transition-colors"
                            >
                                <Save className="w-3.5 h-3.5" /> Xác nhận
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}