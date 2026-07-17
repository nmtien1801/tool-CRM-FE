import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Loader2, Lock, UserPlus, FilePlus2 } from 'lucide-react';
import CustomerDetailModal from '../components/CRM/CustomerDetailModal';
import InvoiceImageUploader from '../components/CRM/InvoiceImageUploader';
import ExpandableInput from '../components/ExpandableInput';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/CRM/ConfirmModal';
import { useAuth } from '../context/AuthContext';

// Import lại các API Services độc lập theo yêu cầu của bạn
import ApiAuth from '../api/ApiAuth';
import ApiCustomer from '../api/ApiCustomer';
import ApiPurchaseHistory from '../api/ApiPurchaseHistory';

import {
  ECOSYSTEM_OPTIONS,
  LABELS,
  CARE_METHODS,
  EMPTY_CUSTOMER,
  ITEM_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  CUSTOMER_SOURCE_OPTIONS
} from './CRM';

// Hàm phụ trợ lấy chuỗi ngày hiện tại YYYY-MM-DD theo giờ địa phương, tránh lệch múi giờ
const getTodayISODate = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - (offset * 60 * 1000));
  return localToday.toISOString().split('T')[0]; // Trả về dạng "2026-07-06"
};

export default function CRMSystem() {
  const { user } = useAuth();

  // --- STATE DỮ LIỆU TỪ API ---
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [detailCustomerPurchaseHistory, setDetailCustomerPurchaseHistory] = useState([]);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState(null);
  // State lưu trữ tổng số tiền đã mua theo customerId
  const [totalSpentMap, setTotalSpentMap] = useState({});

  // --- TRẠNG THÁI FORM ---
  const [editingId, setEditingId] = useState(null);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [isAddingPurchaseHistory, setIsAddingPurchaseHistory] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  // Khởi tạo form với ngày mua hàng mặc định là ngày hiện tại
  const [formData, setFormData] = useState({
    ...EMPTY_CUSTOMER,
    singleDate: getTodayISODate(),
    // Nhóm 3 bổ sung
    category: '',
    itemType: '',
    quote: '',
    price: 0,
    // Nhóm 4 bổ sung
    rentalDays: 0,
    paymentMethod: '',
    customerSource: '',
    referralCustomerId: '',
    // Nhóm 5 bổ sung
    seller: ''
  });
  const [promoEvent, setPromoEvent] = useState('');

  // --- BỘ LỌC VÀ PHÂN TRANG (SERVER-SIDE) ---
  const [crmSearch, setCrmSearch] = useState('');
  const [crmSearchById, setCrmSearchById] = useState('');
  const [crmFilterLabel, setCrmFilterLabel] = useState('');
  const [crmFilterEco, setCrmFilterEco] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // 1. API: Lấy danh sách thành viên nội bộ (Staff)
  const fetchStaff = async () => {
    try {
      const response = await ApiAuth.getListUser();
      const result = response?.DT || response;
      const userList = result?.user || [];
      const filteredStaff = userList.filter(u => u.role === 'Staff');
      setStaffList(filteredStaff);
    } catch (error) {
      console.error("Lỗi tải danh sách user:", error);
      setFormError("Không thể tải danh sách thành viên nội bộ!");
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // 2. API: Lấy danh sách khách hàng phân trang, tìm kiếm từ Server
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const params = {
        search: crmSearch,
        id: crmSearchById,
        label: crmFilterLabel,
        ecosystem: crmFilterEco,
        page: currentPage,
        pageSize: pageSize
      };

      const response = await ApiCustomer.getCustomers(params);
      const result = response?.DT || response;

      if (result && typeof result === 'object') {
        if ('rows' in result && Array.isArray(result.rows)) {
          setCustomers(result.rows);
          if (result.pagination) {
            setTotalItems(result.pagination.totalItems || 0);
            setTotalPages(result.pagination.totalPages || 1);
          }
        }
        else if ('items' in result) {
          setCustomers(Array.isArray(result.items) ? result.items : []);
          setTotalItems(result.total || result.totalItems || 0);
          setTotalPages(result.totalPages || 1);
        }
        else if ('customers' in result && Array.isArray(result.customers)) {
          setCustomers(result.customers);
          setTotalItems(result.total || result.totalItems || 0);
          setTotalPages(result.totalPages || 1);
        }
        else if (Array.isArray(result)) {
          setCustomers(result);
          setTotalItems(result.length);
          setTotalPages(1);
        } else {
          setCustomers([]);
        }
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách khách hàng từ API:", err);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, pageSize, crmSearch, crmSearchById, crmFilterLabel, crmFilterEco]);

  // API: Gọi tổng số tiền đã mua của từng khách hàng khi danh sách thay đổi
  useEffect(() => {
    const fetchAllTotalSpent = async () => {
      if (!customers || customers.length === 0) return;

      const spentData = {};
      await Promise.all(
        customers.map(async (cust) => {
          try {
            const res = await ApiCustomer.getCustomerTotalSpent(cust.id);
            // Giả định API trả về định dạng { EC, EM, DT: số tiền } hoặc trực tiếp số tiền
            spentData[cust.id] = res?.DT?.totalSpent !== undefined ? res.DT.totalSpent : (res || 0);
          } catch (err) {
            console.error(`Lỗi tải tổng tiền tích lũy khách hàng ${cust.id}:`, err);
            spentData[cust.id] = 0;
          }
        })
      );
      setTotalSpentMap(spentData);
    };

    fetchAllTotalSpent();
  }, [customers]);

  // 3. API: Gọi chi tiết lịch sử giao dịch của khách hàng được chọn
  const fetchCustomerPurchaseHistory = async (customerId) => {
    try {
      const response = await ApiPurchaseHistory.getCustomerPurchaseHistory(customerId);
      const result = response?.DT || response;
      setDetailCustomerPurchaseHistory(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("Lỗi tải lịch sử mua hàng từ API:", err);
      setDetailCustomerPurchaseHistory([]);
    }
  };

  // --- CÁC HÀM ĐỊNH DẠNG & OCR EXTRACTORS ---
  const toDMY = (value) => {
    if (!value) return '';
    const str = String(value).trim();
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}/${m}/${y}`;
    }
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    return '';
  };

  // Hàm chuyển đổi ngược từ dd/mm/yyyy sang yyyy-mm-dd cho ô input type="date"
  const toISODate = (value) => {
    if (!value) return '';
    const str = String(value).trim();
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return str;
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return '';
  };

  const matchEcosystem = (text) => {
    if (!text) return '';
    const t = String(text).trim().toLowerCase();
    const found = ECOSYSTEM_OPTIONS.find(o =>
      o.label.toLowerCase() === t || t.includes(o.label.toLowerCase()) || o.value.toLowerCase() === t
    );
    return found ? found.value : '';
  };

  const matchCareMethods = (text) => {
    if (!text) return [];
    const list = Array.isArray(text) ? text : String(text).split(/[,;]/).map(s => s.trim()).filter(Boolean);
    return list
      .map(item => CARE_METHODS.find(m => m.label.toLowerCase() === item.toLowerCase() || m.value.toLowerCase() === item.toLowerCase())?.value)
      .filter(Boolean);
  };

  const matchPromotions = (text) => {
    if (!text) return [];
    if (Array.isArray(text)) {
      return text.map(t => (typeof t === 'string' ? { event: t.trim() } : { event: t.event || t.name || '' })).filter(p => p.event);
    }
    return String(text).split(/[,;]/).map(s => s.trim()).filter(Boolean).map(event => ({ event }));
  };

  const matchPurchaseDates = (text) => {
    if (!text) return [];
    const list = Array.isArray(text) ? text : String(text).split(/[,;]/).map(s => s.trim()).filter(Boolean);
    return list.map(toISODate).filter(Boolean);
  };

  const matchStaffName = (name) => {
    if (!name) return '';
    const found = staffList.find(s =>
      (s.fullName && s.fullName.toLowerCase() === String(name).trim().toLowerCase()) ||
      (s.username && s.username.toLowerCase() === String(name).trim().toLowerCase())
    );
    return found ? (found.username || found.id) : String(name).trim();
  };

  const handleOcrExtracted = (fields) => {
    if (!fields) return;
    setFormError('');
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
        singleDate: (purchaseDates[purchaseDates.length - 1]) || toISODate(fields.singleDate) || prev.singleDate,
        purchaseCount: purchaseDates.length || fields.purchaseCount || prev.purchaseCount,
        products: fields.products || prev.products,
        invoiceLink: fields.invoiceLink || prev.invoiceLink,
        issue: fields.issue || prev.issue,
        promotions: newPromotions.length ? [...(prev.promotions || []), ...newPromotions] : prev.promotions,
        careMethods: newCareMethods.length ? Array.from(new Set([...(prev.careMethods || []), ...newCareMethods])) : prev.careMethods,
        consultant: matchStaffName(fields.consultant) || prev.consultant,
        careStaff: matchStaffName(fields.careStaff) || prev.careStaff,
        label: fields.label || prev.label,
        // Nhóm 3 bổ sung
        category: fields.category || prev.category,
        itemType: fields.itemType || prev.itemType,
        quote: fields.quote || prev.quote,
        price: fields.price || prev.price,
        // Nhóm 4 bổ sung
        rentalDays: fields.rentalDays || prev.rentalDays,
        paymentMethod: fields.paymentMethod || prev.paymentMethod,
        customerSource: fields.customerSource || prev.customerSource,
        // Nhóm 5 bổ sung
        seller: matchStaffName(fields.seller) || prev.seller,
      };
    });
  };

  const handleClearForm = () => {
    setFormData({
      fullName: '',
      birthday: '',
      address: '',
      phone: '',
      email: '',
      facebook: '',
      ecosystem: '',
      singleDate: getTodayISODate(),
      purchaseCount: 0,
      products: '',
      invoiceLink: '',
      issue: '',
      promotions: [],
      careMethods: [],
      consultant: '',
      careStaff: '',
      label: '',
      // Nhóm 3 bổ sung
      category: '',
      itemType: '',
      quote: '',
      price: 0,
      // Nhóm 4 bổ sung
      rentalDays: 0,
      paymentMethod: '',
      customerSource: '',
      referralCustomerId: '',
      // Nhóm 5 bổ sung
      seller: ''
    });
    setEditingId(null);
    setEditingHistoryId(null);
    setIsAddingPurchaseHistory(false);
    setFormError('');
  };

  // --- HÀM THỰC THI THAY ĐỔI DỮ LIỆU QUA API SERVICES ---
  const fetchCustomerById = async (customerId) => {
    try {
      const response = await ApiCustomer.getCustomerById(customerId);
      const result = response?.DT || response;
      return result && typeof result === 'object' ? result : null;
    } catch (error) {
      console.error('Lỗi tải chi tiết khách hàng:', error);
      return null;
    }
  };

  const handleSaveData = async () => {
    if (!formData.fullName || !formData.phone || !formData.birthday) {
      setFormError('Vui lòng nhập tối thiểu Họ và tên, Ngày sinh, Số điện thoại!');
      return;
    }
    setFormError('');

    const historyPayload = {
      date: formData.singleDate,
      products: formData.products,
      invoiceLink: formData.invoiceLink,
      issue: formData.issue,
      careMethods: formData.careMethods || [],
      promotions: formData.promotions || [],
      consultant: formData.consultant,
      careStaff: formData.careStaff,
      // Nhóm 3 bổ sung: chi tiết hạng mục / báo giá
      category: formData.category,
      itemType: formData.itemType,
      quote: formData.quote,
      price: formData.price,
      // Nhóm 4 bổ sung: thuê, thanh toán, nguồn khách hàng
      rentalDays: formData.rentalDays,
      paymentMethod: formData.paymentMethod,
      customerSource: formData.customerSource,
      referralCustomerId: formData.referralCustomerId || null,
      // Nhóm 5 bổ sung: người bán
      seller: formData.seller
    };

    const customerPayload = {
      fullName: formData.fullName,
      birthday: formData.birthday,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      facebook: formData.facebook,
      ecosystem: formData.ecosystem,
      label: formData.label,
      referralCustomerId: formData.referralCustomerId || null
    };

    const isHistoryValid = historyPayload.date || historyPayload.products || historyPayload.invoiceLink;

    try {
      if (isAddingPurchaseHistory && editingId) {
        if (!isHistoryValid) {
          setFormError('Vui lòng nhập thông tin đơn hàng (Ngày mua, sản phẩm hoặc link hóa đơn)!');
          return;
        }
        await ApiPurchaseHistory.createPurchaseHistory(editingId, historyPayload);
      }
      else if (editingId && editingHistoryId) {
        await ApiPurchaseHistory.updatePurchaseHistory(editingHistoryId, historyPayload);
      }
      else if (editingId) {
        await ApiCustomer.updateCustomer(editingId, customerPayload);
      }
      else {
        const customerResponse = await ApiCustomer.createCustomer(customerPayload);
        const customerResult = customerResponse?.DT || customerResponse;

        if (customerResult?.id && isHistoryValid) {
          await ApiPurchaseHistory.createPurchaseHistory(customerResult.id, historyPayload);
        }
      }

      await fetchCustomers();

      if (selectedCustomerForModal?.id === editingId) {
        const updatedCustomer = await fetchCustomerById(editingId);
        if (updatedCustomer) {
          setSelectedCustomerForModal(updatedCustomer);
        }
      }

      handleClearForm();
    } catch (err) {
      setFormError('Lỗi hệ thống khi lưu trữ hoặc phiên làm việc của bạn đã hết hạn.');
      console.error(err);
    }
  };

  // --- HÀM XÓA ĐƠN HÀNG QUA SERVICE ---
  const handleDeleteHistory = (customerId, historyId) => {
    setConfirmState({
      message: 'Bạn có chắc chắn muốn xóa giao dịch này không?',
      onConfirm: async () => {
        try {
          await ApiPurchaseHistory.deletePurchaseHistory(historyId);
          if (selectedCustomerForModal && selectedCustomerForModal.id === customerId) {
            await fetchCustomerPurchaseHistory(customerId);
          }
          if (editingHistoryId === historyId) {
            handleClearForm();
          }
          await fetchCustomers();
        } catch (err) {
          console.error("Lỗi xóa đơn hàng:", err);
        }
      }
    });
  };

  // --- ĐỔI NHÃN TRẠNG THÁI TRỰC TIẾP TRÊN BẢNG ---
  const handleLabelChange = async (customerId, nextLabel) => {
    try {
      await ApiCustomer.updateCustomer(customerId, { label: nextLabel });
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, label: nextLabel } : c));
    } catch (err) {
      console.error("Lỗi thay đổi trạng thái nhanh:", err);
    }
  };

  const handleAddTransactionFromModal = (customer) => {
    setFormData({
      ...EMPTY_CUSTOMER,
      fullName: customer.fullName || '',
      birthday: customer.birthday || '',
      address: customer.address || '',
      phone: customer.phone || '',
      email: customer.email || '',
      facebook: customer.facebook || '',
      ecosystem: customer.ecosystem || '',
      label: customer.label || '',
      purchaseCount: customer.purchaseCount ?? 0,
      singleDate: getTodayISODate(), // Mặc định ngày hiện tại khi click thêm đơn hàng mới
      products: '',
      invoiceLink: '',
      issue: '',
      careMethods: [],
      promotions: [],
      consultant: '',
      careStaff: '',
      // Nhóm 3 bổ sung
      category: '',
      itemType: '',
      quote: '',
      price: 0,
      // Nhóm 4 bổ sung
      rentalDays: 0,
      paymentMethod: '',
      customerSource: '',
      referralCustomerId: '',
      // Nhóm 5 bổ sung
      seller: ''
    });
    setEditingId(customer.id);
    setEditingHistoryId(null);
    setIsAddingPurchaseHistory(true);
    setSelectedCustomerForModal(null);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditClick = (customer) => {
    setFormData({
      ...customer,
      referralCustomerId: customer.referralCustomerId ?? '',
      singleDate: toISODate(customer.singleDate) || getTodayISODate(),
      products: customer.products || ''
    });
    setEditingId(customer.id);
    setEditingHistoryId(null);
    setIsAddingPurchaseHistory(false);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenModal = (customer) => {
    setSelectedCustomerForModal(customer);
    fetchCustomerPurchaseHistory(customer.id);
  };

  const modalStaffOptions = staffList.map(s => ({
    value: s.username || s.id,
    label: s.fullName || s.username
  }));

  const referralCustomerOptions = (customers || []).filter((customer) => String(customer.id) !== String(editingId));

  if (!user || user.role !== 'Admin') {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shadow-xs mb-4">
          <Lock className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Truy cập bị từ chối</h3>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      <main className="max-w-[1600px] mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* KHỐI CHỌN ẢNH HÓA ĐƠN */}
          <InvoiceImageUploader onExtracted={handleOcrExtracted} />

          {/* KHỐI BIỂU MẪU NHẬP LIỆU */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 mb-4 gap-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600">
                  Biểu mẫu thông tin khách hàng (Chế độ Live API)
                </h3>
                <div className="flex gap-2">
                  <button type="button" onClick={handleSaveData} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1">
                    {isAddingPurchaseHistory ? <FilePlus2 className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    {editingId ? (editingHistoryId ? 'Cập nhật giao dịch' : (isAddingPurchaseHistory ? 'Thêm mới giao dịch' : 'Cập nhật khách hàng')) : 'Lưu khách hàng'}
                  </button>
                  <button type="button" onClick={handleClearForm} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
                    Xóa trắng
                  </button>
                </div>
              </div>

              {formError && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 font-medium px-4 py-2.5 rounded-xl text-xs">
                  {formError}
                </div>
              )}

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {editingId && (
                  <div className={`rounded-xl px-3 py-2 text-xs font-bold border ${isAddingPurchaseHistory
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                    }`}>
                    {editingHistoryId
                      ? `Chế độ: Đang SỬA lịch sử mua hàng của khách hàng [ ${formData.fullName || ''} ]`
                      : (isAddingPurchaseHistory
                        ? `Chế độ: Đang THÊM ĐƠN HÀNG MỚI cho khách hàng [ ${formData.fullName || ''} ]`
                        : `Chế độ: Đang CẬP NHẬT thông tin cá nhân của [ ${formData.fullName || ''} ]`
                      )
                    }
                  </div>
                )}

                {/* Nhóm 1: Thông tin cơ bản */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 1: Thông tin cơ bản</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Họ và tên *</label>
                      <input disabled={isAddingPurchaseHistory} type="text" placeholder="Nhập tên khách hàng" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 font-semibold" value={formData.fullName || ''} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày sinh *</label>
                      <input disabled={isAddingPurchaseHistory} type="text" placeholder="dd/MM/yyyy" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500" value={formData.birthday || ''} onChange={e => setFormData({ ...formData, birthday: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Địa chỉ chính xác</label>
                      <input disabled={isAddingPurchaseHistory} type="text" placeholder="Nhập địa chỉ cư trú" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Nhóm 2: Kênh liên hệ */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 2: Kênh liên hệ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số điện thoại *</label>
                      <input disabled={isAddingPurchaseHistory} type="text" placeholder="Số điện thoại liên lạc" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 font-semibold" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Thư điện tử (Email)</label>
                      <input disabled={isAddingPurchaseHistory} type="email" placeholder="Địa chỉ Email" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Đường dẫn Facebook</label>
                      <input disabled={isAddingPurchaseHistory} type="text" placeholder="Link Facebook" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500" value={formData.facebook || ''} onChange={e => setFormData({ ...formData, facebook: e.target.value })} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hệ sinh thái</label>
                      <select disabled={isAddingPurchaseHistory} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500" value={formData.ecosystem || ''} onChange={e => setFormData({ ...formData, ecosystem: e.target.value })}>
                        <option value="">-- Click để chọn hệ sinh thái --</option>
                        {ECOSYSTEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Nhóm 3: Chi tiết đơn hàng */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Nhóm 3: Chi tiết đơn hàng mới / chỉnh sửa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tổng số lần đã mua hàng</label>
                        <input type="number" min="0" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs disabled:bg-slate-100 font-bold text-indigo-600" value={formData.purchaseCount || 0} disabled />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày mua hàng</label>
                        {/* Đã chuyển đổi triệt để sang type="date" và bọc phòng vệ || '' lỗi controlled component */}
                        <input
                          type="date"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={formData.singleDate || ''}
                          onChange={e => setFormData({ ...formData, singleDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên sản phẩm dịch vụ</label>
                          <input type="text" placeholder="Tên sản phẩm dịch vụ" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800" value={formData.products || ''} onChange={e => setFormData({ ...formData, products: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hóa đơn đầu ra</label>
                          <input type="text" placeholder="Nhập đường dẫn URL hóa đơn..." className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.invoiceLink || ''} onChange={e => setFormData({ ...formData, invoiceLink: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hạng mục</label>
                      <input type="text" placeholder="Nhập hạng mục" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phân loại</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.itemType || ''} onChange={e => setFormData({ ...formData, itemType: e.target.value })}>
                        <option value="">-- Chọn phân loại --</option>
                        {ITEM_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Báo giá</label>
                      <input type="text" placeholder="Nhập báo giá" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.quote || ''} onChange={e => setFormData({ ...formData, quote: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Giá chốt</label>
                      <input type="text" inputMode="numeric" placeholder="Nhập giá" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Nhóm 4: Chăm sóc & Tiếp thị */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 4: Chăm sóc &amp; Tiếp thị</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số ngày thuê</label>
                        <input type="number" min="0" placeholder="0" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.rentalDays ?? 0} onChange={e => setFormData({ ...formData, rentalDays: e.target.value === '' ? 0 : Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phương thức thanh toán</label>
                        <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.paymentMethod || ''} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                          <option value="">-- Chọn phương thức --</option>
                          {PAYMENT_METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nguồn khách hàng</label>
                        <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.customerSource || ''} onChange={e => setFormData({ ...formData, customerSource: e.target.value })}>
                          <option value="">-- Chọn nguồn --</option>
                          {CUSTOMER_SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Khách hàng giới thiệu</label>
                        <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.referralCustomerId ?? ''} onChange={e => setFormData({ ...formData, referralCustomerId: e.target.value })}>
                          <option value="">-- Chọn khách hàng giới thiệu --</option>
                          {referralCustomerOptions.map(customer => (
                            <option key={customer.id} value={customer.id}>{customer.fullName} -- ID: {customer.id}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mối quan tâm / Vấn đề</label>
                      <ExpandableInput value={formData.issue || ''} onChange={(newValue) => setFormData({ ...formData, issue: newValue })} placeholder="Nhu cầu khách hàng..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Khuyến mãi áp dụng</label>
                      <div className="flex gap-1.5">
                        <input type="text" className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs" placeholder="Nhập tên khuyến mãi rồi ấn Enter..." value={promoEvent || ''} onChange={e => setPromoEvent(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (promoEvent.trim()) setFormData({ ...formData, promotions: [...(formData.promotions || []), { event: promoEvent.trim() }] }); setPromoEvent(''); } }} />
                        <button type="button" onClick={() => { if (promoEvent.trim()) setFormData({ ...formData, promotions: [...(formData.promotions || []), { event: promoEvent.trim() }] }); setPromoEvent(''); }} className="bg-indigo-50 text-indigo-700 px-3 text-xs font-bold rounded-xl border border-indigo-200">Thêm</button>
                      </div>
                      <div className="mt-1.5 space-y-1">
                        {(formData.promotions || []).map((p, i) => (
                          <div key={i} className="text-[10px] bg-white p-2 rounded-lg flex justify-between items-center border border-slate-200">
                            <span>Sự kiện: <strong className="text-indigo-600">{p.event || ''}</strong></span>
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

                {/* Nhóm 5: Nhân sự phụ trách */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 5: Phân sự nội bộ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Người bán</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.seller || ''} onChange={e => setFormData({ ...formData, seller: e.target.value })}>
                        <option value="">-- Chọn người bán --</option>
                        {staffList.map(s => (
                          <option key={s.id} value={s.fullName}>
                            {s.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nhân viên tư vấn</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.consultant || ''} onChange={e => setFormData({ ...formData, consultant: e.target.value })}>
                        <option value="">-- Chọn nhân sự tư vấn --</option>
                        {staffList.map(s => (
                          <option key={s.id} value={s.fullName}>
                            {s.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nhân viên chăm sóc</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.careStaff || ''} onChange={e => setFormData({ ...formData, careStaff: e.target.value })}>
                        <option value="">-- Chọn nhân sự chăm sóc --</option>
                        {staffList.map(s => (
                          <option key={s.id} value={s.fullName}>
                            {s.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Nhóm 6: Trạng thái nhãn gán */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 6: Trạng thái &amp; Gán nhãn</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gán nhãn phân cấp</label>
                    <select disabled={isAddingPurchaseHistory} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-600 disabled:bg-slate-100 disabled:text-slate-500" value={formData.label || ''} onChange={e => setFormData({ ...formData, label: e.target.value })}>
                      {LABELS.map(l => <option key={l.value} value={l.value} className="text-slate-800 font-normal text-left">{l.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU CRM CHÍNH */}
        <div className="space-y-4 pt-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-xs">
            <div className="flex-1 min-w-[220px]">
              <input type="text" placeholder="Tìm theo Mã khách hàng" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={crmSearchById || ''} onChange={e => { setCrmSearchById(e.target.value); setCurrentPage(1); }} />
            </div>
            <div className="flex-1 min-w-[280px]">
              <input type="text" placeholder="Tìm kiếm theo Tên, SĐT, Email..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={crmSearch || ''} onChange={e => { setCrmSearch(e.target.value); setCurrentPage(1); }} />
            </div>
            <select className="w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" value={crmFilterLabel || ''} onChange={e => { setCrmFilterLabel(e.target.value); setCurrentPage(1); }}>
              <option value="">Lọc theo nhãn gán</option>
              {LABELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <select className="w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" value={crmFilterEco || ''} onChange={e => { setCrmFilterEco(e.target.value); setCurrentPage(1); }}>
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
                <span className="text-xs font-semibold text-slate-600">Đang đồng bộ dữ liệu CRM...</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1150px] table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-4 py-4 w-40">Mã khách hàng</th>
                    <th className="px-4 py-4 w-64">Thông tin cơ bản</th>
                    <th className="px-4 py-4 w-64">Kênh liên hệ</th>
                    <th className="px-4 py-4 w-40">Tổng số lần mua</th>
                    <th className="px-4 py-4 w-44 text-center">Nhãn trạng thái</th>
                    <th className="px-4 py-4 w-44 text-center">Tổng tiền đã mua</th>
                    <th className="px-4 py-4 w-40 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {Array.isArray(customers) && customers.map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors align-top">
                      <td className="px-4 py-4 text-start font-mono text-slate-700 text-[11px]">
                        {cust.id}
                      </td>
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
                        <select value={cust.label || ''} onChange={e => handleLabelChange(cust.id, e.target.value)} className={`text-xs font-bold px-2 py-1.5 rounded-xl border cursor-pointer w-full text-center transition-all ${LABELS.find(l => l.value === cust.label)?.color}`}>
                          {LABELS.map(l => <option key={l.value} value={l.value} className="bg-white text-slate-800 font-normal text-left">{l.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-emerald-600 text-sm">
                        {totalSpentMap[cust.id] !== undefined ? (
                          new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalSpentMap[cust.id])
                        ) : (
                          <span className="text-slate-400 font-normal text-xs italic">Đang tải...</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col gap-1 items-center">
                          <button onClick={() => handleOpenModal(cust)} className="w-full py-1 text-[11px] bg-indigo-600 text-white rounded-lg border border-indigo-600">Xem chi tiết</button>
                          <button onClick={() => handleEditClick(cust)} className="w-full py-1 text-[11px] bg-slate-100 text-slate-700 rounded-lg border">Sửa thông tin</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(customers) || customers.length === 0) && !isLoading && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400 italic">Không tìm thấy khách hàng nào khớp với bộ lọc.</td>
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

        {/* MODAL CHI TIẾT LỊCH SỬ GIAO DỊCH */}
        <CustomerDetailModal
          customer={selectedCustomerForModal}
          onClose={() => setSelectedCustomerForModal(null)}
          staffOptions={modalStaffOptions}
          getPurchaseHistoriesFn={() => detailCustomerPurchaseHistory}
          onAddTransaction={handleAddTransactionFromModal}
          onDeleteTransaction={(historyId) => handleDeleteHistory(selectedCustomerForModal.id, historyId)}
          onEditTransaction={(history) => {
            setFormData({
              ...selectedCustomerForModal,
              singleDate: toISODate(history.date) || getTodayISODate(),
              products: history.products || '',
              invoiceLink: history.invoiceLink || '',
              issue: history.issue || '',
              careMethods: history.careMethods || [],
              promotions: history.promotions || [],
              consultant: history.consultant || '',
              careStaff: history.careStaff || '',
              // Nhóm 3 bổ sung
              category: history.category || '',
              itemType: history.itemType || '',
              quote: history.quote || '',
              price: history.price || 0,
              // Nhóm 4 bổ sung
              rentalDays: history.rentalDays ?? 0,
              paymentMethod: history.paymentMethod || '',
              customerSource: history.customerSource || '',
              // Nhóm 5 bổ sung
              seller: history.seller || ''
            });
            setEditingId(selectedCustomerForModal.id);
            setEditingHistoryId(history.id);
            setIsAddingPurchaseHistory(false);
            setSelectedCustomerForModal(null);
            setFormError('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </main>

      <ConfirmModal
        open={!!confirmState}
        title="Xác nhận xóa"
        message={confirmState?.message}
        danger
        confirmText="Xóa"
        onConfirm={() => { confirmState.onConfirm(); setConfirmState(null); }}
        onCancel={() => setConfirmState(null)}
      />

    </div>
  );
}