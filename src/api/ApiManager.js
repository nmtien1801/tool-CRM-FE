import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const API_SECRET_KEY = import.meta.env.VITE_API_SECRET_KEY;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  responseType: "json",
});

// 🧩 Interceptor request - Chỉ truyền thông tin User và mã Key xác thực xuống BE
api.interceptors.request.use((config) => {
  let headerValue = null;

  try {
    headerValue = JSON.parse(localStorage.getItem("userInfo"));
  } catch (parseError) {
    console.warn("ApiManager: invalid userInfo in localStorage", parseError);
  }

  // Luôn đính kèm mã xác thực Key vào Header
  config.headers["x-api-key"] = API_SECRET_KEY;

  if (headerValue) {
    config.headers["UserID"] = headerValue.id;
    config.headers["UserName"] = encodeURIComponent(headerValue.userName);
  }
  return config;
});

// 🧩 Interceptor response
api.interceptors.response.use(
  (response) => (response && response.data ? response.data : response),
  async (error) => {
    const status = error.response?.status || 500;

    switch (status) {
      case 401: {
        const path = window.location.pathname;
        const publicPaths = ["/", "/login", "/forgot-password"];

        // Nếu đang ở trang public, bỏ qua
        if (publicPaths.includes(path)) {
          return Promise.reject(error);
        }

        // Nếu không được xác thực, xóa session và redirect về login
        localStorage.removeItem("userInfo");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      case 400: {
        return error.response.data; // Bad request
      }

      case 404:
      case 403:
      case 409:
      case 422: {
        return Promise.reject(error);
      }

      default: {
        return Promise.reject(error); // Lỗi server bất ngờ
      }
    }
  },
);

// 🧩 Wrapper API
export const ApiManager = {
  get: async (url, data) => {
    const res = await api.get(url, { params: data });
    return res;
  },
  post: async (url, body, query) => {
    if (body instanceof FormData) {
      const config = { params: query };
      config.headers = {
        "Content-Type": "multipart/form-data",
      };
      const res = await api.post(url, body, config);
      return res;
    }
    const res = await api.post(url, body, { params: query });
    return res;
  },
  put: async (url, data, query) => {
    if (data instanceof FormData) {
      const config = { params: query };
      config.headers = {
        "Content-Type": "multipart/form-data",
      };
      const res = await api.put(url, data, config);
      return res;
    }
    const res = await api.put(url, data);
    return res;
  },
  delete: async (url, data) => {
    const res = await api.delete(url, { data });
    return res;
  },
  patch: async (url, data) => {
    const res = await api.patch(url, data);
    return res;
  },
  getImageBinary: async (urlPath) => {
    const response = await api.get(urlPath, {
      responseType: "arraybuffer",
    });
    return response;
  },
};

export default ApiManager;
