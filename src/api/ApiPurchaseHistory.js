import ApiManager from "./ApiManager";

const ApiPurchaseHistory = {
  // 1. GET: Truyền customerId qua query params (đối tham số thứ 2 của ApiManager.get)
  getCustomerPurchaseHistory: (customerId) => 
    ApiManager.get('/purchase-history', { customerId }),

  // 2. POST: Gộp customerId trực tiếp vào chung với object data gửi lên trong Body
  createPurchaseHistory: (customerId, data) => 
    ApiManager.post('/purchase-history', { customerId, ...data }),

  // 3. PUT: Giữ historyId trên URL theo cấu hình mới, truyền data chỉnh sửa lên
  updatePurchaseHistory: (historyId, data) => 
    ApiManager.put(`/purchase-history/${historyId}`, data),

  // 4. DELETE: Chỉ cần truyền historyId trên URL để xóa đúng bản ghi
  deletePurchaseHistory: (historyId) => 
    ApiManager.delete(`/purchase-history/${historyId}`),
};

export default ApiPurchaseHistory;