import React, { useState } from 'react';
import { ImageIcon, Trash2 } from 'lucide-react';
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

  // Hàm chuyển đổi chuỗi sang không dấu để phục vụ so khớp từ khóa
  const removeAccents = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

      // XỬ LÝ ĐẶC BIỆT: Nối lại link Drive nếu bị AI cắt xuống dòng lỗi
      let chuẩnHóaText = text.replace(/(https?:\/\/drive\.google\.com\/[^\s]+)-\s*\n\s*([^\s]+)/gi, '$1-$2');
      chuẩnHóaText = chuẩnHóaText.replace(/(https?:\/\/drive\.google\.com\/[^\s]+)\s*\n\s*([^\s]*view)/gi, '$1/$2');

      // Chuyển toàn bộ văn bản sang không dấu để phục vụ so khớp Regex
      const textNoAccent = removeAccents(chuẩnHóaText);

      // Tách dòng đồng thời cả bản Gốc (có dấu) và bản Không Dấu
      const linesOriginal = chuẩnHóaText.split('\n');
      const linesNoAccent = textNoAccent.split('\n');

      linesNoAccent.forEach((lineNoAccent, index) => {
        const cleanLineNoAccent = lineNoAccent.trim();
        const cleanLineOriginal = linesOriginal[index]?.trim() || '';

        // 1. Quét Họ và tên
        if (/(ho ten|ho va ten|khach hang|nguoi mua|ten kh|ten khach hang):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) extractedName = match[1].trim();
        }

        // 2. Quét Ngày sinh
        if (/(ngay sinh|nam sinh|dob|birth):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) {
            const dateParts = match[1].trim().match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
            if (dateParts) extractedDob = `${dateParts[1]}/${dateParts[2]}/${dateParts[3]}`;
          }
        }

        // 3. Quét Địa chỉ
        if (/(dia chi|address|noi o|d\/c):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) extractedAddress = match[1].trim();
        }

        // 4. Quét Số điện thoại
        if (/(sdt|so\s*dt|dien thoai|phone|tel|mobile):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) extractedPhone = match[1].replace(/\D/g, '').trim();
        }

        // 5. Quét Email (Quét trực tiếp bằng Regex cấu trúc Email trên dòng gốc)
        const emailMatch = cleanLineOriginal.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+(?:[a-zA-Z]{2,}|com)/);
        if (emailMatch && !extractedEmail) {
          let emailStr = emailMatch[0].trim();
          if (emailStr.endsWith('gmailcom')) emailStr = emailStr.replace('gmailcom', 'gmail.com');
          extractedEmail = emailStr;
        }

        // 6. Quét Facebook
        if (/(facebook|fb|link fb|profile):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) extractedFacebook = match[1].trim();
        }

        // 7. Quét Hệ sinh thái
        if (/(he sinh thai|ecosystem|thuoc nhom):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) extractedEcosystem = match[1].trim();
        }

        // 8. Quét Vấn đề / Nhu cầu
        if (/(moi quan tam|van de|nhu cau|ghi chu|issue):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) extractedIssue = match[1].trim();
        }

        // 9. Quét Số lần mua hàng
        if (/(so lan mua|lan mua|so don|purchase count):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) extractedPurchaseCount = match[1].trim().toLowerCase();
        }

        // 10. Quét Ngày mua hàng
        if (/(ngay mua hang|cac ngay da mua hang):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) {
            const dateMatches = match[1].match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g);
            if (dateMatches) {
              dateMatches.forEach(d => {
                const parts = d.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
                if (parts) {
                  const formattedDate = `${parts[1]}/${parts[2]}/${parts[3]}`;
                  if (!extractedPurchaseDates.includes(formattedDate)) {
                    extractedPurchaseDates.push(formattedDate);
                  }
                }
              });
            }
          }
        }

        // 11. Quét Sản phẩm
        if (/(san pham|dich vu|khoa hoc|noi dung|ten hang|item):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) extractedProducts = match[1].trim();
        }

        // 12. Quét Phương thức CSKH
        const methodsKeywords = ['Email Marketing', 'SMS', 'Zalo OA', 'Telesale', 'Messenger'];
        methodsKeywords.forEach(method => {
          if (new RegExp(removeAccents(method), 'i').test(cleanLineNoAccent) && !extractedCareMethods.includes(method)) {
            extractedCareMethods.push(method);
          }
        });

        // 13. Quét Chương trình khuyến mãi
        if (/(khuyen mai|uu dai|qua tang|voucher|promotion):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) extractedPromotion = match[1].trim();
        }

        // 14. Quét Người tư vấn
        if (/(nhan vien tu van|sale|nguoi tu van|nvkd):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) extractedSalesConsultant = match[1].trim();
        }

        // 15. Quét Người CSKH
        if (/(nhan vien cskh|nguoi cham soc|cskh):\s*(.*)/i.test(cleanLineNoAccent)) {
          const match = cleanLineOriginal.match(/[^:]+:\s*(.*)/i);
          if (match?.[1]) {
            let staffName = match[1].trim();
            staffName = staffName.replace(/([a-zà-ỹ])([A-Z])/g, '$1 $2');
            extractedCsConsultant = staffName;
          }
        }

        // 16. Quét Link hóa đơn đầu ra
        const urlMatch = cleanLineOriginal.match(/https?:\/\/[^\s]+/i);
        if (urlMatch && (urlMatch[0].includes('drive.google') || urlMatch[0].includes('.pdf'))) {
          let fixedLink = urlMatch[0].trim();
          fixedLink = fixedLink.replace('-pgf-', '-pdf-');
          fixedLink = fixedLink.replace('demolview', 'demo/view');
          extractedInvoiceLink = fixedLink;
        }
      });

      if (!extractedPhone) {
        const standalonePhone = chuẩnHóaText.match(/(0[3|5|7|8|9][0-9]{8})\b/);
        if (standalonePhone) extractedPhone = standalonePhone[1];
      }

      onExtracted({
        fullName: extractedName,
        birthday: extractedDob,
        address: extractedAddress,
        phone: extractedPhone,
        email: extractedEmail,
        facebook: extractedFacebook,
        ecosystem: extractedEcosystem,
        issue: extractedIssue || (extractedProducts ? `[AI quét biên lai]: ${extractedProducts}. Nhu cầu hệ thống tự lưu.` : ''),
        purchaseCount: extractedPurchaseCount ? (parseInt(extractedPurchaseCount.replace(/\D/g, ''), 10) || 1) : 1,
        purchaseDates: extractedPurchaseDates.length > 0 ? extractedPurchaseDates : [''],
        products: extractedProducts,
        careMethods: extractedCareMethods,
        promotions: extractedPromotion ? [{ event: extractedPromotion }] : [],
        consultant: extractedSalesConsultant,
        careStaff: extractedCsConsultant,
        invoiceLink: extractedInvoiceLink,
        label: 'Đã mua hàng'
      });

      alert('AI đã hoàn tất phân tích hình ảnh và tự động điền các trường khớp từ khóa!');
    } catch (error) {
      console.error('Lỗi công cụ OCR:', error);
      alert('Có lỗi xảy ra trong quá trình bóc tách chữ trên hình ảnh.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);

    const fileInput = document.getElementById('vps-ocr-upload');
    if (fileInput) fileInput.value = '';

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
            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain max-h-[300px]" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
              <label htmlFor="vps-ocr-upload" className="bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-md hover:bg-slate-100 transition-colors">
                Thay đổi file
              </label>
              <button type="button" onClick={handleRemoveImage} className="bg-red-600 text-white p-2 rounded-xl text-xs font-semibold shadow-md hover:bg-red-700 transition-colors flex items-center gap-1" title="Xóa hình ảnh">
                <Trash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>
            </div>
          </>
        ) : (
          <label htmlFor="vps-ocr-upload" className="flex flex-col items-center justify-center cursor-pointer text-center p-6 w-full h-full">
            <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm font-semibold text-slate-700 block mb-1">Nhấp để chọn file đính kèm</span>
            <span className="text-xs text-slate-400">Định dạng hỗ trợ: PNG, JPG, JPEG</span>
          </label>
        )}

        <input type="file" id="vps-ocr-upload" accept="image/*" className="hidden" onChange={handleImageChange} />

        {isScanning && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest animate-pulse">AI đang xử lý dữ liệu đầu vào...</span>
          </div>
        )}
      </div>
    </div>
  );
}