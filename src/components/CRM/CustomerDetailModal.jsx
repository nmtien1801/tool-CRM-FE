import React, { useState } from 'react';
import { Edit, Trash2, ExternalLink, Plus, Search } from 'lucide-react';

export default function CustomerDetailModal({
  customer,
  onClose,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  staffOptions = [],
  getPurchaseHistoriesFn
}) {
  // --- STATE TÌM KIẾM & LỌC NGÀY ---
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  if (!customer) return null;

  // Lấy lịch sử giao dịch thông qua hàm helper được truyền từ cha[cite: 2]
  const histories = getPurchaseHistoriesFn ? getPurchaseHistoriesFn(customer) : (customer.purchaseHistories || []);
  const validHistories = histories.filter(h => h.date || h.products || h.invoiceLink);

  // --- LOGIC LỌC DỮ LIỆU TẠI CLIENT ---
  const filteredHistories = validHistories.filter(history => {
    // 1. Lọc theo từ khóa tìm kiếm (Sản phẩm, Hạng mục, Báo giá, Người bán...)
    const matchesSearch = searchTerm.trim() === '' ||
      (history.products && history.products.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (history.category && history.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (history.quote && history.quote.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (history.seller && history.seller.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Lọc theo khoảng ngày (Từ ngày - Đến ngày)
    const matchesStartDate = !startDate || (history.date && history.date >= startDate);
    const matchesEndDate = !endDate || (history.date && history.date <= endDate);

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  // Hàm xóa nhanh các bộ lọc
  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

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

        {/* THANH TÌM KIẾM VÀ LỌC NGÀY MỚI BỔ SUNG */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4">
          {/* Ô tìm kiếm từ khóa */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo sản phẩm, hạng mục, báo giá..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Bộ lọc Từ ngày */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Từ:</span>
            <input
              type="date"
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          {/* Bộ lọc Đến ngày */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Đến:</span>
            <input
              type="date"
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          {/* Nút xóa nhanh bộ lọc */}
          {(searchTerm || startDate || endDate) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl transition-all"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Nội dung Modal */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Chi tiết giao dịch</span>
              <div className="text-xs text-slate-500 font-medium">
                Kết quả tìm thấy: <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded mr-3">{filteredHistories.length} / {validHistories.length} dòng</span>
                Tổng số lần giao dịch: <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded ml-1">lần {customer.purchaseCount}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[2200px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3.5 text-center w-12 bg-slate-50/40">STT</th>
                    <th className="px-4 py-3.5 w-32 border-l border-slate-200 bg-indigo-50/20 text-indigo-900">Ngày giao dịch</th>
                    <th className="px-4 py-3.5 w-60 bg-indigo-50/20 text-indigo-900">Sản phẩm</th>
                    <th className="px-4 py-3.5 text-center w-36 bg-indigo-50/20 text-indigo-900">Hóa đơn (URL)</th>
                    <th className="px-4 py-3.5 w-40 border-l border-slate-200 bg-indigo-50/20 text-indigo-900">Hạng mục</th>
                    <th className="px-4 py-3.5 w-32 bg-indigo-50/20 text-indigo-900">Phân loại</th>
                    <th className="px-4 py-3.5 w-32 bg-indigo-50/20 text-indigo-900">Báo giá</th>
                    <th className="px-4 py-3.5 w-32 bg-indigo-50/20 text-indigo-900">Giá chốt</th>
                    <th className="px-4 py-3.5 w-28 border-l border-slate-200 bg-sky-50/20 text-sky-900">Số ngày thuê</th>
                    <th className="px-4 py-3.5 w-36 bg-sky-50/20 text-sky-900">Thanh toán</th>
                    <th className="px-4 py-3.5 w-36 bg-sky-50/20 text-sky-900">Nguồn khách hàng</th>
                    <th className="px-4 py-3.5 w-64 border-l border-slate-200 bg-amber-50/20 text-amber-900">Mối quan tâm</th>
                    <th className="px-4 py-3.5 w-56 bg-amber-50/20 text-amber-900">Quà tặng áp dụng</th>
                    <th className="px-4 py-3.5 w-48 bg-amber-50/20 text-amber-900">Kênh tiếp cận</th>
                    <th className="px-4 py-3.5 w-44 border-l border-slate-200 bg-emerald-50/20 text-emerald-900">Người bán</th>
                    <th className="px-4 py-3.5 w-44 bg-emerald-50/20 text-emerald-900">Nhân sự tư vấn</th>
                    <th className="px-4 py-3.5 w-44 bg-emerald-50/20 text-emerald-900">Người chăm sóc</th>
                    <th className="px-4 py-3.5 text-center w-40 border-l border-slate-200 bg-slate-100 text-slate-700">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredHistories.length > 0 ? (
                    filteredHistories.map((history, index) => (
                      <tr key={history.id || index} className="hover:bg-slate-50/40 transition-colors align-top divide-x divide-slate-100">
                        <td className="px-4 py-4 font-semibold text-slate-400 text-center">{index + 1}</td>
                        <td className="px-4 py-4 font-bold text-slate-900 whitespace-nowrap border-l border-slate-200 bg-indigo-50/5">
                          {history.date || '---'}
                        </td>
                        <td className="px-4 py-4 text-slate-800 font-bold leading-relaxed break-words bg-indigo-50/5">
                          {history.products || '---'}
                        </td>

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

                        <td className="px-4 py-4 text-slate-800 font-medium break-words border-l border-slate-200 bg-indigo-50/5">
                          {history.category || <span className="text-slate-300 italic">Trống</span>}
                        </td>
                        <td className="px-4 py-4 text-slate-700 whitespace-nowrap bg-indigo-50/5">
                          {history.itemType === 'ban' ? (
                            <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md text-[11px] font-bold">Bán</span>
                          ) : history.itemType === 'dich_vu' ? (
                            <span className="bg-violet-50 border border-violet-200 text-violet-700 px-2 py-0.5 rounded-md text-[11px] font-bold">Dịch vụ</span>
                          ) : (
                            <span className="text-slate-300 italic">Trống</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-slate-700 break-words bg-indigo-50/5">
                          {history.quote || <span className="text-slate-300 italic">Trống</span>}
                        </td>
                        <td className="px-4 py-4 text-slate-900 font-bold whitespace-nowrap bg-indigo-50/5">
                          {history.price || <span className="text-slate-300 italic font-normal">Trống</span>}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-sky-700 border-l border-slate-200 bg-sky-50/5">
                          {history.rentalDays || 0}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap bg-sky-50/5">
                          {history.paymentMethod ? (
                            <span className="bg-sky-50 border border-sky-200 text-sky-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
                              {{ momo: 'Momo', ngan_hang: 'Ngân hàng', tien_mat: 'Tiền mặt' }[history.paymentMethod] || history.paymentMethod}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">Trống</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap bg-sky-50/5">
                          {history.customerSource ? (
                            <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
                              {{ fanpage: 'Fanpage', tiktok: 'TikTok', youtube: 'YouTube', zalo: 'Zalo', website: 'Website', partner: 'Partner', sale: 'Sale' }[history.customerSource] || history.customerSource}
                            </span>
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
                          {history.seller ? (
                            <span className="inline-block bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md text-[11px]">
                              {staffOptions.find(s => s.value === history.seller)?.label || history.seller}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa chỉ định</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap bg-emerald-50/5">
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
                      <td colSpan="18" className="text-xs text-slate-400 italic p-6 text-center">
                        {validHistories.length > 0
                          ? 'Không tìm thấy lịch sử giao dịch nào khớp với bộ lọc tìm kiếm.'
                          : 'Chưa có lịch sử giao dịch phân tách độc lập.'}
                      </td>
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