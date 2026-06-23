import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { Edit, Trash2 } from 'lucide-react';
import Select from 'react-select';
import CustomerDetailModal from './CustomerDetailModal';

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
  const [isScanning, setIsScanning] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [detailCustomerId, setDetailCustomerId] = useState(null);
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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setIsScanning(true);

    // Đọc file thành base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: file.type || 'image/jpeg', data: base64 }
              },
              {
                type: 'text',
                text: `Phân tích hình ảnh hóa đơn/tài liệu này và trích xuất thông tin khách hàng. 
Trả về JSON thuần (không có markdown, không có backtick):
{
  "fullName": "họ và tên đầy đủ hoặc null",
  "birthday": "YYYY-MM-DD hoặc null",
  "address": "địa chỉ hoặc null",
  "phone": "số điện thoại hoặc null",
  "email": "email hoặc null",
  "facebook": "link facebook hoặc null",
  "products": "tên sản phẩm/dịch vụ đã mua hoặc null",
  "singleDate": "YYYY-MM-DD ngày mua/ngày trên hóa đơn hoặc null",
  "issue": "vấn đề/nhu cầu khách hàng nếu có hoặc null",
  "ecosystem": "retail hoặc course hoặc coaching hoặc null (dựa vào loại sản phẩm)"
}
Nếu không tìm thấy thông tin nào, trả về null cho trường đó. Chỉ trả về JSON.`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content?.map(c => c.text || '').join('') || '';

      let extracted = {};
      try {
        extracted = JSON.parse(text.replace(/```json|```/g, '').trim());
      } catch {
        console.error('Không parse được JSON từ Claude:', text);
      }

      // Merge dữ liệu trích xuất vào form, bỏ qua các trường null
      setFormData(prev => ({
        ...prev,
        ...(extracted.fullName && { fullName: extracted.fullName }),
        ...(extracted.birthday && { birthday: extracted.birthday }),
        ...(extracted.address && { address: extracted.address }),
        ...(extracted.phone && { phone: extracted.phone }),
        ...(extracted.email && { email: extracted.email }),
        ...(extracted.facebook && { facebook: extracted.facebook }),
        ...(extracted.products && { products: extracted.products }),
        ...(extracted.singleDate && { singleDate: extracted.singleDate }),
        ...(extracted.issue && { issue: extracted.issue }),
        ...(extracted.ecosystem && { ecosystem: extracted.ecosystem }),
      }));

    } catch (err) {
      console.error('Lỗi gọi Claude API:', err);
      alert('Không thể phân tích ảnh. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setIsScanning(false);
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

  const handleDeleteHistory = (customerId, historyId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.")) {
      return;
    }
    setCustomers(prevCustomers =>
      prevCustomers.map(cust => {
        if (cust.id !== customerId) return cust;
        const updatedHistories = (cust.purchaseHistories || []).filter(h => h.id !== historyId);
        const updatedProducts = updatedHistories.map(h => h.products).filter(Boolean).join(', ');
        const updatedInvoiceLink = updatedHistories.find(h => h.invoiceLink)?.invoiceLink || '';
        return {
          ...cust,
          purchaseHistories: updatedHistories,
          purchaseCount: updatedHistories.length,
          products: updatedProducts,
          invoiceLink: updatedInvoiceLink,
          purchaseDates: updatedHistories.map(h => h.date).filter(Boolean)
        };
      })
    );
    alert("Đã xóa giao dịch thành công!");
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
      <main className="max-w-[1600px] mx-auto px-4 py-8 space-y-8">
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

          {/* KHỐI THÔNG TIN BIỂU MẪU */}
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
                    {editingHistoryId ? 'Đang chỉnh sửa chi tiết 1 đơn hàng cụ thể.' : 'Đang chỉnh sửa toàn bộ thông tin gốc.'}
                  </div>
                )}

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
                      <input type="text" placeholder="Nhập địa chỉ cư trú" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 2: Kênh liên hệ</h4>
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
                      <input type="text" placeholder="Link Facebook" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.facebook} onChange={e => setFormData({ ...formData, facebook: e.target.value })} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hệ sinh thái</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" value={formData.ecosystem} onChange={e => setFormData({ ...formData, ecosystem: e.target.value })}>
                        <option value="">-- Click để chọn hệ sinh thái --</option>
                        {ECOSYSTEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 3: Lịch sử mua hàng</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tổng số lần đã mua hàng</label>
                        <input type="number" min="0" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs disabled:bg-slate-100" value={formData.purchaseCount || 0} disabled />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên sản phẩm đã mua</label>
                        <input type="text" placeholder="Chi tiết sản phẩm" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.products} onChange={e => setFormData({ ...formData, products: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày mua hàng</label>
                        <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.singleDate} onChange={e => setFormData({ ...formData, singleDate: e.target.value })} />
                      </div>
                    </div>
                    <div className="h-full flex flex-col">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ảnh hóa đơn đầu ra</label>
                      <div className="relative w-full h-[174px] bg-white border border-slate-200 hover:border-indigo-400 rounded-xl overflow-hidden shadow-sm flex-1 group">
                        <input type="file" accept="image/*" id="invoice-image-upload" className="hidden" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) setFormData({ ...formData, invoiceLink: URL.createObjectURL(file) });
                        }} />
                        {formData.invoiceLink && !formData.invoiceLink.endsWith('.pdf') ? (
                          <label htmlFor="invoice-image-upload" className="block w-full h-full cursor-pointer relative">
                            <img src={formData.invoiceLink} alt="Hóa đơn" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-white text-xs font-semibold bg-indigo-600 px-3 py-1.5 rounded-xl">Thay đổi hình ảnh</span>
                            </div>
                          </label>
                        ) : (
                          <label htmlFor="invoice-image-upload" className="w-full h-full cursor-pointer flex flex-col items-center justify-center gap-1.5 p-3 text-center bg-slate-50/50">
                            <ImageIcon className="w-5 h-5 text-indigo-500 animate-pulse" />
                            <span className="text-slate-700 text-xs font-semibold">Nhấp chọn ảnh hóa đơn</span>
                          </label>
                        )}
                        {formData.invoiceLink && (
                          <button type="button" onClick={() => setFormData({ ...formData, invoiceLink: '' })} className="absolute top-2 right-2 bg-rose-500 text-white w-5 h-5 flex items-center justify-center text-xs rounded-full">×</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 4: Chăm sóc & Tiếp thị</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mối quan tâm / Vấn đề</label>
                      <input type="text" placeholder="Nhu cầu khách hàng..." className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.issue} onChange={e => setFormData({ ...formData, issue: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Khuyến mãi áp dụng</label>
                      <div className="flex gap-1.5">
                        <select className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs" value={promoEvent} onChange={e => setPromoEvent(e.target.value)}>
                          <option value="">-- Chọn sự kiện khuyến mãi --</option>
                          {PROMO_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <button type="button" onClick={() => { if (promoEvent) setFormData({ ...formData, promotions: [...(formData.promotions || []), { event: promoEvent }] }); setPromoEvent(''); }} className="bg-indigo-50 text-indigo-700 px-3 text-xs font-bold rounded-xl border border-indigo-200">Thêm</button>
                      </div>
                      <div className="mt-1.5 space-y-1">{(formData.promotions || []).map((p, i) => <div key={i} className="text-[10px] bg-white p-2 rounded-lg flex justify-between items-center border border-slate-200"><span>Sự kiện: <strong className="text-indigo-600">{p.event}</strong></span><span className="text-rose-500 font-bold cursor-pointer" onClick={() => setFormData({ ...formData, promotions: formData.promotions.filter((_, idx) => idx !== i) })}>Gỡ</span></div>)}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phương thức chăm sóc (Chọn nhiều)</label>
                      <div className="flex flex-wrap gap-4 bg-white p-3 rounded-xl border border-slate-200">
                        {CARE_METHODS.map(m => <label key={m.value} className="flex items-center gap-2 text-xs font-medium cursor-pointer"><input type="checkbox" checked={(formData.careMethods || []).includes(m.value)} onChange={e => setFormData({ ...formData, careMethods: e.target.checked ? [...(formData.careMethods || []), m.value] : formData.careMethods.filter(c => c !== m.value) })} className="rounded text-indigo-600 focus:ring-indigo-500" /> {m.label}</label>)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 5: Phân sự nội bộ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nhân viên tư vấn</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.consultant} onChange={e => setFormData({ ...formData, consultant: e.target.value })}>
                        <option value="">-- Chọn nhân sự tư vấn --</option>
                        {STAFF_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nhân viên hậu mãi</label>
                      <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs" value={formData.careStaff} onChange={e => setFormData({ ...formData, careStaff: e.target.value })}>
                        <option value="">-- Chọn nhân sự hậu mãi --</option>
                        {STAFF_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nhóm 6: Trạng thái & Gán nhãn</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gán nhãn phân cấp</label>
                    <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-600" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })}>
                      {LABELS.map(l => <option key={l.value} value={l.value} className="text-slate-800 font-normal">{l.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU CRM CHÍNH */}
        <div className="space-y-4 pt-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-xs">
            <div className="flex-1 min-w-[280px]">
              <input type="text" placeholder="Tìm kiếm toàn bộ thông tin..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={crmSearch} onChange={e => setCrmSearch(e.target.value)} />
            </div>
            <select className="w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" value={crmFilterLabel} onChange={e => setCrmFilterLabel(e.target.value)}>
              <option value="">Lọc theo nhãn gán</option>
              {LABELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <select className="w-[180px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" value={crmFilterEco} onChange={e => setCrmFilterEco(e.target.value)}>
              <option value="">Lọc theo hệ sinh thái</option>
              {ECOSYSTEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px] table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-4 w-72">Thông tin cơ bản</th>
                  <th className="px-4 py-4 w-72">Kênh liên hệ</th>
                  <th className="px-4 py-4 w-72">Tổng số lần mua hàng</th>
                  <th className="px-4 py-4 w-48 text-center">Nhãn trạng thái</th>
                  <th className="px-4 py-4 w-44 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {getRenderedRows().map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors align-top">
                    <td className="px-3 py-3 space-y-1">
                      <span className="font-bold text-slate-900 text-sm block">{cust.fullName}</span>
                      <div><span className="text-slate-500">Ngày sinh:</span> <span className="font-medium text-slate-800">{cust.birthday}</span></div>
                      <div className="text-slate-600"><span className="text-slate-500">Địa chỉ:</span> <p className="inline break-words font-medium">{cust.address || 'Chưa cập nhật'}</p></div>
                    </td>
                    <td className="px-3 py-3 space-y-1">
                      <div><span className="text-slate-500">SĐT:</span> <span className="font-bold text-slate-900">{cust.phone}</span></div>
                      <div><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-800 break-all">{cust.email || 'Chưa điền'}</span></div>
                      <div><span className="text-slate-500">Facebook:</span> {cust.facebook ? <a href={cust.facebook} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium break-all">{cust.facebook}</a> : <span className="text-slate-400 italic">Trống</span>}</div>
                      <div className="pt-1"><span className="bg-slate-100 border text-slate-700 px-2 py-0.5 rounded-md font-medium text-[10px]">{ECOSYSTEM_OPTIONS.find(e => e.value === cust.ecosystem)?.label || 'Chưa chọn'}</span></div>
                    </td>
                    <td className="px-3 py-3 space-y-1">
                      <span className="font-bold text-indigo-600">lần {cust.purchaseCount}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <select value={cust.label} onChange={e => setCustomers(customers.map(c => c.id === cust.id ? { ...c, label: e.target.value } : c))} className={`text-xs font-bold px-2 py-1.5 rounded-xl border cursor-pointer w-full text-center transition-all ${LABELS.find(l => l.value === cust.label)?.color}`}>
                        {LABELS.map(l => <option key={l.value} value={l.value} className="bg-white text-slate-800 font-normal text-left">{l.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <button onClick={() => setDetailCustomerId(cust.id)} className="w-full py-1 text-[11px] bg-indigo-600 text-white rounded-lg border border-indigo-600">Xem chi tiết</button>
                        <button onClick={() => handleEditClick(cust)} className="w-full py-1 text-[11px] bg-slate-100 text-slate-700 rounded-lg border">Sửa thông tin</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL CHI TIẾT */}
        <CustomerDetailModal
          customer={detailCustomer}
          onClose={() => setDetailCustomerId(null)}
          staffOptions={STAFF_OPTIONS}
          getPurchaseHistoriesFn={getPurchaseHistories}
          onDeleteTransaction={(historyId) => handleDeleteHistory(detailCustomer.id, historyId)}
          onEditTransaction={(history) => {
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
        />
      </main>
    </div>
  );
}