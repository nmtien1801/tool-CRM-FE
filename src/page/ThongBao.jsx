import React, { useState, useEffect } from 'react';
import { Bell, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import ApiCustomer from '../api/ApiCustomer';
import EmailModal from '../components/CSM/Emailmodal';

export function isBirthdayToday(birthday) {
  if (!birthday) return false;
  const today = new Date();
  const [, mm, dd] = birthday.split('-');
  return (
    String(today.getMonth() + 1).padStart(2, '0') === mm &&
    String(today.getDate()).padStart(2, '0') === dd
  );
}

export function getBirthdayCustomers(customers = []) {
  return customers.filter((c) => isBirthdayToday(c.birthday));
}

export default function NotificationPage() {
  const [birthdayList, setBirthdayList] = useState([]);
  const [emailTarget, setEmailTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ─── HOOK FETCH TOÀN BỘ KHÁCH HÀNG ĐỂ QUÉT SINH NHẬT ───
  const fetchAllCustomersBirthday = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // Gọi API lấy danh sách (nếu BE có api lấy toàn bộ hoặc bạn nâng pageSize lên lớn để lọc)
      const params = { page: 1, pageSize: 9999 };
      const response = await ApiCustomer.getCustomers(params);
      const result = response?.DT || response;

      let parsedCustomers = [];

      if (result && typeof result === 'object') {
        if ('rows' in result && Array.isArray(result.rows)) {
          parsedCustomers = result.rows;
        } else if ('items' in result) {
          parsedCustomers = Array.isArray(result.items) ? result.items : [];
        } else if ('customers' in result && Array.isArray(result.customers)) {
          parsedCustomers = result.customers;
        } else if (Array.isArray(result)) {
          parsedCustomers = result;
        }
      }

      // Quét và chỉ lọc ra những khách hàng có sinh nhật hôm nay
      const todaysBirthdays = getBirthdayCustomers(parsedCustomers);
      setBirthdayList(todaysBirthdays);
    } catch (error) {
      console.error("Lỗi khi quét danh sách sinh nhật:", error);
      setApiError("Không thể tải dữ liệu nhắc nhở sinh nhật từ máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCustomersBirthday();
  }, []);

  return (
    <div className="space-y-6 relative min-h-[400px]">
      {/* Hiệu ứng Loading toàn trang khi đang fetch dữ liệu */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 z-50 flex flex-col items-center justify-center gap-2 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold text-slate-600">Đang đồng bộ dữ liệu nhắc nhở...</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Trung tâm nhắc nhở hệ thống</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động quét và hiển thị danh sách khách hàng có sinh nhật trong ngày.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
          Hôm nay: {new Date().toLocaleDateString('vi-VN')}
        </span>
      </div>

      {/* Thông báo lỗi nếu API gặp sự cố */}
      {apiError && (
        <div className="p-4 text-center text-xs text-rose-500 font-medium bg-rose-50 border border-rose-100 rounded-xl">
          {apiError}
        </div>
      )}

      {/* Danh sách sinh nhật */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            Danh sách sinh nhật hôm nay
          </span>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
            {birthdayList.length} Khách hàng
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {birthdayList.length > 0 ? (
            birthdayList.map((customer) => (
              <div
                key={customer.id}
                className="p-6 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {customer.fullName}
                    <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium animate-pulse">
                      🎂 Sinh nhật
                    </span>
                  </h4>
                  <div className="text-xs text-slate-500 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1 pt-0.5">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-400">SĐT:</span>{' '}
                      <span className="font-semibold text-slate-800">{customer.phone || '---'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Ngày sinh:</span>{' '}
                      <span className="font-medium text-slate-800">
                        {customer.birthday ? new Date(customer.birthday).toLocaleDateString('vi-VN') : '---'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="font-medium text-slate-800">{customer.email || '---'}</span>
                    </div>
                  </div>
                  {customer.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {customer.address}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setEmailTarget(customer)}
                  className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 active:scale-95 rounded-xl transition-all whitespace-nowrap"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Gửi mail
                </button>
              </div>
            ))
          ) : (
            !isLoading && (
              <div className="py-12 text-center text-sm text-slate-400 italic">
                Hôm nay không có sinh nhật khách hàng nào trong hệ thống.
              </div>
            )
          )}
        </div>
      </div>

      {/* Popup email */}
      {emailTarget && (
        <EmailModal
          customer={emailTarget}
          onClose={() => setEmailTarget(null)}
          onSend={({ customer, filled }) => {
            console.log('Gửi email đến:', customer.email, filled);
          }}
        />
      )}
    </div>
  );
}