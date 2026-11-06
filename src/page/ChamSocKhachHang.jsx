import React, { useState, useEffect } from 'react';
import { Save, Search, Bell, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExpandableInput from '../components/ExpandableInput';
import Pagination from '../components/Pagination';
import SearchableSelect from '../components/SearchableSelect';
import ApiCustomer from '../api/ApiCustomer';
import ApiAuth from '../api/ApiAuth';
import ApiPurchaseHistory from '../api/ApiPurchaseHistory';
import { useAuth } from '../context/AuthContext';
import { LABELS, ECOSYSTEM_OPTIONS } from './CRM';
import { getBirthdayCustomers } from './ThongBao';

export default function ChamSocKhachHangPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const userRole = String(user?.role || '').toLowerCase();
    const isAdmin = userRole === 'admin';
    const isManager = userRole === 'manager';
    const isStaff = userRole === 'staff';

    const [customersData, setCustomersData] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [purchaseHistoryMap, setPurchaseHistoryMap] = useState({});
    const [careStates, setCareStates] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLabel, setFilterLabel] = useState('');
    const [filterCareStatus, setFilterCareStatus] = useState('all');
    // Nếu là Staff thì mặc định filter đúng tên staff đó
    const [filterStaff, setFilterStaff] = useState(isStaff ? (user?.fullName || user?.userName) : '');
    const [filterEcosystem, setFilterEcosystem] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    const birthdayCount = getBirthdayCustomers(customersData).length;

    const fetchStaff = async () => {
        try {
            const response = await ApiAuth.getListUser();
            const result = response?.DT || response;
            const userList = result?.user || [];
            const filteredStaff = userList.filter(u => String(u.role).toLowerCase() === 'staff');
            setStaffList(filteredStaff);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách user:", error);
        }
    };

    const fetchCustomers = async () => {
        setIsLoading(true);
        setApiError(null);
        try {
            const params = {
                search: searchTerm,
                label: filterLabel,
                ecosystem: filterEcosystem,
                page: currentPage,
                pageSize: pageSize,
                // Truyền quyền user xuống Backend
                userRole: user?.role,
                userId: user?.id,
                userName: user?.fullName || user?.userName,
                userStudio: user?.cmicStudio ? 1 : 0,
                userMedia: user?.cmicMedia ? 1 : 0
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
                } else if ('items' in result) {
                    parsedCustomers = Array.isArray(result.items) ? result.items : [];
                    parsedTotalItems = result.total || result.totalItems || 0;
                    parsedTotalPages = result.totalPages || 1;
                } else if (Array.isArray(result)) {
                    parsedCustomers = result;
                    parsedTotalItems = result.length;
                    parsedTotalPages = 1;
                }
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
            setApiError("Không thể tải dữ liệu từ máy chủ.");
            setCustomersData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchStaff();
    }, [currentPage, pageSize, searchTerm, filterLabel, filterEcosystem]);

    const handleInputChange = (historyId, field, value) => {
        setCareStates(prev => ({
            ...prev,
            [historyId]: { ...prev[historyId], [field]: value }
        }));
    };

    const handleSaveRow = async (customerId, historyId, row) => {
        const rowData = careStates[historyId];
        if (!rowData || String(historyId).startsWith('empty-')) return;

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
            setPurchaseHistoryMap(prev => ({
                ...prev,
                [customerId]: (prev[customerId] || []).map(hist =>
                    hist.id === historyId ? { ...hist, ...payload } : hist
                )
            }));
            setCareStates(prev => {
                const updated = { ...prev };
                delete updated[historyId];
                return updated;
            });
        } catch (error) {
            console.error("Lỗi lưu:", error);
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
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Quản lý Chăm sóc Khách hàng</h3>
                    <p className="text-sm text-slate-600 mt-1">Trang làm việc dành cho nhân viên vận hành hệ thống.</p>
                </div>
                <button onClick={() => navigate('/Notification')} className="relative p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50">
                    <Bell className="w-5 h-5 text-slate-500 hover:text-indigo-600" />
                    {birthdayCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {birthdayCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Bộ lọc Tìm kiếm */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tìm kiếm thông tin</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tên, SĐT, Email..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Giai đoạn</label>
                    <SearchableSelect
                        options={LABELS.map(l => ({ value: l.value, label: l.label }))}
                        value={filterLabel}
                        placeholder="Tất cả giai đoạn"
                        onChange={(value) => { setFilterLabel(value); setCurrentPage(1); }}
                        className="w-full"
                    />
                </div>

                {/* Nhân viên CSKH: Nếu là Staff thì disabled */}
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nhân viên CSKH</label>
                    <SearchableSelect
                        disabled={isStaff}
                        options={staffList.map(staff => ({ value: staff.fullName, label: staff.fullName }))}
                        value={filterStaff}
                        placeholder="Tất cả nhân viên"
                        onChange={(value) => { setFilterStaff(value); setCurrentPage(1); }}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Trạng thái chăm sóc</label>
                    <SearchableSelect
                        options={[
                            { value: 'all', label: 'Tất cả trạng thái' },
                            { value: 'cared', label: 'Đã chăm sóc' },
                            { value: 'not_cared', label: 'Chưa chăm sóc' }
                        ]}
                        value={filterCareStatus}
                        onChange={(value) => setFilterCareStatus(value)}
                        className="w-full"
                    />
                </div>

                {/* Hệ sinh thái: Manager lọc theo quyền, Staff ẩn */}
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Hệ sinh thái</label>
                    <SearchableSelect
                        disabled={isStaff}
                        options={[
                            { value: '', label: 'Tất cả hệ sinh thái' },
                            ...ECOSYSTEM_OPTIONS
                        ]}
                        value={filterEcosystem}
                        placeholder="Tất cả hệ sinh thái"
                        onChange={(value) => { setFilterEcosystem(value); setCurrentPage(1); }}
                        className="w-full"
                    />
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

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                <th className="px-4 py-3 min-w-[240px]">Thông tin cơ bản</th>
                                <th className="px-4 py-3 min-w-[240px]">Kênh liên hệ</th>
                                <th className="px-4 py-3 min-w-[180px]">Phương thức CS</th>
                                <th className="px-4 py-3 min-w-[140px]">Giai đoạn</th>
                                <th className="px-4 py-3 min-w-[220px]">Sản phẩm/Dịch vụ</th>
                                <th className="px-4 py-3 min-w-[220px]">Nội dung CS</th>
                                <th className="px-4 py-3 min-w-[200px]">Hành vi đo lường</th>
                                <th className="px-4 py-3 min-w-[160px]">Nhân viên CSKH</th>
                                <th className="px-4 py-3 text-center w-24">Trạng thái</th>
                                <th className="px-4 py-3 text-center w-20 sticky right-0 bg-slate-100">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-xs">
                            {filteredRows.length > 0 ? (
                                filteredRows.map((row) => {
                                    const currentState = careStates[row.historyId] || {};
                                    const isChecked = currentState.isCared ?? row.isCared;
                                    return (
                                        <tr key={row.historyId} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-4 space-y-1 bg-slate-50/30">
                                                <div className="text-sm font-bold text-slate-900">{row.fullName}</div>
                                                <div className="text-slate-600">{row.birthday}</div>
                                                <div className="text-slate-500">{row.address}</div>
                                            </td>
                                            <td className="px-4 py-4 space-y-1 bg-slate-50/30">
                                                <div><span className="text-slate-400">SĐT:</span> <span className="font-bold">{row.phone}</span></div>
                                                <div><span className="text-slate-400">Email:</span> {row.email || '---'}</div>
                                            </td>
                                            <td className="px-4 py-4 bg-slate-50/30">
                                                <div className="flex flex-wrap gap-1">
                                                    {(row.careMethods || []).map((m, idx) => (
                                                        <span key={idx} className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-medium">{m}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 bg-slate-50/30">
                                                <span className="px-2 py-1 rounded bg-slate-100 border text-[11px] font-semibold">{row.label || 'Lạnh'}</span>
                                            </td>
                                            <td className="px-4 py-4 bg-slate-50/30">
                                                <div className="font-medium text-slate-900">{row.products}</div>
                                                <div className="text-[10px] text-slate-400">Ngày: {row.historyDate}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <ExpandableInput
                                                    value={currentState.issue ?? row.issue ?? ''}
                                                    onChange={(val) => handleInputChange(row.historyId, 'issue', val)}
                                                    placeholder="Nội dung chăm sóc..."
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <ExpandableInput
                                                    value={currentState.behaviorMetric ?? row.behaviorMetric ?? ''}
                                                    onChange={(val) => handleInputChange(row.historyId, 'behaviorMetric', val)}
                                                    placeholder="Hành vi đo lường..."
                                                />
                                            </td>
                                            <td className="px-4 py-4 bg-slate-50/30">
                                                <div className="px-2 py-1 bg-emerald-50 rounded border border-emerald-200 text-center font-medium">
                                                    {row.careStaff || '-- Chưa gán --'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => handleInputChange(row.historyId, 'isCared', e.target.checked)}
                                                    className="w-4 h-4 text-indigo-600 rounded"
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-center sticky right-0 bg-white">
                                                <button
                                                    type="button"
                                                    disabled={!careStates[row.historyId]}
                                                    onClick={() => handleSaveRow(row.id, row.historyId, row)}
                                                    className={`px-2 py-1 rounded text-[10px] font-bold border ${careStates[row.historyId] ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                                                >
                                                    <Save className="w-3 h-3 inline" /> Lưu
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={10} className="py-12 text-center text-slate-400 italic">Không tìm thấy khách hàng nào.</td>
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