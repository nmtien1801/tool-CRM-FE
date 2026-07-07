import ApiManager from "./ApiManager";

const ApiCustomer = {
  getCustomers: (params) => ApiManager.get(`/customers`, params),
  getCustomerById: (id) => ApiManager.get(`/customers/${id}`),
  createCustomer: (data) => ApiManager.post(`/customers`, data),
  updateCustomer: (id, data) => ApiManager.put(`/customers/${id}`, data),
  deleteCustomer: (id) => ApiManager.delete(`/customers/${id}`),
};

export default ApiCustomer;
