import React, { useState, useEffect } from 'react';
import { Save, Search, Bell, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExpandableInput from '../components/ExpandableInput';
import Pagination from '../components/Pagination';
import ApiCustomer from '../api/ApiCustomer';
import ApiAuth from '../api/ApiAuth';
import ApiPurchaseHistory from '../api/ApiPurchaseHistory';
import { LABELS } from './CRM';
import { getBirthdayCustomers } from './ThongBao';

export default function ChamSocKhachHangPage() {
    const navigate = useNavigate();

    const [customersData, setCustomersData] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [purchaseHistoryMap, setPurchaseHistoryMap] = useState({});
    const [careStates, setCareStates] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLabel, setFilterLabel] = useState('');
    const [filterCareStatus, setFilterCareStatus] = useState('all');
    const [filterStaff, setFilterStaff] = useState('');

    // ─── STATE PHÂN TRANG (ĐỒNG BỘ THEO RESPONSE BE) ───
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // ─── STATE LOADING & ERROR ───
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    // Số lượng sinh nhật hôm nay – tính trên danh sách khách hàng đã tải
    const birthdayCount = getBirthdayCustomers(customersData).length;

    // ─── HOOK FETCH DANH SÁCH NHÂN VIÊN TỪ BACKEND ───
    const fetchStaff = async () => {
        try {
            const response = await ApiAuth.getListUser();
            const result = response?.DT || response;

            const userList = result?.user || [];
            const filteredStaff = userList.filter(user => user.role === 'Staff');

            setStaffList(filteredStaff);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách user:", error);
        }
    };

    // ─── HOOK FETCH DANH SÁCH KHÁCH HÀNG TỪ BACKEND (CÓ PHÂN TRANG) ───
    const fetchCustomers = async () => {
        setIsLoading(true);
        setApiError(null);
        try {
            const params = {
                search: searchTerm,
                label: filterLabel,
                page: currentPage,
                pageSize: pageSize
            };

            const response = await ApiCustomer.getCustomers(params);
            const result = response?.DT || response;

            let parsedCustomers = [];
            let parsedTotalItems = 0;
            let parsedTotalPages = 1;

            if (result && typeof result === 'object') {
                if ('rows' in result && Array.isArray(result.rows)) {
                    parsedCustomers = result.rows;
                    if (result.pagination) {
                        parsedTotalItems = result.pagination.totalItems || 0;
                        parsedTotalPages = result.pagination.totalPages || 1;
                    }
                }
                else if ('items' in result) {
                    parsedCustomers = Array.isArray(result.items) ? result.items : [];
                    parsedTotalItems = result.total || result.totalItems || 0;
                    parsedTotalPages = result.totalPages || 1;
                }
                else if ('customers' in result && Array.isArray(result.customers)) {
                    parsedCustomers = result.customers;
                    parsedTotalItems = result.total || result.totalItems || 0;
                    parsedTotalPages = result.totalPages || 1;
                }
                else if (Array.isArray(result)) {
                    parsedCustomers = result;
                    parsedTotalItems = result.length;
                    parsedTotalPages = 1;
                } else {
                    setCustomersData([]);
                    setPurchaseHistoryMap({});
                    setApiError("Không thể bóc tách dữ liệu từ máy chủ.");
                    return;
                }
            } else {
                setCustomersData([]);
                setPurchaseHistoryMap({});
                setApiError("Không thể bóc tách dữ liệu từ máy chủ.");
                return;
            }

            setCustomersData(parsedCustomers);
            setTotalItems(parsedTotalItems);
            setTotalPages(parsedTotalPages);

            if (parsedCustomers.length > 0) {
                const historyResults = await Promise.all(
                    parsedCustomers.map(async (customer) => {
                        try {
                            const historyResponse = await ApiPurchaseHistory.getCustomerPurchaseHistory(customer.id);
                            const historyResult = historyResponse?.DT || historyResponse;

                            return {
                                customerId: customer.id,
                                histories: Array.isArray(historyResult) ? historyResult : []
                            };
                        } catch (error) {
                            console.error(`Lỗi tải lịch sử mua hàng cho khách hàng ${customer.id}:`, error);
                            return { customerId: customer.id, histories: [] };
                        }
                    })
                );

                const nextHistoryMap = {};
                historyResults.forEach(({ customerId, histories }) => {
                    nextHistoryMap[customerId] = histories;
                });
                setPurchaseHistoryMap(nextHistoryMap);
            } else {
                setPurchaseHistoryMap({});
            }
        } catch (error) {
            console.error("Lỗi khi fetch dữ liệu khách hàng:", error);
            setApiError("Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại sau.");
            setCustomersData([]);
            setPurchaseHistoryMap({});
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchStaff();
    }, [currentPage, pageSize, searchTerm, filterLabel]);

    const handleInputChange = (historyId, field, value) => {
        setCareStates(prev => ({
            ...prev,
            [historyId]: { ...prev[historyId], [field]: value }
        }));
    };

    const handleSaveRow = async (customerId, historyId, row) => {
        const rowData = careStates[historyId];
        if (!rowData) return;

        if (String(historyId).startsWith('empty-')) {
            return;
        }

        // Gom đầy đủ payload gửi lên Backend bao gồm cả issue, behaviorMetric và isCared
        const payload = {
            issue: rowData.issue ?? row?.issue ?? '',
            careStaff: rowData.careStaff ?? row?.careStaff ?? '',
            consultant: rowData.consultant ?? row?.consultant ?? '',
            careMethods: rowData.careMethods ?? row?.careMethods ?? [],
            promotions: rowData.promotions ?? row?.promotions ?? [],
            products: rowData.products ?? row?.products ?? '',
            invoiceLink: rowData.invoiceLink ?? row?.invoiceLink ?? '',
            date: rowData.historyDate ?? row?.historyDate ?? '',
            behaviorMetric: rowData.behaviorMetric ?? row?.behaviorMetric ?? '',
            isCared: rowData.isCared ?? row?.isCared ?? false
        };

        try {
            await ApiPurchaseHistory.updatePurchaseHistory(historyId, payload);

            // Cập nhật lại Map để giao diện hiển thị đồng bộ tức thì không cần F5
            setPurchaseHistoryMap(prev => ({
                ...prev,
                [customerId]: (prev[customerId] || []).map(hist =>
                    hist.id === historyId
                        ? {
                            ...hist,
                            ...payload,
                            issue: payload.issue,
                            behaviorMetric: payload.behaviorMetric,
                            isCared: payload.isCared
                        }
                        : hist
                )
            }));

            // Xóa state tạm thời của dòng vừa lưu để disabled nút Lưu
            setCareStates(prev => {
                const updated = { ...prev };
                delete updated[historyId];
                return updated;
            });
        } catch (error) {
            console.error("Lỗi khi lưu thông tin chăm sóc:", error);
        }
    };

    const allRowItems = [];
    customersData.forEach(customer => {
        const histories = purchaseHistoryMap[customer.id] || [];
        if (histories.length > 0) {
            histories.forEach(history => {
                allRowItems.push({
                    ...customer,
                    historyId: history.id,
                    historyDate: history.date || '---',
                    products: history.products || '---',
                    invoiceLink: history.invoiceLink || '',
                    careMethods: Array.isArray(history.careMethods) ? history.careMethods : [],
                    promotions: Array.isArray(history.promotions) ? history.promotions : [],
                    consultant: history.consultant || '',
                    careStaff: history.careStaff || '',
                    issue: history.issue || '',
                    behaviorMetric: history.behaviorMetric || '',
                    // SỬA LỖI: Ưu tiên nhận isCared từ Backend trả về trước, tránh tự ép kiểu sai
                    isCared: history.isCared ?? Boolean(history.issue || history.careStaff || history.careMethods?.length)
                });
            });
        } else {
            allRowItems.push({
                ...customer,
                historyId: `empty-${customer.id}`,
                historyDate: '---',
                products: '---',
                careMethods: [],
                promotions: [],
                careStaff: '',
                issue: '',
                behaviorMetric: '',
                isCared: false
            });
        }
    });

    const filteredRows = allRowItems.filter(row => {
        const currentState = careStates[row.historyId] || {};
        const isCaredNow = currentState.isCared ?? row.isCared;
        let matchesCareStatus = true;
        if (filterCareStatus === 'cared') matchesCareStatus = isCaredNow === true;
        if (filterCareStatus === 'not_cared') matchesCareStatus = isCaredNow === false;
        const matchesStaff = filterStaff === '' || row.careStaff === filterStaff;
        return matchesCareStatus && matchesStaff;
    });

    return (
        <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">

            {/* Tiêu đề + Icon chuông sinh nhật */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">
                        Quản lý Chăm sóc Khách hàng
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Trang làm việc dành cho nhân viên vận hành hệ thống.
                    </p>
                </div>

                {/* Bell button */}
                <button
                    onClick={() => navigate('/Notification')}
                    title={
                        birthdayCount > 0
                            ? `${birthdayCount} khách hàng có sinh nhật hôm nay`
                            : 'Không có sinh nhật hôm nay'
                    }
                    className="relative flex-shrink-0 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-colors group"
                >
                    <Bell className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    {birthdayCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm">
                            {birthdayCount > 99 ? '99+' : birthdayCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Bộ lọc Tìm kiếm nâng cao */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tìm kiếm thông tin</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Họ và tên, SĐT hoặc Email..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-indigo-500"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Giai đoạn khách hàng</label>
                    <select
                        value={filterLabel}
                        onChange={(e) => { setFilterLabel(e.target.value); setCurrentPage(1); }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
                    >
                        <option value="">Tất cả giai đoạn</option>
                        {LABELS.map(l => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nhân viên CSKH</label>
                    <select
                        value={filterStaff}
                        onChange={(e) => { setFilterStaff(e.target.value); setCurrentPage(1); }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
                    >
                        <option value="">Tất cả nhân viên</option>
                        {staffList.map(staff => (
                            <option key={staff.id} value={staff.fullName}>{staff.fullName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Trạng thái chăm sóc</label>
                    <select
                        value={filterCareStatus}
                        onChange={(e) => setFilterCareStatus(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="cared">Đã tích chọn (Đang/Đã chăm sóc)</option>
                        <option value="not_cared">Chưa tích chọn</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Hiển thị</label>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
                    >
                        {[5, 10, 20, 50].map(size => (
                            <option key={size} value={size}>{size} khách hàng/trang</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Bảng dữ liệu */}
            <div className="border border-slate-200 rounded-xl overflow-hidden relative min-h-[200px]">
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
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                <th className="px-4 py-3 min-w-[240px]">Thông tin cơ bản</th>
                                <th className="px-4 py-3 min-w-[240px]">Kênh liên hệ</th>
                                <th className="px-4 py-3 min-w-[140px]">Giai đoạn khách hàng</th>
                                <th className="px-4 py-3 min-w-[220px]">Sản phẩm - Dịch vụ đã mua/tư vấn</th>
                                <th className="px-4 py-3 min-w-[220px]">Nội dung đã chăm sóc</th>
                                <th className="px-4 py-3 min-w-[200px]">Hành vi có thể đo lường</th>
                                <th className="px-4 py-3 min-w-[160px]">Nhân viên CSKH</th>
                                <th className="px-4 py-3 text-center w-24">Trạng thái CS</th>
                                <th className="px-4 py-3 text-center w-20 sticky right-0 bg-slate-100">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                            {filteredRows.length > 0 ? (
                                filteredRows.map((row) => {
                                    const careMethods = row.careMethods || [];
                                    const showPhone = careMethods.some(m => ['Zalo OA', 'SMS', 'Telesale'].includes(m));
                                    const showEmail = careMethods.includes('Email Marketing');
                                    const showFacebook = careMethods.includes('Messenger');
                                    const currentLabel = LABELS.find(l => l.value === row.label) || {
                                        label: row.label || 'Lạnh',
                                        color: 'bg-gray-100 text-gray-700 border-gray-300'
                                    };

                                    const currentState = careStates[row.historyId] || {};
                                    const isChecked = currentState.isCared ?? row.isCared;

                                    // SỬA ĐỒNG BỘ: Sử dụng trực tiếp trường issue cho cả state và dữ liệu gốc
                                    const careContent = currentState.issue ?? row.issue ?? '';
                                    const behaviorMetric = currentState.behaviorMetric ?? row.behaviorMetric ?? '';

                                    return (
                                        <tr key={row.historyId} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-4 space-y-1 bg-slate-50/30">
                                                <div className="text-sm font-bold text-slate-900">{row.fullName}</div>
                                                <div className="text-slate-600">
                                                    <span className="text-slate-400">Ngày sinh:</span> {row.birthday ? new Date(row.birthday).toLocaleDateString('vi-VN') : '---'}
                                                </div>
                                                {row.address && (
                                                    <div className="text-slate-600">
                                                        <span className="text-slate-400">Địa chỉ:</span> {row.address}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 space-y-1 text-slate-700 bg-slate-50/30">
                                                <div>
                                                    <span className="text-slate-400 font-medium">SĐT:</span>{' '}
                                                    {showPhone && row.phone ? (
                                                        <span className="font-bold text-slate-900">{row.phone}</span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Ẩn (Không dùng kênh)</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-medium">Email:</span>{' '}
                                                    {showEmail && row.email ? (
                                                        <span className="font-medium text-slate-900">{row.email}</span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Ẩn (Không dùng kênh)</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-medium">Facebook:</span>{' '}
                                                    {showFacebook && row.facebook ? (
                                                        <a href={row.facebook} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                                                            {row.facebook}
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Ẩn (Không dùng kênh)</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 bg-slate-50/30">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${currentLabel.color}`}>
                                                    {currentLabel.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-slate-900 font-medium bg-slate-50/30 max-w-[200px] truncate" title={row.products}>
                                                <div className="bg-indigo-50 text-indigo-800 px-2 py-1 rounded border border-indigo-100">
                                                    {row.products || '---'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-1">Ngày mua: {row.historyDate}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <ExpandableInput
                                                    value={careContent}
                                                    // SỬA ĐỒNG BỘ: Dùng 'issue' thay vì 'careContent'
                                                    onChange={(newValue) => handleInputChange(row.historyId, 'issue', newValue)}
                                                    placeholder="Nhập nội dung chăm sóc..."
                                                    title={`Nội dung chăm sóc - Khách hàng: ${row.fullName}`}
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <ExpandableInput
                                                    value={behaviorMetric}
                                                    onChange={(newValue) => handleInputChange(row.historyId, 'behaviorMetric', newValue)}
                                                    placeholder="Nhập tay hành vi..."
                                                    title={`Hành vi có thể đo lường - Khách hàng: ${row.fullName}`}
                                                />
                                            </td>
                                            <td className="px-4 py-4 bg-slate-50/30">
                                                <div className="px-2.5 py-1.5 text-slate-800 font-semibold bg-emerald-50/60 rounded-md border border-emerald-200 text-center">
                                                    {staffList.find(s => s.fullName === row.careStaff)?.fullName || <span className="text-slate-400 italic">-- Chưa gán --</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <label className="flex flex-col items-center justify-center gap-1 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => handleInputChange(row.historyId, 'isCared', e.target.checked)}
                                                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded-sm focus:ring-indigo-500"
                                                    />
                                                    <span className={`text-[10px] font-semibold uppercase ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {isChecked ? 'Đã CS' : 'Chưa CS'}
                                                    </span>
                                                </label>
                                            </td>
                                            <td className="px-4 py-4 text-center sticky right-0 bg-white shadow-[-4px_0_12px_rgba(0,0,0,0.05)]">
                                                <button
                                                    type="button"
                                                    disabled={!careStates[row.historyId]}
                                                    onClick={() => handleSaveRow(row.id, row.historyId, row)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold border transition-all ${careStates[row.historyId]
                                                        ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                                                        : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <Save className="w-3 h-3" /> Lưu
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                                        Không tìm thấy kết quả phù hợp với điều kiện tìm kiếm/lọc.
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
    );
}