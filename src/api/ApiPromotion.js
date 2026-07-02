import ApiManager from "./ApiManager";

const ApiPromotion = {
  getList: (params) => ApiManager.get(`/promotion/getList`, { params }),
  create: (data) => ApiManager.post(`/promotion/create`, data),
  update: (data) => ApiManager.put(`/promotion/update`, data),
  delete: (id) => ApiManager.delete(`/promotion/delete/${id}`),
  getPromotionsByDate: (dateStr) =>
    ApiManager.get(`/promotion/check-date?date=${dateStr}`),
};

export default ApiPromotion;
