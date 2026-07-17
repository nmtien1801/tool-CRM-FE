import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Trash2, Key, Search, X, AlertTriangle, Loader2, Lock } from 'lucide-react';
import ApiAuth from '../api/ApiAuth';
import SearchableSelect from '../components/SearchableSelect';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // States quản lý Form Thêm mới
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', role: 'Staff', email: '' });

  // States quản lý Popup xác nhận Xóa / Reset mật khẩu
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', userId: null, userName: '' });

  // --- 1. CALL API: LẤY DANH SÁCH USER ---
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await ApiAuth.getListUser();
      const result = response?.DT || response;
      const userList = result?.user || [];
      setUsers(userList);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách user:", error);
      alert("Không thể tải danh sách thành viên!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ kích hoạt call API nếu user hiện tại đăng nhập có quyền Admin
    if (user?.role === 'Admin') {
      fetchUsers();
    }
  }, [user]);

  // --- 2. CALL API: THÊM MỚI THÀNH VIÊN ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.email) return;

    try {
      const generatedUserName = newUser.email.split('@')[0];

      const payload = {
        userName: generatedUserName,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        password: "123456"
      };

      const response = await ApiAuth.createUser(payload);

      if (response && response.EC === 0) {
        alert('Thêm thành viên mới thành công! Mật khẩu mặc định là: 123456');
        setNewUser({ fullName: '', role: 'Staff', email: '' });
        setIsAddOpen(false);
        fetchUsers();
      } else {
        alert(`Lỗi: ${response?.EM || "Không thể tạo tài khoản"}`);
      }
    } catch (error) {
      console.error("Lỗi khi thêm user:", error);
      alert("Đã xảy ra lỗi hệ thống khi tạo thành viên mới.");
    }
  };

  const openConfirmModal = (type, userId, userName) => {
    setConfirmModal({ isOpen: true, type, userId, userName });
  };

  // --- 3 & 4. CALL API: THỰC THI XÓA / ĐỔI MẬT KHẨU ---
  const executeAction = async () => {
    const { type, userId, userName } = confirmModal;

    try {
      if (type === 'delete') {
        const response = await ApiAuth.deleteUser(userId);
        if (response && response.EC === 0) {
          alert(`Đã xóa thành công tài khoản của: ${userName}`);
          fetchUsers();
        } else {
          alert(`Lỗi: ${response?.EM || "Không thể xóa tài khoản"}`);
        }
      } else if (type === 'reset') {
        const response = await ApiAuth.resetPassword({
          id: userId,
          password: "123456"
        });

        if (response && response.EC === 0) {
          alert(`Đã reset mật khẩu cho ${userName} thành công. Mật khẩu mới là: 123456`);
        } else {
          alert(`Lỗi: ${response?.EM || "Không thể đổi mật khẩu"}`);
        }
      }
    } catch (error) {
      console.error(`Lỗi hệ thống khi thực hiện hành động ${type}:`, error);
      alert("Hệ thống gặp sự cố, vui lòng thử lại sau.");
    } finally {
      setConfirmModal({ isOpen: false, type: '', userId: null, userName: '' });
    }
  };

  const filteredUsers = users.filter(user => {
    const search = searchTerm.trim().toLowerCase();
    const name = (user.fullName || '').toLowerCase();
    const email = (user.email || '').toLowerCase();

    const matchesSearch = name.includes(search) || email.includes(search);
    const matchesRole = filterRole === '' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // ==================== LOGIC PHÂN QUYỀN TRUY CẬP ====================
  // Nếu thông tin user chưa load xong hoặc role không phải Admin, chặn hiển thị
  if (!user || user.role !== 'Admin') {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shadow-xs mb-4">
          <Lock className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Truy cập bị từ chối</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm leading-relaxed">
          Tài khoản của bạn không có quyền quản trị hệ thống. Vui lòng liên hệ với cấp trên nếu đây là một sự nhầm lẫn.
        </p>
      </div>
    );
  }

  // Nếu là Admin, render toàn bộ bảng danh sách quản trị bên dưới
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

        <div className="w-full sm:w-48">
          <SearchableSelect
            options={[
              { value: '', label: 'Tất cả vai trò' },
              { value: 'Admin', label: 'Admin' },
              { value: 'Staff', label: 'Staff' }
            ]}
            value={filterRole}
            placeholder="Tất cả vai trò"
            onChange={(value) => setFilterRole(value)}
            className="w-full"
          />
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
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-slate-400 font-medium bg-slate-50/20">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      Đang tải danh sách thành viên...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{user.fullName}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{user.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${user.role === 'Admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : user.role === 'Staff'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                        {user.role}
                      </span>
                    </td>

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
                <SearchableSelect
                  options={[
                    { value: 'Staff', label: 'Staff' },
                    { value: 'Admin', label: 'Admin' }
                  ]}
                  value={newUser.role}
                  placeholder="Chọn vai trò"
                  onChange={(value) => setNewUser({ ...newUser, role: value })}
                  className="w-full"
                />
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