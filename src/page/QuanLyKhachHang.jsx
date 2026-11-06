import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Lock, UserPlus, FilePlus2 } from 'lucide-react';
import CustomerDetailModal from '../components/CRM/CustomerDetailModal';
import InvoiceImageUploader from '../components/CRM/InvoiceImageUploader';
import ExpandableInput from '../components/ExpandableInput';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/CRM/ConfirmModal';
import SearchableSelect from '../components/SearchableSelect';
import { useAuth } from '../context/AuthContext';

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

const getTodayISODate = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - (offset * 60 * 1000));
  return localToday.toISOString().split('T')[0];
};

export default function CRMSystem() {
  const { user } = useAuth();

  const userRole = String(user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isStaff = userRole === 'staff';

  const hasAccess = isAdmin || (isManager && (user?.cmicStudio || user?.cmicMedia));

  // Lọc dropdown hệ sinh thái theo quyền của Manager
  const availableEcosystemOptions = useMemo(() => {
    if (isAdmin || isStaff) return ECOSYSTEM_OPTIONS;
    return ECOSYSTEM_OPTIONS.filter(opt => {
      const val = String(opt.value).toLowerCase();
      if (val.includes('studio') && user?.cmicStudio) return true;
      if (val.includes('media') && user?.cmicMedia) return true;
      return false;
    });
  }, [isAdmin, isStaff, user]);

  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [detailCustomerPurchaseHistory, setDetailCustomerPurchaseHistory] = useState([]);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState(null);
  const [totalSpentMap, setTotalSpentMap] = useState({});
  const [referralOptionsList, setReferralOptionsList] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [isAddingPurchaseHistory, setIsAddingPurchaseHistory] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  const [formData, setFormData] = useState({
    ...EMPTY_CUSTOMER,
    singleDate: getTodayISODate(),
    category: '',
    itemType: '',
    quote: '',
    price: 0,
    rentalDays: 0,
    paymentMethod: '',
    customerSource: '',
    referralCustomerId: '',
    seller: ''
  });
  const [promoEvent, setPromoEvent] = useState('');

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

  const fetchStaff = async () => {
    try {
      const response = await ApiAuth.getListUser();
      const result = response?.DT || response;
      const userList = result?.user || [];
      const filteredStaff = userList.filter(u => String(u.role).toLowerCase() === 'staff');
      setStaffList(filteredStaff);
    } catch (error) {
      console.error("Lỗi tải danh sách user:", error);
    }
  };

  useEffect(() => {
    if (hasAccess) fetchStaff();
  }, [hasAccess]);

  const fetchCustomers = async () => {
    if (!hasAccess) return;
    setIsLoading(true);
    try {
      const params = {
        search: crmSearch,
        id: crmSearchById,
        label: crmFilterLabel,
        ecosystem: crmFilterEco,
        page: currentPage,
        pageSize: pageSize,
        // Gửi thông tin phân quyền lên BE
        userRole: user?.role,
        userId: user?.id,
        userName: user?.fullName || user?.userName,
        userStudio: user?.cmicStudio ? 1 : 0,
        userMedia: user?.cmicMedia ? 1 : 0
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
        } else if ('items' in result) {
          setCustomers(Array.isArray(result.items) ? result.items : []);
          setTotalItems(result.total || result.totalItems || 0);
          setTotalPages(result.totalPages || 1);
        } else if (Array.isArray(result)) {
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
      console.error("Lỗi tải danh sách khách hàng:", err);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, pageSize, crmSearch, crmSearchById, crmFilterLabel, crmFilterEco, hasAccess]);

  const fetchReferralOptions = async () => {
    if (!hasAccess) return;
    try {
      const response = await ApiCustomer.getCustomers({ 
        page: 1, 
        pageSize: 100000,
        userRole: user?.role,
        userId: user?.id,
        userStudio: user?.cmicStudio ? 1 : 0,
        userMedia: user?.cmicMedia ? 1 : 0
      });
      const result = response?.DT || response;
      let list = [];
      if (result && typeof result === 'object') {
        if (Array.isArray(result.rows)) list = result.rows;
        else if (Array.isArray(result.items)) list = result.items;
        else if (Array.isArray(result)) list = result;
      }
      setReferralOptionsList(list);
    } catch (err) {
      console.error("Lỗi tải danh sách khách hàng giới thiệu:", err);
    }
  };

  useEffect(() => {
    fetchReferralOptions();
  }, [hasAccess]);

  useEffect(() => {
    const fetchAllTotalSpent = async () => {
      if (!customers || customers.length === 0) return;
      const spentData = {};
      await Promise.all(
        customers.map(async (cust) => {
          try {
            const res = await ApiCustomer.getCustomerTotalSpent(cust.id);
            spentData[cust.id] = res?.DT?.totalSpent !== undefined ? res.DT.totalSpent : (res || 0);
          } catch (err) {
            spentData[cust.id] = 0;
          }
        })
      );
      setTotalSpentMap(spentData);
    };
    fetchAllTotalSpent();
  }, [customers]);

  const fetchCustomerPurchaseHistory = async (customerId) => {
    try {
      const response = await ApiPurchaseHistory.getCustomerPurchaseHistory(customerId);
      const result = response?.DT || response;
      setDetailCustomerPurchaseHistory(Array.isArray(result) ? result : []);
    } catch (err) {
      setDetailCustomerPurchaseHistory([]);
    }
  };

  const toDMY = (value) => {
    if (!value) return '';
    const str = String(value).trim();
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    return str;
  };

  const toISODate = (value) => {
    if (!value) return '';
    const str = String(value).trim();
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return str;
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    return '';
  };

  const handleClearForm = () => {
    setFormData({
      fullName: '',
      birthday: '',
      address: '',
      phone: '',
      email: '',
      facebook: '',
      ecosystem: availableEcosystemOptions[0]?.value || '',
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
      category: '',
      itemType: '',
      quote: '',
      price: 0,
      rentalDays: 0,
      paymentMethod: '',
      customerSource: '',
      referralCustomerId: '',
      seller: ''
    });
    setEditingId(null);
    setEditingHistoryId(null);
    setIsAddingPurchaseHistory(false);
    setFormError('');
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
      category: formData.category,
      itemType: formData.itemType,
      quote: formData.quote,
      price: formData.price,
      rentalDays: formData.rentalDays,
      paymentMethod: formData.paymentMethod,
      customerSource: formData.customerSource,
      referralCustomerId: formData.referralCustomerId || null,
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
          setFormError('Vui lòng nhập thông tin đơn hàng!');
          return;
        }
        await ApiPurchaseHistory.createPurchaseHistory(editingId, historyPayload);
      } else if (editingId && editingHistoryId) {
        await ApiPurchaseHistory.updatePurchaseHistory(editingHistoryId, historyPayload);
      } else if (editingId) {
        await ApiCustomer.updateCustomer(editingId, customerPayload);
      } else {
        const customerResponse = await ApiCustomer.createCustomer(customerPayload);
        const customerResult = customerResponse?.DT || customerResponse;
        if (customerResult?.id && isHistoryValid) {
          await ApiPurchaseHistory.createPurchaseHistory(customerResult.id, historyPayload);
        }
      }

      await fetchCustomers();
      await fetchReferralOptions();
      handleClearForm();
    } catch (err) {
      setFormError('Lỗi hệ thống khi lưu trữ dữ liệu.');
    }
  };

  const handleOpenModal = (customer) => {
    setSelectedCustomerForModal(customer);
    fetchCustomerPurchaseHistory(customer.id);
  };

  if (!user || !hasAccess) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shadow-xs mb-4">
          <Lock className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Truy cập bị từ chối</h3>
        <p className="text-sm text-slate-500 mt-1">Bạn không có quyền truy cập vào danh mục CRM này.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      <main className="max-w-[1600px] mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <InvoiceImageUploader onExtracted={(fields) => fields && setFormData(prev => ({ ...prev, ...fields }))} />

          {/* KHỐI BIỂU MẪU */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 mb-4 gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600">
                  Biểu mẫu thông tin khách hàng
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
                {/* Nhóm 1: Cơ bản */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 1: Thông tin cơ bản</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Họ và tên *</label>
                      <input disabled={isAddingPurchaseHistory || !!editingHistoryId} type="text" placeholder="Nhập tên" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 font-semibold" value={formData.fullName || ''} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày sinh *</label>
                      <input disabled={isAddingPurchaseHistory || !!editingHistoryId} type="text" placeholder="yyyy-MM-dd" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.birthday || ''} onChange={e => setFormData({ ...formData, birthday: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Địa chỉ</label>
                      <input disabled={isAddingPurchaseHistory || !!editingHistoryId} type="text" placeholder="Địa chỉ" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Nhóm 2: Kênh liên hệ */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 2: Kênh liên hệ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số điện thoại *</label>
                      <input disabled={isAddingPurchaseHistory || !!editingHistoryId} type="text" placeholder="Số điện thoại" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email</label>
                      <input disabled={isAddingPurchaseHistory || !!editingHistoryId} type="email" placeholder="Email" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Facebook</label>
                      <input disabled={isAddingPurchaseHistory || !!editingHistoryId} type="text" placeholder="Link FB" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.facebook || ''} onChange={e => setFormData({ ...formData, facebook: e.target.value })} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hệ sinh thái</label>
                      <SearchableSelect
                        disabled={isAddingPurchaseHistory || !!editingHistoryId || (!isAdmin && availableEcosystemOptions.length === 1)}
                        options={availableEcosystemOptions}
                        value={formData.ecosystem || ''}
                        placeholder="-- Chọn hệ sinh thái --"
                        onChange={(value) => setFormData({ ...formData, ecosystem: value })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Nhóm 6: Gán nhãn */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm: Gán nhãn &amp; Phân cấp</h4>
                  <SearchableSelect
                    disabled={isAddingPurchaseHistory}
                    options={LABELS.map(l => ({ value: l.value, label: l.label }))}
                    value={formData.label || ''}
                    placeholder="-- Chọn giai đoạn --"
                    onChange={(value) => setFormData({ ...formData, label: value })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="space-y-4 pt-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-xs">
            <div className="flex-1 min-w-[220px]">
              <input type="text" placeholder="Tìm theo Mã khách hàng" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={crmSearchById || ''} onChange={e => { setCrmSearchById(e.target.value); setCurrentPage(1); }} />
            </div>
            <div className="flex-1 min-w-[280px]">
              <input type="text" placeholder="Tìm kiếm theo Tên, SĐT, Email..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={crmSearch || ''} onChange={e => { setCrmSearch(e.target.value); setCurrentPage(1); }} />
            </div>
            <SearchableSelect
              options={LABELS.map(l => ({ value: l.value, label: l.label }))}
              value={crmFilterLabel || ''}
              placeholder="Lọc theo nhãn gán"
              onChange={(value) => { setCrmFilterLabel(value); setCurrentPage(1); }}
              className="w-[180px]"
            />
            {/* Ẩn bộ lọc hệ sinh thái nếu là Staff */}
            {!isStaff && (
              <SearchableSelect
                options={availableEcosystemOptions}
                value={crmFilterEco || ''}
                placeholder="Tất cả hệ sinh thái"
                onChange={(value) => { setCrmFilterEco(value); setCurrentPage(1); }}
                className="w-[180px]"
              />
            )}
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
                    <th className="px-4 py-4 w-40">Mã KH</th>
                    <th className="px-4 py-4 w-64">Thông tin cơ bản</th>
                    <th className="px-4 py-4 w-64">Kênh liên hệ</th>
                    <th className="px-4 py-4 w-40">Số lần mua</th>
                    <th className="px-4 py-4 w-44 text-center">Nhãn trạng thái</th>
                    <th className="px-4 py-4 w-44 text-center">Tổng tiền</th>
                    <th className="px-4 py-4 w-40 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {customers.map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors align-top">
                      <td className="px-4 py-4 font-mono text-slate-700">{cust.id}</td>
                      <td className="px-3 py-3 space-y-1">
                        <span className="font-bold text-slate-900 text-sm block">{cust.fullName}</span>
                        <div><span className="text-slate-500">Ngày sinh:</span> {cust.birthday}</div>
                        <div className="text-slate-600 truncate">{cust.address || 'Chưa cập nhật'}</div>
                      </td>
                      <td className="px-3 py-3 space-y-1">
                        <div><span className="text-slate-500">SĐT:</span> <span className="font-bold">{cust.phone}</span></div>
                        <div><span className="text-slate-500">Email:</span> {cust.email || 'Chưa điền'}</div>
                        <div className="pt-1">
                          <span className="bg-slate-100 border text-slate-700 px-2 py-0.5 rounded-md font-medium text-[10px]">
                            {ECOSYSTEM_OPTIONS.find(e => e.value === cust.ecosystem)?.label || cust.ecosystem || 'Chưa chọn'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-bold text-indigo-600">lần {cust.purchaseCount || 0}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-block px-3 py-1 bg-slate-100 rounded-xl font-bold text-xs border">
                          {LABELS.find(l => l.value === cust.label)?.label || 'Chưa phân cấp'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-emerald-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalSpentMap[cust.id] || 0)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => handleOpenModal(cust)} className="py-1 px-3 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">Xem chi tiết</button>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 italic">Không tìm thấy khách hàng nào.</td>
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
          customer={selectedCustomerForModal}
          onClose={() => setSelectedCustomerForModal(null)}
          staffOptions={staffList.map(s => ({ value: s.fullName, label: s.fullName }))}
          getPurchaseHistoriesFn={() => detailCustomerPurchaseHistory}
        />
      </main>
    </div>
  );
}