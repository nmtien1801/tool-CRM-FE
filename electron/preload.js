import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Lắp đường ống nhận dữ liệu nhắc sinh nhật từ VPS bắn về giao diện React
  onBirthdayReminder: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on("notify:birthday-today", subscription);
    return () => ipcRenderer.removeListener("notify:birthday-today", subscription);
  },
  
  // Lắng nghe điều hướng trang từ Menu File hệ thống
  onNavigate: (callback) => {
    const subscription = (event, path) => callback(path);
    ipcRenderer.on("navigate", subscription);
    return () => ipcRenderer.removeListener("navigate", subscription);
  }
});