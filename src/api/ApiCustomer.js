import ApiManager from "./ApiManager";

const ApiCustomer = {
  getCustomers: (params) => ApiManager.get(`/customers`, { params }),
  createCustomer: (data) => ApiManager.post(`/customers`, data),
  updateCustomer: (id, data) => ApiManager.put(`/customers/${id}`, data),
  deleteCustomer: (id) => ApiManager.delete(`/customers/${id}`),
};

export default ApiCustomer;
