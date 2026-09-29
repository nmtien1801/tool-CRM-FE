import { app, BrowserWindow, Menu, net } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

let mainWindow;

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

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.loadURL(startUrl);
  // if (isDev) mainWindow.webContents.openDevTools();
  mainWindow.webContents.openDevTools();

  // THANH MENU ĐIỀU HƯỚNG HỆ THỐNG
  const menuTemplate = [
    {
      label: "File",
      submenu: [
        {
          label: "Dashboard",
          click: () => mainWindow.webContents.send("navigate", "/dashboard"),
        },
        {
          label: "Thông báo",
          click: () => mainWindow.webContents.send("navigate", "/Notification"),
        },
        { label: "Thoát", role: "quit" },
      ],
    },
    {
      label: "Khách hàng",
      submenu: [
        {
          label: "Quản lý khách hàng (CRM)",
          click: () => mainWindow.webContents.send("navigate", "/crm"),
        },
        {
          label: "Quản lý chăm sóc khách hàng (CSM)",
          click: () => mainWindow.webContents.send("navigate", "/csm"),
        },
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
