// mockData.js

export const ECOSYSTEM_OPTIONS = [
  { value: "retail", label: "Bán lẻ TMĐT" },
  { value: "course", label: "Khóa học Online" },
  { value: "coaching", label: "Tư vấn 1:1" },
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
  purchaseHistories: [],
  careMethods: [],
  promotions: [],
  consultant: "",
  careStaff: "",
  invoiceLink: "",
  label: "Lạnh",
  singleDate: "",
};

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
    purchaseHistories: [
      {
        id: "1-0",
        date: "2026-03-15",
        products: "Khóa học Pro Video Editing",
        invoiceLink: "https://example.com/invoice_01.pdf",
        careMethods: ["Zalo OA", "Email Marketing", "Messenger"],
        promotions: [{ event: "Ưu đãi mở bán sớm -30%" }],
        consultant: "NguyenVanA",
        careStaff: "TranThiB",
        issue: "Cần tìm tool tối ưu quy trình render video tự động",
      },
      {
        id: "1-1",
        date: "2026-05-20",
        products: "Gói nâng cấp Pro Video Editing",
        invoiceLink: "https://example.com/invoice_02.pdf",
        careMethods: ["Zalo OA", "Email Marketing"],
        promotions: [{ event: "Ưu đãi mở bán sớm -40%" }],
        consultant: "TranThiB",
        careStaff: "LeVanC",
        issue: "Cần tìm tool tối ưu quy trình render video tự động",
      },
    ],
    label: "Đã mua hàng",
  },
];
