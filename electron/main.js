import { app, BrowserWindow, Menu, net } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

// ĐỊA CHỈ IP VPS BACKEND CRM CỦA BẠN
const VPS_URL = "http://103.221.220.15:5000";

// LÁCH BẢO MẬT MẠNG NỘI BỘ (Cho phép Electron gọi HTTP lên IP VPS không có SSL)
app.commandLine.appendSwitch(
  "disable-features",
  "BlockInsecurePrivateNetworkRequests",
);
app.commandLine.appendSwitch("disable-web-security");

let mainWindow;

// AUTOMATION: TỰ ĐỘNG GỌI LÊN VPS QUÉT SINH NHẬT KHI VỪA BẬT TOOL
// async function checkBirthdaysFromVPS() {
//   try {
//     const response = await net.fetch(`${VPS_URL}/api/customers/birthdays-today`, { method: "GET" });
//     if (response.ok) {
//       const listBirthdays = await response.json();
//       if (listBirthdays && listBirthdays.length > 0 && mainWindow && !mainWindow.isDestroyed()) {
//         // Bắn dữ liệu về giao diện React hiển thị cảnh báo
//         mainWindow.webContents.send("notify:birthday-today", listBirthdays);
//       }
//     }
//   } catch (err) {
//     console.error("Không thể kết nối đến VPS để quét sinh nhật:", err.message);
//   }
// }

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 850,
    title: "CRM Tool - Hệ Thống Quản Lý Bán Lẻ & Online Course",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
    },
  });

  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  mainWindow.loadURL(startUrl);
  if (isDev) mainWindow.webContents.openDevTools();

  // Khi giao diện load xong -> Trigger quét sinh nhật từ VPS lập tức
  // mainWindow.webContents.on("did-finish-load", () => {
  //   checkBirthdaysFromVPS();
  // });

  // THANH MENU ĐIỀU HƯỚNG HỆ THỐNG
  const menuTemplate = [
    {
      label: "File",
      submenu: [
        {
          label: "Thông báo",
          click: () => mainWindow.webContents.send("navigate", "/dashboard"),
        },
        ,
        { label: "Thoát", role: "quit" },
      ],
    },
    {
      label: "Khách hàng",
      submenu: [
        {
          label: "Quản lý khách hàng (CMR)",
          click: () => mainWindow.webContents.send("navigate", "/dashboard"),
        },
        {
          label: "Quản lý chăm sóc khách hàng (CSM)",
          click: () => mainWindow.webContents.send("navigate", "/crm"),
        },
        { label: "Thoát", role: "quit" },
      ],
    },
    {
      label: "Kho hàng",
      submenu: [
        {
          label: "Quản lý kho hàng",
          click: () => mainWindow.webContents.send("navigate", "/dashboard"),
        },
        {
          label: "Quản lý xuất kho",
          click: () => mainWindow.webContents.send("navigate", "/crm"),
        },
        { label: "Thoát", role: "quit" },
      ],
    },
  ];

  if (isDev) {
    menuTemplate.push({
      label: "Dev",
      submenu: [
        { label: "Reload", role: "reload" },
        { label: "DevTools", role: "toggleDevTools" },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
