const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Screen Capture
  getAvailableSources: () => ipcRenderer.invoke('get-available-sources'),
  startChatCapture: (sourceId, interval) => ipcRenderer.invoke('start-chat-capture', sourceId, interval),
  startGameplayCapture: (sourceId, interval) => ipcRenderer.invoke('start-gameplay-capture', sourceId, interval),
  stopChatCapture: () => ipcRenderer.invoke('stop-chat-capture'),
  stopGameplayCapture: () => ipcRenderer.invoke('stop-gameplay-capture'),

  // Screenshot events
  onChatScreenshot: (callback) => ipcRenderer.on('chat-screenshot', callback),
  onGameplayScreenshot: (callback) => ipcRenderer.on('gameplay-screenshot', callback),

  // Audio
  playTTS: (audioBuffer) => ipcRenderer.invoke('play-tts', audioBuffer),
  setVolume: (volume) => ipcRenderer.invoke('set-volume', volume),

  // OBS Integration
  connectToOBS: (url, password) => ipcRenderer.invoke('connect-obs', url, password),
  disconnectFromOBS: () => ipcRenderer.invoke('disconnect-obs'),

  // General
  minimize: () => ipcRenderer.invoke('minimize-window'),
  maximize: () => ipcRenderer.invoke('maximize-window'),
  close: () => ipcRenderer.invoke('close-window'),
});
