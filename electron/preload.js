import { contextBridge, ipcRenderer } from "electron";

// Lưu ref listener để có thể removeListener đúng cách
let navigateListener = null;

contextBridge.exposeInMainWorld("electronAPI", {
  // ── ĐÃ THÊM: Hàm cầu nối trung gian gửi gói JSON an toàn xuống Main Process ──
  sendToBackend: (endpoint, body) => ipcRenderer.invoke("call-backend-api", { endpoint, body }),

  // Chọn file video từ máy tính
  selectVideo: () => ipcRenderer.invoke("select-video"),

  // Lắng nghe navigate từ menu bar (Main process gửi xuống)
  onNavigate: (callback) => {
    // Xóa listener cũ nếu có để tránh duplicate
    if (navigateListener) {
      ipcRenderer.removeListener("navigate", navigateListener);
    }
    navigateListener = (_event, path) => callback(path);
    ipcRenderer.on("navigate", navigateListener);
  },

  // Cleanup navigate listener (gọi trong useEffect cleanup)
  removeNavigateListener: () => {
    if (navigateListener) {
      ipcRenderer.removeListener("navigate", navigateListener);
      navigateListener = null;
    }
  },
});