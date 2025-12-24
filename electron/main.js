const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'default',
    show: false,
  });

  // Load renderer
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Initialize screen capture service
const ScreenCaptureService = require('./services/screenCapture');
const screenCapture = new ScreenCaptureService();

// IPC Handlers for screen capture
ipcMain.handle('get-available-sources', async () => {
  return await screenCapture.getAvailableSources();
});

ipcMain.handle('start-chat-capture', async (event, sourceId, interval) => {
  screenCapture.startChatCapture(sourceId, interval, (screenshot) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('chat-screenshot', screenshot);
    }
  });
  return { success: true };
});

ipcMain.handle('start-gameplay-capture', async (event, sourceId, interval) => {
  screenCapture.startGameplayCapture(sourceId, interval, (screenshot) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gameplay-screenshot', screenshot);
    }
  });
  return { success: true };
});

ipcMain.handle('stop-chat-capture', async () => {
  screenCapture.stopChatCapture();
  return { success: true };
});

ipcMain.handle('stop-gameplay-capture', async () => {
  screenCapture.stopGameplayCapture();
  return { success: true };
});

// Window control handlers
ipcMain.handle('minimize-window', async () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('maximize-window', async () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', async () => {
  if (mainWindow) mainWindow.close();
});

// Clean up on app quit
app.on('will-quit', () => {
  screenCapture.stopAll();
});

module.exports = { mainWindow };
