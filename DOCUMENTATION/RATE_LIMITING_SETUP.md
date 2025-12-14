# Upload Rate Limiting Configuration

## Overview

Spread uploads across multiple days to stay within Firebase Firestore Free Tier limits:
- **Free Tier:** 50,000 writes/day
- **Safe Limit:** 10,000 writes/day (20% of quota)

This system automatically queues large imports and processes them daily to avoid exceeding free tier quotas.

## Environment Variables

Add these to `.env.local`:

```bash
# Rate Limiting (default: enabled)
USE_RATE_LIMITING=true

# Daily upload limit in writes (default: 10000)
# Safe under free tier of 50k/day
DAILY_UPLOAD_LIMIT=10000

# Time to process queue daily (24-hour format UTC)
# Default: midnight
UPLOAD_SCHEDULE_TIME=00:00

# Queue large imports instead of immediate upload (default: true)
# Only uploads >1000 items are queued
USE_QUEUE=true
```

## How It Works

### 1. File Upload Detection
When a warehouse Excel/CSV file is detected:
- Small imports (≤1000 items): Upload immediately (if within daily limit)
- Large imports (>1000 items): Queue for later processing

### 2. Queue Management
Queued items are stored in `data/upload-queue.json`:
- Items sorted by priority (critical > normal > low)
- Each item tracked with metadata (timestamp, retry count, error info)
- Queue persists between restarts

### 3. Daily Processing
At the scheduled time (default: midnight UTC):
- Process up to `DAILY_UPLOAD_LIMIT` items (default: 10,000)
- Remaining items stay in queue for next day
- Estimated completion date displayed

### 4. Rate Limit Tracking
Stats saved in `data/upload-stats.json`:
- Daily write count per day
- Lifetime: total queued, processed, failed items
- Last processed timestamp

## Features

### ✅ Automatic Priority Handling
```javascript
// Critical items processed first
rateLimiter.queueItems(items, 'file.xlsx', 'critical');

// Normal priority (default)
rateLimiter.queueItems(items, 'file.xlsx', 'normal');

// Low priority items last
rateLimiter.queueItems(items, 'file.xlsx', 'low');
```

### ✅ Persistent Queue
- Queue survives application restarts
- Items retained until successfully uploaded
- Max 5 retry attempts per item

### ✅ Smart Logging
```
┌─────────────────────────────────┐
│   📊 Upload Rate Limiter        │
└─────────────────────────────────┘
Daily Limit:        10,000 writes/day
Today's Usage:      5,234/10,000
Remaining:          4,766
Queued Items:       15,240

Estimated Days:     2 days
Est. Completion:    2025-12-16
```

## Monitoring

### View Current Status
```bash
# Check queue and stats
node services/warehouse-file-watcher/index.js

# Look for output:
# 📊 Current Warehouse Status
# 📝 Queued X items (Y total in queue)
# ⏱️ Estimated Days to Process Queue: Z days
```

### Manual Queue Processing
To process queue immediately (outside scheduled time):

```javascript
// In code, access the scheduler:
if (uploadScheduler) {
  await uploadScheduler.processNow();
}
```

### Check Queue Contents
```bash
cat data/upload-queue.json  # View queued items
cat data/upload-stats.json  # View upload statistics
```

## Configuration Examples

### Example 1: High-Volume Import (Conservative)
```bash
# Process fewer items per day (safer)
USE_RATE_LIMITING=true
DAILY_UPLOAD_LIMIT=5000          # 5k/day
UPLOAD_SCHEDULE_TIME=02:00       # Run at 2 AM UTC
USE_QUEUE=true
```

### Example 2: Moderate Import
```bash
# Default safe configuration
USE_RATE_LIMITING=true
DAILY_UPLOAD_LIMIT=10000         # 10k/day
UPLOAD_SCHEDULE_TIME=00:00       # Run at midnight
USE_QUEUE=true
```

### Example 3: Low-Volume Import (Fast)
```bash
# Can upload more (still under 50k free tier)
USE_RATE_LIMITING=true
DAILY_UPLOAD_LIMIT=20000         # 20k/day
UPLOAD_SCHEDULE_TIME=06:00       # Run at 6 AM UTC
USE_QUEUE=true
```

### Example 4: No Rate Limiting (Manual)
```bash
# Upload immediately (use only if small imports)
USE_RATE_LIMITING=false
# Rate limiter disabled, all uploads immediate
```

## Firebase Free Tier Limits

### Reads/Writes
- **Free Tier:** 50,000 reads/writes per day
- **Our Default:** 10,000 writes/day (20% safe margin)
- **Remaining Buffer:** 40,000 for other operations

### Storage
- **Free Tier:** 1GB
- **Solution:** Spreads uploads over time, prevents burst usage

### Connections
- **Free Tier:** Unlimited (but concurrent limits apply)
- **Solution:** Batch processing with delays prevents connection saturation

## API Reference

### UploadRateLimiter

```javascript
import UploadRateLimiter from './services/uploadRateLimiter.js';

const limiter = new UploadRateLimiter({
  dailyLimit: 10000,
  dataDir: './data'
});

// Queue items for later
limiter.queueItems(items, 'source-file.xlsx', 'normal');

// Process queue
await limiter.processQueue(uploadFunction);

// Check status
limiter.displayStatus();
const info = limiter.getInfo();
```

### DailyUploadScheduler

```javascript
import DailyUploadScheduler from './services/dailyUploadScheduler.js';

const scheduler = new DailyUploadScheduler({
  dailyLimit: 10000,
  scheduleTime: '00:00',
  uploadBatchFn: async (item) => { /* upload logic */ }
});

// Start daily processing
scheduler.start();

// Trigger immediate processing
await scheduler.processNow();

// Check next run time
scheduler.getNextRunTime();

// Get status
scheduler.displayQueueInfo();
```

## Troubleshooting

### Queue Growing But Not Processing
**Solution:** Check if scheduler is running
```bash
# Should see "Daily scheduler started"
# Look for "Daily Upload Processing Started" at scheduled time
```

### Items Staying in Queue with Errors
**Solution:** Check `data/upload-queue.json` for `lastError`
- Max 5 retries per item
- After 5 failures, item is skipped

### Running Out of Daily Limit
**Solution:** Increase `DAILY_UPLOAD_LIMIT` or add more schedule times
```bash
# Option 1: Increase daily limit (but stay under 50k)
DAILY_UPLOAD_LIMIT=15000

# Option 2: Would need to add mid-day processing (custom schedule)
```

### Want to Force Immediate Upload
**Considerations:**
1. Only safe if import is small (< 1000 items)
2. Set `USE_QUEUE=false` temporarily
3. Monitor Firestore to ensure no quota violations

## Performance Notes

### Large Imports (100k+ items)
- Default schedule: ~10 days to complete
- Items sorted by priority (critical items first)
- Safe for free tier

### Medium Imports (10k-50k items)
- Default schedule: ~1-5 days to complete
- Balanced processing

### Small Imports (< 1k items)
- Upload immediately
- No queueing needed
- Instant availability

## Next Steps

1. **Test Rate Limiting**
   - Upload a test file with 5000 items
   - Verify it queues (if > 1000 items)
   - Check `data/upload-queue.json`

2. **Configure Schedule**
   - Set `UPLOAD_SCHEDULE_TIME` to preferred time
   - Ensure UTC timezone is correct

3. **Monitor Stats**
   - Check `data/upload-stats.json` daily
   - Watch queue growth/completion
   - Adjust `DAILY_UPLOAD_LIMIT` if needed

4. **Production Setup**
   - Keep `USE_RATE_LIMITING=true`
   - Set conservative `DAILY_UPLOAD_LIMIT` (10k-15k)
   - Monitor Firestore metrics dashboard

## Support

For issues with rate limiting:
1. Check logs for "Rate Limiting" section
2. Review `data/upload-queue.json` structure
3. Verify `DAILY_UPLOAD_LIMIT` vs file size
4. Check Firebase quota usage in console
