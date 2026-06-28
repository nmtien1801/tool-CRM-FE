import React, { useState } from 'react';
import { Save, Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExpandableInput from '../components/ExpandableInput';
import { INITIAL_CUSTOMERS, LABELS, STAFF_OPTIONS } from './CRM';
import { getBirthdayCustomers } from './ThongBao';

export default function ChamSocKhachHangPage() {
    const navigate = useNavigate();

    // Số lượng sinh nhật hôm nay – tính 1 lần khi render
    const birthdayCount = getBirthdayCustomers(INITIAL_CUSTOMERS).length;

    const [customersData, setCustomersData] = useState(INITIAL_CUSTOMERS);
    const [careStates, setCareStates] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLabel, setFilterLabel] = useState('');
    const [filterCareStatus, setFilterCareStatus] = useState('all');
    const [filterStaff, setFilterStaff] = useState('');

    const handleInputChange = (historyId, field, value) => {
        setCareStates(prev => ({
            ...prev,
            [historyId]: { ...prev[historyId], [field]: value }
        }));
    };

    const handleSaveRow = (customerId, historyId) => {
        const rowData = careStates[historyId];
        if (rowData) {
            setCustomersData(prevList =>
                prevList.map(cust => {
                    if (cust.id === customerId) {
                        const updatedHistories = (cust.purchaseHistories || []).map(hist => {
                            if (hist.id === historyId) {
                                return {
                                    ...hist,
                                    issue: rowData.careContent !== undefined ? rowData.careContent : hist.issue,
                                    behaviorMetric: rowData.behaviorMetric !== undefined ? rowData.behaviorMetric : hist.behaviorMetric,
                                    isCared: rowData.isCared ?? hist.isCared ?? false
                                };
                            }
                            return hist;
                        });
                        return {
                            ...cust,
                            isCared: rowData.isCared ?? cust.isCared ?? false,
                            purchaseHistories: updatedHistories
                        };
                    }
                    return cust;
                })
            );
            setCareStates(prev => {
                const updated = { ...prev };
                delete updated[historyId];
                return updated;
            });
            alert('Đã cập nhật thông tin chăm sóc cho đơn hàng thành công!');
        }
    };

    const allRowItems = [];
    customersData.forEach(customer => {
        const histories = customer.purchaseHistories || [];
        if (histories.length > 0) {
            histories.forEach(history => {
                allRowItems.push({
                    ...customer,
                    historyId: history.id,
                    historyDate: history.date,
                    products: history.products,
                    invoiceLink: history.invoiceLink,
                    careMethods: history.careMethods || [],
                    promotions: history.promotions || [],
                    consultant: history.consultant,
                    careStaff: history.careStaff,
                    issue: history.issue,
                    behaviorMetric: history.behaviorMetric || '',
                    isCared: history.isCared || false
                });
            });
        } else {
            allRowItems.push({
                ...customer,
                historyId: `empty-${customer.id}`,
                historyDate: '---',
                products: '---',
                careMethods: [],
                careStaff: '',
                issue: '',
                behaviorMetric: '',
                isCared: false
            });
        }
    });

    const filteredRows = allRowItems.filter(row => {
        const careMethods = row.careMethods || [];
        const showPhone = careMethods.some(m => ['Zalo OA', 'SMS', 'Telesale'].includes(m));
        const showEmail = careMethods.includes('Email Marketing');
        const matchesSearch =
            row.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (showPhone && row.phone && row.phone.includes(searchTerm)) ||
            (showEmail && row.email && row.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesLabel = filterLabel === '' || row.label === filterLabel;
        const currentState = careStates[row.historyId] || {};
        const isCaredNow = currentState.isCared ?? row.isCared;
        let matchesCareStatus = true;
        if (filterCareStatus === 'cared') matchesCareStatus = isCaredNow === true;
        if (filterCareStatus === 'not_cared') matchesCareStatus = isCaredNow === false;
        const matchesStaff = filterStaff === '' || row.careStaff === filterStaff;
        return matchesSearch && matchesLabel && matchesCareStatus && matchesStaff;
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tìm kiếm thông tin</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Họ và tên, SĐT hoặc Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-indigo-500"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Giai đoạn khách hàng</label>
                    <select
                        value={filterLabel}
                        onChange={(e) => setFilterLabel(e.target.value)}
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
                        onChange={(e) => setFilterStaff(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
                    >
                        <option value="">Tất cả nhân viên</option>
                        {STAFF_OPTIONS.map(staff => (
                            <option key={staff.value} value={staff.value}>{staff.label}</option>
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
            </div>

            {/* Bảng dữ liệu */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
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
                                const careContent = currentState.careContent ?? '';
                                const behaviorMetric = currentState.behaviorMetric ?? '';

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
                                                onChange={(newValue) => handleInputChange(row.historyId, 'careContent', newValue)}
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
                                                {STAFF_OPTIONS.find(s => s.value === row.careStaff)?.label || <span className="text-slate-400 italic">-- Chưa gán --</span>}
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
                                                onClick={() => handleSaveRow(row.id, row.historyId)}
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
        </div>
    );
}