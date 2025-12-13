/**
 * File Tracker Service - Universal Module
 * 
 * Tracks file changes using modification time (mtime) instead of hash
 * Designed for both Inventory and Warehouse systems
 * 
 * Features:
 * - Fast mtime-based detection (no file reading)
 * - Intelligent skip logic with configurable windows
 * - Locked file handling with retry mechanism
 * - Per-file state tracking
 * - Memory-efficient cleanup
 * - Event-based architecture for extensibility
 * 
 * Usage:
 * const tracker = new FileTracker({
 *   skipWindow: 2000,        // Skip duplicates within 2 seconds
 *   reprocessWindow: 30000,  // Allow reprocess after 30 seconds
 *   lockRetryDelay: 1000     // Retry locked files after 1 second
 * });
 * 
 * tracker.trackFile(filePath);
 * const shouldProcess = tracker.shouldProcess(filePath);
 */

import fs from 'fs';
import path from 'path';

export class FileTracker {
  constructor(options = {}) {
    // Configuration
    this.skipWindow = options.skipWindow || 2000;           // Skip if processed within 2 sec
    this.reprocessWindow = options.reprocessWindow || 30000; // Reprocess after 30 sec
    this.lockRetryDelay = options.lockRetryDelay || 1000;   // Retry locked files after 1 sec
    this.maxTrackedFiles = options.maxTrackedFiles || 100;   // Max files to track (cleanup if exceeded)
    
    // File tracking state
    // Map<filePath, { filename, mtime, lastProcessedTime, lastCheckedMtime, lockRetries }>
    this.fileStates = new Map();
    
    // Callbacks
    this.onFileReady = options.onFileReady || null;
    this.onFileLocked = options.onFileLocked || null;
    this.onFileSkipped = options.onFileSkipped || null;
    
    // System type (for logging/identification)
    this.systemType = options.systemType || 'inventory'; // 'inventory' or 'warehouse'
  }

  /**
   * Check if file is locked (being written to)
   */
  isFileLocked(filePath, maxWait = 2000) {
    try {
      const startTime = Date.now();
      const tempPath = filePath + '.lock-check';
      
      // Try to open file in read mode
      const fd = fs.openSync(filePath, 'r');
      fs.closeSync(fd);
      
      return false; // File is accessible
    } catch (error) {
      return true; // File is locked
    }
  }

  /**
   * Get file's current modification time
   */
  getFileMtime(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.mtimeMs; // Milliseconds precision
    } catch (error) {
      return null; // File doesn't exist or can't access
    }
  }

  /**
   * Check if file should be processed
   * Returns: { should: boolean, reason: string, isLocked: boolean }
   */
  checkFile(filePath) {
    const fileName = path.basename(filePath);
    const currentMtime = this.getFileMtime(filePath);
    
    // File doesn't exist
    if (currentMtime === null) {
      return {
        should: false,
        reason: 'File not found',
        isLocked: false
      };
    }

    // First time seeing this file
    if (!this.fileStates.has(filePath)) {
      this.fileStates.set(filePath, {
        filename: fileName,
        mtime: currentMtime,
        lastProcessedTime: null,
        lastCheckedMtime: currentMtime,
        lockRetries: 0
      });
      
      return {
        should: true,
        reason: 'First time processing',
        isLocked: false
      };
    }

    const state = this.fileStates.get(filePath);
    const now = Date.now();
    const isLocked = this.isFileLocked(filePath);

    // File is locked - retry later
    if (isLocked) {
      state.lockRetries = (state.lockRetries || 0) + 1;
      
      return {
        should: false,
        reason: `File locked (retry ${state.lockRetries})`,
        isLocked: true
      };
    }

    // Reset lock retries if file was previously locked but now accessible
    state.lockRetries = 0;

    // File hasn't been modified since last check
    if (currentMtime === state.lastCheckedMtime) {
      return {
        should: false,
        reason: 'No file changes detected',
        isLocked: false
      };
    }

    // File was modified, check skip window
    if (state.lastProcessedTime !== null) {
      const timeSinceLastProcess = now - state.lastProcessedTime;
      
      // Within skip window - ignore duplicate saves
      if (timeSinceLastProcess < this.skipWindow) {
        return {
          should: false,
          reason: `Skipped (processed ${timeSinceLastProcess}ms ago)`,
          isLocked: false
        };
      }
      
      // Beyond skip window but within reprocess window - check if content changed
      if (timeSinceLastProcess < this.reprocessWindow && currentMtime === state.mtime) {
        return {
          should: false,
          reason: 'File not modified since last process',
          isLocked: false
        };
      }
    }

    // File is modified and ready to process
    return {
      should: true,
      reason: 'File modified and ready for processing',
      isLocked: false
    };
  }

  /**
   * Mark file as processed after successful sync
   */
  markAsProcessed(filePath) {
    const state = this.fileStates.get(filePath);
    if (!state) return;

    state.lastProcessedTime = Date.now();
    state.mtime = this.getFileMtime(filePath);
    state.lastCheckedMtime = state.mtime;
    state.lockRetries = 0;
  }

  /**
   * Update tracked mtime without marking as processed
   * Used when we check the file but don't process it
   */
  updateCheckedTime(filePath) {
    const state = this.fileStates.get(filePath);
    if (!state) return;

    state.lastCheckedMtime = this.getFileMtime(filePath);
  }

  /**
   * Clear tracking for a specific file
   */
  clearFile(filePath) {
    this.fileStates.delete(filePath);
  }

  /**
   * Clear all tracking data
   */
  clearAll() {
    this.fileStates.clear();
  }

  /**
   * Get tracking statistics
   */
  getStats() {
    const files = Array.from(this.fileStates.values());
    
    return {
      systemType: this.systemType,
      totalTrackedFiles: files.length,
      filesWithoutProcess: files.filter(f => f.lastProcessedTime === null).length,
      lastProcessedTimes: files.map(f => ({
        file: f.filename,
        mtime: f.mtime,
        lastProcessed: f.lastProcessedTime,
        age: f.lastProcessedTime ? Date.now() - f.lastProcessedTime : 'never'
      }))
    };
  }

  /**
   * Cleanup old entries if tracking map exceeds max size
   * Removes files that haven't been processed for longest time
   */
  cleanup() {
    if (this.fileStates.size <= this.maxTrackedFiles) return;

    // Sort by lastProcessedTime (oldest first)
    const sorted = Array.from(this.fileStates.entries())
      .sort((a, b) => {
        const timeA = a[1].lastProcessedTime || 0;
        const timeB = b[1].lastProcessedTime || 0;
        return timeA - timeB;
      });

    // Remove oldest entries until under max
    const toRemove = sorted.length - this.maxTrackedFiles;
    for (let i = 0; i < toRemove; i++) {
      this.fileStates.delete(sorted[i][0]);
    }
  }

  /**
   * Get formatted tracking info for logging
   */
  getTrackingInfo(filePath) {
    const state = this.fileStates.get(filePath);
    if (!state) return `Tracking: Not tracked`;

    const age = state.lastProcessedTime 
      ? `${Date.now() - state.lastProcessedTime}ms ago`
      : 'Never processed';

    return `Tracking: ${state.filename} (Last: ${age})`;
  }
}

export default FileTracker;
