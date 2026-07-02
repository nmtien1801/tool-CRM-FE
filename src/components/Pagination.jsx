import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  setCurrentPage,
  pageSize,
  totalItems,
  totalPages
}) {
  // Tính toán vị trí hiển thị dòng dữ liệu
  const fromItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="px-4 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
      {/* Khối hiển thị thông số */}
      <div className="text-xs font-medium text-slate-500">
        Hiển thị từ <span className="font-semibold text-slate-700">{fromItem}</span> đến{' '}
        <span className="font-semibold text-slate-700">{toItem}</span> trong tổng số{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span> khách hàng
      </div>

      {/* Khối các nút chuyển trang */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Render danh sách các số trang */}
        {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map(page => {
          if (totalPages > 5 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
            if (page === 2 || page === totalPages - 1) {
              return <span key={page} className="px-1 text-slate-400 text-xs">...</span>;
            }
            return null;
          }

          return (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`min-w-[32px] h-8 text-xs font-bold rounded-lg transition-all ${
                page === currentPage
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}