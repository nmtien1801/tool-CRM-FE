import React from 'react';
import { Bell } from 'lucide-react';

export default function NotificationPage({ birthdayList = [], onNavigateToCare }) {
  return (
    <div className="space-y-6">
      {/* Header nhắc nhở */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Trung tâm nhắc nhở hệ thống</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động quét và hiển thị danh sách khách hàng có sự kiện đặc biệt trong ngày.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
          Hôm nay: {new Date().toLocaleDateString('vi-VN')}
        </span>
      </div>

      {/* Danh sách sinh nhật */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Danh sách sinh nhật hôm nay
          </span>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
            {birthdayList?.length || 0} Khách hàng
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {birthdayList && birthdayList.length > 0 ? (
            birthdayList.map((customer) => (
              <div
                key={customer.id}
                className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 align-top"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {customer.fullName}
                    <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium animate-pulse">
                      🎂 Sinh nhật
                    </span>
                  </h4>
                  
                  <div className="text-xs text-slate-500 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1 pt-0.5">
                    <div>
                      <span className="text-slate-400">Số điện thoại:</span>{' '}
                      <span className="font-semibold text-slate-800">{customer.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Ngày sinh:</span>{' '}
                      <span className="font-medium text-slate-800">{customer.birthday}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Email:</span>{' '}
                      <span className="font-medium text-slate-800">{customer.email || '---'}</span>
                    </div>
                  </div>

                  {customer.address && (
                    <p className="text-xs text-slate-500">
                      <span className="text-slate-400">Địa chỉ:</span> {customer.address}
                    </p>
                  )}
                </div>

                <div className="flex sm:justify-end items-center">
                  <button
                    onClick={onNavigateToCare}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all whitespace-nowrap"
                  >
                    Đi đến mục chăm sóc ngay →
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-slate-400 italic">
              Hôm nay không có sinh nhật khách hàng nào trong hệ thống dữ liệu.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}