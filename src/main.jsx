// electron/main.js

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
    // SỬA LỖI: Dùng '__dirname' (2 dấu gạch dưới)
    icon: path.join(__dirname, '../public/favicon.ico'),
  });

  // SỬA LỖI: Dùng '__dirname' (2 dấu gạch dưới)
  // Đường dẫn chính xác bây giờ là 'dist/index.html'
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  
  // Mở DevTools (Tùy chọn)
  // mainWindow.webContents.openDevTools(); 

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = decodeURI(request.url.replace('file:///', ''));
    callback(pathname);
  });
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';