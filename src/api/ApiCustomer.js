import ApiManager from "./ApiManager";

const ApiCustomer = {
    getAllCustomers: () => ApiManager.get(`/customers`),
    getCustomerById: (id) => ApiManager.get(`/customers/${id}`),
    createCustomer: (data) => ApiManager.post(`/customers`, data),
    updateCustomer: (id, data) => ApiManager.put(`/customers/${id}`, data),
    deleteCustomer: (id) => ApiManager.delete(`/customers/${id}`),  
};

export default ApiCustomer;