// mockData.js

export const ECOSYSTEM_OPTIONS = [
  { value: "CMIC_STUDIO", label: "CMIC STUDIO" },
  { value: "CMIC_MEDIA", label: "CMIC MEDIA" },
];

export const LABELS = [
  {
    value: "Lạnh",
    label: "Lạnh",
    color: "bg-gray-100 text-gray-700 border-gray-300",
  },
  {
    value: "Đã quan tâm",
    label: "Đã quan tâm",
    color: "bg-blue-50 text-blue-700 border-blue-300",
  },
  {
    value: "Đang tư vấn",
    label: "Đang tư vấn",
    color: "bg-yellow-50 text-yellow-700 border-yellow-300",
  },
  {
    value: "Đang cân nhắc",
    label: "Đang cân nhắc",
    color: "bg-orange-50 text-orange-700 border-orange-300",
  },
  {
    value: "báo giá",
    label: "Báo giá",
    color: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    value: "Follow Up",
    label: "Follow Up",
    color: "bg-purple-50 text-purple-700 border-purple-300",
  },
  {
    value: "Chưa chốt",
    label: "Chưa chốt",
    color: "bg-rose-50 text-rose-700 border-rose-300",
  },
  {
    value: "Đã mua hàng",
    label: "Đã mua hàng",
    color: "bg-green-50 text-green-700 border-green-300",
  },
  {
    value: "Đã quay lại",
    label: "Đã quay lại",
    color: "bg-emerald-100 text-emerald-800 border-emerald-400",
  },
  {
    value: "Đã giới thiệu bạn bè",
    label: "Đã giới thiệu bạn bè",
    color: "bg-teal-50 text-teal-700 border-teal-300",
  },
];

// Nhóm 3 bổ sung: phân loại hạng mục (bán / dịch vụ)
export const ITEM_TYPE_OPTIONS = [
  { value: "ban", label: "Bán" },
  { value: "dich_vu", label: "Dịch vụ" },
];

// Nhóm 4 bổ sung: phương thức thanh toán
export const PAYMENT_METHOD_OPTIONS = [
  { value: "momo", label: "Momo" },
  { value: "ngan_hang", label: "Ngân hàng" },
  { value: "tien_mat", label: "Tiền mặt" },
];

// Nhóm 4 bổ sung: nguồn khách hàng
export const CUSTOMER_SOURCE_OPTIONS = [
  { value: "fanpage", label: "Fanpage" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "zalo", label: "Zalo" },
  { value: "website", label: "Website" },
  { value: "partner", label: "Partner" },
  { value: "sale", label: "Sale" },
];

export const CARE_METHODS = [
  { value: "Email Marketing", label: "Email Marketing" },
  { value: "SMS", label: "SMS" },
  { value: "Zalo OA", label: "Zalo OA" },
  { value: "Telesale", label: "Telesale" },
  { value: "Messenger", label: "Messenger" },
];

export const STAFF_OPTIONS = [
  { value: "NguyenVanA", label: "Nguyễn Văn A" },
  { value: "TranThiB", label: "Trần Thị B" },
  { value: "LeVanC", label: "Lê Văn C" },
];

export const CONTENT_SUGGESTIONS = [
  { value: "Chuỗi email GĐ1", label: "Chuỗi email GĐ1 (Chào mừng)" },
  { value: "Chuỗi email GĐ2", label: "Chuỗi email GĐ2 (Bám đuôi)" },
  { value: "Tư vấn 1:1", label: "Tư vấn 1:1 qua Google Meet" },
  { value: "Gọi điện báo giá", label: "Gọi điện báo giá + Khuyến mãi" },
  { value: "Gửi tin nhắn Zalo", label: "Gửi tin nhắn ưu đãi Zalo OA" },
];

export const PROMO_OPTIONS = [
  { value: "Ưu đãi mở bán sớm -30%", label: "Ưu đãi mở bán sớm -30%" },
  { value: "Giảm 10% khách hàng mới", label: "Giảm 10% khách hàng mới" },
  { value: "Tặng kèm tài liệu VIP", label: "Tặng kèm tài liệu VIP" },
  { value: "Voucher 500k sinh nhật", label: "Voucher 500k sinh nhật" },
  { value: "Sự kiện đối tác chiến lược", label: "Sự kiện đối tác chiến lược" },
  { value: "Flash Sale Black Friday", label: "Flash Sale Black Friday" },
];

export const EMPTY_CUSTOMER = {
  fullName: "",
  birthday: "",
  address: "",
  phone: "",
  email: "",
  facebook: "",
  ecosystem: "",
  issue: "",
  purchaseCount: 0,
  purchaseDates: [],
  products: "",
  careMethods: [],
  promotions: [],
  consultant: "",
  careStaff: "",
  invoiceLink: "",
  label: "Lạnh",
  singleDate: "",
  // Nhóm 3 bổ sung: chi tiết hạng mục / báo giá
  category: "",
  itemType: "",
  quote: "",
  price: "",
  // Nhóm 4 bổ sung: thuê, thanh toán, nguồn khách hàng
  rentalDays: 0,
  paymentMethod: "",
  customerSource: "",
  // Nhóm 5 bổ sung: người bán
  seller: "",
};

// Danh sách khách hàng gốc (Đã lược bỏ purchaseHistories lồng bên trong)
export const INITIAL_CUSTOMERS = [
  {
    id: 1,
    fullName: "Nguyễn Minh Tiền",
    birthday: "2000-06-28",
    address: "Quận 1, TP. HCM",
    phone: "0912345678",
    email: "tien.nguyen@gmail.com",
    facebook: "https://fb.com/tiennguyen",
    ecosystem: "course",
    purchaseCount: 2,
    label: "Đã mua hàng",
  },
];

// Mảng lịch sử mua hàng được tách riêng biệt hoàn toàn, liên kết bằng định danh customerId
export const INITIAL_PURCHASE_HISTORIES = [
  {
    id: "1-0",
    customerId: 1,
    date: "2026-03-15",
    products: "Khóa học Pro Video Editing",
    invoiceLink: "https://example.com/invoice_01.pdf",
    careMethods: ["Zalo OA", "Email Marketing", "Messenger"],
    promotions: [{ event: "Ưu đãi mở bán sớm -30%" }],
    consultant: "NguyenVanA",
    careStaff: "TranThiB",
    issue: "Cần tìm tool tối ưu quy trình render video tự động",
    // Nhóm 3 bổ sung
    category: "Khóa học Video Editing",
    itemType: "dich_vu",
    quote: "2.500.000đ",
    price: "2.200.000đ",
    // Nhóm 4 bổ sung
    rentalDays: 0,
    paymentMethod: "ngan_hang",
    customerSource: "fanpage",
    // Nhóm 5 bổ sung
    seller: "NguyenVanA",
  },
  {
    id: "1-1",
    customerId: 1,
    date: "2026-05-20",
    products: "Gói nâng cấp Pro Video Editing",
    invoiceLink: "https://example.com/invoice_02.pdf",
    careMethods: ["Zalo OA", "Email Marketing"],
    promotions: [{ event: "Ưu đãi mở bán sớm -40%" }],
    consultant: "TranThiB",
    careStaff: "LeVanC",
    issue: "Cần tìm tool tối ưu quy trình render video tự động",
    // Nhóm 3 bổ sung
    category: "Gói nâng cấp Video Editing",
    itemType: "ban",
    quote: "1.000.000đ",
    price: "900.000đ",
    // Nhóm 4 bổ sung
    rentalDays: 0,
    paymentMethod: "momo",
    customerSource: "zalo",
    // Nhóm 5 bổ sung
    seller: "TranThiB",
  },
];
