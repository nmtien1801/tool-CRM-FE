import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Clapperboard, Loader2, Lock, Search } from 'lucide-react';
import ApiEcosystem from '../api/ApiEcosystem';
import { useAuth } from '../context/AuthContext';

function EmployeeColumn({ title, ecosystem, icon: Icon, employees, onChange }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return employees.filter((employee) =>
      !keyword ||
      employee.fullName?.toLowerCase().includes(keyword) ||
      employee.userName?.toLowerCase().includes(keyword) ||
      employee.email?.toLowerCase().includes(keyword)
    );
  }, [employees, search]);
  const selectedCount = employees.filter((employee) => employee[ecosystem]).length;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Icon className="w-5 h-5 text-indigo-600" />{title}
          </h2>
          <span className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-100 rounded-full">{selectedCount}</span>
        </div>
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Tìm nhân viên ${title}`}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div className="p-3 space-y-2 max-h-[620px] overflow-y-auto">
        {filtered.map((employee) => (
          <label key={employee.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer ${employee[ecosystem] ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
            <input
              type="checkbox"
              checked={Boolean(employee[ecosystem])}
              onChange={(event) => onChange(employee.id, ecosystem, event.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900 truncate">{employee.fullName || employee.userName}</span>
              <span className="block text-[11px] text-slate-500 truncate">{employee.email}</span>
            </span>
          </label>
        ))}
        {!filtered.length && <p className="py-10 text-center text-xs text-slate-400">Không có nhân viên phù hợp.</p>}
      </div>
    </section>
  );
}

export default function EcosystemPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ApiEcosystem.getEcosystemEmployees();
      if (response?.EC !== 0) throw new Error(response?.EM || 'Không thể tải nhân viên.');
      setEmployees(Array.isArray(response.DT) ? response.DT : []);
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải nhân viên.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') loadEmployees();
  }, [user]);

  const handleChange = async (id, ecosystem, assigned) => {
    setEmployees((current) => current.map((employee) => employee.id === id ? { ...employee, [ecosystem]: assigned } : employee));
    try {
      const response = await ApiEcosystem.setEcosystemEmployee(id, ecosystem, assigned);
      if (response?.EC !== 0) throw new Error(response?.EM || 'Không thể lưu phân công.');
    } catch (saveError) {
      setEmployees((current) => current.map((employee) => employee.id === id ? { ...employee, [ecosystem]: !assigned } : employee));
      setError(saveError.message || 'Không thể lưu phân công.');
    }
  };

  if (!user || user.role !== 'Admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
        <Lock className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="font-bold text-slate-900">Chỉ Admin mới được truy cập</h1>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-6">
      <div className="w-full">
        <header className="mb-5">
          <h1 className="text-xl font-bold text-slate-900">Chọn nhân viên quản lý hệ sinh thái</h1>
        </header>
        {error && <div className="mb-4 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">{error}</div>}
        {loading ? (
          <div className="py-20 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Đang tải nhân viên...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <EmployeeColumn title="CMIC Media" ecosystem="cmicMedia" icon={Clapperboard} employees={employees} onChange={handleChange} />
            <EmployeeColumn title="CMIC Studio" ecosystem="cmicStudio" icon={Building2} employees={employees} onChange={handleChange} />
          </div>
        )}
      </div>
    </main>
  );
}
