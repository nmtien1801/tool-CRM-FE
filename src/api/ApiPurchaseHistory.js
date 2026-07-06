import ApiManager from "./ApiManager";

const ApiPurchaseHistory = {
  getCustomerPurchaseHistory: (customerId) => ApiManager.get(`/customers/${customerId}/purchase-history`),
  createPurchaseHistory: (customerId, data) => ApiManager.post(`/customers/${customerId}/purchase-history`, data),
  updatePurchaseHistory: (customerId, historyId, data) => ApiManager.put(`/customers/${customerId}/purchase-history/${historyId}`, data),
  deletePurchaseHistory: (customerId, historyId) => ApiManager.delete(`/customers/${customerId}/purchase-history/${historyId}`),
};

export default ApiPurchaseHistory;
