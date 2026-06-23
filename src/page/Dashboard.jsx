import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { Bell } from 'lucide-react';
import Select from 'react-select';

// ─── ĐỊNH NGHĨA DANH MỤC LỰA CHỌN (CONSTANTS) ───
const ECOSYSTEM_OPTIONS = [
  { value: 'retail', label: 'Bán lẻ TMĐT' },
  { value: 'course', label: 'Khóa học Online' },
  { value: 'coaching', label: 'Tư vấn 1:1' }
];

const LABELS = [
  { value: 'Lạnh', label: 'Lạnh', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'Đã quan tâm', label: 'Đã quan tâm', color: 'bg-blue-50 text-blue-700 border-blue-300' },
  { value: 'Đang tư vấn', label: 'Đang tư vấn', color: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
  { value: 'Đang cân nhắc', label: 'Đang cân nhắc', color: 'bg-orange-50 text-orange-700 border-orange-300' },
  { value: 'báo giá', label: 'Báo giá', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'Follow Up', label: 'Follow Up', color: 'bg-purple-50 text-purple-700 border-purple-300' },
  { value: 'Chưa chốt', label: 'Chưa chốt', color: 'bg-rose-50 text-rose-700 border-rose-300' },
  { value: 'Đã mua hàng', label: 'Đã mua hàng', color: 'bg-green-50 text-green-700 border-green-300' },
  { value: 'Đã quay lại', label: 'Đã quay lại', color: 'bg-emerald-100 text-emerald-800 border-emerald-400' },
  { value: 'Đã giới thiệu bạn bè', label: 'Đã giới thiệu bạn bè', color: 'bg-teal-50 text-teal-700 border-teal-300' }
];

const CARE_METHODS = [
  { value: 'Email Marketing', label: 'Email Marketing' },
  { value: 'SMS', label: 'SMS' },
  { value: 'Zalo OA', label: 'Zalo OA' },
  { value: 'Telesale', label: 'Telesale' },
  { value: 'Messenger', label: 'Messenger' }
];

const STAFF_OPTIONS = [
  { value: 'NguyenVanA', label: 'Nguyễn Văn A' },
  { value: 'TranThiB', label: 'Trần Thị B' },
  { value: 'LeVanC', label: 'Lê Văn C' }
];

const CONTENT_SUGGESTIONS = [
  { value: 'Chuỗi email GĐ1', label: 'Chuỗi email GĐ1 (Chào mừng)' },
  { value: 'Chuỗi email GĐ2', label: 'Chuỗi email GĐ2 (Bám đuôi)' },
  { value: 'Tư vấn 1:1', label: 'Tư vấn 1:1 qua Google Meet' },
  { value: 'Gọi điện báo giá', label: 'Gọi điện báo giá + Khuyến mãi' },
  { value: 'Gửi tin nhắn Zalo', label: 'Gửi tin nhắn ưu đãi Zalo OA' }
];

const PROMO_OPTIONS = [
  { value: 'Ưu đãi mở bán sớm -30%', label: 'Ưu đãi mở bán sớm -30%' },
  { value: 'Giảm 10% khách hàng mới', label: 'Giảm 10% khách hàng mới' },
  { value: 'Tặng kèm tài liệu VIP', label: 'Tặng kèm tài liệu VIP' },
  { value: 'Voucher 500k sinh nhật', label: 'Voucher 500k sinh nhật' },
  { value: 'Sự kiện đối tác chiến lược', label: 'Sự kiện đối tác chiến lược' },
  { value: 'Flash Sale Black Friday', label: 'Flash Sale Black Friday' }
];

const EMPTY_CUSTOMER = {
  fullName: '', birthday: '', address: '', phone: '', email: '', facebook: '',
  ecosystem: '', issue: '', purchaseCount: 0, purchaseDates: [],
  products: '', purchaseHistories: [], careMethods: [], promotions: [], consultant: '', careStaff: '', invoiceLink: '',
  label: 'Lạnh', singleDate: ''
};

const getPurchaseHistories = (customer) => {
  if (customer.purchaseHistories?.length) return customer.purchaseHistories;

  const dates = customer.purchaseDates?.length ? customer.purchaseDates : [''];
  return dates.map((date, index) => ({
    id: `${customer.id || 'new'}-${index}`,
    date,
    products: customer.products || '',
    invoiceLink: customer.invoiceLink || '',
    issue: customer.issue || '',
    careMethods: customer.careMethods || [],
    promotions: customer.promotions || [],
    consultant: customer.consultant || '',
    careStaff: customer.careStaff || ''
  }));
};

const normalizeCustomerData = (customer) => {
  const purchaseHistories = getPurchaseHistories(customer);

  // CHUYỂN ĐỔI purchaseCount THÀNH NUMBER ĐỂ KHỚP VỚI INPUT
  let pCount = 0;
  if (customer.purchaseCount !== undefined && customer.purchaseCount !== '') {
    pCount = parseInt(String(customer.purchaseCount).replace(/\D/g, ''), 10) || 0;
  } else {
    pCount = purchaseHistories.filter(h => h.date || h.products || h.invoiceLink).length;
  }

  return {
    ...EMPTY_CUSTOMER,
    ...customer,
    purchaseHistories,
    purchaseCount: pCount,
    purchaseDates: purchaseHistories.map(h => h.date).filter(Boolean),
    products: customer.products || purchaseHistories.map(h => h.products).filter(Boolean).join(', '),
    invoiceLink: customer.invoiceLink || purchaseHistories.find(h => h.invoiceLink)?.invoiceLink || '',
    singleDate: customer.singleDate !== undefined && customer.singleDate !== '' ? customer.singleDate : (purchaseHistories[0]?.date || '')
  };
};

export default function CRMSystem() {
  const [currentTab, setCurrentTab] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [detailCustomerId, setDetailCustomerId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showNotiPopup, setShowNotiPopup] = useState(false);

  // ─── STATE QUAN TRỌNG HỆ THỐNG (BẢO LƯU DATA NGUYÊN BẢN) ───
  const [customers, setCustomers] = useState([
    {
      id: 1,
      fullName: 'Nguyễn Minh Tiền',
      birthday: '2000-06-22',
      address: 'Quận 1, TP. HCM',
      phone: '0912345678',
      email: 'tien.nguyen@gmail.com',
      facebook: 'https://fb.com/tiennguyen',
      ecosystem: 'course',
      issue: 'Cần tìm tool tối ưu quy trình render video tự động',
      purchaseCount: 2,
      purchaseDates: ['2026-03-15', '2026-05-20'],
      products: 'Khóa học Pro Video Editing',
      purchaseHistories: [
        {
          id: '1-0',
          date: '2026-03-15',
          products: 'Khóa học Pro Video Editing',
          invoiceLink: 'https://example.com/invoice_01.pdf',
          careMethods: ['Zalo OA', 'Email Marketing'],
          promotions: [{ event: 'Ưu đãi mở bán sớm -30%' }],
          consultant: 'NguyenVanA',
          careStaff: 'TranThiB',
          issue: 'Cần tìm tool tối ưu quy trình render video tự động',
        },
        {
          id: '1-1',
          date: '2026-05-20',
          products: 'Gói nâng cấp Pro Video Editing',
          invoiceLink: 'https://example.com/invoice_02.pdf',
          careMethods: ['Zalo OA', 'Email Marketing'],
          promotions: [{ event: 'Ưu đãi mở bán sớm -40%' }],
          consultant: 'TranThiB',
          careStaff: 'LeVanC',
          issue: 'Cần tìm tool tối ưu quy trình render video tự động',
        }
      ],
      label: 'Đã mua hàng'
    }
  ]);

  const [formData, setFormData] = useState(EMPTY_CUSTOMER);
  const [promoEvent, setPromoEvent] = useState('');

  const [crmSearch, setCrmSearch] = useState('');
  const [crmFilterLabel, setCrmFilterLabel] = useState('');
  const [crmFilterEco, setCrmFilterEco] = useState('');
  const [csmSearch, setCsmSearch] = useState('');
  const [csmFilterStage, setCsmFilterStage] = useState('');
  const [csmFilterStatus, setCsmFilterStatus] = useState('all');

  const [careData, setCareData] = useState([]);

  const activeCareList = customers.map(cust => {
    const existingCare = careData.find(b => b.id === cust.id);
    const safeCareMethods = cust.careMethods || [];

    return {
      id: cust.id,
      fullName: cust.fullName,
      birthday: cust.birthday,
      address: cust.address ? cust.address : 'Chưa có dữ liệu',
      phone: (safeCareMethods.includes('Zalo OA') || safeCareMethods.includes('SMS') || safeCareMethods.includes('Telesale')) ? cust.phone : '********',
      email: safeCareMethods.includes('Email Marketing') ? cust.email : '********',
      facebook: safeCareMethods.includes('Messenger') ? cust.facebook : '********',
      careMethods: safeCareMethods,
      stage: cust.label,
      products: cust.products || getPurchaseHistories(cust).map(h => h.products).filter(Boolean).join(', '),
      careStaff: cust.careStaff,
      status: existingCare ? existingCare.status : false,
      careContent: existingCare ? existingCare.careContent : '',
      careContentCustom: existingCare ? existingCare.careContentCustom : '',
      behaviorMetrics: existingCare ? existingCare.behaviorMetrics : ''
    };
  });

  const todayStr = new Date().toISOString().slice(5, 10);
  const birthdayList = customers.filter(c => c.birthday && c.birthday.slice(5, 10) === todayStr);
  const birthdayCount = birthdayList.length;

  const updateCareData = (careId, patch) => {
    setCareData(prev => prev.some(item => item.id === careId)
      ? prev.map(item => item.id === careId ? { ...item, ...patch } : item)
      : [...prev, { id: careId, ...patch }]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setIsScanning(true);

      setTimeout(() => {
        setFormData({
          fullName: 'Trần Thị Thảo',
          birthday: '1998-11-12',
          address: 'Đống Đa, Hà Nội',
          phone: '0988888888',
          email: 'thao.tran@outlook.com',
          facebook: 'https://fb.com/thaotran.pharmacy',
          ecosystem: 'retail',
          issue: 'Muốn làm đối tác cung cấp khóa học Online ngành y dược',
          purchaseCount: 1,
          purchaseDates: ['2026-06-22'],
          products: 'Gói tư vấn Setup tự động hóa CRM',
          purchaseHistories: [
            {
              id: `ocr-${Date.now()}`,
              date: '2026-06-22',
              products: 'Gói tư vấn Setup tự động hóa CRM',
              invoiceLink: 'https://example.com/invoice_thao_ocr.pdf',
              issue: 'Muốn làm đối tác cung cấp khóa học Online ngành y dược',
              careMethods: ['Zalo OA', 'Messenger', 'Email Marketing'],
              promotions: [{ event: 'Sự kiện đối tác chiến lược' }],
              consultant: 'LeVanC',
              careStaff: 'NguyenVanA'
            }
          ],
          careMethods: ['Zalo OA', 'Messenger', 'Email Marketing'],
          promotions: [{ event: 'Sự kiện đối tác chiến lược' }],
          consultant: 'LeVanC',
          careStaff: 'NguyenVanA',
          invoiceLink: 'https://example.com/invoice_thao_ocr.pdf',
          label: 'Đang tư vấn',
          singleDate: '2026-06-22'
        });
        setIsScanning(false);
      }, 1500);
    }
  };

  const handleClearForm = () => {
    setFormData(EMPTY_CUSTOMER);
    setImagePreview(null);
    setEditingId(null);
    setEditingHistoryId(null);
  };

  const handleSaveData = () => {
    if (!formData.fullName || !formData.phone || !formData.birthday) {
      alert("Vui lòng nhập tối thiểu Họ và tên, Ngày sinh, Số điện thoại!");
      return;
    }

    const normalizedForm = normalizeCustomerData(formData);
    let finalHistories = [...normalizedForm.purchaseHistories];

    if (finalHistories.length === 0) {
      finalHistories.push({
        id: `${Date.now()}-0`,
        date: formData.singleDate,
        products: formData.products,
        invoiceLink: formData.invoiceLink,
        issue: formData.issue,
        careMethods: formData.careMethods,
        promotions: formData.promotions,
        consultant: formData.consultant,
        careStaff: formData.careStaff
      });
    } else if (!editingHistoryId) {
      finalHistories[0] = {
        ...finalHistories[0],
        date: formData.singleDate,
        products: formData.products,
        invoiceLink: formData.invoiceLink,
        issue: formData.issue,
        careMethods: formData.careMethods,
        promotions: formData.promotions,
        consultant: formData.consultant,
        careStaff: formData.careStaff
      };
    } else {
      finalHistories = finalHistories.map(h =>
        h.id === editingHistoryId ? {
          ...h,
          date: formData.singleDate,
          products: formData.products,
          invoiceLink: formData.invoiceLink,
          issue: formData.issue,
          careMethods: formData.careMethods,
          promotions: formData.promotions,
          consultant: formData.consultant,
          careStaff: formData.careStaff
        } : h
      );
    }

    if (editingId) {
      setCustomers(customers.map(c => {
        if (c.id !== editingId) return c;
        return { ...normalizedForm, purchaseHistories: finalHistories, id: editingId };
      }));
      setEditingId(null);
      setEditingHistoryId(null);
      alert("Đã cập nhật thông tin thành công!");
    } else {
      setCustomers([...customers, { ...normalizedForm, purchaseHistories: finalHistories, id: Date.now() }]);
      alert("Đã thêm mới thành công!");
    }
    handleClearForm();
  };

  const handleEditClick = (customer) => {
    setFormData(normalizeCustomerData(customer));
    setEditingId(customer.id);
    setEditingHistoryId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRenderedRows = () => {
    return customers.map(normalizeCustomerData).filter(c => {
      const purchaseText = getPurchaseHistories(c).map(h => `${h.date} ${h.products} ${h.invoiceLink}`).join(' ');
      const matchText = crmSearch === '' || c.fullName.toLowerCase().includes(crmSearch.toLowerCase()) || c.phone.includes(crmSearch) || c.email.toLowerCase().includes(crmSearch.toLowerCase()) || c.products.toLowerCase().includes(crmSearch.toLowerCase()) || purchaseText.toLowerCase().includes(crmSearch.toLowerCase()) || c.address.toLowerCase().includes(crmSearch.toLowerCase()) || c.issue.toLowerCase().includes(crmSearch.toLowerCase());
      const matchLabel = crmFilterLabel === '' || c.label === crmFilterLabel;
      const matchEco = crmFilterEco === '' || c.ecosystem === crmFilterEco;
      return matchText && matchLabel && matchEco;
    });
  };

  const detailCustomer = detailCustomerId ? customers.map(normalizeCustomerData).find(c => c.id === detailCustomerId) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">

      {/* Header Điều Hướng */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex justify-between items-center relative">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setCurrentTab(0)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${currentTab === 0 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-indigo-600'}`}>
              Quản lý khách hàng (CRM)
            </button>
            <button onClick={() => setCurrentTab(1)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${currentTab === 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-indigo-600'}`}>
              Quản lý chăm sóc khách hàng (CSM)
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotiPopup(!showNotiPopup)}
              className="px-3 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all relative border border-slate-200 flex items-center gap-1.5"
            >
              <span><Bell className="w-4 h-4" /></span>
              {birthdayCount > 0 && (
                <span className="bg-rose-500 text-white font-bold text-xs px-1.5 py-0.5 rounded-full">
                  {birthdayCount}
                </span>
              )}
            </button>

            {showNotiPopup && (
              <div className="absolute right-0 mt-2 w-85 bg-white border border-slate-200 rounded-2xl shadow-xl py-3 z-50">
                <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-400 uppercase tracking-wider">Hệ thống nhắc nhở</span>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Hôm nay</span>
                </div>
                <div className="max-h-64 overflow-y-auto mt-2">
                  {birthdayList.length > 0 ? (
                    birthdayList.map(c => (
                      <div key={c.id} className="px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-b-0">
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-slate-900">{c.fullName}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">SĐT: {c.phone} | Ngày sinh: {c.birthday}</p>
                          <button onClick={() => { setCurrentTab(1); setShowNotiPopup(false); }} className="text-[10px] text-indigo-600 mt-1 font-semibold hover:underline block text-left">
                            Đi đến mục chăm sóc ngay →
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-xs text-slate-400 italic">Hôm nay không có sinh nhật khách hàng nào.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-8 space-y-8">

        {currentTab === 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* KHỐI CHỌN ẢNH */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 text-indigo-600">
                    Hình ảnh hóa đơn
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Tải tài liệu lên để tự động phân tích trích xuất dữ liệu điền vào biểu mẫu.</p>
                </div>

                <div className="flex-1 min-h-[260px] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 relative group overflow-hidden">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain max-h-[300px]" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <label className="bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-md">Thay đổi file</label>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer text-center p-6 w-full h-full">
                      <span className="text-sm font-semibold text-slate-700 block mb-1">Nhấp để chọn file đính kèm</span>
                      <span className="text-xs text-slate-400">Định dạng hỗ trợ: PNG, JPG, JPEG</span>
                    </label>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

                  {isScanning && (
                    <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest animate-pulse">AI đang xử lý dữ liệu đầu vào...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* KHỐI THÔNG TIN BIỂU MẪU CẤU TRÚC 6 NHÓM CHUẨN */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-3 mb-4 gap-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-indigo-600">
                      Biểu mẫu nhập liệu thông tin khách hàng
                    </h3>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleSaveData} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all">
                        {editingId ? "Cập nhật thay đổi" : "Lưu vào hệ thống"}
                      </button>
                      <button type="button" onClick={handleClearForm} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
                        Xóa trắng
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {editingId && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-700">
                        {editingHistoryId
                          ? 'Đang chỉnh sửa chi tiết 1 đơn hàng cụ thể. Dữ liệu sẽ lưu thẳng vào lịch sử giao dịch.'
                          : 'Đang chỉnh sửa toàn bộ thông tin gốc của khách hàng.'}
                      </div>
                    )}

                    {/* NHÓM 1: THÔNG TIN CƠ BẢN */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 1: Thông tin cơ bản</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Họ và tên *</label>
                          <input type="text" placeholder="Nhập thủ công" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày sinh *</label>
                          <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.birthday} onChange={e => setFormData({ ...formData, birthday: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Địa chỉ chính xác</label>
                          <input type="text" placeholder="Nhập thủ công địa chỉ cư trú hoặc giao hàng" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    {/* NHÓM 2: KÊNH LIÊN HỆ & HỆ SINH THÁI */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 2: Kênh liên hệ & Hệ sinh thái (Contact Channels)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số điện thoại *</label>
                          <input type="text" placeholder="Nhập thủ công" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Thư điện tử (Email)</label>
                          <input type="email" placeholder="Nhập thủ công" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Đường dẫn Facebook</label>
                          <input type="text" placeholder="Nhập thủ công link trang cá nhân" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.facebook} onChange={e => setFormData({ ...formData, facebook: e.target.value })} />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Thuộc hệ sinh thái doanh nghiệp (Chọn 1)</label>
                          <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.ecosystem} onChange={e => setFormData({ ...formData, ecosystem: e.target.value })}>
                            <option value="">-- Click để chọn một phân hệ --</option>
                            {ECOSYSTEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* NHÓM 3: LỊCH SỬ MUA HÀNG & DỊCH VỤ */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Nhóm 3: Lịch sử mua hàng & Dịch vụ (Sales History)
                      </h4>

                      {/* Chia Grid làm 2 cột bằng nhau trên màn hình md trở lên */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

                        {/* BÊN TRÁI: KHỐI CHỨA 3 Ô NHẬP LIỆU XẾP DỌC */}
                        <div className="space-y-3">
                          {/* 1. Tổng số lần đã mua hàng */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tổng số lần đã mua hàng</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="Ví dụ: 2"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                              value={formData.purchaseCount || 0}
                              onChange={e => setFormData({ ...formData, purchaseCount: parseInt(e.target.value, 10) || 0 })}
                              disabled
                            />
                          </div>

                          {/* 2. Tên sản phẩm */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên sản phẩm - dịch vụ đã mua</label>
                            <input
                              type="text"
                              placeholder="Nhập thủ công chi tiết sản phẩm"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              value={formData.products}
                              onChange={e => setFormData({ ...formData, products: e.target.value })}
                            />
                          </div>

                          {/* 3. Ngày mua hàng */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày mua hàng</label>
                            <input
                              type="date"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              value={formData.singleDate}
                              onChange={e => setFormData({ ...formData, singleDate: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* BÊN PHẢI: KHỐI CHỨA Ô HÌNH ẢNH HÓA ĐƠN ĐỘC LẬP */}
                        <div className="h-full flex flex-col">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Hóa đơn đầu ra (Click vào ảnh để thay đổi)
                          </label>

                          {/* Tăng chiều cao h-full hoặc cố định h-[178px] để cân bằng với 3 ô nhập bên trái */}
                          <div className="relative w-full h-[174px] bg-white border border-slate-200 hover:border-indigo-400 rounded-xl overflow-hidden shadow-sm transition-all group flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              id="invoice-image-upload"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const imageUrl = URL.createObjectURL(file);
                                  setFormData({ ...formData, invoiceLink: imageUrl });
                                }
                              }}
                            />

                            {formData.invoiceLink && !formData.invoiceLink.endsWith('.pdf') ? (
                              /* TRƯỜNG HỢP: ĐÃ CÓ ẢNH ĐÍNH KÈM -> PHỦ KÍN Ô NHẬP, CLICK ĐỂ ĐỔI */
                              <label htmlFor="invoice-image-upload" className="block w-full h-full cursor-pointer relative">
                                <img
                                  src={formData.invoiceLink}
                                  alt="Hóa đơn đầu ra"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                {/* Lớp phủ hover xuất hiện chữ "Thay đổi ảnh" */}
                                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <span className="text-white text-xs font-semibold bg-indigo-600 px-3 py-1.5 rounded-xl shadow-md">
                                    Thay đổi hình ảnh
                                  </span>
                                </div>
                              </label>
                            ) : (
                              /* TRƯỜNG HỢP: CHƯA CÓ ẢNH HOẶC ĐANG LÀ LINK .PDF GỐC */
                              <label
                                htmlFor="invoice-image-upload"
                                className="w-full h-full cursor-pointer flex flex-col items-center justify-center gap-1.5 p-3 text-center bg-slate-50/50 hover:bg-indigo-50/30 transition-colors"
                              >
                                <ImageIcon className="w-5 h-5 text-indigo-500 animate-pulse" />
                                <span className="text-slate-700 text-xs font-semibold">Nhấp chọn ảnh hóa đơn</span>
                                <p className="text-[10px] text-slate-400">
                                  {formData.invoiceLink && formData.invoiceLink.endsWith('.pdf')
                                    ? "⚠️ Đơn gốc hiện là file PDF, hãy đổi sang Ảnh"
                                    : "Hỗ trợ định dạng PNG, JPG, JPEG"}
                                </p>
                              </label>
                            )}

                            {/* Nút xóa nhanh ảnh nằm ở góc phải nếu cần đưa về trạng thái trống */}
                            {formData.invoiceLink && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setFormData({ ...formData, invoiceLink: '' });
                                }}
                                className="absolute top-2 right-2 z-10 bg-rose-500/90 hover:bg-rose-600 text-white w-5 h-5 flex items-center justify-center text-xs rounded-full transition-colors shadow-xs"
                                title="Xóa ảnh hiện tại"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* NHÓM 4: CHĂM SÓC & TIẾP THỊ */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 4: Chăm sóc & Tiếp thị (Nurturing & Marketing)</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mối quan tâm / Vấn đề cốt lõi đang gặp phải</label>
                          <input type="text" placeholder="Nhập nhu cầu, điểm đau, bài toán khách hàng cần giải quyết..." className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.issue} onChange={e => setFormData({ ...formData, issue: e.target.value })} />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chương trình khuyến mãi / Sự kiện quà tặng đã áp dụng</label>
                          <div className="flex gap-1.5">
                            <select className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={promoEvent} onChange={e => setPromoEvent(e.target.value)}>
                              <option value="">-- Chọn sự kiện khuyến mãi / quà tặng --</option>
                              {PROMO_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <button type="button" onClick={() => { if (promoEvent) setFormData({ ...formData, promotions: [...(formData.promotions || []), { event: promoEvent }] }); setPromoEvent(''); }} className="bg-indigo-50 text-indigo-700 px-3 text-xs font-bold rounded-xl hover:bg-indigo-100 border border-indigo-200">Thêm vào dòng</button>
                          </div>
                          <div className="mt-1.5 space-y-1">{(formData.promotions || []).map((p, i) => <div key={i} className="text-[10px] bg-white p-2 rounded-lg flex justify-between items-center border border-slate-200 shadow-2xs"><span>Sự kiện áp dụng: <strong className="text-indigo-600">{p.event}</strong></span><span className="text-rose-500 font-bold cursor-pointer px-1" onClick={() => setFormData({ ...formData, promotions: formData.promotions.filter((_, idx) => idx !== i) })}>Gỡ</span></div>)}</div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phương thức phân phối chăm sóc (Chọn nhiều phương án)</label>
                          <div className="flex flex-wrap gap-4 bg-white p-3 rounded-xl border border-slate-200">
                            {CARE_METHODS.map(m => <label key={m.value} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"><input type="checkbox" checked={(formData.careMethods || []).includes(m.value)} onChange={e => setFormData({ ...formData, careMethods: e.target.checked ? [...(formData.careMethods || []), m.value] : formData.careMethods.filter(c => c !== m.value) })} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /> {m.label}</label>)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* NHÓM 5: QUẢN LÝ NỘI BỘ */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 5: Phân sự & Quản lý nội bộ (Internal Assignment)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nhân viên trực tiếp đảm nhận tư vấn</label>
                          <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.consultant} onChange={e => setFormData({ ...formData, consultant: e.target.value })}>
                            <option value="">-- Click chọn nhân sự phụ trách --</option>
                            {STAFF_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nhân viên hậu mãi / Chăm sóc khách hàng</label>
                          <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.careStaff} onChange={e => setFormData({ ...formData, careStaff: e.target.value })}>
                            <option value="">-- Click chọn nhân sự phụ trách --</option>
                            {STAFF_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* NHÓM 6: TRẠNG THÁI & GÁN NHÃN */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 6: Trạng thái quy trình & Nhãn phân loại (Status & Tags)</h4>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gán nhãn phân cấp khách hàng hiện tại</label>
                        <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })}>
                          {LABELS.map(l => <option key={l.value} value={l.value} className="text-slate-800 font-normal">{l.label}</option>)}
                        </select>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* BẢNG DỮ LIỆU CHÍNH */}
            <div className="space-y-4 pt-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-xs">
                <div className="flex-1 min-w-[280px]">
                  <input type="text" placeholder="Tìm kiếm toàn bộ thông tin hệ thống (Tên, SĐT, Email, Địa chỉ)..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={crmSearch} onChange={e => setCrmSearch(e.target.value)} />
                </div>
                <select className="w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={crmFilterLabel} onChange={e => setCrmFilterLabel(e.target.value)}>
                  <option value="">Lọc theo nhãn gán</option>
                  {LABELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <select className="w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={crmFilterEco} onChange={e => setCrmFilterEco(e.target.value)}>
                  <option value="">Lọc theo hệ sinh thái</option>
                  {ECOSYSTEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[980px] table-fixed">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="px-4 py-4 w-72">Thông tin cơ bản</th>
                      <th className="px-4 py-4 w-72">Kênh liên hệ & Hệ sinh thái</th>
                      <th className="px-4 py-4 w-72">Tổng số lần mua hàng</th>
                      <th className="px-4 py-4 w-48 text-center">Nhãn trạng thái</th>
                      <th className="px-4 py-4 w-44 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {getRenderedRows().map(cust => (
                      <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors align-top">
                        <td className="px-3 py-3 space-y-1">
                          <div><span className="font-bold text-slate-900 text-sm block">{cust.fullName}</span></div>
                          <div><span className="text-slate-500">Ngày sinh:</span> <span className="font-medium text-slate-800">{cust.birthday}</span></div>
                          <div className="text-slate-600"><span className="text-slate-500">Địa chỉ:</span> <p className="inline break-words font-medium">{cust.address || 'Chưa cập nhật'}</p></div>
                        </td>

                        <td className="px-3 py-3 space-y-1">
                          <div><span className="text-slate-500">SĐT:</span> <span className="font-bold text-slate-900">{cust.phone}</span></div>
                          <div><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-800 break-all">{cust.email || 'Chưa điền'}</span></div>
                          <div>
                            <span className="text-slate-500">Facebook:</span> {cust.facebook ? (
                              <a href={cust.facebook} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium break-all">{cust.facebook}</a>
                            ) : <span className="text-slate-400 italic">Trống</span>}
                          </div>
                          <div className="pt-1">
                            <span className="bg-slate-100 border text-slate-700 px-2 py-0.5 rounded-md font-medium text-[10px]">
                              {ECOSYSTEM_OPTIONS.find(e => e.value === cust.ecosystem)?.label || 'Chưa chọn hệ sinh thái'}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3 space-y-1">
                          <div>
                            <span className="font-bold text-indigo-600">
                              lần {cust.purchaseCount}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <select
                            value={cust.label}
                            onChange={e => setCustomers(customers.map(c => c.id === cust.id ? { ...c, label: e.target.value } : c))}
                            className={`text-xs font-bold px-2 py-1.5 rounded-xl border cursor-pointer w-full text-center transition-all ${LABELS.find(l => l.value === cust.label)?.color}`}
                          >
                            {LABELS.map(l => <option key={l.value} value={l.value} className="bg-white text-slate-800 font-normal text-left">{l.label}</option>)}
                          </select>
                          <p className="text-[9px] text-slate-400 mt-1">Đẩy tự động sang mục xử lý</p>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <button onClick={() => setDetailCustomerId(cust.id)} className="w-full py-1 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg border border-indigo-600 transition-all">Xem chi tiết</button>
                            <button onClick={() => handleEditClick(cust)} className="w-full py-1 text-[11px] bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg border transition-all">Sửa thông tin</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL CHI TIẾT HOẠT ĐỘNG KHÁCH HÀNG */}
            {detailCustomer && (
              <div className="fixed inset-0 z-50 bg-slate-900/45 px-4 py-6 flex items-center justify-center">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-[95vw] max-h-[92vh] flex flex-col overflow-hidden">

                  <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Lịch sử mua hàng: {detailCustomer.fullName}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailCustomerId(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                      <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Chi tiết giao dịch</span>
                        <div className="text-xs text-slate-500 font-medium">
                          Tổng số lần giao dịch: <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded ml-1">lần {detailCustomer.purchaseCount}</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs min-w-[1500px]">
                          <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                              <th className="px-4 py-3.5 text-center w-12 bg-slate-50/40">STT</th>
                              <th className="px-4 py-3.5 w-32 border-l border-slate-200 bg-indigo-50/20 text-indigo-900">Ngày giao dịch</th>
                              <th className="px-4 py-3.5 w-60 bg-indigo-50/20 text-indigo-900">Sản phẩm</th>
                              <th className="px-4 py-3.5 text-center w-24 bg-indigo-50/20 text-indigo-900">Hóa đơn</th>
                              <th className="px-4 py-3.5 w-64 border-l border-slate-200 bg-amber-50/20 text-amber-900">Mối quan tâm</th>
                              <th className="px-4 py-3.5 w-56 bg-amber-50/20 text-amber-900">Quà tặng áp dụng</th>
                              <th className="px-4 py-3.5 w-48 bg-amber-50/20 text-amber-900">Kênh tiếp cận</th>
                              <th className="px-4 py-3.5 w-44 border-l border-slate-200 bg-emerald-50/20 text-emerald-900">Nhân sự tư vấn</th>
                              <th className="px-4 py-3.5 w-44 bg-emerald-50/20 text-emerald-900">Người chăm sóc</th>
                              <th className="px-4 py-3.5 text-center w-28 border-l border-slate-200 bg-slate-100 text-slate-700">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {getPurchaseHistories(detailCustomer).filter(h => h.date || h.products || h.invoiceLink).length > 0 ? (
                              getPurchaseHistories(detailCustomer)
                                .filter(h => h.date || h.products || h.invoiceLink)
                                .map((history, index) => (
                                  <tr key={history.id || index} className="hover:bg-slate-50/40 transition-colors align-top divide-x divide-slate-100">
                                    <td className="px-4 py-4 font-semibold text-slate-400 text-center">{index + 1}</td>
                                    <td className="px-4 py-4 font-bold text-slate-900 whitespace-nowrap border-l border-slate-200 bg-indigo-50/5">
                                      {history.date || '---'}
                                    </td>
                                    <td className="px-4 py-4 text-slate-800 font-bold leading-relaxed break-words bg-indigo-50/5">
                                      {history.products || '---'}
                                    </td>
                                    <td className="px-4 py-4 text-center whitespace-nowrap bg-indigo-50/5">
                                      {history.invoiceLink ? (
                                        <div className="flex justify-center">
                                          <a
                                            href={history.invoiceLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block relative group w-12 h-12 border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                                            title="Nhấp để xem ảnh gốc"
                                          >
                                            <img src={history.invoiceLink} alt="Hóa đơn" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                              <span className="text-[9px] text-white font-bold uppercase tracking-widest">Xem</span>
                                            </div>
                                          </a>
                                        </div>
                                      ) : (
                                        <span className="text-slate-300 italic">Trống</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-slate-700 font-medium leading-relaxed break-words border-l border-slate-200 bg-amber-50/5">
                                      {history.issue || detailCustomer.issue || <span className="text-slate-400 italic">Chưa ghi nhận</span>}
                                    </td>
                                    <td className="px-4 py-4 text-slate-600 leading-relaxed break-words bg-amber-50/5">
                                      {history.promotions && history.promotions.length > 0 ? (
                                        history.promotions.map((p, idx) => (
                                          <div key={idx} className="mb-1.5 last:mb-0">
                                            <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] inline-block">{p.event}</span>
                                          </div>
                                        ))
                                      ) : detailCustomer.promotions && detailCustomer.promotions.length > 0 ? (
                                        detailCustomer.promotions.map((p, idx) => (
                                          <div key={idx} className="mb-1.5 last:mb-0">
                                            <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] inline-block">{p.event}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <span className="text-slate-400 italic">Không áp dụng</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 bg-amber-50/5">
                                      <div className="flex flex-wrap gap-1">
                                        {history.careMethods && history.careMethods.length > 0 ? (
                                          history.careMethods.map(m => (
                                            <span key={m} className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold shadow-3xs">{m}</span>
                                          ))
                                        ) : detailCustomer.careMethods && detailCustomer.careMethods.length > 0 ? (
                                          detailCustomer.careMethods.map(m => (
                                            <span key={m} className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold shadow-3xs">{m}</span>
                                          ))
                                        ) : (
                                          <span className="text-slate-300 italic">Trống</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap border-l border-slate-200 bg-emerald-50/5">
                                      {history.consultant ? (
                                        <span className="inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md text-[11px]">
                                          {STAFF_OPTIONS.find(s => s.value === history.consultant)?.label || history.consultant}
                                        </span>
                                      ) : detailCustomer.consultant ? (
                                        <span className="inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md text-[11px]">
                                          {STAFF_OPTIONS.find(s => s.value === detailCustomer.consultant)?.label || detailCustomer.consultant}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">Chưa chỉ định</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap bg-emerald-50/5">
                                      {history.careStaff ? (
                                        <span className="inline-block bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md text-[11px]">
                                          {STAFF_OPTIONS.find(s => s.value === history.careStaff)?.label || history.careStaff}
                                        </span>
                                      ) : detailCustomer.careStaff ? (
                                        <span className="inline-block bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md text-[11px]">
                                          {STAFF_OPTIONS.find(s => s.value === detailCustomer.careStaff)?.label || detailCustomer.careStaff}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">Chưa chỉ định</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-center whitespace-nowrap border-l border-slate-200 bg-slate-50/50">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const targetedFormData = {
                                            ...detailCustomer,
                                            singleDate: history.date || '',
                                            products: history.products || detailCustomer.products,
                                            invoiceLink: history.invoiceLink || detailCustomer.invoiceLink,
                                            issue: history.issue || detailCustomer.issue,
                                            careMethods: (history.careMethods && history.careMethods.length > 0) ? history.careMethods : detailCustomer.careMethods,
                                            promotions: (history.promotions && history.promotions.length > 0) ? history.promotions : detailCustomer.promotions,
                                            consultant: history.consultant || detailCustomer.consultant,
                                            careStaff: history.careStaff || detailCustomer.careStaff
                                          };
                                          setFormData(normalizeCustomerData(targetedFormData));
                                          setEditingId(detailCustomer.id);
                                          setEditingHistoryId(history.id);
                                          setDetailCustomerId(null);
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-xs text-[11px]"
                                      >
                                        Sửa đơn này
                                      </button>
                                    </td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td colSpan="9" className="text-xs text-slate-400 italic p-6 text-center">Chưa có lịch sử giao dịch phân tách độc lập.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: CHĂM SÓC KHÁCH HÀNG (STAFF XỬ LÝ) */}
        {currentTab === 1 && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-xs">
              <div className="flex-1 min-w-[280px]">
                <input type="text" placeholder="Tìm kiếm nhanh tên, SĐT hoặc Email khách hàng cần chăm sóc hôm nay..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={csmSearch} onChange={e => setCrmSearch(e.target.value)} />
              </div>
              <select className="w-[200px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={csmFilterStage} onChange={e => setCsmFilterStage(e.target.value)}>
                <option value="">Lọc theo Giai đoạn</option>
                {LABELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <select className="w-[200px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={csmFilterStatus} onChange={e => setCsmFilterStatus(e.target.value)}>
                <option value="all">Tất cả tiến độ chăm sóc</option>
                <option value="checked">Đã hoàn tất chăm sóc</option>
                <option value="unchecked">Chưa hoàn tất chăm sóc</option>
              </select>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4 text-center w-24">Hoàn tất</th>
                    <th className="px-6 py-4 w-80">Thông tin Khách hàng bổ nhiệm</th>
                    <th className="px-6 py-4 w-72">Kênh thông tin liên lạc an toàn</th>
                    <th className="px-6 py-4 w-80">Ghi chú & Nội dung chăm sóc khách hàng</th>
                    <th className="px-6 py-4 w-60">Chỉ số hành vi phản hồi đo lường</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {activeCareList
                    .filter(c => {
                      const matchText = csmSearch === '' || c.fullName.toLowerCase().includes(csmSearch.toLowerCase()) || c.phone.includes(csmSearch) || c.email.toLowerCase().includes(csmSearch.toLowerCase());
                      const matchStage = csmFilterStage === '' || c.stage === csmFilterStage;
                      const matchStatus = csmFilterStatus === 'all' || (csmFilterStatus === 'checked' ? c.status === true : c.status === false);
                      return matchText && matchStage && matchStatus;
                    })
                    .map(care => (
                      <tr key={care.id} className={`transition-all ${care.status ? 'bg-slate-50/80 text-slate-400 line-through' : 'hover:bg-slate-50/40'}`}>
                        <td className="px-6 py-4 text-center">
                          <input type="checkbox" checked={care.status} onChange={e => updateCareData(care.id, { status: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-2xs" />
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <div className={`font-bold ${care.status ? 'text-slate-400' : 'text-slate-900'}`}>{care.fullName}</div>
                          <div className="text-xs text-slate-500">Ngày sinh: {care.birthday} | Địa chỉ: {care.address}</div>
                          <div className="text-xs pt-0.5">
                            <span className="font-semibold text-slate-400">Giai đoạn hiện tại: </span>
                            <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded border ${LABELS.find(l => l.value === care.stage)?.color}`}>{care.stage}</span>
                          </div>
                          <div className="text-xs text-slate-500 font-medium">Sản phẩm/Tư vấn: <span className="underline font-semibold text-slate-700">{care.products || 'Không có'}</span></div>
                        </td>
                        <td className="px-6 py-4 space-y-1 text-xs">
                          <div><span className="text-slate-400 font-medium">SĐT:</span> <span className={care.phone !== '********' ? 'text-slate-800 font-bold' : 'text-slate-300 italic'}>{care.phone}</span></div>
                          <div><span className="text-slate-400 font-medium">Email:</span> <span className={care.email !== '********' ? 'text-slate-800 font-bold' : 'text-slate-300 italic'}>{care.email}</span></div>
                          <div>
                            <span className="text-slate-400 font-medium">Facebook Messenger:</span> {care.facebook !== '********' && care.facebook ? (
                              <a href={care.facebook} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-semibold ml-1">Mở liên kết chat</a>
                            ) : <span className="text-slate-300 italic ml-1">********</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Select
                            placeholder="Chọn mẫu chuỗi chăm sóc gợi ý..."
                            options={CONTENT_SUGGESTIONS}
                            isClearable
                            isSearchable
                            value={CONTENT_SUGGESTIONS.find(opt => opt.value === care.careContent) || null}
                            onChange={(opt) => updateCareData(care.id, { careContent: opt ? opt.value : '' })}
                            className="text-xs"
                          />
                          <textarea placeholder="Ghi chú tay phản hồi của khách hàng (Lý do chưa chốt, hẹn thời gian gọi lại...)" className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={2} value={care.careContentCustom || ''} onChange={e => updateCareData(care.id, { careContentCustom: e.target.value })} />
                        </td>
                        <td className="px-6 py-4">
                          <input type="text" placeholder="Ví dụ: Đã mở 3/5 email, Click đường dẫn báo giá..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={care.behaviorMetrics} onChange={e => updateCareData(care.id, { behaviorMetrics: e.target.value })} />
                          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Nhập tay dữ liệu tương tác thực tế</p>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}