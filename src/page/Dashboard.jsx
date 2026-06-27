import React, { useState } from 'react';
import { UserPlus, Shield, Trash2, Key, Search, X, AlertTriangle } from 'lucide-react';
import { INITIAL_USERS } from './Auth';

export default function DashboardPage() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState(''); // State quản lý bộ lọc vai trò

  // States quản lý Form Thêm mới
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', role: 'CSKH Staff', email: '' });

  // States quản lý Popup xác nhận Xóa / Reset mật khẩu
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', userId: null, userName: '' });

  // Xử lý Thêm mới thành viên
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.email) return;

    const userAdded = {
      id: Date.now(),
      ...newUser
    };

    setUsers([...users, userAdded]);
    setNewUser({ fullName: '', role: 'CSKH Staff', email: '' });
    setIsAddOpen(false);
    alert('Thêm thành viên mới thành công!');
  };

  // Mở popup xác nhận hành động
  const openConfirmModal = (type, userId, userName) => {
    setConfirmModal({ isOpen: true, type, userId, userName });
  };

  // Thực thi hành động sau khi bấm xác nhận ở Popup
  const executeAction = () => {
    const { type, userId, userName } = confirmModal;

    if (type === 'delete') {
      setUsers(users.filter(u => u.id !== userId));
      alert(`Đã xóa tài khoản của: ${userName}`);
    } else if (type === 'reset') {
      alert(`Đã gửi yêu cầu cấp lại mật khẩu cho ${userName}. Mật khẩu mới mặc định là: 123456a@`);
    }

    setConfirmModal({ isOpen: false, type: null, userId: null, userName: '' });
  };

  // --- LOGIC LỌC TÌM KIẾM NÂNG CAO ---
  const filteredUsers = users.filter(user => {
    const search = searchTerm.trim().toLowerCase();
    const name = (user.fullName || '').toLowerCase();
    const email = (user.email || '').toLowerCase();

    // 1. Kiểm tra điều kiện tìm kiếm theo tên/email
    const matchesSearch = name.includes(search) || email.includes(search);

    // 2. Kiểm tra điều kiện lọc theo vai trò
    const matchesRole = filterRole === '' || user.role === filterRole;

    // Kết hợp cả 2 điều kiện lọc
    return matchesSearch && matchesRole;
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 p-6 space-y-6 text-slate-800">

      {/* Thanh điều hướng / Tiêu đề chính */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" /> Hệ thống Quản trị Tài khoản
          </h2>
          <p className="text-xs text-slate-500 mt-1">Quản lý thành viên, phân quyền vai trò và bảo mật hệ thống.</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" /> Thêm thành viên
          </button>
        </div>
      </div>

      {/* Khu vực Bộ lọc: Tìm kiếm văn bản + Chọn vai trò */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Ô Tìm kiếm nhanh */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo tên, email thành viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Ô Chọn bộ lọc Vai trò */}
        <div className="w-full sm:w-48">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="">Tất cả vai trò</option>
            <option value="Administrator">Administrator</option>
            <option value="CSKH Staff">CSKH Staff</option>
            <option value="Operator">Operator</option>
          </select>
        </div>
      </div>

      {/* Bảng Danh sách Tài khoản */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Họ và Tên / Email</th>
                <th className="px-6 py-3.5">Vai trò (Role)</th>
                <th className="px-6 py-3.5 text-center w-48">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">

                    {/* Tên & Email */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{user.fullName}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{user.email}</div>
                    </td>

                    {/* Vai trò */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${user.role === 'Administrator'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : user.role === 'CSKH Staff'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Khối nút hành động yêu cầu */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openConfirmModal('reset', user.id, user.fullName)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-medium hover:bg-amber-100 transition-colors"
                          title="Cấp lại mật khẩu mới"
                        >
                          <Key className="w-3 h-3" /> Đổi mật khẩu
                        </button>
                        <button
                          type="button"
                          onClick={() => openConfirmModal('delete', user.id, user.fullName)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-medium hover:bg-rose-100 transition-colors"
                          title="Xóa tài khoản khỏi hệ thống"
                        >
                          <Trash2 className="w-3 h-3" /> Xóa
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-slate-400 italic bg-slate-50/20">
                    Không tìm thấy thành viên phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP 1: FORM THÊM MỚI THÀNH VIÊN */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleAddUser} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-800">Thêm thành viên mới</h4>
              <button type="button" onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Họ và Tên</label>
                <input required type="text" placeholder="Nhập họ và tên..." value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ Email</label>
                <input required type="email" placeholder="example@gmail.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Vai trò</label>
                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700">
                  <option value="CSKH Staff">CSKH Staff</option>
                  <option value="Operator">Operator</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-150 flex justify-end gap-2 bg-slate-50">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100">Hủy</button>
              <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">Tạo tài khoản</button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP 2: XÁC NHẬN HÀNH ĐỘNG */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${confirmModal.type === 'delete' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {confirmModal.type === 'delete' ? 'Xác nhận xóa tài khoản' : 'Xác nhận reset mật khẩu'}
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Bạn có chắc chắn muốn {confirmModal.type === 'delete' ? 'XÓA HOÀN TOÀN' : 'RESET LẠI MẬT KHẨU'} của tài khoản <span className="font-bold text-slate-800">"{confirmModal.userName}"</span>? Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setConfirmModal({ isOpen: false, type: '', userId: null, userName: '' })} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100">Hủy</button>
              <button
                type="button"
                onClick={executeAction}
                className={`px-4 py-1.5 text-white rounded-lg text-xs font-bold ${confirmModal.type === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}