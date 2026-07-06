import React from 'react';
import { Edit, Trash2, ExternalLink, Plus } from 'lucide-react';

export default function CustomerDetailModal({
  customer,
  onClose,
  onAddTransaction, // Thêm prop để xử lý sự kiện thêm giao dịch
  onEditTransaction,
  onDeleteTransaction,
  staffOptions = [],
  getPurchaseHistoriesFn
}) {
  if (!customer) return null;

  // Lấy lịch sử giao dịch thông qua hàm helper được truyền từ cha
  const histories = getPurchaseHistoriesFn ? getPurchaseHistoriesFn(customer) : (customer.purchaseHistories || []);
  const validHistories = histories.filter(h => h.date || h.products || h.invoiceLink);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 px-4 py-6 flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-[95vw] max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Lịch sử mua hàng: {customer.fullName}
            </h3>
          </div>
          <div className="flex gap-2">
            {/* Nút Thêm giao dịch mới */}
            <button
              type="button"
              onClick={() => onAddTransaction && onAddTransaction(customer)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm giao dịch
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Nội dung Modal */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Chi tiết giao dịch</span>
              <div className="text-xs text-slate-500 font-medium">
                Tổng số lần giao dịch: <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded ml-1">lần {customer.purchaseCount}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[1500px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3.5 text-center w-12 bg-slate-50/40">STT</th>
                    <th className="px-4 py-3.5 w-32 border-l border-slate-200 bg-indigo-50/20 text-indigo-900">Ngày giao dịch</th>
                    <th className="px-4 py-3.5 w-60 bg-indigo-50/20 text-indigo-900">Sản phẩm</th>
                    <th className="px-4 py-3.5 text-center w-36 bg-indigo-50/20 text-indigo-900">Hóa đơn (URL)</th>
                    <th className="px-4 py-3.5 w-64 border-l border-slate-200 bg-amber-50/20 text-amber-900">Mối quan tâm</th>
                    <th className="px-4 py-3.5 w-56 bg-amber-50/20 text-amber-900">Quà tặng áp dụng</th>
                    <th className="px-4 py-3.5 w-48 bg-amber-50/20 text-amber-900">Kênh tiếp cận</th>
                    <th className="px-4 py-3.5 w-44 border-l border-slate-200 bg-emerald-50/20 text-emerald-900">Nhân sự tư vấn</th>
                    <th className="px-4 py-3.5 w-44 bg-emerald-50/20 text-emerald-900">Người chăm sóc</th>
                    <th className="px-4 py-3.5 text-center w-40 border-l border-slate-200 bg-slate-100 text-slate-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {validHistories.length > 0 ? (
                    validHistories.map((history, index) => (
                      <tr key={history.id || index} className="hover:bg-slate-50/40 transition-colors align-top divide-x divide-slate-100">
                        <td className="px-4 py-4 font-semibold text-slate-400 text-center">{index + 1}</td>
                        <td className="px-4 py-4 font-bold text-slate-900 whitespace-nowrap border-l border-slate-200 bg-indigo-50/5">
                          {history.date || '---'}
                        </td>
                        <td className="px-4 py-4 text-slate-800 font-bold leading-relaxed break-words bg-indigo-50/5">
                          {history.products || '---'}
                        </td>

                        {/* CỘT HÓA ĐƠN ĐÃ THAY ĐỔI SANG HIỂN THỊ LINK URL */}
                        <td className="px-4 py-4 text-center whitespace-nowrap bg-indigo-50/5">
                          {history.invoiceLink ? (
                            <div className="flex justify-center items-center h-full pt-1">
                              <a
                                href={history.invoiceLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg font-semibold transition-all text-[11px]"
                                title={history.invoiceLink}
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Xem liên kết</span>
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">Trống</span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-slate-700 font-medium leading-relaxed break-words border-l border-slate-200 bg-amber-50/5">
                          {history.issue || customer.issue || <span className="text-slate-400 italic">Chưa ghi nhận</span>}
                        </td>
                        <td className="px-4 py-4 text-slate-600 leading-relaxed break-words bg-amber-50/5">
                          {history.promotions && history.promotions.length > 0 ? (
                            history.promotions.map((p, idx) => (
                              <div key={idx} className="mb-1.5 last:mb-0">
                                <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] inline-block">{p.event}</span>
                              </div>
                            ))
                          ) : customer.promotions && customer.promotions.length > 0 ? (
                            customer.promotions.map((p, idx) => (
                              <div key={idx} className="mb-1.5 last:mb-0">
                                <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] inline-block">{p.event}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">Không áp dụng</span>
                          )}
                        </td>
                        <td className="px-4 py-4 bg-amber-50/5">
                          <div className="flex flex-wrap gap-1">
                            {history.careMethods && history.careMethods.length > 0 ? (
                              history.careMethods.map(m => (
                                <span key={m} className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold shadow-3xs">{m}</span>
                              ))
                            ) : customer.careMethods && customer.careMethods.length > 0 ? (
                              customer.careMethods.map(m => (
                                <span key={m} className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold shadow-3xs">{m}</span>
                              ))
                            ) : (
                              <span className="text-slate-300 italic">Trống</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap border-l border-slate-200 bg-emerald-50/5">
                          {history.consultant ? (
                            <span className="inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md text-[11px]">
                              {staffOptions.find(s => s.value === history.consultant)?.label || history.consultant}
                            </span>
                          ) : customer.consultant ? (
                            <span className="inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md text-[11px]">
                              {staffOptions.find(s => s.value === customer.consultant)?.label || customer.consultant}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa chỉ định</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap bg-emerald-50/5">
                          {history.careStaff ? (
                            <span className="inline-block bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md text-[11px]">
                              {staffOptions.find(s => s.value === history.careStaff)?.label || history.careStaff}
                            </span>
                          ) : customer.careStaff ? (
                            <span className="inline-block bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md text-[11px]">
                              {staffOptions.find(s => s.value === customer.careStaff)?.label || customer.careStaff}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa chỉ định</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center whitespace-nowrap border-l border-slate-200 bg-slate-50/50">
                          <div className="flex gap-1.5 justify-center">
                            <button
                              type="button"
                              onClick={() => onEditTransaction(history)}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-xs text-[11px]"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTransaction(history.id)}
                              className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-xs text-[11px]"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-xs text-slate-400 italic p-6 text-center">Chưa có lịch sử giao dịch phân tách độc lập.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}