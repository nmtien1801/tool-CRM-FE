import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Edit3, Search, X, AlertTriangle, Loader2, Calendar } from 'lucide-react';
import ApiPromotion from '../api/ApiPromotion';
import Pagination from '../components/Pagination';

export default function PromotionPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ─── STATE PHÂN TRANG ───
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ─── STATE POPUP FORM (THÊM / SỬA) ───
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', code: '', name: '', appliedFrom: '', appliedTo: '' });

  // ─── STATE POPUP CONFIRM XÓA ───
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  // --- 1. CALL API: LẤY DANH SÁCH KHUYẾN MÃI ---
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await ApiPromotion.getList({
        page: currentPage,
        limit: pageSize,
        search: searchTerm
      });

      const result = response?.DT || response;
      if (response?.EC === 0 || result) {
        setPromotions(result?.promotions || []);
        setTotalItems(result?.totalItems || 0);
        setTotalPages(result?.totalPages || 1);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách khuyến mãi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [currentPage, pageSize, searchTerm]);

  // --- 2. XỬ LÝ MỞ FORM THÊM / SỬA ---
  const openCreateForm = () => {
    setFormData({ id: '', code: '', name: '', appliedFrom: '', appliedTo: '' });
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (promo) => {
    // Định dạng lại chuỗi Date thành YYYY-MM-DD để hiển thị chuẩn lên thẻ <input type="date" />
    const formatDate = (dateStr) => dateStr ? dateStr.substring(0, 10) : '';
    
    setFormData({
      id: promo.id,
      code: promo.code,
      name: promo.name,
      appliedFrom: formatDate(promo.appliedFrom),
      appliedTo: formatDate(promo.appliedTo),
    });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  // --- 3. CALL API: SUBMIT FORM (LƯU / CẬP NHẬT) ---
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (isEditMode) {
        response = await ApiPromotion.update(formData);
      } else {
        response = await ApiPromotion.create(formData);
      }

      if (response && response.EC === 0) {
        alert(isEditMode ? 'Cập nhật khuyến mãi thành công!' : 'Tạo mới khuyến mãi thành công!');
        setIsFormOpen(false);
        fetchPromotions();
      } else {
        alert(`Thất bại: ${response?.EM || 'Đã xảy ra lỗi'}`);
      }
    } catch (error) {
      console.error("Lỗi xử lý form:", error);
      alert("Lỗi kết nối hệ thống.");
    }
  };

  // --- 4. CALL API: THỰC THI XÓA ---
  const handleDeletePromotion = async () => {
    try {
      const response = await ApiPromotion.delete(deleteModal.id);
      if (response && response.EC === 0) {
        alert(`Đã xóa sự kiện: ${deleteModal.name}`);
        setDeleteModal({ isOpen: false, id: null, name: '' });
        fetchPromotions();
      } else {
        alert(`Lỗi: ${response?.EM || 'Không thể xóa'}`);
      }
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
    }
  };

  // Định dạng hiển thị ngày DD/MM/YYYY cho bảng dữ liệu
  const displayDate = (dateStr) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 p-6 space-y-6 text-slate-800">
      
      {/* Tiêu đề trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-indigo-600" /> Hệ thống Quản lý Khuyến mãi
          </h2>
          <p className="text-xs text-slate-500 mt-1">Cấu hình mã giảm giá, sự kiện quà tặng và quản lý mốc thời gian áp dụng.</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm khuyến mãi
        </button>
      </div>

      {/* Thanh bộ lọc tìm kiếm */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên chương trình..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Hiển thị:</span>
          <select 
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-700"
            value={pageSize} 
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
          >
            {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size} dòng</option>)}
          </select>
        </div>
      </div>

      {/* Bảng hiển thị dữ liệu */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden relative min-h-[250px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold text-slate-600">Đang đồng bộ dữ liệu...</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 w-48">Mã chiến dịch (Code)</th>
                <th className="px-6 py-4">Tên chương trình khuyến mãi</th>
                <th className="px-6 py-4 w-64">Thời gian hiệu lực (Timeline)</th>
                <th className="px-6 py-4 text-center w-40">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs">
              {promotions.length > 0 ? (
                promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Code */}
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 text-sm">
                      {promo.code}
                    </td>
                    {/* Name */}
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {promo.name}
                    </td>
                    {/* Timeline */}
                    <td className="px-6 py-4 text-slate-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Từ</span>
                        <span className="font-medium">{displayDate(promo.appliedFrom)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Đến</span>
                        <span className="font-medium">{displayDate(promo.appliedTo)}</span>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditForm(promo)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors"
                          title="Sửa chiến dịch"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ isOpen: true, id: promo.id, name: promo.name })}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                          title="Xóa chiến dịch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : !loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 italic bg-slate-50/10">
                    Không tìm thấy chương trình khuyến mãi nào phù hợp.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {promotions.length > 0 && (
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
          />
        )}
      </div>

      {/* ─── MODAL POPUP: FORM THÊM / SỬA ─── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleSubmitForm} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-800">
                {isEditMode ? 'Cập nhật chương trình khuyến mãi' : 'Tạo mới chiến dịch khuyến mãi'}
              </h4>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mã chương trình (Code) *</label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: VOUCHER_30, BLACK_FRIDAY..."
                  value={formData.code}
                  disabled={isEditMode} // Không cho phép sửa code nếu ở chế độ Edit
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono disabled:bg-slate-50 disabled:text-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên chương trình hiển thị *</label>
                <input
                  required
                  type="text"
                  placeholder="Nhập tên sự kiện khuyến mãi..."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày bắt đầu *</label>
                  <input
                    required
                    type="date"
                    value={formData.appliedFrom}
                    onChange={e => setFormData({ ...formData, appliedFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày kết thúc *</label>
                  <input
                    required
                    type="date"
                    value={formData.appliedTo}
                    onChange={e => setFormData({ ...formData, appliedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-150 flex justify-end gap-2 bg-slate-50">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100">
                Hủy bỏ
              </button>
              <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">
                {isEditMode ? 'Cập nhật' : 'Xác nhận tạo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL POPUP: XÁC NHẬN XÓA ─── */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl shrink-0 bg-rose-50 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Xác nhận xóa khuyến mãi</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Bạn có chắc chắn muốn xóa chương trình <span className="font-bold text-slate-800">"{deleteModal.name}"</span> không? Dữ liệu lịch sử áp dụng mã này có thể bị ảnh hưởng.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setDeleteModal({ isOpen: false, id: null, name: '' })} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100">
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeletePromotion}
                className="px-4 py-1.5 text-white bg-rose-600 hover:bg-rose-700 rounded-lg text-xs font-bold"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}