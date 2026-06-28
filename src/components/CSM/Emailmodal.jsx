import React, { useState } from 'react';
import { X, Eye, Send, Mail } from 'lucide-react';

const EMAIL_TEMPLATES = [
  {
    id: 1,
    name: 'Chúc mừng thân thiện',
    subject: '🎂 Chúc mừng sinh nhật {{name}}!',
    body: `Xin chào {{name}},

Nhân ngày sinh nhật của bạn, toàn thể đội ngũ chúng tôi xin gửi đến bạn lời chúc mừng chân thành nhất!

🎉 Chúc bạn một ngày sinh nhật thật vui vẻ, tràn đầy niềm vui bên gia đình và những người thân yêu.

Cảm ơn bạn đã luôn đồng hành và tin tưởng chúng tôi. Chúng tôi rất trân trọng sự ủng hộ của bạn!

Trân trọng,
Đội ngũ chăm sóc khách hàng`,
  },
  {
    id: 2,
    name: 'Kèm ưu đãi',
    subject: '🎁 Quà sinh nhật đặc biệt dành riêng cho {{name}}',
    body: `Kính gửi {{name}},

Hôm nay là ngày đặc biệt của bạn — và chúng tôi muốn ghi dấu khoảnh khắc đó bằng một món quà nhỏ!

🎂 Chúc mừng sinh nhật {{name}}!

Để tri ân sự đồng hành của bạn, chúng tôi xin tặng bạn ưu đãi sinh nhật đặc biệt:
👉 Giảm 15% cho đơn hàng tiếp theo
👉 Miễn phí tư vấn 1:1 trong tháng sinh nhật

Ưu đãi có hiệu lực trong vòng 30 ngày kể từ hôm nay. Liên hệ ngay để không bỏ lỡ!

Một lần nữa, chúc bạn sinh nhật vui vẻ và nhiều sức khỏe!

Trân trọng,
Đội ngũ chăm sóc khách hàng`,
  },
  {
    id: 3,
    name: 'Trang trọng',
    subject: 'Lời chúc sinh nhật từ chúng tôi — {{name}}',
    body: `Kính gửi {{name}},

Nhân dịp sinh nhật của bạn, chúng tôi xin gửi đến bạn những lời chúc tốt đẹp nhất.

Chúc bạn luôn dồi dào sức khỏe, thành công trong công việc và hạnh phúc trong cuộc sống.

Sự tin tưởng và đồng hành của bạn là động lực lớn nhất để chúng tôi không ngừng cải thiện và nâng cao chất lượng dịch vụ.

Chúng tôi rất vinh hạnh được phục vụ bạn và mong tiếp tục được đồng hành cùng bạn trong thời gian tới.

Trân trọng,
Đội ngũ chăm sóc khách hàng`,
  },
];

function fillTemplate(template, customer) {
  const name = customer.fullName || '';
  return {
    subject: template.subject.replace(/{{name}}/g, name),
    body: template.body.replace(/{{name}}/g, name),
  };
}

export default function EmailModal({ customer, onClose, onSend }) {
  const [selectedId, setSelectedId] = useState(EMAIL_TEMPLATES[0].id);
  const [previewMode, setPreviewMode] = useState(false);
  const [sending, setSending] = useState(false);

  const selected = EMAIL_TEMPLATES.find((t) => t.id === selectedId);
  const filled = fillTemplate(selected, customer);

  const handleSend = async () => {
    setSending(true);
    // Gọi callback onSend khi tích hợp API sau
    await new Promise((r) => setTimeout(r, 800)); // placeholder
    if (onSend) onSend({ customer, template: selected, filled });
    setSending(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gửi email chúc sinh nhật</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đến:{' '}
                <span className="font-semibold text-slate-700">{customer.fullName}</span>
                {customer.email && (
                  <span className="text-slate-400"> — {customer.email}</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chọn mẫu */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Chọn mẫu email
          </p>
          <div className="flex flex-wrap gap-2">
            {EMAIL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedId(t.id); setPreviewMode(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  selectedId === t.id
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex gap-4 border-b border-slate-100">
          <button
            onClick={() => setPreviewMode(false)}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
              !previewMode
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Nội dung
          </button>
          <button
            onClick={() => setPreviewMode(true)}
            className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1 transition-colors ${
              previewMode
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Xem trước
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!previewMode ? (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tiêu đề
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium">
                  {filled.subject}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nội dung
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[180px]">
                  {filled.body}
                </div>
              </div>
            </>
          ) : (
            // Preview
            <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 w-14 shrink-0">Từ:</span>
                  <span className="font-medium text-slate-700">CRM System &lt;no-reply@crm.com&gt;</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 w-14 shrink-0">Đến:</span>
                  <span className="font-medium text-slate-700">
                    {customer.fullName}{customer.email ? ` <${customer.email}>` : ' (chưa có email)'}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-slate-400 w-14 shrink-0">Tiêu đề:</span>
                  <span className="font-semibold text-slate-900">{filled.subject}</span>
                </div>
              </div>
              <div className="px-5 py-5 bg-white text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {filled.body}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Đang gửi...' : 'Gửi mail'}
          </button>
        </div>

      </div>
    </div>
  );
}