const { app, BrowserWindow, protocol } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
    },
    // Icon (nếu có file icon trong public)
    icon: path.join(__dirname, '../public/favicon.ico'), 
  });

  // Tải file index.html từ thư mục dist
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  // Mở DevTools để kiểm tra lỗi (Tắt đi khi release thật)
  // mainWindow.webContents.openDevTools(); 

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});