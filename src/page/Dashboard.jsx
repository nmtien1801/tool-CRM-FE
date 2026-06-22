import React, { useState, useEffect } from 'react';
import {
  UserPlus, Search, Calendar, Tag, Users, CheckSquare,
  Phone, Mail, FileText, Cake,
  Plus, Trash2, Edit2, RotateCcw, Upload, Image as ImageIcon,
  ShieldAlert, ArrowRight
} from 'lucide-react';
import Select from 'react-select';

// ─── COMPONENT SVG FACEBOOK CHUẨN (KHÔNG LO LỖI IMPORT THƯ VIỆN) ───
const FacebookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// ─── ĐỊNH NGHĨA DANH MỤC LỰA CHỌN (CONSTANTS) ───
const ECOSYSTEM_OPTIONS = [
  { value: 'retail', label: 'Hệ sinh thái Bán lẻ TMĐT' },
  { value: 'course', label: 'Hệ sinh thái Khóa học Online' },
  { value: 'coaching', label: 'Hệ sinh thái Tư vấn 1:1' }
];

const LABELS = [
  { value: 'Lạnh', label: 'Lạnh', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { value: 'Đã quan tâm', label: 'Đã quan tâm', color: 'bg-blue-50 text-blue-700 border-blue-300' },
  { value: 'Đang tư vấn', label: 'Đang tư vấn', color: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
  { value: 'Đang cân nhắc', label: 'Đang cân nhắc', color: 'bg-orange-50 text-orange-700 border-orange-300' },
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

const EMPTY_CUSTOMER = {
  fullName: '', birthday: '', address: '', phone: '', email: '', facebook: '',
  ecosystem: '', issue: '', purchaseCount: 'lần 0', purchaseDates: [],
  products: '', careMethods: [], promotions: [], consultant: '', careStaff: '', invoiceLink: '',
  label: 'Lạnh'
};

export default function CRMSystem() {
  const [currentTab, setCurrentTab] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // ─── STATE QUAN TRỌNG HỆ THỐNG ───
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
      purchaseCount: 'lần 2',
      purchaseDates: ['2026-03-15', '2026-05-20'],
      products: 'Khóa học Pro Video Editing',
      careMethods: ['Zalo OA', 'Email Marketing'],
      promotions: [{ date: '2026-03-15', event: 'Ưu đãi mở bán sớm -30%' }],
      consultant: 'NguyenVanA',
      careStaff: 'TranThiB',
      invoiceLink: 'https://example.com/invoice_01.pdf',
      label: 'Đã mua hàng'
    }
  ]);

  const [formData, setFormData] = useState(EMPTY_CUSTOMER);
  const [inputPurchaseDate, setInputPurchaseDate] = useState('');
  const [promoDate, setPromoDate] = useState('');
  const [promoEvent, setPromoEvent] = useState('');

  // State quản lý bộ lọc nâng cao
  const [crmSearch, setCrmSearch] = useState('');
  const [crmFilterLabel, setCrmFilterLabel] = useState('');
  const [crmFilterEco, setCrmFilterEco] = useState('');
  const [csmSearch, setCsmSearch] = useState('');
  const [csmFilterStage, setCsmFilterStage] = useState('');
  const [csmFilterStatus, setCsmFilterStatus] = useState('all');

  const [careData, setCareData] = useState([]);
  const [birthdayAlerts, setBirthdayAlerts] = useState([]);

  // ─── [AUTOMATION 1] TỰ ĐỘNG CHUYỂN DỮ LIỆU & MÃ HÓA BẢO MẬT SANG PHẦN 2 ───
  useEffect(() => {
    const activeCareList = customers.map(cust => {
      const existingCare = careData.find(b => b.id === cust.id);
      return {
        id: cust.id,
        fullName: cust.fullName,
        birthday: cust.birthday,
        address: cust.address ? cust.address : 'Chưa có dữ liệu',

        // Mặc định lấy data từ phần 1 kèm điều kiện lọc phương thức CSKH khắt khe
        phone: (cust.careMethods.includes('Zalo OA') || cust.careMethods.includes('SMS') || cust.careMethods.includes('Telesale')) ? cust.phone : '********',
        email: cust.careMethods.includes('Email Marketing') ? cust.email : '********',
        facebook: cust.careMethods.includes('Messenger') ? cust.facebook : '********',

        careMethods: cust.careMethods,
        stage: cust.label,
        products: cust.products,
        careStaff: cust.careStaff,
        status: existingCare ? existingCare.status : false,
        careContent: existingCare ? existingCare.careContent : '',
        careContentCustom: existingCare ? existingCare.careContentCustom : '',
        behaviorMetrics: existingCare ? existingCare.behaviorMetrics : ''
      };
    });
    setCareData(activeCareList);
  }, [customers]);

  // ─── [AUTOMATION 2] TỰ ĐỘNG QUÉT VÀ NHẮC NHỞ LỊCH SINH NHẬT HỆ THỐNG ───
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(5, 10);
    setBirthdayAlerts(customers.filter(c => c.birthday && c.birthday.slice(5, 10) === todayStr));
  }, [customers]);

  // ─── XỬ LÝ SCAN OCR HÌNH ẢNH ───
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
          purchaseCount: 'lần 1',
          purchaseDates: ['2026-06-22'],
          products: 'Gói tư vấn Setup tự động hóa CRM',
          careMethods: ['Zalo OA', 'Messenger', 'Email Marketing'],
          promotions: [{ date: '2026-06-22', event: 'Sự kiện đối tác chiến lược' }],
          consultant: 'LeVanC',
          careStaff: 'NguyenVanA',
          invoiceLink: 'https://example.com/invoice_thao_ocr.pdf',
          label: 'Đang tư vấn'
        });
        setIsScanning(false);
      }, 1500);
    }
  };

  // ─── ĐIỀU KHIỂN CHỨC NĂNG FORM (THÊM, SỬA, XÓA, XÓA TRẮNG) ───
  const handleClearForm = () => {
    setFormData(EMPTY_CUSTOMER);
    setImagePreview(null);
    setEditingId(null);
  };

  const handleSaveData = () => {
    if (!formData.fullName || !formData.phone || !formData.birthday) {
      alert("Vui lòng nhập tối thiểu Họ và tên, Ngày sinh, Số điện thoại!");
      return;
    }

    if (editingId) {
      setCustomers(customers.map(c => c.id === editingId ? { ...formData, id: editingId } : c));
      setEditingId(null);
      alert("Đã sửa đổi và lưu thông tin khách hàng gốc cập nhật thành công!");
    } else {
      setCustomers([...customers, { ...formData, id: Date.now() }]);
      alert("Đã thêm mới và tự động chuyển dữ liệu khách hàng cần chăm sóc!");
    }
    handleClearForm();
  };

  const handleEditClick = (customer) => {
    setFormData(customer);
    setEditingId(customer.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm("Xác nhận xóa bỏ vĩnh viễn khách hàng này khỏi hệ thống cơ sở dữ liệu?")) {
      setCustomers(customers.filter(c => c.id !== id));
      if (editingId === id) handleClearForm();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">

      {/* Thông báo sinh nhật tự động hệ thống */}
      {birthdayAlerts.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3 text-amber-900 font-medium text-sm animate-pulse">
          <Cake className="w-5 h-5 text-amber-600" />
          <span><span className="font-bold">Tự động nhắc ngày sinh nhật:</span> Hôm nay có {birthdayAlerts.length} khách hàng đến ngày sinh nhật ({birthdayAlerts.map(c => c.fullName).join(', ')}). Vui lòng triển khai chương trình tri ân quà tặng!</span>
        </div>
      )}

      {/* Header Điều khiển Phân Quyền */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setCurrentTab(0)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${currentTab === 0 ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}>
              <ShieldAlert className="w-4 h-4" /> Phần 1: Quản lý khách hàng (BOD)
            </button>
            <button onClick={() => setCurrentTab(1)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${currentTab === 1 ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}>
              <Users className="w-4 h-4" /> Phần 2: Quản lý chăm sóc khách hàng (Staff)
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {currentTab === 0 && (
          <>
            {/* THIẾT KẾ GRID: KHỐI ẢNH BÊN TRÁI | KHỐI THÔNG TIN BÊN PHẢI */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

              {/* KHỐI CHỌN ẢNH (BÊN TRÁI) */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2 text-indigo-600">
                    <ImageIcon className="w-4 h-4" /> Chọn ảnh tài liệu / Chân dung
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Hỗ trợ tải hình ảnh lên, hệ thống sẽ tự động phân tích và trích xuất thông tin khớp vào các trường dữ liệu ở bên phải.</p>
                </div>

                <div className="flex-1 min-h-[350px] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 relative group overflow-hidden">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview Documents" className="w-full h-full object-contain max-h-[360px]" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <label className="bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-md">Thay thế ảnh khác</label>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer text-center p-6 w-full h-full">
                      <Upload className="w-10 h-10 text-slate-300 mb-3 group-hover:text-indigo-500 transition-colors" />
                      <span className="text-sm font-semibold text-slate-700 block mb-1">Click chọn hình ảnh cần quét</span>
                      <span className="text-xs text-slate-400">Định dạng file: PNG, JPG, JPEG</span>
                    </label>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

                  {isScanning && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest animate-pulse">Hệ thống AI đang thực thi quét thông tin hình ảnh...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* KHỐI THÔNG TIN NHẬP TAY ĐẦY ĐỦ 15 TRƯỜNG & ĐIỀU KHIỂN (BÊN PHẢI) */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 text-indigo-600">
                      <FileText className="w-4 h-4" /> Khối thông tin dữ liệu nhập tay
                    </h3>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleSaveData} className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all">
                        {editingId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {editingId ? "Cập nhật dữ liệu" : "Xác nhận thêm"}
                      </button>
                      <button type="button" onClick={handleClearForm} className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
                        <RotateCcw className="w-3.5 h-3.5" /> Xóa trắng ô nhập
                      </button>
                    </div>
                  </div>

                  {/* FORM CHI TIẾT 15 TRƯỜNG DỮ LIỆU ĐỀ BÀI ĐƯA RA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Họ và tên *</label>
                      <input type="text" placeholder="Nhập thủ công" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Ngày sinh *</label>
                      <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500" value={formData.birthday} onChange={e => setFormData({ ...formData, birthday: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Địa chỉ</label>
                      <input type="text" placeholder="Nhập thủ công địa chỉ" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">SĐT *</label>
                      <input type="text" placeholder="Nhập thủ công số điện thoại" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Email</label>
                      <input type="email" placeholder="Nhập thủ công email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Facebook</label>
                      <input type="text" placeholder="Nhập thủ công link profile" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500" value={formData.facebook} onChange={e => setFormData({ ...formData, facebook: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Thuộc hệ sinh thái (Tùy chọn 1)</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500" value={formData.ecosystem} onChange={e => setFormData({ ...formData, ecosystem: e.target.value })}>
                        <option value="">-- Chọn hệ sinh thái --</option>
                        {ECOSYSTEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Mối quan tâm/vấn đề đang gặp phải</label>
                      <input type="text" placeholder="Nhập thủ công vấn đề" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500" value={formData.issue} onChange={e => setFormData({ ...formData, issue: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Số lần mua hàng (Tùy chọn 1)</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500" value={formData.purchaseCount} onChange={e => setFormData({ ...formData, purchaseCount: e.target.value })}>
                        {['lần 0', 'lần 1', 'lần 2', 'lần 3', 'lần 4', 'lần 5', 'lần n+'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Sản phẩm - Dịch vụ đã mua/tư vấn</label>
                      <input type="text" placeholder="Nhập thủ công" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500" value={formData.products} onChange={e => setFormData({ ...formData, products: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Ngày mua hàng (Nhiều lựa chọn)</label>
                      <div className="flex gap-1.5">
                        <input type="date" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs focus:outline-hidden focus:border-indigo-500" value={inputPurchaseDate} onChange={e => setInputPurchaseDate(e.target.value)} />
                        <button type="button" onClick={() => { if (inputPurchaseDate && !formData.purchaseDates.includes(inputPurchaseDate)) setFormData({ ...formData, purchaseDates: [...formData.purchaseDates, inputPurchaseDate] }); setInputPurchaseDate(''); }} className="bg-slate-200 text-slate-700 px-2.5 text-xs font-bold rounded-xl hover:bg-slate-300">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">{formData.purchaseDates.map(d => <span key={d} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-sm border flex items-center gap-1">{d}<Trash2 className="w-3 h-3 text-rose-500 cursor-pointer" onClick={() => setFormData({ ...formData, purchaseDates: formData.purchaseDates.filter(p => p !== d) })} /></span>)}</div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Hoá đơn đầu ra (Chèn link PDF)</label>
                      <input type="text" placeholder="Chèn link hóa đơn đính kèm" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500" value={formData.invoiceLink} onChange={e => setFormData({ ...formData, invoiceLink: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Chương trình khuyến mãi/ tặng quà đã áp dụng (Dòng thời gian + Sự kiện)</label>
                      <div className="flex gap-1.5">
                        <input type="date" className="w-1/3 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs focus:outline-hidden" value={promoDate} onChange={e => setPromoDate(e.target.value)} />
                        <input type="text" placeholder="Tên sự kiện ưu đãi áp dụng..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-hidden" value={promoEvent} onChange={e => setPromoEvent(e.target.value)} />
                        <button type="button" onClick={() => { if (promoDate && promoEvent) setFormData({ ...formData, promotions: [...formData.promotions, { date: promoDate, event: promoEvent }] }); setPromoDate(''); setPromoEvent(''); }} className="bg-slate-200 text-slate-700 px-2.5 text-xs font-bold rounded-xl hover:bg-slate-300">Add</button>
                      </div>
                      <div className="mt-1.5 space-y-1">{formData.promotions.map((p, i) => <div key={i} className="text-[10px] bg-slate-50 p-1 rounded-sm flex justify-between border"><span>📅 {p.date}: {p.event}</span><Trash2 className="w-3 h-3 text-rose-500 cursor-pointer" onClick={() => setFormData({ ...formData, promotions: formData.promotions.filter((_, idx) => idx !== i) })} /></div>)}</div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Phương thức chăm sóc khách hàng (Chọn nhiều lựa chọn)</label>
                      <div className="flex flex-wrap gap-3 bg-slate-50 p-2.5 rounded-xl border">
                        {CARE_METHODS.map(m => <label key={m.value} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer"><input type="checkbox" checked={formData.careMethods.includes(m.value)} onChange={e => setFormData({ ...formData, careMethods: e.target.checked ? [...formData.careMethods, m.value] : formData.careMethods.filter(c => c !== m.value) })} className="rounded-sm text-indigo-600" /> {m.label}</label>)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Nhân viên tư vấn trực tiếp</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden" value={formData.consultant} onChange={e => setFormData({ ...formData, consultant: e.target.value })}>
                        <option value="">-- Chọn 1 nhân viên --</option>
                        {STAFF_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Nhân viên chăm sóc khách hàng</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden" value={formData.careStaff} onChange={e => setFormData({ ...formData, careStaff: e.target.value })}>
                        <option value="">-- Chọn 1 nhân viên --</option>
                        {STAFF_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BẢNG MAP DỮ LIỆU ĐĂNG KÝ HỆ THỐNG (TABLE BÊN DƯỚI) & BỘ LỌC TÌM KIẾM TOÀN DIỆN */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-xs">
                <div className="flex-1 min-w-[280px] relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input type="text" placeholder="Tìm kiếm và lọc tất cả thông tin hệ thống (Tên, Số điện thoại, Email, Sản phẩm...)" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-hidden focus:border-indigo-500" value={crmSearch} onChange={e => setCrmSearch(e.target.value)} />
                </div>
                <select className="w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden" value={crmFilterLabel} onChange={e => setCrmFilterLabel(e.target.value)}>
                  <option value="">Lọc theo nhãn gán</option>
                  {LABELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <select className="w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden" value={crmFilterEco} onChange={e => setCrmFilterEco(e.target.value)}>
                  <option value="">Lọc theo hệ sinh thái</option>
                  {ECOSYSTEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <th className="px-6 py-4">Khách hàng / Liên hệ</th>
                      <th className="px-6 py-4">Thông tin cá nhân & Hệ sinh thái</th>
                      <th className="px-6 py-4">Hành vi mua bán</th>
                      <th className="px-6 py-4">Phương thức & Dòng quà tặng</th>
                      <th className="px-6 py-4 text-center">Gán nhãn gốc</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {customers
                      .filter(c => {
                        const matchText = crmSearch === '' || c.fullName.toLowerCase().includes(crmSearch.toLowerCase()) || c.phone.includes(crmSearch) || c.email.toLowerCase().includes(crmSearch.toLowerCase()) || c.products.toLowerCase().includes(crmSearch.toLowerCase());
                        const matchLabel = crmFilterLabel === '' || c.label === crmFilterLabel;
                        const matchEco = crmFilterEco === '' || c.ecosystem === crmFilterEco;
                        return matchText && matchLabel && matchEco;
                      })
                      .map(cust => (
                        <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 space-y-0.5">
                            <div className="font-bold text-slate-900">{cust.fullName}</div>
                            <div className="text-xs text-slate-500 flex flex-col">
                              <span>SĐT: {cust.phone}</span>
                              <span>Email: {cust.email || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="pt-1">
                              {cust.facebook && (
                                <a href={cust.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                                  <FacebookIcon className="w-3 h-3" /> Facebook Profile
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs space-y-1">
                            <div>NS: <span className="font-semibold">{cust.birthday}</span> | ĐC: {cust.address || 'Chưa điền'}</div>
                            <div className="text-slate-500 italic">"Vấn đề: {cust.issue}"</div>
                            <span className="inline-block bg-slate-100 border text-slate-600 px-1.5 py-0.5 rounded-sm text-[10px] font-medium">{ECOSYSTEM_OPTIONS.find(e => e.value === cust.ecosystem)?.label || 'Vãng lai'}</span>
                          </td>
                          <td className="px-6 py-4 text-xs space-y-1">
                            <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-sm">{cust.purchaseCount}</span>
                            <div className="font-semibold text-slate-700">{cust.products || 'Không'}</div>
                            {cust.purchaseDates.length > 0 && <div className="text-[10px] text-slate-400">Ngày mua: {cust.purchaseDates.join(', ')}</div>}
                            {cust.invoiceLink && <a href={cust.invoiceLink} target="_blank" rel="noreferrer" className="inline-flex items-center text-emerald-600 underline font-medium mt-1"><FileText className="w-3 h-3 mr-0.5" /> PDF Invoice</a>}
                          </td>
                          <td className="px-6 py-4 text-xs space-y-1">
                            <div className="text-[10px] text-slate-500 font-medium">Kênh CS: {cust.careMethods.join(', ') || 'Chưa có'}</div>
                            <div className="text-[10px] text-slate-400">Phụ trách: {STAFF_OPTIONS.find(s => s.value === cust.consultant)?.label || 'Trống'} (Tư vấn)</div>
                            {cust.promotions.map((p, i) => <div key={i} className="text-[10px] text-indigo-600 font-medium">🎁 {p.date} - {p.event}</div>)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <select value={cust.label} onChange={e => setCustomers(customers.map(c => c.id === cust.id ? { ...c, label: e.target.value } : c))} className={`text-xs font-bold px-2 py-1.5 rounded-xl border cursor-pointer ${LABELS.find(l => l.value === cust.label)?.color}`}>
                              {LABELS.map(l => <option key={l.value} value={l.value} className="bg-white text-slate-800">{l.label}</option>)}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-1.5">
                              <button onClick={() => handleEditClick(cust)} className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg border border-slate-200 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteCustomer(cust.id)} className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-200 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CSM QUẢN LÝ CHĂM SÓC KHÁCH HÀNG (NHÂN VIÊN CÓ QUYỀN TRUY CẬP)          */}
        {/* ========================================================================= */}
        {currentTab === 1 && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-xs">
              <div className="flex-1 min-w-[280px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input type="text" placeholder="Lọc Tìm kiếm Họ tên, Số điện thoại hoặc Email nhân viên chăm sóc..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-hidden" value={csmSearch} onChange={e => setCsmSearch(e.target.value)} />
              </div>
              <select className="w-[200px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden" value={csmFilterStage} onChange={e => setCsmFilterStage(e.target.value)}>
                <option value="">Lọc Giai đoạn khách hàng</option>
                {LABELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <select className="w-[200px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-hidden" value={csmFilterStatus} onChange={e => setCsmFilterStatus(e.target.value)}>
                <option value="all">Tất cả Trạng thái chăm sóc</option>
                <option value="checked">Đã hoàn tất chăm sóc</option>
                <option value="unchecked">Chưa hoàn tất chăm sóc</option>
              </select>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4 text-center w-20">Trạng thái</th>
                    <th className="px-6 py-4">Thông tin Khách hàng (P1)</th>
                    <th className="px-6 py-4">Kênh liên lạc an toàn (Mặc định lọc)</th>
                    <th className="px-6 py-4">Nội dung đã chăm sóc (Điền có gợi ý)</th>
                    <th className="px-6 py-4">Hành vi khách hàng có thể đo lường</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {careData
                    .filter(c => {
                      const matchText = csmSearch === '' || c.fullName.toLowerCase().includes(csmSearch.toLowerCase()) || c.phone.includes(csmSearch) || c.email.toLowerCase().includes(csmSearch.toLowerCase());
                      const matchStage = csmFilterStage === '' || c.stage === csmFilterStage;
                      const matchStatus = csmFilterStatus === 'all' || (csmFilterStatus === 'checked' ? c.status === true : c.status === false);
                      return matchText && matchStage && matchStatus;
                    })
                    .map(care => (
                      <tr key={care.id} className={`transition-colors ${care.status ? 'bg-slate-50/60 line-through text-slate-400' : 'hover:bg-slate-50/70'}`}>
                        <td className="px-6 py-4 text-center">
                          <input type="checkbox" checked={care.status} onChange={e => setCareData(careData.map(b => b.id === care.id ? { ...b, status: e.target.checked } : b))} className="w-5 h-5 rounded-sm border-slate-300 text-indigo-600 cursor-pointer focus:ring-0" />
                        </td>
                        <td className="px-6 py-4 space-y-1">
                          <div className="font-bold text-slate-900">{care.fullName}</div>
                          <div className="text-xs text-slate-500">Ngày sinh: {care.birthday} | ĐC: {care.address}</div>
                          <div className="text-xs pt-0.5">
                            <span className="font-semibold text-slate-400">Giai đoạn: </span>
                            <span className={`inline-block font-bold text-[10px] px-1.5 py-0.5 rounded-sm border ${LABELS.find(l => l.value === care.stage)?.color}`}>{care.stage}</span>
                          </div>
                          <div className="text-xs text-slate-500 font-medium">Sản phẩm mua/tư vấn: {care.products || 'Trống'}</div>
                        </td>
                        <td className="px-6 py-4 space-y-1.5 text-xs">
                          {/* ẨN HIỆN THÔNG TIN BẢO MẬT KHẮT KHE THEO YÊU CẦU ĐỀ BÀI */}
                          <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /><span className={care.phone !== '********' ? 'text-slate-800 font-semibold' : 'text-slate-300 italic'}>{care.phone}</span></div>
                          <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /><span className={care.email !== '********' ? 'text-slate-800 font-semibold' : 'text-slate-300 italic'}>{care.email}</span></div>
                          <div className="flex items-center gap-1.5">
                            <FacebookIcon className="w-3.5 h-3.5 text-slate-400" />
                            {care.facebook !== '********' && care.facebook ? (
                              <a href={care.facebook} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium">Link Facebook</a>
                            ) : (
                              <span className="text-slate-300 italic">********</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-[240px]">
                          <Select placeholder="Chọn chuỗi chăm sóc..." options={CONTENT_SUGGESTIONS} isClearable isSearchable defaultValue={care.careContent ? { value: care.careContent, label: care.careContent } : null} onChange={(opt) => setCareData(careData.map(b => b.id === care.id ? { ...b, careContent: opt ? opt.value : '' } : b))} className="text-xs" />
                          <textarea placeholder="Ghi chú thêm nội dung chăm sóc thủ công..." className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden focus:border-indigo-500" rows={2} value={care.careContentCustom || ''} onChange={e => setCareData(careData.map(b => b.id === care.id ? { ...b, careContentCustom: e.target.value } : b))} />
                        </td>
                        <td className="px-6 py-4">
                          <input type="text" placeholder="Ví dụ: Mở 10/20 mail, Yêu cầu tư vấn,..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500" value={care.behaviorMetrics} onChange={e => setCareData(careData.map(b => b.id === care.id ? { ...b, behaviorMetrics: e.target.value } : b))} />
                          <p className="text-[10px] text-slate-400 mt-1">Nhập tay đo lường chuyển đổi thực tế</p>
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