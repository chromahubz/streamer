const OBSWebSocket = require('obs-websocket-js').default;

class OBSService {
  constructor() {
    this.obs = new OBSWebSocket();
    this.isConnected = false;
    this.connectionInfo = null;
  }

  // Connect to OBS WebSocket
  async connect(url = 'ws://localhost:4455', password = '') {
    try {
      await this.obs.connect(url, password);
      this.isConnected = true;
      this.connectionInfo = { url, connectedAt: new Date().toISOString() };

      console.log('Connected to OBS WebSocket');

      // Setup event listeners
      this.setupEventListeners();

      return {
        success: true,
        version: await this.getVersion()
      };
    } catch (error) {
      console.error('OBS connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  // Disconnect from OBS
  async disconnect() {
    try {
      if (this.isConnected) {
        await this.obs.disconnect();
        this.isConnected = false;
        this.connectionInfo = null;
        console.log('Disconnected from OBS');
      }
      return { success: true };
    } catch (error) {
      console.error('OBS disconnect error:', error);
      throw error;
    }
  }

  // Get OBS version info
  async getVersion() {
    try {
      const version = await this.obs.call('GetVersion');
      return version;
    } catch (error) {
      console.error('OBS version error:', error);
      return null;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    this.obs.on('ConnectionClosed', () => {
      console.log('OBS connection closed');
      this.isConnected = false;
      this.connectionInfo = null;
    });

    this.obs.on('ConnectionError', (error) => {
      console.error('OBS connection error:', error);
      this.isConnected = false;
    });
  }

  // Get current scene
  async getCurrentScene() {
    try {
      const scene = await this.obs.call('GetCurrentProgramScene');
      return scene;
    } catch (error) {
      console.error('Get current scene error:', error);
      return null;
    }
  }

  // Get scene list
  async getSceneList() {
    try {
      const scenes = await this.obs.call('GetSceneList');
      return scenes;
    } catch (error) {
      console.error('Get scene list error:', error);
      return null;
    }
  }

  // Switch to scene
  async setCurrentScene(sceneName) {
    try {
      await this.obs.call('SetCurrentProgramScene', { sceneName });
      return { success: true, sceneName };
    } catch (error) {
      console.error('Set scene error:', error);
      throw error;
    }
  }

  // Create browser source for chat overlay
  async createBrowserSource(sceneName, sourceName, url, width = 400, height = 600) {
    try {
      const inputSettings = {
        url,
        width,
        height,
        fps: 30,
        shutdown: false
      };

      await this.obs.call('CreateInput', {
        sceneName,
        inputName: sourceName,
        inputKind: 'browser_source',
        inputSettings,
        sceneItemEnabled: true
      });

      return { success: true, sourceName };
    } catch (error) {
      console.error('Create browser source error:', error);
      throw error;
    }
  }

  // Get audio input list
  async getInputList() {
    try {
      const inputs = await this.obs.call('GetInputList');
      return inputs;
    } catch (error) {
      console.error('Get input list error:', error);
      return null;
    }
  }

  // Set audio source settings
  async setInputSettings(inputName, inputSettings) {
    try {
      await this.obs.call('SetInputSettings', {
        inputName,
        inputSettings,
        overlay: true
      });
      return { success: true };
    } catch (error) {
      console.error('Set input settings error:', error);
      throw error;
    }
  }

  // Send text to browser source (for chat overlay)
  async sendChatOverlayData(data) {
    try {
      // This would require a custom browser source that listens for data
      // Implementation depends on how the chat overlay is built
      console.log('Chat overlay data:', data);
      return { success: true };
    } catch (error) {
      console.error('Send chat overlay error:', error);
      throw error;
    }
  }

  // Get streaming status
  async getStreamStatus() {
    try {
      const status = await this.obs.call('GetStreamStatus');
      return status;
    } catch (error) {
      console.error('Get stream status error:', error);
      return null;
    }
  }

  // Start/Stop streaming
  async startStreaming() {
    try {
      await this.obs.call('StartStream');
      return { success: true };
    } catch (error) {
      console.error('Start streaming error:', error);
      throw error;
    }
  }

  async stopStreaming() {
    try {
      await this.obs.call('StopStream');
      return { success: true };
    } catch (error) {
      console.error('Stop streaming error:', error);
      throw error;
    }
  }

  // Get recording status
  async getRecordStatus() {
    try {
      const status = await this.obs.call('GetRecordStatus');
      return status;
    } catch (error) {
      console.error('Get record status error:', error);
      return null;
    }
  }

  // Start/Stop recording
  async startRecording() {
    try {
      await this.obs.call('StartRecord');
      return { success: true };
    } catch (error) {
      console.error('Start recording error:', error);
      throw error;
    }
  }

  async stopRecording() {
    try {
      await this.obs.call('StopRecord');
      return { success: true };
    } catch (error) {
      console.error('Stop recording error:', error);
      throw error;
    }
  }

  // Check connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionInfo: this.connectionInfo
    };
  }
}

module.exports = OBSService;
