import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  Loader2,
  Megaphone,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ApiDashboard from "../api/ApiDashboard";
import { ECOSYSTEM_OPTIONS, LABELS } from "./CRM";

const todayISO = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const monthStartISO = () => `${todayISO().slice(0, 7)}-01`;

const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function MetricCard({ label, value, icon: Icon, tone }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{money(value)}</p>
        </div>
        <span className={`rounded-xl p-3 ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function DashboardDateRange({ from, to, setFrom, setTo }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">Từ ngày</span>
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => setFrom(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">Đến ngày</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          max={todayISO()}
          onChange={(event) => setTo(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
    </div>
  );
}

export default function MarketingReportPage() {
  const { user } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  const isAdmin = role === "admin";
  const isManager = role === "manager";

  const allowedEcosystems = useMemo(() => {
    if (isAdmin) return ECOSYSTEM_OPTIONS;
    return ECOSYSTEM_OPTIONS.filter(({ value }) =>
      value === "CMIC_STUDIO" ? user?.cmicStudio : user?.cmicMedia
    );
  }, [user, isAdmin]);

  const [from, setFrom] = useState(monthStartISO);
  const [to, setTo] = useState(todayISO);
  const [label, setLabel] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    if (!isAdmin && !isManager) return;
    if (!from || !to || from > to) {
      setError("Vui lòng chọn khoảng ngày hợp lệ.");
      setReport(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const response = await ApiDashboard.getMarketingReport({ from, to, label });
      if (response?.EC !== 0) throw new Error(response?.EM || "Không thể tải báo cáo.");
      setReport(response.DT);
    } catch (loadError) {
      setError(loadError.message || "Không thể tải báo cáo marketing.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, label, isAdmin, isManager]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (!isAdmin && !isManager) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-bold text-slate-900">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm text-slate-500">Báo cáo Marketing chỉ dành cho Admin và Manager.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <Megaphone className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Báo cáo Marketing</h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Trạng thái khách hàng</span>
              <select
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                className="min-w-48 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Tất cả trạng thái</option>
                {LABELS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <DashboardDateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
          </div>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            Đang tổng hợp khách hàng...
          </div>
        ) : (
          report && (
            <>
              <section className="grid gap-4 md:grid-cols-3">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Tổng khách hàng duy nhất</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {report.customerCount.toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                      <Users className="h-5 w-5" />
                    </span>
                  </div>
                </article>
                <MetricCard
                  label="Doanh thu trong khoảng thời gian đã chọn"
                  value={report.periodValue}
                  icon={CalendarDays}
                  tone="bg-emerald-50 text-emerald-600"
                />
                <MetricCard
                  label="Tổng doanh thu"
                  value={report.lifetimeValue}
                  icon={CircleDollarSign}
                  tone="bg-blue-50 text-blue-600"
                />
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-4">
                  <h2 className="font-bold text-slate-900">Danh sách khách hàng</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Số lần mua được tính trong khoảng ngày đã chọn. Danh sách:{" "}
                    {allowedEcosystems.map((item) => item.label).join(", ") || "chưa được phân công"}.
                  </p>
                </div>
                {report.customers.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    Không có khách hàng phù hợp với bộ lọc.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Khách hàng</th>
                          <th className="px-4 py-3">Điện thoại</th>
                          <th className="px-4 py-3">Hệ sinh thái</th>
                          <th className="px-4 py-3">Trạng thái</th>
                          <th className="px-4 py-3 text-right">Số lần mua</th>
                          <th className="px-4 py-3 text-right">Số tiền mua</th>
                          <th className="px-4 py-3 text-right">Tổng tiền đã mua</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.customers.map((customer) => (
                          <tr
                            key={customer.id ?? `${customer.ecosystem}-${customer.phone}-${index}`}
                            className="hover:bg-slate-50/70"
                          >
                            <td className="px-4 py-3">
                              <span className="block font-semibold text-slate-900">
                                {customer.fullName || "Chưa cập nhật"}
                              </span>
                              <span className="mt-0.5 block text-xs text-slate-500">
                                {customer.email || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">{customer.phone || "—"}</td>
                            <td className="px-4 py-3">
                              {String(customer.ecosystem || "").replace("_", " ")}
                            </td>
                            <td className="px-4 py-3">{customer.label || "Chưa gắn trạng thái"}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{customer.purchaseCount}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{money(customer.periodValue)}</td>
                            <td className="px-4 py-3 text-right font-semibold tabular-nums">
                              {money(customer.lifetimeValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )
        )}
      </div>
    </main>
  );
}