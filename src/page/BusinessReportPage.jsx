import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  CircleDollarSign,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ApiDashboard from "../api/ApiDashboard";
import { ECOSYSTEM_OPTIONS } from "./CRM";

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
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2">
        <span className="whitespace-nowrap text-xs font-semibold text-slate-600">Từ ngày</span>
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(event) => setFrom(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
      <label className="flex items-center gap-2">
        <span className="whitespace-nowrap text-xs font-semibold text-slate-600">Đến ngày</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          max={todayISO()}
          onChange={(event) => setTo(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
    </div>
  );
}

export default function BusinessReportPage() {
  const { user } = useAuth();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const [from, setFrom] = useState(monthStartISO);
  const [to, setTo] = useState(todayISO);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    if (!isAdmin) return;
    if (!from || !to || from > to) {
      setError("Vui lòng chọn khoảng ngày hợp lệ.");
      setReport(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const response = await ApiDashboard.getBusinessReport({ from, to });

      if (response?.EC !== 0) throw new Error(response?.EM || "Không thể tải báo cáo.");
      setReport(response.DT);
    } catch (loadError) {
      setError(loadError.message || "Không thể tải báo cáo kinh doanh.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, isAdmin]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-bold text-slate-900">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm text-slate-500">Báo cáo kinh doanh chỉ dành cho Admin.</p>
        </div>
      </main>
    );
  }

  const ecosystemRows = report
    ? ECOSYSTEM_OPTIONS.map(({ value, label }) => ({
      ecosystem: value,
      label: label || value.replace("_", " "),
      ...report.ecosystems?.[value],
    }))
    : [];
  const overall = report?.overall;

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <TrendingUp className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Báo cáo kinh doanh</h1>
            </div>
          </div>
          <DashboardDateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
        </header>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            Đang tổng hợp kinh doanh...
          </div>
        ) : error || !report ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error || "Không có dữ liệu báo cáo."}
          </div>
        ) : (
          <>
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-800">Toàn bộ hệ sinh thái</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Tổng doanh thu"
                  value={overall.revenue}
                  icon={TrendingUp}
                  tone="bg-emerald-50 text-emerald-600"
                />
                <MetricCard
                  label="Tổng chi phí"
                  value={overall.totalCost}
                  icon={CircleDollarSign}
                  tone="bg-amber-50 text-amber-600"
                />
                <MetricCard
                  label="Lợi nhuận trước thuế"
                  value={overall.profitBeforeTax}
                  icon={BarChart3}
                  tone="bg-indigo-50 text-indigo-600"
                />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-bold text-slate-800">Kết quả riêng từng hệ sinh thái</h2>
              <div className="grid gap-4 xl:grid-cols-2">
                {ecosystemRows.map((item) => (
                  <article key={item.ecosystem} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 font-bold text-slate-900">{item.label}</h3>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-xs text-slate-500">Tổng doanh thu</dt>
                        <dd className="mt-1 font-bold">{money(item.revenue)}</dd>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-xs text-slate-500">Tổng chi phí</dt>
                        <dd className="mt-1 font-bold">{money(item.totalCost)}</dd>
                      </div>
                      <div className="rounded-xl bg-indigo-50 p-3">
                        <dt className="text-xs text-indigo-700">Chi phí vốn</dt>
                        <dd className="mt-1 font-bold text-indigo-900">{money(item.grossCost)}</dd>
                      </div>
                      <div className="rounded-xl bg-indigo-50 p-3">
                        <dt className="text-xs text-indigo-700">Lợi nhuận gộp</dt>
                        <dd className="mt-1 font-bold text-indigo-900">{money(item.grossProfit)}</dd>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-xs text-slate-500">Chi phí vận hành</dt>
                        <dd className="mt-1 font-bold">{money(item.operatingCost)}</dd>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-xs text-slate-500">Chi phí quản lý chung</dt>
                        <dd className="mt-1 font-bold">{money(item.managementCost)}</dd>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-xs text-slate-500">Chi phí đầu tư</dt>
                        <dd className="mt-1 font-bold">{money(item.unclassifiedCost)}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                      <span className="text-slate-500">Biên lợi nhuận gộp</span>
                      <span className="font-bold text-indigo-700">{Number(item.grossMargin || 0).toFixed(2)}%</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4">
                <h2 className="font-bold text-slate-900">Chi phí theo hạng mục</h2>
                <p className="mt-1 text-xs text-slate-500">Số liệu trong khoảng ngày đã chọn, tính theo ngày thanh toán.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Hạng mục</th>
                      <th className="px-4 py-3 text-right">CMIC STUDIO</th>
                      <th className="px-4 py-3 text-right">CMIC MEDIA</th>
                      <th className="px-4 py-3 text-right">Tổng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.categories.map((row) => (
                      <tr key={row.category}>
                        <td className="px-4 py-3 font-medium text-slate-700">{row.category}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{money(row.CMIC_STUDIO)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{money(row.CMIC_MEDIA)}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{money(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold">
                    <tr>
                      <td className="px-4 py-3">Tổng chi phí</td>
                      <td className="px-4 py-3 text-right">{money(ecosystemRows[0]?.totalCost)}</td>
                      <td className="px-4 py-3 text-right">{money(ecosystemRows[1]?.totalCost)}</td>
                      <td className="px-4 py-3 text-right">{money(overall.totalCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}