import React, { useState, useEffect } from 'react';
import {
  UserPlus, Shield, Trash2, Key, Search, X,
  AlertTriangle, Loader2, Lock, Eye, EyeOff
} from 'lucide-react';
import ApiAuth from '../api/ApiAuth';
import SearchableSelect from '../components/SearchableSelect';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // States quản lý Form Thêm mới
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [newUser, setNewUser] = useState({ userName: '', fullName: '', role: 'Staff', email: '', password: '' });
  const [addError, setAddError] = useState('');

  // States quản lý Modal Reset / Đổi mật khẩu
  const [resetModal, setResetModal] = useState({ isOpen: false, userId: null, userName: '', newPassword: '' });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState('');

  // States quản lý Popup xác nhận Xóa
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null, userName: '' });
  const [deleteError, setDeleteError] = useState('');

  // --- 1. CALL API: LẤY DANH SÁCH USER ---
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setTableError('');
      const response = await ApiAuth.getListUser();
      const result = response?.DT || response;
      const userList = result?.user || [];
      setUsers(userList);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách user:", error);
      setTableError("Không thể tải danh sách thành viên. Vui lòng tải lại trang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      fetchUsers();
    }
  }, [user]);

  // --- 2. CALL API: THÊM MỚI THÀNH VIÊN ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddError('');

    if (!newUser.userName || !newUser.fullName || !newUser.email || !newUser.password) {
      setAddError("Vui lòng điền đầy đủ tên đăng nhập, họ tên, email và mật khẩu.");
      return;
    }

    try {
      const payload = {
        userName: newUser.userName.trim(),
        fullName: newUser.fullName.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        password: newUser.password
      };

      const response = await ApiAuth.createUser(payload);

      if (response && response.EC === 0) {
        setNewUser({ userName: '', fullName: '', role: 'Staff', email: '', password: '' });
        setShowAddPassword(false);
        setAddError('');
        setIsAddOpen(false);
        fetchUsers();
      } else {
        setAddError(response?.EM || "Không thể tạo tài khoản");
      }
    } catch (error) {
      console.error("Lỗi khi thêm user:", error);
      setAddError("Đã xảy ra lỗi hệ thống khi tạo thành viên mới.");
    }
  };

  // --- 3. CALL API: THỰC THI XÓA USER ---
  const handleExecuteDelete = async () => {
    const { userId } = deleteModal;
    setDeleteError('');
    try {
      const response = await ApiAuth.deleteUser(userId);
      if (response && response.EC === 0) {
        setDeleteModal({ isOpen: false, userId: null, userName: '' });
        fetchUsers();
      } else {
        setDeleteError(response?.EM || "Không thể xóa tài khoản");
      }
    } catch (error) {
      console.error("Lỗi hệ thống khi xóa user:", error);
      setDeleteError("Hệ thống gặp sự cố, vui lòng thử lại sau.");
    }
  };

  // --- 4. CALL API: THỰC THI ĐỔI / RESET MẬT KHẨU ---
  const handleExecuteResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    const { userId, newPassword } = resetModal;

    if (!newPassword || newPassword.trim().length < 6) {
      setResetError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }

    try {
      const response = await ApiAuth.resetPassword({
        id: userId,
        password: newPassword.trim()
      });

      if (response && response.EC === 0) {
        setResetModal({ isOpen: false, userId: null, userName: '', newPassword: '' });
        setShowResetPassword(false);
        setResetError('');
      } else {
        setResetError(response?.EM || "Không thể đổi mật khẩu");
      }
    } catch (error) {
      console.error("Lỗi hệ thống khi đổi mật khẩu:", error);
      setResetError("Hệ thống gặp sự cố, vui lòng thử lại sau.");
    }
  };

  const canResetPassword = (currentUser, targetUser) => {
    if (!currentUser || !targetUser) return false;

    // Admin đổi được cho Manager và Staff (và tài khoản của chính mình)
    if (currentUser.role === 'Admin') {
      return targetUser.role === 'Manager' || targetUser.role === 'Staff' || currentUser.id === targetUser.id;
    }

    // Manager chỉ đổi được cho Staff
    if (currentUser.role === 'Manager') {
      return targetUser.role === 'Staff';
    }

    return false;
  };

  const filteredUsers = users.filter(item => {
    const search = searchTerm.trim().toLowerCase();
    const name = (item.fullName || '').toLowerCase();
    const email = (item.email || '').toLowerCase();
    const username = (item.userName || item.username || '').toLowerCase();

    const matchesSearch = name.includes(search) || email.includes(search) || username.includes(search);
    const matchesRole = filterRole === '' || item.role === filterRole;

    return matchesSearch && matchesRole;
  });

  if (!user || user.role === 'Staff') {
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
            onClick={() => {
              setAddError('');
              setIsAddOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> Thêm thành viên
          </button>
        </div>
      </div>

      {/* Khu vực Bộ lọc */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo tên đăng nhập, tên, email thành viên..."
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
              { value: 'Manager', label: 'Manager' },
              { value: 'Staff', label: 'Staff' }
            ]}
            value={filterRole}
            placeholder="Tất cả vai trò"
            onChange={(value) => setFilterRole(value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Thông báo lỗi khi tải bảng (nếu có) */}
      {tableError && (
        <p className="text-xs text-rose-500 font-medium px-1">{tableError}</p>
      )}

      {/* Bảng Danh sách Tài khoản */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Tên đăng nhập</th>
                <th className="px-6 py-3.5">Họ và Tên / Email</th>
                <th className="px-6 py-3.5">Vai trò (Role)</th>
                <th className="px-6 py-3.5 text-center w-48">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 font-medium bg-slate-50/20">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      Đang tải danh sách thành viên...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Cột Tên đăng nhập mới */}
                    <td className="px-6 py-4">
                      <span className="font-mono font-semibold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-xs">
                        {item.userName || item.username || '—'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{item.fullName}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{item.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${item.role === 'Admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : item.role === 'Staff'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                        {item.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {canResetPassword(user, item) && (
                          <button
                            type="button"
                            onClick={() => {
                              setResetError('');
                              setResetModal({ isOpen: true, userId: item.id, userName: item.fullName, newPassword: '' });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-medium hover:bg-amber-100 transition-colors cursor-pointer"
                            title="Cấp lại mật khẩu mới"
                          >
                            <Key className="w-3 h-3" /> Đổi mật khẩu
                          </button>
                        )}

                        {canResetPassword(user, item) && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError('');
                              setDeleteModal({ isOpen: true, userId: item.id, userName: item.fullName });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-medium hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Xóa tài khoản khỏi hệ thống"
                          >
                            <Trash2 className="w-3 h-3" /> Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400 italic bg-slate-50/20">
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
          <form
            onSubmit={handleAddUser}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-visible flex flex-col animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h4 className="text-sm font-bold text-slate-800">Thêm thành viên mới</h4>
              <button
                type="button"
                onClick={() => {
                  setAddError('');
                  setIsAddOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên đăng nhập *</label>
                <input
                  required
                  type="text"
                  placeholder="Nhập username (viết liền, không dấu)..."
                  value={newUser.userName}
                  onChange={e => {
                    setAddError('');
                    setNewUser({ ...newUser, userName: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Họ và Tên *</label>
                <input
                  required
                  type="text"
                  placeholder="Nhập họ và tên..."
                  value={newUser.fullName}
                  onChange={e => {
                    setAddError('');
                    setNewUser({ ...newUser, fullName: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ Email *</label>
                <input
                  required
                  type="email"
                  placeholder="example@gmail.com"
                  value={newUser.email}
                  onChange={e => {
                    setAddError('');
                    setNewUser({ ...newUser, email: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mật khẩu *</label>
                <div className="relative">
                  <input
                    required
                    type={showAddPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
                    value={newUser.password}
                    onChange={e => {
                      setAddError('');
                      setNewUser({ ...newUser, password: e.target.value });
                    }}
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Ô chọn Vai trò */}
              <div className="relative z-10">
                <label className="block text-xs font-bold text-slate-600 mb-1">Vai trò</label>
                <SearchableSelect
                  options={[
                    { value: 'Staff', label: 'Staff' },
                    { value: 'Manager', label: 'Manager' },
                    { value: 'Admin', label: 'Admin' }
                  ]}
                  value={newUser.role}
                  placeholder="Chọn vai trò"
                  onChange={(value) => setNewUser({ ...newUser, role: value })}
                  className="w-full"
                />
              </div>

              {addError && (
                <p className="text-xs text-rose-500 font-medium">{addError}</p>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-150 flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  setAddError('');
                  setIsAddOpen(false);
                }}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer"
              >
                Tạo tài khoản
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP 2: MODAL ĐỔI / RESET MẬT KHẨU MỚI */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleExecuteResetPassword} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl shrink-0 bg-amber-50 text-amber-600">
                <Key className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900">Đổi mật khẩu tài khoản</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Cập nhật mật khẩu mới cho tài khoản: <span className="font-bold text-slate-800">"{resetModal.userName}"</span>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Mật khẩu mới</label>
              <div className="relative">
                <input
                  required
                  autoFocus
                  type={showResetPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới..."
                  value={resetModal.newPassword}
                  onChange={(e) => {
                    setResetError('');
                    setResetModal({ ...resetModal, newPassword: e.target.value });
                  }}
                  className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {resetError && (
                <p className="text-xs text-rose-500 font-medium mt-1.5">{resetError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setResetError('');
                  setResetModal({ isOpen: false, userId: null, userName: '', newPassword: '' });
                }}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-white rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 cursor-pointer"
              >
                Lưu mật khẩu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP 3: XÁC NHẬN XÓA TÀI KHOẢN */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl shrink-0 bg-rose-50 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Xác nhận xóa tài khoản</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Bạn có chắc chắn muốn <span className="font-bold text-rose-600">XÓA HOÀN TOÀN</span> tài khoản <span className="font-bold text-slate-800">"{deleteModal.userName}"</span>? Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>

            {deleteError && (
              <p className="text-xs text-rose-500 font-medium">{deleteError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteError('');
                  setDeleteModal({ isOpen: false, userId: null, userName: '' });
                }}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-1.5 text-white rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}