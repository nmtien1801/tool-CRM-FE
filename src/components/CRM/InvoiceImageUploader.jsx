import React, { useState } from 'react';
import { ImageIcon, Trash2 } from 'lucide-react'; // Thêm Trash2 icon ở đây
import Tesseract from 'tesseract.js';

/**
 * InvoiceImageUploader
 *
 * Props:
 * - onExtracted(fields): callback khi AI đọc xong, trả về object chứa
 * các trường đã map đầy đủ từ hóa đơn
 */
export default function InvoiceImageUploader({ onExtracted }) {
  const [isScanning, setIsScanning] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Giải phóng URL cũ nếu có để tránh rò rỉ bộ nhớ
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
    setIsScanning(true);

    try {
      const { data: { text } } = await Tesseract.recognize(
        file,
        'vie+eng',
        { logger: (m) => console.log(`Tiến độ quét: ${Math.round(m.progress * 100)}%`) }
      );

      console.log('=== TOÀN BỘ CHỮ AI ĐỌC ĐƯỢC ===');
      console.log(text);
      console.log('=================================');

      // Khởi tạo toàn bộ các biến tương ứng 16 trường dữ liệu trên hóa đơn
      let extractedName = '';
      let extractedDob = '';
      let extractedAddress = '';
      let extractedPhone = '';
      let extractedEmail = '';
      let extractedFacebook = '';
      let extractedEcosystem = '';
      let extractedIssue = '';
      let extractedPurchaseCount = 'lần 1';
      let extractedPurchaseDates = [];
      let extractedProducts = '';
      let extractedCareMethods = [];
      let extractedPromotion = '';
      let extractedSalesConsultant = '';
      let extractedCsConsultant = '';
      let extractedInvoiceLink = '';

      const lines = text.split('\n');

      lines.forEach((line) => {
        const cleanLine = line.trim();

        // 1. Quét Họ và tên
        if (/(Họ tên|Họ và tên|Khách hàng|Người mua|Tên kh|Tên khách hàng):\s*(.*)/i.test(cleanLine)) {
          const match = cleanLine.match(/(Họ tên|Họ và tên|Khách hàng|Người mua|Tên kh|Tên khách hàng):\s*(.*)/i);
          if (match?.[2]) extractedName = match[2].trim();
        }

        // 2. Quét Ngày sinh
        if (/(Ngày sinh|Năm sinh|DOB|Birth):\s*(.*)/i.test(cleanLine)) {
          const match = cleanLine.match(/(Ngày sinh|Năm sinh|DOB|Birth):\s*(.*)/i);
          if (match?.[2]) {
            const dateParts = match[2].trim().match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
            if (dateParts) extractedDob = `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}`;
          }
        }

        // 3. Quét Địa chỉ (Đã escape \/ tránh lỗi Vite parse)
        if (/(Địa chỉ|Address|Nơi ở|Đ\/c):\s*(.*)/i.test(cleanLine)) {
          const match = cleanLine.match(/(Địa chỉ|Address|Nơi ở|Đ\/c):\s*(.*)/i);
          if (match?.[2]) extractedAddress = match[2].trim();
        }

        // 4. Quét Số điện thoại
        if (/(SĐT|Số ĐT|Điện thoại|Phone|Tel|Mobile):\s*(.*)/i.test(cleanLine)) {
          const match = cleanLine.match(/(SĐT|Số ĐT|Điện thoại|Phone|Tel|Mobile):\s*(.*)/i);
          if (match?.[2]) extractedPhone = match[2].replace(/\D/g, '').trim();
        }

        // 5. Quét Email
        const emailMatch = cleanLine.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) extractedEmail = emailMatch[0].trim();

        // 6. Quét Facebook
        if (/(Facebook|FB|Link FB|Profile):\s*(.*)/i.test(cleanLine)) {
          const match = cleanLine.match(/(Facebook|FB|Link FB|Profile):\s*(.*)/i);
          if (match?.[2]) extractedFacebook = match[2].trim();
        }

        // 7. Quét Hệ sinh thái
        if (/(Hệ sinh thái|Ecosystem|Thuộc nhóm):\s*(.*)/i.test(cleanLine)) {
          const match = cleanLine.match(/(Hệ sinh thái|Ecosystem|Thuộc nhóm):\s*(.*)/i);
          if (match?.[2]) extractedEcosystem = match[2].trim();
        }

        // 8. Quét Vấn đề / Nhu cầu
        if (/(Mối quan tâm|Vấn đề|Nhu cầu|Ghi chú|Issue):\s*(.*)/i.test(cleanLine)) {
          const match = cleanLine.match(/(Mối quan tâm|Vấn đề|Nhu cầu|Ghi chú|Issue):\s*(.*)/i);
          if (match?.[2]) extractedIssue = match[2].trim();
        }

        // 9. Quét Số lần mua hàng
        if (/(Số lần mua|Lần mua|Số đơn|Purchase Count):\s*(.*)/i.test(cleanLine)) {
          const match = cleanLine.match(/(Số lần mua|Lần mua|Số đơn|Purchase Count):\s*(lần \d+|lần n\+)/i);
          if (match?.[2]) extractedPurchaseCount = match[2].trim().toLowerCase();
        }

        // 10. Quét Lịch sử ngày mua hàng (Mảng chứa tất cả ngày dạng YYYY-MM-DD tìm thấy)
        const dateMatches = cleanLine.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g);
        if (dateMatches) {
          dateMatches.forEach(d => {
            const parts = d.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
            if (parts) {
              const formattedDate = `${parts[3]}-${parts[2]}-${parts[1]}`;
              if (formattedDate !== extractedDob && !extractedPurchaseDates.includes(formattedDate)) {
                extractedPurchaseDates.push(formattedDate);
              }
            }
          });
        }

        // 11. Quét Sản phẩm
        if (/(Sản phẩm|Dịch vụ|Khóa học|Nội dung|Tên hàng|Item):\s*(.*)/i.test(cleanLine)) {
          const match = cleanLine.match(/(Sản phẩm|Dịch vụ|Khóa học|Nội dung|Tên hàng|Item):\s*(.*)/i);
          if (match?.[2]) extractedProducts = match[2].trim();
        }

        // 12. Quét Phương thức CSKH (Zalo OA, SMS, Email Marketing...)
        const methodsKeywords = ['Email Marketing', 'SMS', 'Zalo OA', 'Telesale', 'Messenger'];
        methodsKeywords.forEach(method => {
          if (new RegExp(method, 'i').test(cleanLine) && !extractedCareMethods.includes(method)) {
            extractedCareMethods.push(method);
          }
        });

        // 13. Quét Chương trình khuyến mãi
        if (/(Khuyến mãi|Ưu đãi|Quà tặng|Voucher|Promotion):\s*(.*)/i.test(cleanLine)) {
          const match = cleanLine.match(/(Khuyến mãi|Ưu đãi|Quà tặng|Voucher|Promotion):\s*(.*)/i);
          if (match?.[2]) extractedPromotion = match[2].trim();
        }

        // 14. Quét Người tư vấn
        if (/(Nhân viên tư vấn|Sale|Người tư vấn|NVKD):\s*(.*)/i.test(cleanLine)) {
          const match = cleanLine.match(/(Nhân viên tư vấn|Sale|Người tư vấn|NVKD):\s*(.*)/i);
          if (match?.[2]) extractedSalesConsultant = match[2].trim();
        }

        // 15. Quét Người CSKH
        if (/(Nhân viên CSKH|Người chăm sóc|CSKH):\s*(.*)/i.test(cleanLine)) {
          const match = cleanLine.match(/(Nhân viên CSKH|Người chăm sóc|CSKH):\s*(.*)/i);
          if (match?.[2]) extractedCsConsultant = match[2].trim();
        }

        // 16. Quét Link hóa đơn đầu ra
        const pdfLinkMatch = cleanLine.match(/https?:\/\/[^\s]+\.pdf[^\s]*/i) || cleanLine.match(/https?:\/\/drive\.google\.com\/[^\s]+/i);
        if (pdfLinkMatch) {
          extractedInvoiceLink = pdfLinkMatch[0].trim();
        }
      });

      // Cơ chế fallback tìm số điện thoại đứng độc lập nếu không khớp từ khóa
      if (!extractedPhone) {
        const standalonePhone = text.match(/(0[3|5|7|8|9][0-9]{8})\b/);
        if (standalonePhone) extractedPhone = standalonePhone[1];
      }

      // Trả kết quả ra ngoài form chính
      onExtracted({
        fullName: extractedName,
        birthday: extractedDob, // Đổi từ dob -> birthday
        address: extractedAddress,
        phone: extractedPhone,
        email: extractedEmail,
        facebook: extractedFacebook,
        ecosystem: extractedEcosystem,
        issue: extractedIssue || (extractedProducts ? `[AI quét biên lai]: ${extractedProducts}. Nhu cầu hệ thống tự lưu.` : ''),

        // Xử lý purchaseCount về dạng Number như CRMSystem mong muốn
        purchaseCount: extractedPurchaseCount ? (parseInt(extractedPurchaseCount.replace(/\D/g, ''), 10) || 1) : 1,

        purchaseDates: extractedPurchaseDates.length > 0 ? extractedPurchaseDates : [''],
        products: extractedProducts,
        careMethods: extractedCareMethods,

        // Đổi promotionTimeline -> promotions và đưa về cấu trúc mảng object [{ event: ... }]
        promotions: extractedPromotion ? [{ event: extractedPromotion }] : [],

        consultant: extractedSalesConsultant, // Đổi từ salesConsultant -> consultant
        careStaff: extractedCsConsultant,     // Đổi từ csConsultant -> careStaff
        invoiceLink: extractedInvoiceLink,
        label: 'Đã mua hàng'                  // Đổi từ customerLabel -> label
      });

      alert('AI đã hoàn tất phân tích hình ảnh và tự động điền các trường khớp từ khóa!');
    } catch (error) {
      console.error('Lỗi công cụ OCR:', error);
      alert('Có lỗi xảy ra trong quá trình bóc tách chữ trên hình ảnh.');
    } finally {
      setIsScanning(false);
    }
  };

  // Hàm xử lý xóa ảnh
  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview); // Giải phóng bộ nhớ vùng nhận preview
    }
    setImagePreview(null);

    // Reset lại ô input file để nếu user chọn lại đúng file cũ thì vẫn kích hoạt onChange
    const fileInput = document.getElementById('vps-ocr-upload');
    if (fileInput) fileInput.value = '';

    // Tùy chọn: Xóa dữ liệu đã map ở form chính (nếu cần thiết)
    if (onExtracted) {
      onExtracted(null);
    }
  };

  return (
    <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 text-indigo-600">
          Hình ảnh hóa đơn/ form khách hàng
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Tải tài liệu lên để tự động phân tích trích xuất dữ liệu điền vào biểu mẫu.
        </p>
      </div>

      <div className="flex-1 min-h-[260px] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 relative group overflow-hidden">
        {imagePreview ? (
          <>
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-contain max-h-[300px]"
            />
            {/* Vùng overlay hiển thị khi hover chuột vào ảnh */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
              <label
                htmlFor="vps-ocr-upload"
                className="bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-md hover:bg-slate-100 transition-colors"
              >
                Thay đổi file
              </label>

              <button
                type="button"
                onClick={handleRemoveImage}
                className="bg-red-600 text-white p-2 rounded-xl text-xs font-semibold shadow-md hover:bg-red-700 transition-colors flex items-center gap-1"
                title="Xóa hình ảnh"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>
            </div>
          </>
        ) : (
          <label
            htmlFor="vps-ocr-upload"
            className="flex flex-col items-center justify-center cursor-pointer text-center p-6 w-full h-full"
          >
            <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm font-semibold text-slate-700 block mb-1">
              Nhấp để chọn file đính kèm
            </span>
            <span className="text-xs text-slate-400">Định dạng hỗ trợ: PNG, JPG, JPEG</span>
          </label>
        )}

        <input
          type="file"
          id="vps-ocr-upload"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        {isScanning && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest animate-pulse">
              AI đang xử lý dữ liệu đầu vào...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}