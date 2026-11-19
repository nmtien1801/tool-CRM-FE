import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Lock, UserPlus, Edit, Trash2, Copy } from 'lucide-react';
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
  const localToday = new Date(today.getTime() - offset * 60 * 1000);
  return localToday.toISOString().split('T')[0];
};

const parseNumericValue = (val) => {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const cleaned = String(val ?? '').replace(/[^\d.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
};

export default function CRMSystem() {
  const { user } = useAuth();

  // --- PHÂN QUYỀN TRUY CẬP ---
  const userRole = String(user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isStaff = userRole === 'staff';

  const hasAccess = isAdmin || (isManager && (user?.cmicStudio || user?.cmicMedia));

  const availableEcosystemOptions = useMemo(() => {
    if (isAdmin || isStaff) return ECOSYSTEM_OPTIONS;
    return ECOSYSTEM_OPTIONS.filter((opt) => {
      const val = String(opt.value).toLowerCase();
      if (val.includes('studio') && user?.cmicStudio) return true;
      if (val.includes('media') && user?.cmicMedia) return true;
      return false;
    });
  }, [isAdmin, isStaff, user]);

  // --- STATE DỮ LIỆU TỪ API ---
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [historyMap, setHistoryMap] = useState({});
  const [totalSpentMap, setTotalSpentMap] = useState({});
  const [referralOptionsList, setReferralOptionsList] = useState([]);

  // --- TRẠNG THÁI FORM ---
  const [editingId, setEditingId] = useState(null);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    ...EMPTY_CUSTOMER,
    ecosystem: availableEcosystemOptions[0]?.value || '',
    singleDate: getTodayISODate(),
    category: '',
    itemType: '',
    quote: '',
    price: 0,
    receivableDebt: 0,
    rentalDays: 0,
    paymentMethod: '',
    customerSource: '',
    referralCustomerId: '',
    seller: ''
  });
  const [promoEvent, setPromoEvent] = useState('');

  // --- BỘ LỌC VÀ PHÂN TRANG ---
  const [crmSearch, setCrmSearch] = useState('');
  const [crmSearchById, setCrmSearchById] = useState('');
  const [crmFilterLabel, setCrmFilterLabel] = useState('');
  const [crmFilterEco, setCrmFilterEco] = useState('');
  const [transactionDateFrom, setTransactionDateFrom] = useState('');
  const [transactionDateTo, setTransactionDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState('');
  const [receivableDebtDrafts, setReceivableDebtDrafts] = useState({});
  const [savingReceivableDebtIds, setSavingReceivableDebtIds] = useState({});
  const [receivableDebtErrors, setReceivableDebtErrors] = useState({});

  // 1. Tải danh sách Staff
  const fetchStaff = async () => {
    try {
      const response = await ApiAuth.getListUser();
      const result = response?.DT || response?.data?.DT || response?.data || response;
      const userList = result?.user || [];
      const filteredStaff = userList.filter((u) => String(u.role).toLowerCase() === 'staff');
      setStaffList(filteredStaff);
    } catch (error) {
      console.error('Lỗi tải danh sách user:', error);
    }
  };

  useEffect(() => {
    if (hasAccess) fetchStaff();
  }, [hasAccess]);

  // 2. Tải danh sách khách hàng
  const fetchCustomers = async () => {
    if (!hasAccess) return;
    setIsLoading(true);
    try {
      const params = {
        search: crmSearch,
        id: crmSearchById,
        label: crmFilterLabel,
        ecosystem: crmFilterEco,
        transactionDateFrom,
        transactionDateTo,
        page: currentPage,
        pageSize: pageSize,
        userRole: user?.role,
        userId: user?.id,
        userName: user?.fullName || user?.userName,
        userStudio: user?.cmicStudio ? 1 : 0,
        userMedia: user?.cmicMedia ? 1 : 0
      };

      const response = await ApiCustomer.getCustomers(params);
      const result = response?.DT || response?.data?.DT || response?.data || response;

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
        } else if ('customers' in result && Array.isArray(result.customers)) {
          setCustomers(result.customers);
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
      console.error('Lỗi tải danh sách khách hàng:', err);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [
    currentPage,
    pageSize,
    crmSearch,
    crmSearchById,
    crmFilterLabel,
    crmFilterEco,
    transactionDateFrom,
    transactionDateTo,
    hasAccess
  ]);

  // Lấy danh sách dùng cho Referrals
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
      const result = response?.DT || response?.data?.DT || response?.data || response;
      let list = [];
      if (result && typeof result === 'object') {
        if (Array.isArray(result.rows)) list = result.rows;
        else if (Array.isArray(result.items)) list = result.items;
        else if (Array.isArray(result.customers)) list = result.customers;
        else if (Array.isArray(result)) list = result;
      }
      setReferralOptionsList(list);
    } catch (err) {
      console.error('Lỗi tải danh sách khách hàng giới thiệu:', err);
    }
  };

  useEffect(() => {
    fetchReferralOptions();
  }, [hasAccess]);

  // Tính tổng tiền và lịch sử mua hàng
  useEffect(() => {
    const fetchAllTotalSpent = async () => {
      if (!customers || customers.length === 0) return;
      const spentData = {};
      const historyData = {};
      await Promise.all(
        customers.map(async (cust) => {
          try {
            const res = await ApiCustomer.getCustomerTotalSpent(cust.id);
            const dt = res?.DT || res?.data?.DT;
            spentData[cust.id] = dt?.totalSpent !== undefined ? dt.totalSpent : Number(res) || 0;
          } catch (err) {
            spentData[cust.id] = 0;
          }
          try {
            const hRes = await ApiPurchaseHistory.getCustomerPurchaseHistory(cust.id);
            const hResult = hRes?.DT || hRes?.data?.DT || hRes?.data || hRes;
            historyData[cust.id] = Array.isArray(hResult) ? hResult : [];
          } catch (err) {
            historyData[cust.id] = [];
          }
        })
      );
      setTotalSpentMap(spentData);
      setHistoryMap(historyData);
    };
    fetchAllTotalSpent();
  }, [customers]);

  const fetchCustomerById = async (id) => {
    try {
      if (ApiCustomer.getCustomerById) {
        const res = await ApiCustomer.getCustomerById(id);
        return res?.DT || res?.data?.DT || res?.data || res;
      }
      return referralOptionsList.find((c) => String(c.id) === String(id)) || null;
    } catch (err) {
      return null;
    }
  };

  // --- FORMATTERS ---
  const toDMY = (value) => {
    if (!value) return '';
    const str = String(value).trim();
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) return `${dmyMatch[1].padStart(2, '0')}/${dmyMatch[2].padStart(2, '0')}/${dmyMatch[3]}`;
    return str;
  };

  const toISODate = (value) => {
    if (!value) return '';
    const str = String(value).trim();
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
    return '';
  };

  // --- HANDLERS ---
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
      receivableDebt: 0,
      rentalDays: 0,
      paymentMethod: '',
      customerSource: '',
      referralCustomerId: '',
      seller: ''
    });
    setEditingId(null);
    setEditingHistoryId(null);
    setFormError('');
  };

  const handleSaveData = async () => {
    if (isSaving) return;

    const cleanName = String(formData.fullName || '').trim();
    const cleanPhone = String(formData.phone || '').trim();
    const cleanProduct = String(formData.products || '').trim();

    if (!cleanName || !cleanPhone) {
      setFormError('Vui lòng nhập tối thiểu Họ và tên và Số điện thoại!');
      return;
    }

    if (!cleanProduct) {
      setFormError('Vui lòng nhập Tên sản phẩm dịch vụ cho hàng này!');
      return;
    }
    setFormError('');

    const parsedReferralId =
      formData.referralCustomerId !== '' &&
        formData.referralCustomerId !== null &&
        formData.referralCustomerId !== undefined
        ? Number(formData.referralCustomerId) || formData.referralCustomerId
        : null;

    const historyPayload = {
      date: formData.singleDate || getTodayISODate(),
      products: cleanProduct,
      invoiceLink: formData.invoiceLink || '',
      issue: formData.issue || '',
      careMethods: Array.isArray(formData.careMethods) ? formData.careMethods : [],
      promotions: Array.isArray(formData.promotions) ? formData.promotions : [],
      consultant: formData.consultant || '',
      careStaff: formData.careStaff || '',
      category: formData.category || '',
      itemType: formData.itemType || '',
      quote: formData.quote || '',
      price: parseNumericValue(formData.price),
      receivableDebt: parseNumericValue(formData.receivableDebt),
      rentalDays: Number(formData.rentalDays) || 0,
      paymentMethod: formData.paymentMethod || '',
      customerSource: formData.customerSource || '',
      referralCustomerId: parsedReferralId,
      seller: formData.seller || ''
    };

    const customerPayload = {
      fullName: cleanName,
      birthday: formData.birthday ? toISODate(formData.birthday) : null,
      address: formData.address || '',
      phone: cleanPhone,
      email: formData.email || '',
      facebook: formData.facebook || '',
      ecosystem: formData.ecosystem || '',
      label: formData.label || '',
      referralCustomerId: parsedReferralId
    };

    setIsSaving(true);
    try {
      if (editingId && editingHistoryId) {
        // Sửa dòng hiện có: cập nhật thông tin khách hàng + dòng sản phẩm/giao dịch
        const customerResponse = await ApiCustomer.updateCustomer(editingId, customerPayload);
        const custRes = customerResponse?.data || customerResponse;
        if (custRes?.EC !== undefined && custRes.EC !== 0) {
          throw new Error(custRes.EM || 'Không thể cập nhật khách hàng.');
        }

        const historyResponse = await ApiPurchaseHistory.updatePurchaseHistory(editingHistoryId, historyPayload);
        const histRes = historyResponse?.data || historyResponse;
        if (histRes?.EC !== undefined && histRes.EC !== 0) {
          throw new Error(histRes.EM || 'Không thể cập nhật giao dịch.');
        }
      } else if (editingId) {
        // Sửa khách hàng chưa có dòng giao dịch: cập nhật khách + tạo dòng giao dịch
        const customerResponse = await ApiCustomer.updateCustomer(editingId, customerPayload);
        const custRes = customerResponse?.data || customerResponse;
        if (custRes?.EC !== undefined && custRes.EC !== 0) {
          throw new Error(custRes.EM || 'Không thể cập nhật khách hàng.');
        }

        const historyResponse = await ApiPurchaseHistory.createPurchaseHistory(editingId, historyPayload);
        const histRes = historyResponse?.data || historyResponse;
        if (histRes?.EC !== undefined && histRes.EC !== 0) {
          throw new Error(histRes.EM || 'Không thể tạo dòng giao dịch.');
        }
      } else {
        // Thêm mới: tạo khách hàng mới + tạo luôn 1 dòng hàng giao dịch cho khách đó
        const customerResponse = await ApiCustomer.createCustomer(customerPayload);
        const custRes = customerResponse?.data || customerResponse;
        if (custRes?.EC !== undefined && custRes.EC !== 0) {
          throw new Error(custRes.EM || 'Không thể thêm khách hàng.');
        }
        const customerResult = custRes?.DT || custRes;
        if (!customerResult?.id) {
          throw new Error('Không lấy được mã khách hàng vừa thêm.');
        }

        const historyResponse = await ApiPurchaseHistory.createPurchaseHistory(customerResult.id, historyPayload);
        const histRes = historyResponse?.data || historyResponse;
        if (histRes?.EC !== undefined && histRes.EC !== 0) {
          throw new Error(histRes.EM || 'Đã tạo khách nhưng không thể thêm hàng giao dịch.');
        }
      }

      await fetchCustomers();
      await fetchReferralOptions();
      handleClearForm();
    } catch (err) {
      console.error('Lỗi handleSaveData:', err);
      setFormError(err?.response?.data?.EM || err?.message || 'Lỗi hệ thống khi lưu trữ dữ liệu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = async (customer) => {
    setFormData({
      ...EMPTY_CUSTOMER,
      ...customer,
      birthday: toISODate(customer.birthday) || '',
      referralCustomerId: customer.referralCustomerId ?? '',
      singleDate: getTodayISODate(),
      products: '',
      invoiceLink: '',
      category: '',
      itemType: '',
      quote: '',
      price: 0,
      receivableDebt: 0,
      rentalDays: 0,
      paymentMethod: '',
      customerSource: '',
      seller: ''
    });
    setEditingId(customer.id);
    setEditingHistoryId(null);
    setFormError('');

    if (customer.referralCustomerId) {
      const alreadyInList = referralOptionsList.some((c) => String(c.id) === String(customer.referralCustomerId));
      if (!alreadyInList) {
        const referrer = await fetchCustomerById(customer.referralCustomerId);
        if (referrer) setReferralOptionsList((prev) => [...prev, referrer]);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditTransaction = async (customer, history) => {
    const customerId = customer?.id;
    if (!customerId || !history?.id) {
      setFormError('Không tìm thấy mã định danh giao dịch hoặc khách hàng.');
      return;
    }

    setFormData({
      ...EMPTY_CUSTOMER,
      fullName: customer.fullName || '',
      birthday: toISODate(customer.birthday) || '',
      address: customer.address || '',
      phone: customer.phone || '',
      email: customer.email || '',
      facebook: customer.facebook || '',
      ecosystem: customer.ecosystem || '',
      label: customer.label || '',
      purchaseCount: customer.purchaseCount ?? 0,
      referralCustomerId: history.referralCustomerId ?? customer.referralCustomerId ?? '',
      singleDate: toISODate(history.date) || getTodayISODate(),
      products: history.products || '',
      invoiceLink: history.invoiceLink || '',
      issue: history.issue || '',
      careMethods: Array.isArray(history.careMethods) ? history.careMethods : [],
      promotions: Array.isArray(history.promotions) ? history.promotions : [],
      consultant: history.consultant || '',
      careStaff: history.careStaff || '',
      category: history.category || '',
      itemType: history.itemType || '',
      quote: history.quote || '',
      price: parseNumericValue(history.price),
      receivableDebt: parseNumericValue(history.receivableDebt),
      rentalDays: Number(history.rentalDays) || 0,
      paymentMethod: history.paymentMethod || '',
      customerSource: history.customerSource || '',
      seller: history.seller || ''
    });

    setEditingId(customerId);
    setEditingHistoryId(history.id);
    setFormError('');

    const referralId = history.referralCustomerId ?? customer?.referralCustomerId;
    if (referralId) {
      const alreadyInList = referralOptionsList.some((c) => String(c.id) === String(referralId));
      if (!alreadyInList) {
        const referrer = await fetchCustomerById(referralId);
        if (referrer) setReferralOptionsList((prev) => [...prev, referrer]);
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReceivableDebtChange = (historyId, value) => {
    setReceivableDebtDrafts((previous) => ({ ...previous, [historyId]: value }));
    setReceivableDebtErrors((previous) => ({ ...previous, [historyId]: '' }));
  };

  const handleSaveReceivableDebt = async (customer, history) => {
    const rawValue = receivableDebtDrafts[history.id] ?? String(history.receivableDebt ?? 0);
    const receivableDebt = rawValue.trim() === '' ? 0 : Number(rawValue);
    if (!Number.isFinite(receivableDebt) || receivableDebt < 0) {
      setReceivableDebtErrors((previous) => ({
        ...previous,
        [history.id]: 'Nhập số tiền hợp lệ (từ 0 trở lên).'
      }));
      return;
    }

    if (receivableDebt === Number(history.receivableDebt ?? 0)) {
      setReceivableDebtDrafts((previous) => {
        const next = { ...previous };
        delete next[history.id];
        return next;
      });
      return;
    }

    setSavingReceivableDebtIds((previous) => ({ ...previous, [history.id]: true }));
    setReceivableDebtErrors((previous) => ({ ...previous, [history.id]: '' }));
    try {
      const response = await ApiPurchaseHistory.updatePurchaseHistory(history.id, { receivableDebt });
      const res = response?.data || response;
      if (res?.EC !== undefined && res.EC !== 0) {
        throw new Error(res.EM || 'Không thể cập nhật công nợ phải thu.');
      }

      setHistoryMap((previous) => {
        const histories = previous[customer.id] || customer.purchaseHistories || [];
        return {
          ...previous,
          [customer.id]: histories.map((item) =>
            item.id === history.id ? { ...item, receivableDebt } : item
          )
        };
      });
      setReceivableDebtDrafts((previous) => {
        const next = { ...previous };
        delete next[history.id];
        return next;
      });
    } catch (error) {
      console.error('Lỗi cập nhật công nợ phải thu:', error);
      setReceivableDebtErrors((previous) => ({
        ...previous,
        [history.id]: 'Không lưu được công nợ. Vui lòng thử lại.'
      }));
    } finally {
      setSavingReceivableDebtIds((previous) => {
        const next = { ...previous };
        delete next[history.id];
        return next;
      });
    }
  };

  const handleDeleteHistory = (customer, historyId) => {
    const histories = historyMap[customer.id] || customer.purchaseHistories || [];
    const remaining = histories.filter((item) => item.id !== historyId);
    const removeCustomerToo = remaining.length === 0;

    setConfirmState({
      message: `Bạn có chắc chắn muốn xóa dòng của khách hàng [ ${customer.fullName} ] không?`,
      onConfirm: async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
          if (removeCustomerToo) {
            const response = await ApiCustomer.deleteCustomer(customer.id);
            const res = response?.data || response;
            if (res?.EC !== undefined && res.EC !== 0) {
              throw new Error(res.EM || 'Không thể xóa khách hàng.');
            }
          } else {
            const response = await ApiPurchaseHistory.deletePurchaseHistory(historyId);
            const res = response?.data || response;
            if (res?.EC !== undefined && res.EC !== 0) {
              throw new Error(res.EM || 'Không thể xóa dòng giao dịch.');
            }
          }
          if (editingHistoryId === historyId || (removeCustomerToo && editingId === customer.id)) {
            handleClearForm();
          }
          await fetchCustomers();
          await fetchReferralOptions();
        } catch (err) {
          console.error('Lỗi xóa dòng:', err);
          setFormError(err?.response?.data?.EM || err?.message || 'Lỗi khi xóa dòng dữ liệu.');
        } finally {
          setIsDeleting(false);
          setConfirmState(null);
        }
      }
    });
  };

  const handleDeleteCustomer = (customer) => {
    if (typeof ApiCustomer.deleteCustomer !== 'function') return;
    setConfirmState({
      message: `Xóa toàn bộ khách hàng [ ${customer.fullName} ] và tất cả các dòng hàng đã mua?`,
      onConfirm: async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
          const response = await ApiCustomer.deleteCustomer(customer.id);
          const res = response?.data || response;
          if (res?.EC !== undefined && res.EC !== 0) {
            throw new Error(res.EM || 'Không thể xóa khách hàng.');
          }
          if (editingId === customer.id) handleClearForm();
          await fetchCustomers();
          await fetchReferralOptions();
        } catch (err) {
          console.error('Lỗi xóa khách hàng:', err);
          setFormError(err?.response?.data?.EM || err?.message || 'Lỗi khi xóa khách hàng.');
        } finally {
          setIsDeleting(false);
          setConfirmState(null);
        }
      }
    });
  };

  const staffOptions = staffList.map((s) => ({ value: s.fullName, label: s.fullName }));

  // Mỗi cặp (Khách hàng + Sản phẩm/Giao dịch) là 1 hàng riêng trên bảng
  const flatRows = [];
  const hasTransactionDateFilter = Boolean(transactionDateFrom || transactionDateTo);
  (Array.isArray(customers) ? customers : []).forEach((cust) => {
    const histories = (historyMap[cust.id] || cust.purchaseHistories || []).filter((h) => {
      if (!(h.date || h.products || h.invoiceLink)) return false;
      if (!hasTransactionDateFilter) return true;
      const transactionDate = toISODate(h.date);
      return (
        transactionDate &&
        (!transactionDateFrom || transactionDate >= transactionDateFrom) &&
        (!transactionDateTo || transactionDate <= transactionDateTo)
      );
    });
    if (histories.length === 0) {
      if (!hasTransactionDateFilter) flatRows.push({ cust, history: null });
      return;
    }
    histories.forEach((h) => flatRows.push({ cust, history: h }));
  });

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

  const referralCustomerOptions = (referralOptionsList || []).filter(
    (customer) => String(customer.id) !== String(editingId)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      <main className="max-w-[1600px] mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <InvoiceImageUploader onExtracted={(fields) => fields && setFormData((prev) => ({ ...prev, ...fields }))} />

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 mb-4 gap-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600">
                  Biểu mẫu thông tin khách hàng &amp; đơn hàng
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveData}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    {editingId ? 'Cập nhật dòng hàng' : 'Lưu khách hàng & hàng'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                  >
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
                  <div className="rounded-xl px-3 py-2 text-xs font-bold border bg-indigo-50 border-indigo-100 text-indigo-700">
                    {`Chế độ: Đang SỬA thông tin khách hàng & dòng hàng của [ ${formData.fullName || ''} ]`}
                  </div>
                )}

                {/* Nhóm 1: Cơ bản */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 1: Thông tin cơ bản</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Họ và tên *</label>
                      <input
                        type="text"
                        placeholder="Nhập tên khách hàng"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                        value={formData.fullName || ''}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày sinh</label>
                      <input
                        type="date"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.birthday || ''}
                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Địa chỉ</label>
                      <input
                        type="text"
                        placeholder="Nhập địa chỉ cư trú"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Nhóm 2: Kênh liên hệ */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 2: Kênh liên hệ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số điện thoại *</label>
                      <input
                        type="text"
                        placeholder="Số điện thoại liên lạc"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Thư điện tử (Email)</label>
                      <input
                        type="email"
                        placeholder="Địa chỉ Email"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Đường dẫn Facebook</label>
                      <input
                        type="text"
                        placeholder="Link Facebook"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.facebook || ''}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hệ sinh thái</label>
                      <SearchableSelect
                        disabled={!isAdmin && availableEcosystemOptions.length === 1}
                        options={availableEcosystemOptions}
                        value={formData.ecosystem || ''}
                        placeholder="-- Click để chọn hệ sinh thái --"
                        onChange={(value) => setFormData({ ...formData, ecosystem: value })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Nhóm 3: Chi tiết đơn hàng */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                    Nhóm 3: Chi tiết đơn hàng (Mỗi đơn là 1 hàng)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Tổng số lần đã mua hàng
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs disabled:bg-slate-100 font-bold text-indigo-600"
                          value={formData.purchaseCount || 0}
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày mua hàng</label>
                        <input
                          type="date"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={formData.singleDate || ''}
                          onChange={(e) => setFormData({ ...formData, singleDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-end">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Tên sản phẩm dịch vụ *
                          </label>
                          <input
                            type="text"
                            placeholder="Tên sản phẩm dịch vụ"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                            value={formData.products || ''}
                            onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hóa đơn đầu ra (url)</label>
                          <input
                            type="text"
                            placeholder="Nhập đường dẫn URL hóa đơn..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.invoiceLink || ''}
                            onChange={(e) => setFormData({ ...formData, invoiceLink: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hạng mục</label>
                      <input
                        type="text"
                        placeholder="Nhập hạng mục"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.category || ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phân loại</label>
                      <SearchableSelect
                        options={ITEM_TYPE_OPTIONS}
                        value={formData.itemType || ''}
                        placeholder="-- Chọn phân loại --"
                        onChange={(value) => setFormData({ ...formData, itemType: value })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Báo giá</label>
                      <input
                        type="text"
                        placeholder="Nhập báo giá"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.quote || ''}
                        onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Giá chốt</label>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        placeholder="Nhập giá"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={formData.price ?? 0}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Nhóm 4: Chăm sóc & Tiếp thị */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Nhóm 4: Chăm sóc &amp; Tiếp thị
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số ngày thuê</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={formData.rentalDays ?? 0}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              rentalDays: e.target.value === '' ? 0 : Number(e.target.value)
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Phương thức thanh toán
                        </label>
                        <SearchableSelect
                          options={PAYMENT_METHOD_OPTIONS}
                          value={formData.paymentMethod || ''}
                          placeholder="-- Chọn phương thức --"
                          onChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nguồn khách hàng</label>
                        <SearchableSelect
                          options={CUSTOMER_SOURCE_OPTIONS}
                          value={formData.customerSource || ''}
                          placeholder="-- Chọn nguồn --"
                          onChange={(value) => setFormData({ ...formData, customerSource: value })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Khách hàng giới thiệu
                        </label>
                        <SearchableSelect
                          options={referralCustomerOptions.map((customer) => ({
                            value: customer.id,
                            label: `${customer.fullName} -- ID: ${customer.id}`
                          }))}
                          value={formData.referralCustomerId ?? ''}
                          placeholder="-- Chọn khách hàng giới thiệu --"
                          onChange={(value) => setFormData({ ...formData, referralCustomerId: value })}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Mối quan tâm / Vấn đề
                      </label>
                      <ExpandableInput
                        value={formData.issue || ''}
                        onChange={(newValue) => setFormData({ ...formData, issue: newValue })}
                        placeholder="Nhu cầu khách hàng..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Khuyến mãi áp dụng
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                          placeholder="Nhập tên khuyến mãi rồi ấn Enter..."
                          value={promoEvent || ''}
                          onChange={(e) => setPromoEvent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (promoEvent.trim()) {
                                setFormData({
                                  ...formData,
                                  promotions: [...(formData.promotions || []), { event: promoEvent.trim() }]
                                });
                              }
                              setPromoEvent('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (promoEvent.trim()) {
                              setFormData({
                                ...formData,
                                promotions: [...(formData.promotions || []), { event: promoEvent.trim() }]
                              });
                            }
                            setPromoEvent('');
                          }}
                          className="bg-indigo-50 text-indigo-700 px-3 text-xs font-bold rounded-xl border border-indigo-200"
                        >
                          Thêm
                        </button>
                      </div>
                      <div className="mt-1.5 space-y-1">
                        {(formData.promotions || []).map((p, i) => (
                          <div
                            key={i}
                            className="text-[10px] bg-white p-2 rounded-lg flex justify-between items-center border border-slate-200"
                          >
                            <span>
                              Sự kiện: <strong className="text-indigo-600">{p.event || ''}</strong>
                            </span>
                            <span
                              className="text-rose-500 font-bold cursor-pointer"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  promotions: formData.promotions.filter((_, idx) => idx !== i)
                                })
                              }
                            >
                              Gỡ
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Phương thức chăm sóc (Chọn nhiều)
                      </label>
                      <div className="flex flex-wrap gap-4 bg-white p-3 rounded-xl border border-slate-200">
                        {CARE_METHODS.map((m) => (
                          <label key={m.value} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(formData.careMethods || []).includes(m.value)}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  careMethods: e.target.checked
                                    ? [...(formData.careMethods || []), m.value]
                                    : formData.careMethods.filter((c) => c !== m.value)
                                })
                              }
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
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
                      <SearchableSelect
                        options={staffList.map((s) => ({ value: s.fullName, label: s.fullName }))}
                        value={formData.seller || ''}
                        placeholder="-- Chọn người bán --"
                        onChange={(value) => setFormData({ ...formData, seller: value })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Nhân viên tư vấn
                      </label>
                      <SearchableSelect
                        options={staffList.map((s) => ({ value: s.fullName, label: s.fullName }))}
                        value={formData.consultant || ''}
                        placeholder="-- Chọn nhân sự tư vấn --"
                        onChange={(value) => setFormData({ ...formData, consultant: value })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Nhân viên chăm sóc
                      </label>
                      <SearchableSelect
                        options={staffList.map((s) => ({ value: s.fullName, label: s.fullName }))}
                        value={formData.careStaff || ''}
                        placeholder="-- Chọn nhân sự chăm sóc --"
                        onChange={(value) => setFormData({ ...formData, careStaff: value })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Nhóm 6: Trạng thái nhãn gán */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Nhóm 6: Trạng thái &amp; Gán nhãn
                  </h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Gán nhãn phân cấp
                    </label>
                    <SearchableSelect
                      options={LABELS.map((l) => ({ value: l.value, label: l.label }))}
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
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="space-y-4 pt-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-xs">
            <div className="flex-1 min-w-[220px]">
              <input
                type="text"
                placeholder="Tìm theo Mã khách hàng"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm"
                value={crmSearchById || ''}
                onChange={(e) => {
                  setCrmSearchById(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex-1 min-w-[280px]">
              <input
                type="text"
                placeholder="Tìm kiếm theo Tên, SĐT, Email..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm"
                value={crmSearch || ''}
                onChange={(e) => {
                  setCrmSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <SearchableSelect
              options={[
                { value: '', label: 'Tất cả nhãn gán' },
                ...LABELS.map((l) => ({ value: l.value, label: l.label }))
              ]}
              value={crmFilterLabel || ''}
              placeholder="Lọc theo nhãn gán"
              onChange={(value) => {
                setCrmFilterLabel(value);
                setCurrentPage(1);
              }}
              className="w-[180px]"
            />
            {!isStaff && (
              <SearchableSelect
                options={[
                  { value: '', label: 'Tất cả hệ sinh thái' },
                  ...availableEcosystemOptions.map((l) => ({ value: l.value, label: l.label }))
                ]}
                value={crmFilterEco || ''}
                placeholder="Tất cả hệ sinh thái"
                onChange={(value) => {
                  setCrmFilterEco(value);
                  setCurrentPage(1);
                }}
                className="w-[180px]"
              />
            )}
            <label className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 uppercase">
              Từ ngày giao dịch
              <input
                type="date"
                value={transactionDateFrom}
                max={transactionDateTo || undefined}
                onChange={(e) => {
                  setTransactionDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-700"
              />
            </label>
            <label className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 uppercase">
              Đến ngày giao dịch
              <input
                type="date"
                value={transactionDateTo}
                min={transactionDateFrom || undefined}
                onChange={(e) => {
                  setTransactionDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-700"
              />
            </label>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-auto">
              <span>Hiển thị:</span>
              <SearchableSelect
                options={[5, 10, 20, 50].map((size) => ({ value: size, label: `${size} dòng` }))}
                value={pageSize}
                placeholder="Chọn số dòng"
                onChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
                className="w-[120px]"
              />
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
              <table className="w-full text-left border-collapse min-w-[4450px] table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-4 py-3.5 text-center w-12">STT</th>
                    <th className="px-4 py-3.5 w-40 border-l border-slate-200">Mã khách hàng</th>
                    <th className="px-4 py-3.5 w-64">Thông tin cơ bản</th>
                    <th className="px-4 py-3.5 w-64">Kênh liên hệ</th>
                    <th className="px-4 py-3.5 w-40">Tổng số lần mua</th>
                    <th className="px-4 py-3.5 w-44 text-center">Nhãn trạng thái</th>
                    <th className="px-4 py-3.5 w-44 text-center">Tổng tiền đã mua</th>
                    <th className="px-4 py-3.5 w-32 border-l border-slate-200 bg-indigo-50/20 text-indigo-900">
                      Ngày giao dịch
                    </th>
                    <th className="px-4 py-3.5 w-60 bg-indigo-50/20 text-indigo-900">Sản phẩm</th>
                    <th className="px-4 py-3.5 text-center w-36 bg-indigo-50/20 text-indigo-900">Hóa đơn (URL)</th>
                    <th className="px-4 py-3.5 w-40 bg-indigo-50/20 text-indigo-900">Hạng mục</th>
                    <th className="px-4 py-3.5 w-32 bg-indigo-50/20 text-indigo-900">Phân loại</th>
                    <th className="px-4 py-3.5 w-32 bg-indigo-50/20 text-indigo-900">Báo giá</th>
                    <th className="px-4 py-3.5 w-32 bg-indigo-50/20 text-indigo-900">Giá chốt</th>
                    <th className="px-4 py-3.5 w-36 bg-rose-50/20 text-rose-900">Công nợ phải thu</th>
                    <th className="px-4 py-3.5 w-28 border-l border-slate-200 bg-sky-50/20 text-sky-900">
                      Số ngày thuê
                    </th>
                    <th className="px-4 py-3.5 w-36 bg-sky-50/20 text-sky-900">Phương thức Thanh toán</th>
                    <th className="px-4 py-3.5 w-36 bg-sky-50/20 text-sky-900">Nguồn khách hàng</th>
                    <th className="px-4 py-3.5 w-44 bg-sky-50/20 text-sky-900">Khách hàng giới thiệu</th>
                    <th className="px-4 py-3.5 w-64 border-l border-slate-200 bg-amber-50/20 text-amber-900">
                      Mối quan tâm
                    </th>
                    <th className="px-4 py-3.5 w-56 bg-amber-50/20 text-amber-900">Quà tặng áp dụng</th>
                    <th className="px-4 py-3.5 w-48 bg-amber-50/20 text-amber-900">Kênh tiếp cận</th>
                    <th className="px-4 py-3.5 w-44 border-l border-slate-200 bg-emerald-50/20 text-emerald-900">
                      Người bán
                    </th>
                    <th className="px-4 py-3.5 w-44 bg-emerald-50/20 text-emerald-900">Nhân sự tư vấn</th>
                    <th className="px-4 py-3.5 w-44 bg-emerald-50/20 text-emerald-900">Người chăm sóc</th>
                    <th className="px-4 py-3.5 text-center w-44 border-l border-slate-200 bg-slate-100 text-slate-700">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs bg-white">
                  {flatRows.map(({ cust: customer, history: h }, index) => {
                    const cust = customer;
                    const history = h || {};
                    return (
                      <tr
                        key={`${cust.id}-${h?.id ?? 'empty'}-${index}`}
                        className="hover:bg-slate-50/60 transition-colors align-top"
                      >
                        <td className="px-4 py-4 font-semibold text-slate-400 text-center">{index + 1}</td>
                        <td className="px-4 py-4 text-start font-mono text-slate-700 text-[11px]">{cust.id}</td>
                        <td className="px-3 py-3 space-y-1">
                          <span className="font-bold text-slate-900 text-sm block">{cust.fullName}</span>
                          <div>
                            <span className="text-slate-500">Ngày sinh:</span>{' '}
                            <span className="font-medium text-slate-800">
                              {toDMY(cust.birthday) || 'Chưa cập nhật'}
                            </span>
                          </div>
                          <div className="text-slate-600">
                            <span className="text-slate-500">Địa chỉ:</span>{' '}
                            <p className="inline break-words font-medium">{cust.address || 'Chưa cập nhật'}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 space-y-1">
                          <div>
                            <span className="text-slate-500">SĐT:</span>{' '}
                            <span className="font-bold text-slate-900">{cust.phone}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Email:</span>{' '}
                            <span className="font-medium text-slate-800 break-all">
                              {cust.email || 'Chưa điền'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Facebook:</span>{' '}
                            {cust.facebook ? (
                              <a
                                href={cust.facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:underline font-medium break-all"
                              >
                                {cust.facebook}
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">Trống</span>
                            )}
                          </div>
                          <div className="pt-1">
                            <span className="bg-slate-100 border text-slate-700 px-2 py-0.5 rounded-md font-medium text-[10px]">
                              {ECOSYSTEM_OPTIONS.find((e) => e.value === cust.ecosystem)?.label ||
                                cust.ecosystem ||
                                'Chưa chọn'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 space-y-1">
                          <span className="font-bold text-indigo-600">lần {cust.purchaseCount || 0}</span>
                        </td>
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          {(() => {
                            const currentLabel = LABELS.find((l) => l.value === cust.label);
                            return (
                              <span
                                className={`inline-block w-full text-center py-1.5 rounded-xl font-bold text-xs border ${currentLabel?.color || 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                              >
                                {currentLabel?.label || 'Chưa phân cấp'}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-emerald-600 text-sm">
                          {totalSpentMap[cust.id] !== undefined ? (
                            new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                              totalSpentMap[cust.id]
                            )
                          ) : (
                            <span className="text-slate-400 font-normal text-xs italic">Đang tải...</span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-900 whitespace-nowrap border-l border-slate-200 bg-indigo-50/5">
                          {history.date || '---'}
                        </td>
                        <td className="px-4 py-4 text-slate-800 font-bold leading-relaxed break-words bg-indigo-50/5">
                          {history.products || '---'}
                        </td>

                        <td className="px-4 py-4 text-center whitespace-nowrap bg-indigo-50/5">
                          {history.invoiceLink ? (
                            <div className="flex justify-center items-center h-full pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(history.invoiceLink);
                                  alert('Đã sao chép liên kết!');
                                }}
                                className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg font-semibold transition-all text-[11px]"
                                title={history.invoiceLink}
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy liên kết</span>
                              </button>
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
                            <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
                              Bán
                            </span>
                          ) : history.itemType === 'dich_vu' ? (
                            <span className="bg-violet-50 border border-violet-200 text-violet-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
                              Dịch vụ
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">Trống</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-slate-700 break-words bg-indigo-50/5">
                          {history.quote || <span className="text-slate-300 italic">Trống</span>}
                        </td>
                        <td className="px-4 py-4 text-slate-900 font-bold whitespace-nowrap bg-indigo-50/5">
                          {history.price ? (
                            new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                              parseNumericValue(history.price)
                            )
                          ) : (
                            <span className="text-slate-300 italic font-normal">Trống</span>
                          )}
                        </td>
                        <td className="px-3 py-3 bg-rose-50/5">
                          {h?.id ? (
                            <>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                inputMode="numeric"
                                aria-label={`Công nợ phải thu của ${cust.fullName || 'khách hàng'}`}
                                title="Nhập số tiền khách hàng còn nợ"
                                value={receivableDebtDrafts[h.id] ?? h.receivableDebt ?? 0}
                                disabled={Boolean(savingReceivableDebtIds[h.id])}
                                onChange={(event) => handleReceivableDebtChange(h.id, event.target.value)}
                                onBlur={() => handleSaveReceivableDebt(cust, h)}
                                className="w-full min-w-[100px] bg-white border border-rose-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:bg-slate-100"
                              />
                              {savingReceivableDebtIds[h.id] && (
                                <span className="text-[10px] text-slate-500">Đang lưu...</span>
                              )}
                              {receivableDebtErrors[h.id] && (
                                <span className="block text-[10px] text-rose-600">{receivableDebtErrors[h.id]}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-300 italic">---</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-sky-700 border-l border-slate-200 bg-sky-50/5">
                          {history.rentalDays || 0}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap bg-sky-50/5">
                          {history.paymentMethod ? (
                            <span className="bg-sky-50 border border-sky-200 text-sky-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
                              {{ momo: 'Momo', ngan_hang: 'Ngân hàng', tien_mat: 'Tiền mặt' }[history.paymentMethod] ||
                                history.paymentMethod}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">Trống</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap bg-sky-50/5">
                          {history.customerSource ? (
                            <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
                              {{
                                fanpage: 'Fanpage',
                                tiktok: 'TikTok',
                                youtube: 'YouTube',
                                zalo: 'Zalo',
                                website: 'Website',
                                partner: 'Partner',
                                sale: 'Sale'
                              }[history.customerSource] || history.customerSource}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">Trống</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap bg-sky-50/5">
                          {history.referralCustomerId ? (
                            <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
                              ID: {history.referralCustomerId}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">Không có</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-slate-700 font-medium leading-relaxed break-words border-l border-slate-200 bg-amber-50/5">
                          {history.issue || customer.issue || <span className="text-slate-400 italic">Chưa ghi nhận</span>}
                        </td>
                        <td className="px-4 py-4 text-slate-600 leading-relaxed break-words bg-amber-50/5">
                          {history.promotions && history.promotions.length > 0 ? (
                            history.promotions.map((p, idx) => (
                              <div key={idx} className="mb-1.5 last:mb-0">
                                <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] inline-block">
                                  {p.event}
                                </span>
                              </div>
                            ))
                          ) : customer.promotions && customer.promotions.length > 0 ? (
                            customer.promotions.map((p, idx) => (
                              <div key={idx} className="mb-1.5 last:mb-0">
                                <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] inline-block">
                                  {p.event}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">Không áp dụng</span>
                          )}
                        </td>
                        <td className="px-4 py-4 bg-amber-50/5">
                          <div className="flex flex-wrap gap-1">
                            {history.careMethods && history.careMethods.length > 0 ? (
                              history.careMethods.map((m) => (
                                <span
                                  key={m}
                                  className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold shadow-3xs"
                                >
                                  {m}
                                </span>
                              ))
                            ) : customer.careMethods && customer.careMethods.length > 0 ? (
                              customer.careMethods.map((m) => (
                                <span
                                  key={m}
                                  className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold shadow-3xs"
                                >
                                  {m}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-300 italic">Trống</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap border-l border-slate-200 bg-emerald-50/5">
                          {history.seller ? (
                            <span className="inline-block bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md text-[11px]">
                              {staffOptions.find((s) => s.value === history.seller)?.label || history.seller}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa chỉ định</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap bg-emerald-50/5">
                          {history.consultant ? (
                            <span className="inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md text-[11px]">
                              {staffOptions.find((s) => s.value === history.consultant)?.label || history.consultant}
                            </span>
                          ) : customer.consultant ? (
                            <span className="inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md text-[11px]">
                              {staffOptions.find((s) => s.value === customer.consultant)?.label || customer.consultant}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa chỉ định</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap bg-emerald-50/5">
                          {history.careStaff ? (
                            <span className="inline-block bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md text-[11px]">
                              {staffOptions.find((s) => s.value === history.careStaff)?.label || history.careStaff}
                            </span>
                          ) : customer.careStaff ? (
                            <span className="inline-block bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md text-[11px]">
                              {staffOptions.find((s) => s.value === customer.careStaff)?.label || customer.careStaff}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa chỉ định</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center border-l border-slate-200 bg-slate-50/50">
                          <div className="flex flex-row gap-1.5 items-center">
                            <button
                              type="button"
                              onClick={() => (h?.id ? handleEditTransaction(cust, h) : handleEditClick(cust))}
                              className="flex-1 py-1.5 px-2 text-[11px] bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center gap-1 font-bold"
                              title="Sửa thông tin khách hàng và dòng hàng này"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => (h?.id ? handleDeleteHistory(cust, h.id) : handleDeleteCustomer(cust))}
                              disabled={isDeleting}
                              className="flex-1 py-1.5 px-2 text-[11px] bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center gap-1 font-bold"
                              title="Xóa dòng này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {flatRows.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan="26" className="text-center py-8 text-slate-400 italic">
                        Không tìm thấy khách hàng nào khớp với bộ lọc.
                      </td>
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
      </main>

      <ConfirmModal
        open={!!confirmState}
        title="Xác nhận xóa"
        message={confirmState?.message}
        danger
        confirmText="Xóa"
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}