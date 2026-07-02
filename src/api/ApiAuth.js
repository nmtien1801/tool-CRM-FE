import ApiManager from "./ApiManager";

const ApiAuth = {
  LoginApi: (data) => ApiManager.post(`/auth/login`, data),
  createUser: (data) => ApiManager.post(`/auth/create-user`, data),
  deleteUser: (id) => ApiManager.delete(`/auth/delete-user/${id}`),
  resetPassword: (data) => ApiManager.post(`/auth/reset-password`, data),
  getListUser: (data) => ApiManager.get(`/auth/getListUser`),
};

export default ApiAuth;
