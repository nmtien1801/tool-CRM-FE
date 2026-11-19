import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Loader2,
  Lock,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import ApiExpenses from "../api/ApiExpenses";
import { useAuth } from "../context/AuthContext";

const ECOSYSTEM_OPTIONS = [
  { value: "CMIC_STUDIO", label: "CMIC STUDIO" },
  { value: "CMIC_MEDIA", label: "CMIC MEDIA" },
];
const CATEGORY_OPTIONS = [
  "Nhân sự",
  "Sản phẩm",
  "Marketing",
  "Kế toán",
  "Vận chuyển",
  "Văn phòng",
  "Tài nguyên",
  "Hoàn tiền",
  "Đầu tư",
  "Khác",
];
const TYPE_OPTIONS = ["Cố định", "Biến đổi", "Phát sinh"];
const PAYMENT_OPTIONS = ["Chuyển khoản", "Tiền mặt"];
const STATUS_OPTIONS = ["Đang về", "Tồn kho", "Đã bán", "N/A"];

const EMPTY_FORM = {
  ecosystem: "",
  expenseName: "",
  category: "",
  sourceName: "",
  unitCost: "",
  quantity: "1",
  expenseType: "",
  payableAmount: "",
  paymentDate: "",
  paymentMethod: "",
  status: "N/A",
};

const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const dateLabel = (value) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN") : "—";

function ExpenseField({ label, children, className = "", action = null }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="block text-xs font-semibold text-slate-600">
          {label}
        </span>
        {action}
      </div>
      {children}
    </label>
  );
}

function SelectField({ value, onChange, options, placeholder, required = false }) {
  return (
    <select
      required={required}
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => {
        const item = typeof option === "string" ? { value: option, label: option } : option;
        return (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        );
      })}
    </select>
  );
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const formSectionRef = useRef(null);

  const loadExpenses = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      setError("");
      const response = await ApiExpenses.getExpenses();
      if (response?.EC !== 0) {
        throw new Error(response?.EM || "Không thể tải danh sách chi phí.");
      }
      setExpenses(Array.isArray(response.DT) ? response.DT : []);
    } catch (loadError) {
      setError(loadError.message || "Không thể tải danh sách chi phí.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadExpenses();
    }
  }, [isAdmin, loadExpenses]);

  const visibleExpenses = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return expenses.filter((item) => {
      const matchesSearch =
        !keyword ||
        [item.expenseName, item.sourceName, item.ecosystem].some((value) =>
          String(value || "").toLocaleLowerCase("vi").includes(keyword),
        );
      return (
        matchesSearch &&
        (!categoryFilter || item.category === categoryFilter) &&
        (!statusFilter || item.status === statusFilter)
      );
    });
  }, [expenses, search, categoryFilter, statusFilter]);

  if (!user || !isAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-600 shadow-xs">
          <Lock className="h-12 w-12 stroke-[1.5]" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Không có quyền truy cập</h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý chi phí chỉ dành cho Admin.</p>
      </main>
    );
  }

  const estimatedTotal = (Number(form.unitCost) || 0) * (Number(form.quantity) || 0);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
  };

  const openEdit = (expense) => {
    setEditingId(expense.id);
    setForm({
      ecosystem: expense.ecosystem || "",
      expenseName: expense.expenseName || "",
      category: expense.category || "",
      sourceName: expense.sourceName || "",
      unitCost: expense.unitCost ?? "",
      quantity: expense.quantity ?? "1",
      expenseType: expense.expenseType || "",
      payableAmount: expense.payableAmount ?? "",
      paymentDate: expense.paymentDate || "",
      paymentMethod: expense.paymentMethod || "",
      status: expense.status || "N/A",
    });
    setError("");
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payableVal = Number(form.payableAmount) || 0;
      const payload = {
        ...form,
        unitCost: Number(form.unitCost),
        quantity: Number(form.quantity),
        payableAmount: payableVal,
        isPayable: payableVal > 0,
      };
      const response = editingId
        ? await ApiExpenses.updateExpense(editingId, payload)
        : await ApiExpenses.createExpense(payload);
      if (response?.EC !== 0) {
        throw new Error(response?.EM || "Không thể lưu chi phí.");
      }
      resetForm();
      await loadExpenses();
    } catch (saveError) {
      setError(saveError.message || "Không thể lưu chi phí.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Xóa khoản chi "${expense.expenseName}"?`)) return;
    try {
      setError("");
      const response = await ApiExpenses.deleteExpense(expense.id);
      if (response?.EC !== 0) {
        throw new Error(response?.EM || "Không thể xóa chi phí.");
      }
      if (editingId === expense.id) {
        resetForm();
      }
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
    } catch (deleteError) {
      setError(deleteError.message || "Không thể xóa chi phí.");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Đóng thông báo">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* TOP: Form Thêm / Cập nhật khoản chi */}
        <section
          ref={formSectionRef}
          aria-labelledby="expense-form-title"
          className={`rounded-2xl border bg-white shadow-sm transition ${editingId ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200"
            }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div>
                <h1 id="expense-form-title" className="font-bold text-slate-900">
                  {editingId ? "Cập nhật khoản chi" : "Thêm khoản chi"}
                </h1>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ExpenseField label="Hệ sinh thái (HST) *">
                <SelectField
                  required
                  value={form.ecosystem}
                  onChange={(event) => setForm({ ...form, ecosystem: event.target.value })}
                  options={ECOSYSTEM_OPTIONS}
                  placeholder="Chọn hệ sinh thái"
                />
              </ExpenseField>

              <ExpenseField label="Tên chi phí *" className="lg:col-span-2">
                <input
                  required
                  maxLength={200}
                  value={form.expenseName}
                  onChange={(event) => setForm({ ...form, expenseName: event.target.value })}
                  placeholder="Ví dụ: Chi phí chạy quảng cáo"
                  className={inputClass}
                />
              </ExpenseField>

              <ExpenseField label="Hạng mục *">
                <SelectField
                  required
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  options={CATEGORY_OPTIONS}
                  placeholder="Chọn hạng mục"
                />
              </ExpenseField>

              <ExpenseField label="Nguồn hàng">
                <input
                  maxLength={200}
                  value={form.sourceName}
                  onChange={(event) => setForm({ ...form, sourceName: event.target.value })}
                  placeholder="Nhà cung cấp / nguồn hàng"
                  className={inputClass}
                />
              </ExpenseField>

              <ExpenseField label="Chi phí đơn (VNĐ) *">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitCost}
                  onChange={(event) => setForm({ ...form, unitCost: event.target.value })}
                  placeholder="0"
                  className={inputClass}
                />
              </ExpenseField>

              <ExpenseField label="Số lượng *">
                <input
                  required
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                  className={inputClass}
                />
              </ExpenseField>

              <ExpenseField label="Thể loại *">
                <SelectField
                  required
                  value={form.expenseType}
                  onChange={(event) => setForm({ ...form, expenseType: event.target.value })}
                  options={TYPE_OPTIONS}
                  placeholder="Chọn thể loại"
                />
              </ExpenseField>

              <ExpenseField label="Thanh toán *">
                <SelectField
                  required
                  value={form.paymentMethod}
                  onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}
                  options={PAYMENT_OPTIONS}
                  placeholder="Chọn hình thức thanh toán"
                />
              </ExpenseField>

              <ExpenseField label="Ngày trả tiền">
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(event) => setForm({ ...form, paymentDate: event.target.value })}
                  className={inputClass}
                />
              </ExpenseField>

              <ExpenseField label="Tình trạng *">
                <SelectField
                  required
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                  options={STATUS_OPTIONS}
                  placeholder="Chọn tình trạng"
                />
              </ExpenseField>

              <ExpenseField
                label="Công nợ phải trả (VNĐ)"
                action={
                  estimatedTotal > 0 && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, payableAmount: String(estimatedTotal) })}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      Nợ toàn bộ
                    </button>
                  )
                }
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.payableAmount}
                  onChange={(event) => setForm({ ...form, payableAmount: event.target.value })}
                  placeholder="0 (Không nợ)"
                  className={inputClass}
                />
              </ExpenseField>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-2.5">
                  <span className="text-xs font-semibold text-indigo-700">
                    Chi phí tổng dự kiến:
                  </span>
                  <span className="text-lg font-bold text-indigo-900 tabular-nums">
                    {money(estimatedTotal)}
                  </span>
                </div>

                {Number(form.payableAmount) > 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5">
                    <span className="text-xs font-semibold text-amber-700">
                      Còn nợ:
                    </span>
                    <span className="text-sm font-bold text-amber-900 tabular-nums">
                      {money(form.payableAmount)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  {editingId ? "Hủy" : "Làm mới"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Lưu thay đổi" : "Tạo khoản chi"}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* BOTTOM: Table Danh sách khoản chi */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="font-bold text-slate-900">Danh sách khoản chi</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm tên, nguồn hàng..."
                  className={`${inputClass} pl-9`}
                />
              </div>
              <SelectField
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                options={CATEGORY_OPTIONS}
                placeholder="Tất cả hạng mục"
              />
              <SelectField
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={STATUS_OPTIONS}
                placeholder="Tất cả tình trạng"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Đang tải chi phí...
            </div>
          ) : visibleExpenses.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
              <ArrowDownToLine className="mb-3 h-8 w-8 text-slate-300" />
              <p className="font-semibold text-slate-700">Chưa có khoản chi phù hợp</p>
              <p className="mt-1 text-sm text-slate-500">
                Thêm khoản chi mới ở biểu mẫu phía trên để bắt đầu theo dõi.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Tên chi phí</th>
                    <th className="px-4 py-3">Hạng mục</th>
                    <th className="px-4 py-3">Nguồn hàng</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3 text-right">SL</th>
                    <th className="px-4 py-3 text-right">Tổng chi</th>
                    <th className="px-4 py-3">Thể loại</th>
                    <th className="px-4 py-3">Thanh toán</th>
                    <th className="px-4 py-3">Tình trạng</th>
                    <th className="px-4 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleExpenses.map((expense) => {
                    const isEditingRow = editingId === expense.id;
                    const payableAmount = Number(expense.payableAmount) || 0;
                    return (
                      <tr
                        key={expense.id}
                        className={`transition ${isEditingRow ? "bg-indigo-50/60" : "hover:bg-slate-50/70"
                          }`}
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900">{expense.expenseName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {(expense.ecosystem || "").replace("_", " ")}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">{expense.category}</td>
                        <td className="px-4 py-3.5">{expense.sourceName || "—"}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          {money(expense.unitCost)}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{expense.quantity}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900 tabular-nums">
                          {money(expense.totalCost)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="block">{expense.expenseType}</span>
                          {payableAmount > 0 && (
                            <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 tabular-nums">
                              Nợ: {money(payableAmount)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span>{expense.paymentMethod}</span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {dateLabel(expense.paymentDate)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {expense.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(expense)}
                              aria-label={`Sửa ${expense.expenseName}`}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(expense)}
                              aria-label={`Xóa ${expense.expenseName}`}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && visibleExpenses.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              Hiển thị {visibleExpenses.length} / {expenses.length} khoản chi
            </div>
          )}
        </section>
      </div>
    </main>
  );
}