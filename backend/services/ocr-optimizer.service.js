const crypto = require('crypto');

class OCROptimizerService {
  constructor() {
    this.screenshotCache = new Map(); // Hash -> timestamp
    this.lastChatActivity = Date.now();
    this.messageCount = 0;
    this.lastMessageCount = 0;

    // Configuration
    this.minInterval = 2000; // Minimum 2 seconds
    this.maxInterval = 10000; // Maximum 10 seconds when idle
    this.defaultInterval = 3000; // Default 3 seconds
    this.activityWindow = 30000; // 30 second window for activity detection

    // Cache settings
    this.cacheExpiryMs = 60000; // 1 minute cache expiry
    this.maxCacheSize = 100; // Maximum cached screenshots
  }

  /**
   * Calculate hash of screenshot for deduplication
   */
  calculateHash(screenshot) {
    try {
      // Extract base64 data if it's a data URL
      const base64Data = screenshot.includes('base64,')
        ? screenshot.split('base64,')[1]
        : screenshot;

      // Create hash of screenshot
      return crypto.createHash('md5').update(base64Data).digest('hex');
    } catch (error) {
      console.error('Hash calculation error:', error);
      return null;
    }
  }

  /**
   * Check if screenshot is duplicate (already processed recently)
   */
  isDuplicate(screenshot) {
    const hash = this.calculateHash(screenshot);
    if (!hash) return false;

    const cachedTime = this.screenshotCache.get(hash);
    if (cachedTime) {
      const age = Date.now() - cachedTime;
      if (age < this.cacheExpiryMs) {
        console.log(`Duplicate screenshot detected (cached ${Math.round(age / 1000)}s ago)`);
        return true;
      }
    }

    // Add to cache
    this.screenshotCache.set(hash, Date.now());

    // Clean old entries if cache is too large
    if (this.screenshotCache.size > this.maxCacheSize) {
      this.cleanCache();
    }

    return false;
  }

  /**
   * Clean expired entries from cache
   */
  cleanCache() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [hash, timestamp] of this.screenshotCache.entries()) {
      if (now - timestamp > this.cacheExpiryMs) {
        expiredKeys.push(hash);
      }
    }

    expiredKeys.forEach(key => this.screenshotCache.delete(key));

    console.log(`Cleaned ${expiredKeys.length} expired cache entries`);
  }

  /**
   * Update chat activity metrics
   */
  updateActivity(messageCount) {
    this.messageCount = messageCount;
    this.lastChatActivity = Date.now();
  }

  /**
   * Calculate optimal capture interval based on chat activity
   */
  getAdaptiveInterval() {
    const now = Date.now();
    const timeSinceActivity = now - this.lastChatActivity;
    const recentMessages = this.messageCount - this.lastMessageCount;

    // Very active (multiple messages in last 30s): use minimum interval
    if (recentMessages > 3 && timeSinceActivity < this.activityWindow) {
      console.log('Chat very active: using minimum interval (2s)');
      return this.minInterval;
    }

    // Moderate activity (some messages recently): use default interval
    if (timeSinceActivity < this.activityWindow) {
      console.log('Chat moderately active: using default interval (3s)');
      return this.defaultInterval;
    }

    // No recent activity: gradually increase interval
    const idleTime = Math.min(timeSinceActivity - this.activityWindow, 60000); // Cap at 1 minute
    const slowdownFactor = 1 + (idleTime / 60000); // Gradually slow down
    const adaptiveInterval = Math.min(
      this.defaultInterval * slowdownFactor,
      this.maxInterval
    );

    console.log(`Chat idle for ${Math.round(timeSinceActivity / 1000)}s: using ${Math.round(adaptiveInterval / 1000)}s interval`);
    return Math.round(adaptiveInterval);
  }

  /**
   * Reset activity tracking (e.g., when new messages detected)
   */
  resetActivity() {
    this.lastMessageCount = this.messageCount;
  }

  /**
   * Calculate pixel difference percentage between two screenshots
   */
  calculatePixelDifference(screenshot1, screenshot2) {
    try {
      // This is a simplified version - in production you'd use a proper image comparison library
      // For now, we'll compare the base64 strings

      const data1 = screenshot1.includes('base64,')
        ? screenshot1.split('base64,')[1]
        : screenshot1;
      const data2 = screenshot2.includes('base64,')
        ? screenshot2.split('base64,')[1]
        : screenshot2;

      if (data1 === data2) return 0;

      // Simple character-by-character comparison
      let differences = 0;
      const maxLength = Math.max(data1.length, data2.length);

      for (let i = 0; i < maxLength; i++) {
        if (data1[i] !== data2[i]) {
          differences++;
        }
      }

      return (differences / maxLength) * 100;
    } catch (error) {
      console.error('Pixel difference calculation error:', error);
      return 100; // Assume different on error
    }
  }

  /**
   * Determine if screenshot has changed significantly enough to process
   */
  hasSignificantChange(newScreenshot, oldScreenshot, threshold = 5) {
    if (!oldScreenshot) return true; // First screenshot, always process

    const difference = this.calculatePixelDifference(newScreenshot, oldScreenshot);
    const isSignificant = difference > threshold;

    if (!isSignificant) {
      console.log(`Screenshot change ${difference.toFixed(2)}% below threshold ${threshold}%, skipping OCR`);
    }

    return isSignificant;
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    return {
      cacheSize: this.screenshotCache.size,
      messageCount: this.messageCount,
      lastActivity: this.lastChatActivity,
      currentInterval: this.getAdaptiveInterval(),
      cacheExpiry: this.cacheExpiryMs,
      maxCacheSize: this.maxCacheSize
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.screenshotCache.clear();
    console.log('OCR optimizer cache cleared');
  }
}

module.exports = OCROptimizerService;
