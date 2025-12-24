const { desktopCapturer } = require('electron');

class ScreenCaptureService {
  constructor() {
    this.chatCaptureInterval = null;
    this.gameplayCaptureInterval = null;
    this.chatSourceId = null;
    this.gameplaySourceId = null;
  }

  // Get all available display sources (monitors and windows)
  async getAvailableSources() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 150, height: 150 }
      });

      return sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }));
    } catch (error) {
      console.error('Error getting sources:', error);
      throw error;
    }
  }

  // Capture screenshot from specific source
  async captureScreenshot(sourceId, size = { width: 1920, height: 1080 }) {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: size
      });

      const source = sources.find(s => s.id === sourceId);
      if (!source) {
        throw new Error(`Source ${sourceId} not found`);
      }

      // Return screenshot as base64 data URL
      return source.thumbnail.toDataURL();
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      throw error;
    }
  }

  // Start capturing chat monitor at intervals
  startChatCapture(sourceId, interval, callback) {
    this.stopChatCapture(); // Stop any existing capture

    this.chatSourceId = sourceId;
    this.chatCaptureInterval = setInterval(async () => {
      try {
        const screenshot = await this.captureScreenshot(sourceId, {
          width: 800,
          height: 1080
        });
        callback(screenshot);
      } catch (error) {
        console.error('Chat capture error:', error);
      }
    }, interval);

    console.log(`Started chat capture from source ${sourceId} every ${interval}ms`);
  }

  // Start capturing gameplay monitor at intervals
  startGameplayCapture(sourceId, interval, callback) {
    this.stopGameplayCapture(); // Stop any existing capture

    this.gameplaySourceId = sourceId;
    this.gameplayCaptureInterval = setInterval(async () => {
      try {
        const screenshot = await this.captureScreenshot(sourceId, {
          width: 1920,
          height: 1080
        });
        callback(screenshot);
      } catch (error) {
        console.error('Gameplay capture error:', error);
      }
    }, interval);

    console.log(`Started gameplay capture from source ${sourceId} every ${interval}ms`);
  }

  // Stop chat capture
  stopChatCapture() {
    if (this.chatCaptureInterval) {
      clearInterval(this.chatCaptureInterval);
      this.chatCaptureInterval = null;
      this.chatSourceId = null;
      console.log('Stopped chat capture');
    }
  }

  // Stop gameplay capture
  stopGameplayCapture() {
    if (this.gameplayCaptureInterval) {
      clearInterval(this.gameplayCaptureInterval);
      this.gameplayCaptureInterval = null;
      this.gameplaySourceId = null;
      console.log('Stopped gameplay capture');
    }
  }

  // Stop all captures
  stopAll() {
    this.stopChatCapture();
    this.stopGameplayCapture();
  }

  // Get current capture status
  getStatus() {
    return {
      chatCapture: {
        active: !!this.chatCaptureInterval,
        sourceId: this.chatSourceId
      },
      gameplayCapture: {
        active: !!this.gameplayCaptureInterval,
        sourceId: this.gameplaySourceId
      }
    };
  }
}

module.exports = ScreenCaptureService;
