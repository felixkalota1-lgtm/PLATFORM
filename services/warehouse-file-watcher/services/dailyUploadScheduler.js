/**
 * Daily Upload Scheduler
 * 
 * Processes queued items once per day at scheduled time
 * Handles rate limiting and maintains persistence across restarts
 */

import cron from 'node-cron';
import admin from 'firebase-admin';
import UploadRateLimiter from './uploadRateLimiter.js';

export class DailyUploadScheduler {
  constructor(options = {}) {
    this.rateLimiter = new UploadRateLimiter({
      dailyLimit: options.dailyLimit || 18000,
      dataDir: options.dataDir || './data'
    });
    
    this.uploadBatchFn = options.uploadBatchFn;
    this.scheduleTime = options.scheduleTime || '00:00'; // Midnight by default
    this.maxRetries = options.maxRetries || 3;
    this.enabled = options.enabled !== false; // Enabled by default
    this.task = null;
  }

  /**
   * Start the daily scheduler
   */
  start() {
    if (!this.enabled) {
      console.log('⏸️ Daily scheduler is disabled');
      return;
    }

    if (!this.uploadBatchFn) {
      throw new Error('uploadBatchFn is required for scheduler');
    }

    const [hours, minutes] = this.scheduleTime.split(':').map(Number);
    const cronExpression = `${minutes} ${hours} * * *`; // Daily at specified time

    this.task = cron.schedule(cronExpression, () => {
      this.processQueue();
    }, { runOnInit: false });

    console.log(`📅 Daily upload scheduler started (${this.scheduleTime} UTC)`);
    console.log(`⏳ Next run: ${this.getNextRunTime()}`);

    // Also check queue on startup (with small delay)
    setTimeout(() => {
      if (this.rateLimiter.queue.items.length > 0) {
        console.log(`\n📋 Found ${this.rateLimiter.queue.items.length} items in queue from previous run`);
        this.displayQueueInfo();
      }
    }, 2000);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      console.log('⏸️ Daily scheduler stopped');
    }
  }

  /**
   * Process the upload queue
   */
  async processQueue() {
    console.log(`\n${'='.repeat(50)}`);
    console.log('🕐 Daily Upload Processing Started');
    console.log(`${'='.repeat(50)}\n`);

    const startTime = Date.now();

    try {
      // Check if there are items to process
      if (this.rateLimiter.queue.items.length === 0) {
        console.log('📭 No items in queue');
        console.log('✅ Done!\n');
        return;
      }

      // Reset daily counter if it's a new day
      const today = this.rateLimiter.getDateKey();
      const lastProcessed = this.rateLimiter.queue.lastProcessed 
        ? new Date(this.rateLimiter.queue.lastProcessed).toISOString().split('T')[0]
        : null;

      if (lastProcessed && lastProcessed !== today) {
        this.rateLimiter.resetDaily();
      }

      // Display current status
      this.displayQueueInfo();

      // Process queue
      const result = await this.rateLimiter.processQueue(this.uploadBatchFn);

      // Log results
      console.log(`\n✅ Upload processing complete:`);
      console.log(`   Processed:  ${result.processed}`);
      console.log(`   Failed:     ${result.failed}`);
      console.log(`   Remaining:  ${result.queued}`);

      // Cleanup old stats
      this.rateLimiter.pruneOldStats(30);

      // Save state
      this.rateLimiter.saveQueue();
      this.rateLimiter.saveStats();

      // Display time taken
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`\n⏱️ Time taken: ${elapsed}s`);

      // Show next run time if items remain
      if (result.queued > 0) {
        const daysUntilDone = Math.ceil(result.queued / this.rateLimiter.dailyLimit);
        console.log(`\n📅 Next scheduled run: ${this.getNextRunTime()}`);
        console.log(`⏳ Est. completion: ${this.rateLimiter.getEstimatedDate(daysUntilDone)}`);
      }

    } catch (error) {
      console.error(`\n❌ Error during queue processing: ${error.message}`);
      console.log('Queue will be retried at next scheduled time');
    }

    console.log(`\n${'='.repeat(50)}\n`);
  }

  /**
   * Manually trigger immediate queue processing
   */
  async processNow() {
    console.log('\n⚡ Triggering immediate queue processing...\n');
    await this.processQueue();
  }

  /**
   * Queue items for upload
   */
  queueItems(items, sourceFile, priority = 'normal') {
    return this.rateLimiter.queueItems(items, sourceFile, priority);
  }

  /**
   * Get next scheduled run time
   */
  getNextRunTime() {
    const now = new Date();
    const [hours, minutes] = this.scheduleTime.split(':').map(Number);
    
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    // If the scheduled time has passed today, show tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun.toISOString();
  }

  /**
   * Display detailed queue info
   */
  displayQueueInfo() {
    this.rateLimiter.displayStatus();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    const info = this.rateLimiter.getInfo();
    return {
      ...info,
      enabled: this.enabled,
      scheduleTime: this.scheduleTime,
      nextRun: this.getNextRunTime(),
      isRunning: this.task !== null
    };
  }

  /**
   * Update daily limit
   */
  updateDailyLimit(newLimit) {
    this.rateLimiter.dailyLimit = newLimit;
    console.log(`✅ Daily limit updated to ${newLimit.toLocaleString()} writes/day`);
  }

  /**
   * Clear entire queue
   */
  clearQueue(confirm = false) {
    if (!confirm) {
      console.warn('⚠️ Call with confirm=true to clear queue');
      return;
    }

    const count = this.rateLimiter.queue.items.length;
    this.rateLimiter.queue.items = [];
    this.rateLimiter.queue.total = 0;
    this.rateLimiter.saveQueue();

    console.log(`🗑️ Cleared ${count} items from queue`);
  }

  /**
   * Get queue items by priority
   */
  getQueueByPriority() {
    const critical = this.rateLimiter.queue.items.filter(i => i.priority === 'critical').length;
    const normal = this.rateLimiter.queue.items.filter(i => i.priority === 'normal').length;
    const low = this.rateLimiter.queue.items.filter(i => i.priority === 'low').length;

    return { critical, normal, low, total: this.rateLimiter.queue.items.length };
  }
}

export default DailyUploadScheduler;
