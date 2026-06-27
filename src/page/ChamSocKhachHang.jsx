import React, { useState } from 'react';
import { Save, Search } from 'lucide-react';
// Import dữ liệu từ file CRM.js cùng thư mục
import { INITIAL_CUSTOMERS, LABELS, STAFF_OPTIONS, CONTENT_SUGGESTIONS } from './CRM';

export default function ChamSocKhachHangPage() {
    // Quản lý danh sách khách hàng trực tiếp tại Page này
    const [customersData, setCustomersData] = useState(INITIAL_CUSTOMERS);

    // Quản lý trạng thái chỉnh sửa tạm thời của các ô nhập liệu theo từng dòng (Inline Editing)
    const [careStates, setCareStates] = useState({});

    // States quản lý bộ lọc dữ liệu (Search & Filter)
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLabel, setFilterLabel] = useState('');
    const [filterCareStatus, setFilterCareStatus] = useState('all'); // all, cared, not_cared

    // Hàm xử lý khi thay đổi dữ liệu (checkbox, input, select) trên từng dòng
    const handleInputChange = (customerId, field, value) => {
        setCareStates(prev => ({
            ...prev,
            [customerId]: {
                ...prev[customerId],
                [field]: value
            }
        }));
    };

    // Hàm lưu thông tin: Cập nhật trực tiếp vào State của Page
    const handleSaveRow = (customerId) => {
        const rowData = careStates[customerId];
        if (rowData) {
            setCustomersData(prevList =>
                prevList.map(cust => {
                    if (cust.id === customerId) {
                        const currentHistories = cust.purchaseHistories || [];

                        const newHistoryItem = {
                            id: `${customerId}-${Date.now()}`,
                            date: new Date().toISOString().split('T')[0],
                            careMethods: cust.careMethods || [],
                            careStaff: rowData.careStaff !== undefined ? rowData.careStaff : cust.careStaff,
                            issue: rowData.careContent || '',
                            behaviorMetric: rowData.behaviorMetric || '',
                            isCared: rowData.isCared ?? cust.isCared ?? false
                        };

                        return {
                            ...cust,
                            isCared: rowData.isCared ?? cust.isCared ?? false,
                            careStaff: rowData.careStaff || cust.careStaff,
                            purchaseHistories: [...currentHistories, newHistoryItem]
                        };
                    }
                    return cust;
                })
            );

            // Xóa trạng thái tạm thời của dòng đó sau khi đã lưu thành công
            setCareStates(prev => {
                const updated = { ...prev };
                delete updated[customerId];
                return updated;
            });

            alert('Đã lưu thông tin chăm sóc khách hàng thành công!');
        }
    };

    // --- LOGIC LỌC TÌM KIẾM DỮ LIỆU ---
    const filteredCustomers = customersData.filter(customer => {
        const latestHistory = customer.purchaseHistories?.[customer.purchaseHistories.length - 1] || {};
        const careMethods = latestHistory.careMethods || customer.careMethods || [];
        const showPhone = careMethods.some(m => ['Zalo OA', 'SMS', 'Telesale'].includes(m));
        const showEmail = careMethods.includes('Email Marketing');

        // Tìm kiếm đồng thời theo Họ tên, SĐT (nếu hiện), Email (nếu hiện)
        const matchesSearch =
            customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (showPhone && customer.phone && customer.phone.includes(searchTerm)) ||
            (showEmail && customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesLabel = filterLabel === '' || customer.label === filterLabel;

        const currentState = careStates[customer.id] || {};
        const isCaredNow = currentState.isCared ?? customer.isCared ?? false;

        let matchesCareStatus = true;
        if (filterCareStatus === 'cared') matchesCareStatus = isCaredNow === true;
        if (filterCareStatus === 'not_cared') matchesCareStatus = isCaredNow === false;

        return matchesSearch && matchesLabel && matchesCareStatus;
    });

    return (
        <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">

            {/* Tiêu đề Trang */}
            <div>
                <h3 className="text-xl font-bold text-slate-900">
                    Quản lý Chăm sóc Khách hàng
                </h3>
                <p className="text-sm text-slate-900 mt-1">
                    Nhân viên:
                </p>
            </div>

            {/* Bộ lọc Tìm kiếm nâng cao */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tìm kiếm thông tin</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Nhập Họ và tên, SĐT hoặc Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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

            {/* Bảng hiển thị dữ liệu */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-100/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            <th className="px-4 py-3 text-center w-24">Trạng thái CS</th>
                            <th className="px-4 py-3 min-w-[240px]">Thông tin cơ bản</th>
                            <th className="px-4 py-3 min-w-[240px]">Kênh liên hệ</th>
                            <th className="px-4 py-3 min-w-[140px]">Giai đoạn khách hàng</th>
                            <th className="px-4 py-3 min-w-[180px]">Sản phẩm - Dịch vụ đã mua/tư vấn</th>
                            <th className="px-4 py-3 min-w-[220px]">Nội dung đã chăm sóc</th>
                            <th className="px-4 py-3 min-w-[200px]">Hành vi có thể đo lường</th>
                            <th className="px-4 py-3 min-w-[160px]">Nhân viên CSKH</th>
                            <th className="px-4 py-3 text-center w-20 sticky right-0 bg-slate-100">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => {
                                // Lấy thông tin lịch sử gần nhất (nếu cần dùng cho người phụ trách)
                                const latestHistory = customer.purchaseHistories?.[customer.purchaseHistories.length - 1] || {};

                                const currentLabel = LABELS.find(l => l.value === customer.label) || {
                                    label: customer.label || 'Lạnh',
                                    color: 'bg-gray-100 text-gray-700 border-gray-300'
                                };

                                const currentState = careStates[customer.id] || {};
                                const isChecked = currentState.isCared ?? customer.isCared ?? false;
                                const careContent = currentState.careContent ?? '';
                                const behaviorMetric = currentState.behaviorMetric ?? '';

                                // Gộp toán tử an toàn với oxc compiler
                                const assignedStaff = (currentState.careStaff || customer.careStaff || latestHistory.careStaff) || '';

                                return (
                                    <tr key={customer.id} className="hover:bg-slate-50/60 transition-colors">

                                        {/* 1. Trạng thái CS */}
                                        <td className="px-4 py-4 text-center">
                                            <label className="flex flex-col items-center justify-center gap-1 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => handleInputChange(customer.id, 'isCared', e.target.checked)}
                                                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded-sm focus:ring-indigo-500"
                                                />
                                                <span className={`text-[10px] font-semibold uppercase ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {isChecked ? 'Đã CS' : 'Chưa CS'}
                                                </span>
                                            </label>
                                        </td>

                                        {/* 2. Thông tin cơ bản */}
                                        <td className="px-4 py-4 space-y-1">
                                            <div className="text-sm font-bold text-slate-900">{customer.fullName}</div>
                                            <div className="text-slate-600">
                                                <span className="text-slate-400">Ngày sinh:</span> {customer.birthday ? new Date(customer.birthday).toLocaleDateString('vi-VN') : '---'}
                                            </div>
                                            {customer.address && (
                                                <div className="text-slate-600">
                                                    <span className="text-slate-400">Địa chỉ:</span> {customer.address}
                                                </div>
                                            )}
                                        </td>

                                        {/* 3. Kênh liên hệ - HIỂN THỊ THẲNG DATA TỪ FILE CRM.JS */}
                                        <td className="px-4 py-4 space-y-1 text-slate-700">
                                            <div>
                                                <span className="text-slate-400 font-medium">SĐT:</span>{' '}
                                                <span className="font-bold text-slate-900">{customer.phone || '---'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-medium">Email:</span>{' '}
                                                <span className="font-medium text-slate-900">{customer.email || '---'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-medium">Facebook:</span>{' '}
                                                {customer.facebook ? (
                                                    <a href={customer.facebook} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                                                        {customer.facebook}
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 italic">---</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* 4. Giai đoạn khách hàng */}
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${currentLabel.color}`}>
                                                {currentLabel.label}
                                            </span>
                                        </td>

                                        {/* 5. Sản phẩm - Dịch vụ đã mua/tư vấn */}
                                        <td className="px-4 py-4 text-slate-700 max-w-[200px] truncate" title={customer.products}>
                                            {customer.products || '---'}
                                        </td>

                                        {/* 6. Nội dung đã chăm sóc */}
                                        <td className="px-4 py-4">
                                            <input
                                                type="text"
                                                list={`hints-${customer.id}`}
                                                value={careContent}
                                                onChange={(e) => handleInputChange(customer.id, 'careContent', e.target.value)}
                                                placeholder="Chuỗi email GĐ1, tư vấn 1:1..."
                                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-hidden focus:border-indigo-500"
                                            />
                                            <datalist id={`hints-${customer.id}`}>
                                                {CONTENT_SUGGESTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.label} />
                                                ))}
                                            </datalist>
                                        </td>

                                        {/* 7. Hành vi có thể đo lường */}
                                        <td className="px-4 py-4">
                                            <input
                                                type="text"
                                                value={behaviorMetric}
                                                onChange={(e) => handleInputChange(customer.id, 'behaviorMetric', e.target.value)}
                                                placeholder="Mở 10/20 mail, yêu cầu..."
                                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-hidden focus:border-indigo-500"
                                            />
                                        </td>

                                        {/* 8. Nhân viên CSKH */}
                                        <td className="px-4 py-4">
                                            <select
                                                value={assignedStaff}
                                                onChange={(e) => handleInputChange(customer.id, 'careStaff', e.target.value)}
                                                className="w-full px-1.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500"
                                            >
                                                <option value="">-- Chọn --</option>
                                                {STAFF_OPTIONS.map((staff) => (
                                                    <option key={staff.value} value={staff.value}>
                                                        {staff.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        {/* 9. Nút Thao tác lưu (Sticky cố định) */}
                                        <td className="px-4 py-4 text-center sticky right-0 bg-white shadow-[-4px_0_12px_rgba(0,0,0,0.05)]">
                                            <button
                                                type="button"
                                                disabled={!careStates[customer.id]}
                                                onClick={() => handleSaveRow(customer.id)}
                                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold border transition-all ${careStates[customer.id]
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
                                    Không tìm thấy kết quả khách hàng phù hợp với điều kiện tìm kiếm/lọc.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}