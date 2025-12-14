/**
 * Upload Rate Limiter Service
 * 
 * Spreads uploads across multiple days to stay within Firebase Free Tier limits
 * 
 * Firebase Firestore Free Tier:
 * - 50,000 writes/day
 * - 20,000 reads/day
 * - 1GB storage
 * 
 * Default Strategy:
 * - Process 18,000 writes/day (safely under 50k limit)
 * - Spreads large imports over multiple days
 * - Queue persists between restarts
 * - Priority: Critical updates > New items > Updates
 */

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

const DEFAULT_DAILY_LIMIT = 18000; // Writes per day (safe under 50k free tier)
const QUEUE_FILE = 'upload-queue.json';
const STATS_FILE = 'upload-stats.json';

export class UploadRateLimiter {
  constructor(options = {}) {
    this.dailyLimit = options.dailyLimit || DEFAULT_DAILY_LIMIT;
    this.dataDir = options.dataDir || './data';
    this.queuePath = path.join(this.dataDir, QUEUE_FILE);
    this.statsPath = path.join(this.dataDir, STATS_FILE);
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    this.queue = this.loadQueue();
    this.stats = this.loadStats();
    this.todayUsage = this.getTodayUsage();
  }

  /**
   * Load pending upload queue from disk
   */
  loadQueue() {
    try {
      if (fs.existsSync(this.queuePath)) {
        const data = fs.readFileSync(this.queuePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load upload queue:', error.message);
    }
    return { items: [], total: 0, lastProcessed: null };
  }

  /**
   * Load stats from disk
   */
  loadStats() {
    try {
      if (fs.existsSync(this.statsPath)) {
        const data = fs.readFileSync(this.statsPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error.message);
    }
    return {
      totalProcessed: 0,
      totalQueued: 0,
      totalFailed: 0,
      dailyHistory: {}
    };
  }

  /**
   * Get today's usage
   */
  getTodayUsage() {
    const today = this.getDateKey();
    return (this.stats.dailyHistory[today] || { writes: 0, timestamp: Date.now() }).writes || 0;
  }

  /**
   * Get date key for tracking (YYYY-MM-DD)
   */
  getDateKey(date = new Date()) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Check if we can process more items today
   */
  canProcessToday() {
    return this.todayUsage < this.dailyLimit;
  }

  /**
   * Get remaining writes for today
   */
  getRemainingWrites() {
    return Math.max(0, this.dailyLimit - this.todayUsage);
  }

  /**
   * Add items to upload queue (instead of immediate sync)
   */
  queueItems(items, sourceFile, priority = 'normal') {
    if (!items || items.length === 0) return { queued: 0, total: this.queue.items.length };

    const queuedItems = items.map(item => ({
      ...item,
      sourceFile,
      priority, // 'critical', 'normal', 'low'
      queuedAt: Date.now(),
      attempts: 0,
      lastError: null
    }));

    // Sort by priority: critical > normal > low
    const priorityOrder = { critical: 0, normal: 1, low: 2 };
    this.queue.items.push(...queuedItems);
    this.queue.items.sort((a, b) => 
      priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal']
    );
    
    this.queue.total = this.queue.items.length;
    this.saveQueue();
    
    this.stats.totalQueued += items.length;
    this.saveStats();

    console.log(`📝 Queued ${items.length} items (${this.queue.total} total in queue)`);
    return { queued: items.length, total: this.queue.total };
  }

  /**
   * Process queued items respecting daily limits
   */
  async processQueue(uploadFn) {
    if (this.queue.items.length === 0) {
      console.log('📭 Upload queue is empty');
      return { processed: 0, queued: 0, failed: 0 };
    }

    console.log(`\n⏳ Processing upload queue (${this.queue.items.length} items)`);
    console.log(`   Today's usage: ${this.todayUsage}/${this.dailyLimit} writes`);
    console.log(`   Remaining: ${this.getRemainingWrites()} writes`);

    let processed = 0;
    let failed = 0;
    const remaining = [...this.queue.items];

    // Process items up to daily limit
    while (remaining.length > 0 && this.canProcessToday()) {
      const item = remaining.shift();
      
      try {
        await uploadFn(item);
        this.todayUsage++;
        processed++;
        this.stats.totalProcessed++;
      } catch (error) {
        item.attempts++;
        item.lastError = error.message;
        
        // Keep failed items in queue for retry (max 5 attempts)
        if (item.attempts < 5) {
          remaining.push(item);
        } else {
          failed++;
          this.stats.totalFailed++;
          console.error(`❌ Max retries exceeded: ${item.sku}`);
        }
      }
    }

    // Update queue with remaining items
    this.queue.items = remaining;
    this.queue.total = remaining.length;
    this.queue.lastProcessed = Date.now();
    this.saveQueue();

    // Update stats for today
    const today = this.getDateKey();
    if (!this.stats.dailyHistory[today]) {
      this.stats.dailyHistory[today] = { writes: 0, timestamp: Date.now() };
    }
    this.stats.dailyHistory[today].writes = this.todayUsage;
    this.saveStats();

    console.log(`\n✅ Queue processing complete:`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Remaining: ${remaining.length}`);
    console.log(`   Today's total: ${this.todayUsage}/${this.dailyLimit}`);

    return {
      processed,
      queued: remaining.length,
      failed,
      remaining: this.getRemainingWrites()
    };
  }

  /**
   * Get next batch of items that can be processed
   */
  getNextBatch(batchSize = 500) {
    const remaining = this.getRemainingWrites();
    const size = Math.min(batchSize, remaining);
    
    if (size <= 0) {
      return [];
    }

    return this.queue.items.slice(0, size);
  }

  /**
   * Save queue to disk
   */
  saveQueue() {
    try {
      fs.writeFileSync(this.queuePath, JSON.stringify(this.queue, null, 2));
    } catch (error) {
      console.error('Failed to save queue:', error.message);
    }
  }

  /**
   * Save stats to disk
   */
  saveStats() {
    try {
      fs.writeFileSync(this.statsPath, JSON.stringify(this.stats, null, 2));
    } catch (error) {
      console.error('Failed to save stats:', error.message);
    }
  }

  /**
   * Clear old stats (older than 30 days)
   */
  pruneOldStats(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffKey = this.getDateKey(cutoffDate);

    const keys = Object.keys(this.stats.dailyHistory);
    let removed = 0;

    keys.forEach(key => {
      if (key < cutoffKey) {
        delete this.stats.dailyHistory[key];
        removed++;
      }
    });

    if (removed > 0) {
      this.saveStats();
      console.log(`🧹 Pruned ${removed} old stat entries`);
    }
  }

  /**
   * Get daily limit info
   */
  getInfo() {
    return {
      dailyLimit: this.dailyLimit,
      todayUsage: this.todayUsage,
      remaining: this.getRemainingWrites(),
      queuedItems: this.queue.items.length,
      totalProcessed: this.stats.totalProcessed,
      totalQueued: this.stats.totalQueued,
      totalFailed: this.stats.totalFailed,
      today: this.getDateKey(),
      canProcess: this.canProcessToday()
    };
  }

  /**
   * Reset daily counter (call at midnight or manually)
   */
  resetDaily() {
    const today = this.getDateKey();
    this.todayUsage = 0;
    
    if (!this.stats.dailyHistory[today]) {
      this.stats.dailyHistory[today] = { writes: 0, timestamp: Date.now() };
    }
    
    this.stats.dailyHistory[today].writes = 0;
    this.saveStats();
    
    console.log(`🔄 Daily counter reset for ${today}`);
  }

  /**
   * Display queue status
   */
  displayStatus() {
    const info = this.getInfo();
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│   📊 Upload Rate Limiter Status         │');
    console.log('└─────────────────────────────────────────┘');
    console.log(`Daily Limit:        ${info.dailyLimit.toLocaleString()} writes/day`);
    console.log(`Today's Usage:      ${info.todayUsage.toLocaleString()}/${info.dailyLimit.toLocaleString()}`);
    console.log(`Remaining:          ${info.remaining.toLocaleString()}`);
    console.log(`Queued Items:       ${info.queuedItems.toLocaleString()}`);
    console.log(`Can Process Today:  ${info.canProcess ? '✅ Yes' : '❌ No'}`);
    console.log(`\nLifetime Stats:`);
    console.log(`Total Processed:    ${info.totalProcessed.toLocaleString()}`);
    console.log(`Total Queued:       ${info.totalQueued.toLocaleString()}`);
    console.log(`Total Failed:       ${info.totalFailed.toLocaleString()}`);
    console.log('');

    // Estimate days until done
    if (info.queuedItems > 0) {
      const daysNeeded = Math.ceil(info.queuedItems / info.dailyLimit);
      console.log(`⏱️  Estimated Days to Process Queue: ${daysNeeded} days`);
      console.log(`📅 Estimated Completion: ${this.getEstimatedDate(daysNeeded)}`);
    }
  }

  /**
   * Get estimated completion date
   */
  getEstimatedDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }
}

export default UploadRateLimiter;
