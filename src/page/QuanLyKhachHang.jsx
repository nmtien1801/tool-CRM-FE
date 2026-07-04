import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Loader2, Lock } from 'lucide-react';
import Select from 'react-select';
import CustomerDetailModal from '../components/CRM/CustomerDetailModal';
import InvoiceImageUploader from '../components/CRM/InvoiceImageUploader';
import ExpandableInput from '../components/ExpandableInput';
import Pagination from '../components/Pagination';
import ApiCustomer from '../api/ApiCustomer';
import { useAuth } from '../context/AuthContext';
import ApiAuth from '../api/ApiAuth';

import {
  ECOSYSTEM_OPTIONS,
  LABELS,
  CARE_METHODS,
  EMPTY_CUSTOMER
} from './CRM'; // Đã loại bỏ PROMO_OPTIONS tĩnh ở đây

const getPurchaseHistories = (customer) => {
  if (customer.purchaseHistories?.length) return customer.purchaseHistories;
  const dates = customer.purchaseDates?.length ? customer.purchaseDates : [''];
  return dates.map((date, index) => ({
    id: `${customer.id || 'new'}-${index}`,
    date,
    products: customer.products || '',
    invoiceLink: customer.invoiceLink || '',
    issue: customer.issue || '',
    careMethods: customer.careMethods || [],
    promotions: customer.promotions || [],
    consultant: customer.consultant || '',
    careStaff: customer.careStaff || ''
  }));
};

const normalizeCustomerData = (customer) => {
  const purchaseHistories = getPurchaseHistories(customer);
  let pCount = 0;
  if (customer.purchaseCount !== undefined && customer.purchaseCount !== '') {
    pCount = parseInt(String(customer.purchaseCount).replace(/\D/g, ''), 10) || 0;
  } else {
    pCount = purchaseHistories.filter(h => h.date || h.products || h.invoiceLink).length;
  }
  return {
    ...EMPTY_CUSTOMER,
    ...customer,
    purchaseHistories,
    purchaseCount: pCount,
    purchaseDates: purchaseHistories.map(h => h.date).filter(Boolean),
    products: customer.products || purchaseHistories.map(h => h.products).filter(Boolean).join(', '),
    invoiceLink: customer.invoiceLink || purchaseHistories.find(h => h.invoiceLink)?.invoiceLink || '',
    singleDate: customer.singleDate !== undefined && customer.singleDate !== '' ? customer.singleDate : (purchaseHistories[0]?.date || '')
  };
};

export default function CRMSystem() {
  const { user } = useAuth();

  const [staffList, setStaffList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [detailCustomerId, setDetailCustomerId] = useState(null);

  // ─── STATE QUAN TRỌNG HỆ THỐNG ───
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(EMPTY_CUSTOMER);

  const [promoEvent, setPromoEvent] = useState('');

  const [crmSearch, setCrmSearch] = useState('');
  const [crmFilterLabel, setCrmFilterLabel] = useState('');
  const [crmFilterEco, setCrmFilterEco] = useState('');

  // ─── STATE PHÂN TRANG (ĐỒNG BỘ THEO RESPONSE BE) ───
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ─── STATE LOADING & ERROR ───
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [careData, setCareData] = useState([]);

  const today = new Date();
  const todayDD = String(today.getDate()).padStart(2, '0');
  const todayMM = String(today.getMonth() + 1).padStart(2, '0');
  const birthdayList = customers.filter(c => {
    if (!c.birthday) return false;
    const parts = String(c.birthday).split('/'); // dd/MM/yyyy
    return parts.length === 3 && parts[0] === todayDD && parts[1] === todayMM;
  });
  const birthdayCount = birthdayList.length;

  // ─── HOOK FETCH DATA TỪ BACKEND ───
  const fetchStaff = async () => {
    try {
      const response = await ApiAuth.getListUser();
      const result = response?.DT || response;

      const userList = result?.user || [];
      const filteredStaff = userList.filter(user => user.role === 'Staff');

      setStaffList(filteredStaff);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách user:", error);
      alert("Không thể tải danh sách thành viên!");
    }
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await ApiCustomer.getAllCustomers({
        page: currentPage,
        size: pageSize,
        search: crmSearch,
        label: crmFilterLabel,
        ecosystem: crmFilterEco
      });

      if (response && response.EC === 0 && response.DT) {
        const { rows, pagination } = response.DT;

        setCustomers(rows || []);
        setTotalItems(pagination?.totalItems || 0);
        setTotalPages(pagination?.totalPages || 1);
        setCurrentPage(pagination?.currentPage || 1);
      } else {
        setApiError(response?.EM || "Không thể bóc tách dữ liệu từ máy chủ.");
      }
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu khách hàng:", error);
      setApiError("Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchCustomers();
      fetchStaff();
    }
  }, [currentPage, pageSize, crmSearch, crmFilterLabel, crmFilterEco, user]);

  const updateCareData = (careId, patch) => {
    setCareData(prev => prev.some(item => item.id === careId)
      ? prev.map(item => item.id === careId ? { ...item, ...patch } : item)
      : [...prev, { id: careId, ...patch }]
    );
  };

  // ─── Chuẩn hóa mọi dạng ngày (dd/MM/yyyy, d/M/yyyy, hoặc ISO yyyy-MM-dd cũ) về đúng dd/MM/yyyy để hiển thị nhất quán ───
  const toDMY = (value) => {
    if (!value) return '';
    const str = String(value).trim();
    // Nếu là chuẩn ISO yyyy-MM-dd (dữ liệu cũ) -> chuyển sang dd/MM/yyyy
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}/${m}/${y}`;
    }
    // Nếu đã là dd/MM/yyyy (hoặc d/M/yyyy) -> chỉ chuẩn hóa số 0 phía trước
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    return '';
  };

  // ─── Khớp text hệ sinh thái trích xuất được (VD: "Hệ sinh thái A") với value trong ECOSYSTEM_OPTIONS ───
  const matchEcosystem = (text) => {
    if (!text) return '';
    const t = String(text).trim().toLowerCase();
    const found = ECOSYSTEM_OPTIONS.find(o =>
      o.label.toLowerCase() === t || t.includes(o.label.toLowerCase()) || o.value.toLowerCase() === t
    );
    return found ? found.value : '';
  };

  // ─── Tách chuỗi "Zalo OA, Email Marketing, Messenger" thành mảng value khớp CARE_METHODS ───
  const matchCareMethods = (text) => {
    if (!text) return [];
    const list = Array.isArray(text) ? text : String(text).split(/[,;]/).map(s => s.trim()).filter(Boolean);
    return list
      .map(item => CARE_METHODS.find(m => m.label.toLowerCase() === item.toLowerCase() || m.value.toLowerCase() === item.toLowerCase())?.value)
      .filter(Boolean);
  };

  // ─── Chuẩn hóa khuyến mãi trích xuất được thành mảng [{ event }] ───
  const matchPromotions = (text) => {
    if (!text) return [];
    if (Array.isArray(text)) {
      return text.map(t => (typeof t === 'string' ? { event: t.trim() } : { event: t.event || t.name || '' })).filter(p => p.event);
    }
    return String(text).split(/[,;]/).map(s => s.trim()).filter(Boolean).map(event => ({ event }));
  };

  // ─── Tách nhiều ngày mua hàng "10/01/2026, 15/04/2026, 20/06/2026" thành mảng dd/MM/yyyy ───
  const matchPurchaseDates = (text) => {
    if (!text) return [];
    const list = Array.isArray(text) ? text : String(text).split(/[,;]/).map(s => s.trim()).filter(Boolean);
    return list.map(toDMY).filter(Boolean);
  };

  // ─── Khớp tên nhân viên trích xuất được với danh sách staffList thực tế (không lệch hoa/thường, khoảng trắng) ───
  const matchStaffName = (name) => {
    if (!name) return '';
    const found = staffList.find(s => s.fullName.toLowerCase() === String(name).trim().toLowerCase());
    return found ? found.fullName : String(name).trim();
  };

  const handleOcrExtracted = (fields) => {
    if (!fields) return; // Trường hợp người dùng bấm "Xóa" ảnh -> không có dữ liệu để map
    setFormData((prev) => {
      const purchaseDates = matchPurchaseDates(fields.purchaseDates);
      const newCareMethods = matchCareMethods(fields.careMethods);
      const newPromotions = matchPromotions(fields.promotions);

      return {
        ...prev,
        fullName: fields.fullName || prev.fullName,
        birthday: toDMY(fields.birthday) || prev.birthday,
        address: fields.address || prev.address,
        phone: fields.phone || prev.phone,
        email: fields.email || prev.email,
        facebook: fields.facebook || prev.facebook,
        ecosystem: matchEcosystem(fields.ecosystem) || prev.ecosystem,
        singleDate: (purchaseDates[purchaseDates.length - 1]) || toDMY(fields.singleDate) || prev.singleDate,
        purchaseDates: purchaseDates.length ? purchaseDates : prev.purchaseDates,
        purchaseCount: purchaseDates.length || fields.purchaseCount || prev.purchaseCount,
        products: fields.products || prev.products,
        invoiceLink: fields.invoiceLink || prev.invoiceLink,
        issue: fields.issue || prev.issue,
        promotions: newPromotions.length ? [...(prev.promotions || []), ...newPromotions] : prev.promotions,
        careMethods: newCareMethods.length ? Array.from(new Set([...(prev.careMethods || []), ...newCareMethods])) : prev.careMethods,
        consultant: matchStaffName(fields.consultant) || prev.consultant,
        careStaff: matchStaffName(fields.careStaff) || prev.careStaff,
        label: fields.label || prev.label,
      };
    });
  };

  const handleClearForm = () => {
    setFormData(EMPTY_CUSTOMER);
    setEditingId(null);
    setEditingHistoryId(null);
  };

  const handleSaveData = async () => {
    if (!formData.fullName || !formData.phone || !formData.birthday) {
      alert('Vui lòng nhập tối thiểu Họ và tên, Ngày sinh, Số điện thoại!');
      return;
    }
    const normalizedForm = normalizeCustomerData(formData);
    let finalHistories = [...normalizedForm.purchaseHistories];

    if (finalHistories.length === 0) {
      finalHistories.push({
        id: `${Date.now()}-0`,
        date: formData.singleDate,
        products: formData.products,
        invoiceLink: formData.invoiceLink,
        issue: formData.issue,
        careMethods: formData.careMethods,
        promotions: formData.promotions,
        consultant: formData.consultant,
        careStaff: formData.careStaff
      });
    } else if (!editingHistoryId) {
      finalHistories[0] = {
        ...finalHistories[0],
        date: formData.singleDate,
        products: formData.products,
        invoiceLink: formData.invoiceLink,
        issue: formData.issue,
        careMethods: formData.careMethods,
        promotions: formData.promotions,
        consultant: formData.consultant,
        careStaff: formData.careStaff
      };
    } else {
      finalHistories = finalHistories.map(h =>
        h.id === editingHistoryId ? {
          ...h,
          date: formData.singleDate,
          products: formData.products,
          invoiceLink: formData.invoiceLink,
          issue: formData.issue,
          careMethods: formData.careMethods,
          promotions: formData.promotions,
          consultant: formData.consultant,
          careStaff: formData.careStaff
        } : h
      );
    }

    const payload = { ...normalizedForm, purchaseHistories: finalHistories };

    try {
      if (editingId) {
        await ApiCustomer.updateCustomer(editingId, payload);
        alert('Đã cập nhật thông tin thành công!');
      } else {
        await ApiCustomer.createCustomer(payload);
        alert('Đã thêm mới thành công!');
      }
      setEditingId(null);
      setEditingHistoryId(null);
      handleClearForm();
      fetchCustomers();
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu khách hàng:", error);
      alert('Lưu dữ liệu thất bại. Vui lòng kiểm tra lại kết nối!');
    }
  };

  const handleDeleteHistory = async (customerId, historyId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.')) {
      return;
    }
    try {
      await ApiCustomer.deletePurchaseHistory(customerId, historyId);
      alert('Đã xóa giao dịch thành công!');
      fetchCustomers();
    } catch (error) {
      console.error("Lỗi khi xóa lịch sử giao dịch:", error);
      alert('Xóa giao dịch thất bại!');
    }
  };

  const handleLabelChange = async (customerId, nextLabel) => {
    try {
      await ApiCustomer.patchCustomer(customerId, { label: nextLabel });
      setCustomers(customers.map(c => c.id === customerId ? { ...c, label: nextLabel } : c));
    } catch (error) {
      console.error("Lỗi khi cập nhật nhãn:", error);
      alert('Không thể cập nhật nhãn trạng thái!');
    }
  };

  const handleEditClick = (customer) => {
    setFormData(normalizeCustomerData(customer));
    setEditingId(customer.id);
    setEditingHistoryId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRenderedRows = () => {
    return customers.map(normalizeCustomerData);
  };

  const detailCustomer = detailCustomerId ? customers.map(normalizeCustomerData).find(c => c.id === detailCustomerId) : null;

  if (!user || user.role !== 'Admin') {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shadow-xs mb-4">
          <Lock className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Truy cập bị từ chối</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm leading-relaxed">
          Tài khoản của bạn không có quyền truy cập vào Module quản lý khách hàng (CRM). Vui lòng sử dụng tài khoản Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      <main className="max-w-[1600px] mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* ─── KHỐI CHỌN ẢNH ─── */}
          <InvoiceImageUploader onExtracted={handleOcrExtracted} />

          {/* ─── KHỐI THÔNG TIN BIỂU MẪU ─── */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 mb-4 gap-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600">
                  Biểu mẫu nhập liệu thông tin khách hàng
                </h3>
                <div className="flex gap-2">
                  <button type="button" onClick={handleSaveData} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all">
                    {editingId ? 'Cập nhật thay đổi' : 'Lưu vào hệ thống'}
                  </button>
                  <button type="button" onClick={handleClearForm} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
                    Xóa trắng
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {editingId && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-700">
                    {editingHistoryId ? 'Đang chỉnh sửa chi tiết 1 đơn hàng cụ thể.' : 'Đang chỉnh sửa toàn bộ thông tin gốc.'}
                  </div>
                )}

                {/* Nhóm 1: Thông tin cơ bản */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 1: Thông tin cơ bản</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Họ và tên *</label>
                      <input type="text" placeholder="Nhập thủ công" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày sinh *</label>
                      <input type="text" placeholder="dd/MM/yyyy" pattern="\d{2}/\d{2}/\d{4}" title="Định dạng: dd/MM/yyyy" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.birthday} onChange={e => setFormData({ ...formData, birthday: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Địa chỉ chính xác</label>
                      <input type="text" placeholder="Nhập địa chỉ cư trú" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Nhóm 2: Kênh liên hệ */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 2: Kênh liên hệ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số điện thoại *</label>
                      <input type="text" placeholder="Nhập thủ công" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Thư điện tử (Email)</label>
                      <input type="email" placeholder="Nhập thủ công" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Đường dẫn Facebook</label>
                      <input type="text" placeholder="Link Facebook" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.facebook} onChange={e => setFormData({ ...formData, facebook: e.target.value })} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hệ sinh thái</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.ecosystem} onChange={e => setFormData({ ...formData, ecosystem: e.target.value })}>
                        <option value="">-- Click để chọn hệ sinh thái --</option>
                        {ECOSYSTEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Nhóm 3: Lịch sử mua hàng */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 3: Lịch sử mua hàng</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tổng số lần đã mua hàng</label>
                        <input type="number" min="0" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs disabled:bg-slate-100" value={formData.purchaseCount || 0} disabled />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày mua hàng</label>
                        <input type="text" placeholder="dd/MM/yyyy" pattern="\d{2}/\d{2}/\d{4}" title="Định dạng: dd/MM/yyyy" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.singleDate} onChange={e => setFormData({ ...formData, singleDate: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên sản phẩm đã mua</label>
                          <input type="text" placeholder="Chi tiết sản phẩm" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.products} onChange={e => setFormData({ ...formData, products: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Đường dẫn hóa đơn (URL Link)</label>
                          <input
                            type="text"
                            placeholder="Nhập đường dẫn URL hóa đơn tại đây..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.invoiceLink}
                            onChange={e => setFormData({ ...formData, invoiceLink: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nhóm 4: Chăm sóc & Tiếp thị */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 4: Chăm sóc &amp; Tiếp thị</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mối quan tâm / Vấn đề</label>
                      <ExpandableInput
                        value={formData.issue}
                        onChange={(newValue) => setFormData({ ...formData, issue: newValue })}
                        placeholder="Nhu cầu khách hàng..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Khuyến mãi áp dụng</label>
                      <div className="flex gap-1.5">

                        {/* ─── Nhập tay khuyến mãi đã tặng cho khách hàng ─── */}
                        <input
                          type="text"
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                          placeholder="Nhập tên khuyến mãi đã tặng..."
                          value={promoEvent}
                          onChange={e => setPromoEvent(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (promoEvent.trim()) setFormData({ ...formData, promotions: [...(formData.promotions || []), { event: promoEvent.trim() }] });
                              setPromoEvent('');
                            }
                          }}
                        />

                        <button type="button" onClick={() => { if (promoEvent.trim()) setFormData({ ...formData, promotions: [...(formData.promotions || []), { event: promoEvent.trim() }] }); setPromoEvent(''); }} className="bg-indigo-50 text-indigo-700 px-3 text-xs font-bold rounded-xl border border-indigo-200">Thêm</button>
                      </div>
                      <div className="mt-1.5 space-y-1">
                        {(formData.promotions || []).map((p, i) => (
                          <div key={i} className="text-[10px] bg-white p-2 rounded-lg flex justify-between items-center border border-slate-200">
                            <span>Sự kiện: <strong className="text-indigo-600">{p.event}</strong></span>
                            <span className="text-rose-500 font-bold cursor-pointer" onClick={() => setFormData({ ...formData, promotions: formData.promotions.filter((_, idx) => idx !== i) })}>Gỡ</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phương thức chăm sóc (Chọn nhiều)</label>
                      <div className="flex flex-wrap gap-4 bg-white p-3 rounded-xl border border-slate-200">
                        {CARE_METHODS.map(m => (
                          <label key={m.value} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input type="checkbox" checked={(formData.careMethods || []).includes(m.value)} onChange={e => setFormData({ ...formData, careMethods: e.target.checked ? [...(formData.careMethods || []), m.value] : formData.careMethods.filter(c => c !== m.value) })} className="rounded text-indigo-600 focus:ring-indigo-500" />
                            {m.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nhóm 5: Phân sự nội bộ */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 5: Phân sự nội bộ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nhân viên tư vấn</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.consultant} onChange={e => setFormData({ ...formData, consultant: e.target.value })}>
                        <option value="">-- Chọn nhân sự tư vấn --</option>
                        {staffList.map(s => <option key={s.id} value={s.fullName}>{s.fullName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nhân viên chăm sóc</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.careStaff} onChange={e => setFormData({ ...formData, careStaff: e.target.value })}>
                        <option value="">-- Chọn nhân sự chăm sóc --</option>
                        {staffList.map(s => <option key={s.id} value={s.fullName}>{s.fullName}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Nhóm 6: Trạng thái & Gán nhãn */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 6: Trạng thái &amp; Gán nhãn</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gán nhãn phân cấp</label>
                    <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-600" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })}>
                      {LABELS.map(l => <option key={l.value} value={l.value} className="text-slate-800 font-normal">{l.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── BẢNG DỮ LIỆU CRM CHÍNH ─── */}
        <div className="space-y-4 pt-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-xs">
            <div className="flex-1 min-w-[280px]">
              <input type="text" placeholder="Tìm kiếm toàn bộ thông tin..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={crmSearch} onChange={e => { setCrmSearch(e.target.value); setCurrentPage(1); }} />
            </div>
            <select className="w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" value={crmFilterLabel} onChange={e => { setCrmFilterLabel(e.target.value); setCurrentPage(1); }}>
              <option value="">Lọc theo nhãn gán</option>
              {LABELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <select className="w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" value={crmFilterEco} onChange={e => { setCrmFilterEco(e.target.value); setCurrentPage(1); }}>
              <option value="">Lọc theo hệ sinh thái</option>
              {ECOSYSTEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-auto">
              <span>Hiển thị:</span>
              <select className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size} dòng</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative min-h-[200px]">
            {isLoading && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs font-semibold text-slate-600">Đang tải dữ liệu...</span>
              </div>
            )}

            {apiError && (
              <div className="p-6 text-center text-xs text-rose-500 font-medium bg-rose-50 border-b border-rose-100">
                {apiError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[980px] table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-4 py-4 w-72">Thông tin cơ bản</th>
                    <th className="px-4 py-4 w-72">Kênh liên hệ</th>
                    <th className="px-4 py-4 w-72">Tổng số lần mua hàng</th>
                    <th className="px-4 py-4 w-48 text-center">Nhãn trạng thái</th>
                    <th className="px-4 py-4 w-44 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {getRenderedRows().map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors align-top">
                      <td className="px-3 py-3 space-y-1">
                        <span className="font-bold text-slate-900 text-sm block">{cust.fullName}</span>
                        <div><span className="text-slate-500">Ngày sinh:</span> <span className="font-medium text-slate-800">{cust.birthday}</span></div>
                        <div className="text-slate-600"><span className="text-slate-500">Địa chỉ:</span> <p className="inline break-words font-medium">{cust.address || 'Chưa cập nhật'}</p></div>
                      </td>
                      <td className="px-3 py-3 space-y-1">
                        <div><span className="text-slate-500">SĐT:</span> <span className="font-bold text-slate-900">{cust.phone}</span></div>
                        <div><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-800 break-all">{cust.email || 'Chưa điền'}</span></div>
                        <div><span className="text-slate-500">Facebook:</span> {cust.facebook ? <a href={cust.facebook} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium break-all">{cust.facebook}</a> : <span className="text-slate-400 italic">Trống</span>}</div>
                        <div className="pt-1"><span className="bg-slate-100 border text-slate-700 px-2 py-0.5 rounded-md font-medium text-[10px]">{ECOSYSTEM_OPTIONS.find(e => e.value === cust.ecosystem)?.label || 'Chưa chọn'}</span></div>
                      </td>
                      <td className="px-3 py-3 space-y-1">
                        <span className="font-bold text-indigo-600">lần {cust.purchaseCount}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <select value={cust.label} onChange={e => handleLabelChange(cust.id, e.target.value)} className={`text-xs font-bold px-2 py-1.5 rounded-xl border cursor-pointer w-full text-center transition-all ${LABELS.find(l => l.value === cust.label)?.color}`}>
                          {LABELS.map(l => <option key={l.value} value={l.value} className="bg-white text-slate-800 font-normal text-left">{l.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col gap-1 items-center">
                          <button onClick={() => setDetailCustomerId(cust.id)} className="w-full py-1 text-[11px] bg-indigo-600 text-white rounded-lg border border-indigo-600">Xem chi tiết</button>
                          <button onClick={() => handleEditClick(cust)} className="w-full py-1 text-[11px] bg-slate-100 text-slate-700 rounded-lg border">Sửa thông tin</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {getRenderedRows().length === 0 && !isLoading && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-400 italic">Không tìm thấy khách hàng nào khớp với bộ lọc.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
            />
          </div>
        </div>

        <CustomerDetailModal
          customer={detailCustomer}
          onClose={() => setDetailCustomerId(null)}
          staffOptions={staffList.map(s => ({ value: s.fullName, label: s.fullName }))}
          getPurchaseHistoriesFn={getPurchaseHistories}
          onDeleteTransaction={(historyId) => handleDeleteHistory(detailCustomer.id, historyId)}
          onEditTransaction={(history) => {
            const targetedFormData = {
              ...detailCustomer,
              singleDate: history.date || '',
              products: history.products || detailCustomer.products,
              invoiceLink: history.invoiceLink || detailCustomer.invoiceLink,
              issue: history.issue || detailCustomer.issue,
              careMethods: (history.careMethods && history.careMethods.length > 0) ? history.careMethods : detailCustomer.careMethods,
              promotions: (history.promotions && history.promotions.length > 0) ? history.promotions : detailCustomer.promotions,
              consultant: history.consultant || detailCustomer.consultant,
              careStaff: history.careStaff || detailCustomer.careStaff
            };
            setFormData(normalizeCustomerData(targetedFormData));
            setEditingId(detailCustomer.id);
            setEditingHistoryId(history.id);
            setDetailCustomerId(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </main>
    </div>
  );
}