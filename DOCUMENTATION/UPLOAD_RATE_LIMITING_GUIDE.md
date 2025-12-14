# Multi-Day Upload Implementation Guide

## 🎯 Overview

You now have a complete **rate-limiting system** that spreads uploads across multiple days to stay within Firebase Free Tier limits (50,000 writes/day).

**Key Features:**
- ✅ Automatic queuing of large imports
- ✅ Daily scheduled processing (configurable time)
- ✅ Persistent queue (survives restarts)
- ✅ Priority-based processing (critical > normal > low)
- ✅ Real-time stats and monitoring
- ✅ CLI tool for queue management
- ✅ Fallback to immediate upload for small files

## 📦 New Files Created

### Core Services
1. **`services/warehouse-file-watcher/services/uploadRateLimiter.js`**
   - Queue management
   - Daily limit tracking
   - Persistence to disk
   - Priority sorting

2. **`services/warehouse-file-watcher/services/dailyUploadScheduler.js`**
   - Cron-based daily processing
   - Batch upload orchestration
   - Queue status display

3. **`services/warehouse-file-watcher/queue-manager.js`**
   - CLI tool for queue management
   - Status viewing
   - Manual processing
   - Queue operations

### Configuration
4. **`RATE_LIMITING_SETUP.md`**
   - Complete configuration guide
   - Environment variables
   - Examples and troubleshooting

## 🚀 Quick Start

### 1. Install Dependencies

Add to `package.json`:
```bash
npm install node-cron
```

(The file watcher already has cron installed, but if missing)

### 2. Configure Environment

Add to `.env.local`:
```bash
# Enable rate limiting (default)
USE_RATE_LIMITING=true

# Daily write limit (default: 10,000)
DAILY_UPLOAD_LIMIT=10000

# Time to process queue (UTC, 24-hour format)
UPLOAD_SCHEDULE_TIME=00:00

# Queue mode (queue large imports > 1000 items)
USE_QUEUE=true
```

### 3. Start Warehouse Watcher

```bash
npm run warehouse-watcher
```

**Expected Output:**
```
┌─────────────────────────────────────────┐
│ 🏭 Warehouse File Watcher (Excel/CSV) │
└─────────────────────────────────────────┘
📈 Rate Limiting: ENABLED
   Daily Limit: 10,000 writes/day
   Schedule: 00:00 UTC daily
   Queue Mode: ON

📊 Upload Rate Limiter Status
Daily Limit:        10,000 writes/day
Today's Usage:      0/10,000
Remaining:          10,000
Queued Items:       0

✅ Warehouse watcher ready!
```

## 📋 How It Works

### Workflow Diagram

```
Upload File
    ↓
Validate Items
    ↓
Check File Size
    ↓
├─ Small (≤1000) → Upload immediately (if under daily limit)
│                ↓
│           Rate check
│                ↓
│           ├─ Under limit → Sync now ✅
│           └─ Over limit → Queue for tomorrow
│
└─ Large (>1000) → Queue for batch processing
                 ↓
             Daily Scheduler
                 ↓
             Process Up to
             Daily Limit
                 ↓
             Remaining → Tomorrow
```

### Example: 35,000 Item Import

**Day 1 (00:00 UTC)**
- File detected: 35,000 items
- Validation: ✅ All valid
- Size check: Large import → Queue
- Result: **35,000 items queued**

**Day 2 (00:00 UTC)**
- Process 10,000 items
- Remaining: 25,000
- Result: **10,000 synced, 25,000 queued**

**Day 3 (00:00 UTC)**
- Process 10,000 items
- Remaining: 15,000
- Result: **10,000 synced, 15,000 queued**

**Day 4 (00:00 UTC)**
- Process 10,000 items
- Remaining: 5,000
- Result: **10,000 synced, 5,000 queued**

**Day 5 (00:00 UTC)**
- Process 5,000 items
- Remaining: 0
- Result: **5,000 synced, done! ✅**

## 🎮 CLI Tool Usage

### View Status
```bash
node services/warehouse-file-watcher/queue-manager.js status
```

Output:
```
┌─────────────────────────────────────────┐
│   📊 Upload Rate Limiter Status         │
└─────────────────────────────────────────┘
Daily Limit:        10,000 writes/day
Today's Usage:      2,500/10,000
Remaining:          7,500
Queued Items:       45,230

⏱️  Estimated Days to Process Queue: 5 days
📅 Estimated Completion: 2025-12-19
```

### Process Queue Immediately
```bash
node services/warehouse-file-watcher/queue-manager.js process
```

This respects the daily limit but processes what it can right now.

### Change Daily Limit
```bash
node services/warehouse-file-watcher/queue-manager.js limit 15000
```

Sets daily limit to 15,000 writes (stays under 50k free tier).

### View Priority Breakdown
```bash
node services/warehouse-file-watcher/queue-manager.js priority normal
```

Shows all normal-priority items in queue.

### Export Queue Backup
```bash
node services/warehouse-file-watcher/queue-manager.js export backup.json
```

Exports queue and stats for backup/analysis.

### Clear Queue (with confirmation)
```bash
node services/warehouse-file-watcher/queue-manager.js clear --confirm
```

⚠️ Irreversible - all queued items deleted!

## 📊 Monitoring

### Queue Files

**`data/upload-queue.json`** - Current queue
```json
{
  "items": [
    {
      "sku": "PROD001",
      "productName": "Widget",
      "quantity": 100,
      "location": "MAIN",
      "sourceFile": "inventory.xlsx",
      "priority": "normal",
      "queuedAt": 1702473600000,
      "attempts": 0,
      "lastError": null
    }
  ],
  "total": 15240,
  "lastProcessed": 1702387200000
}
```

**`data/upload-stats.json`** - Historical stats
```json
{
  "totalProcessed": 50000,
  "totalQueued": 75000,
  "totalFailed": 250,
  "dailyHistory": {
    "2025-12-14": { "writes": 8500, "timestamp": 1702473600000 },
    "2025-12-13": { "writes": 10000, "timestamp": 1702387200000 }
  }
}
```

### Firebase Console

1. Go to Firebase Console
2. Select your project
3. Navigate to **Firestore Database**
4. Check **Usage** tab
   - **Read Ops:** Should be low
   - **Write Ops:** Should stay under 50,000/day
   - **Delete Ops:** Low

## ⚙️ Configuration Strategies

### Strategy 1: Large Imports (100k+ items)
**Best for:** Initial data migration

```bash
USE_RATE_LIMITING=true
DAILY_UPLOAD_LIMIT=10000      # 10k/day
UPLOAD_SCHEDULE_TIME=00:00    # Nightly
USE_QUEUE=true
```

**Timeline:** 10+ days, stays safe under free tier

### Strategy 2: Moderate Imports (10k-50k items)
**Best for:** Regular operations

```bash
USE_RATE_LIMITING=true
DAILY_UPLOAD_LIMIT=15000      # 15k/day
UPLOAD_SCHEDULE_TIME=06:00    # Early morning
USE_QUEUE=true
```

**Timeline:** 1-5 days, balanced

### Strategy 3: Small Imports (< 1k items)
**Best for:** Daily operations

```bash
USE_RATE_LIMITING=false       # Disabled
USE_QUEUE=false
```

**Timeline:** Immediate, no queuing needed

### Strategy 4: Peak Hours (Custom)
**Best for:** Business-specific timing

```bash
USE_RATE_LIMITING=true
DAILY_UPLOAD_LIMIT=8000       # Conservative
UPLOAD_SCHEDULE_TIME=22:00    # 10 PM UTC
USE_QUEUE=true
```

**Timeline:** Spreads processing during off-hours

## 🔍 Troubleshooting

### Queue Not Processing

**Check:** Is scheduler running?
```bash
# Look for this in logs:
# 📅 Daily scheduler started (HH:MM UTC)
# Next run: YYYY-MM-DD HH:MM:SS
```

**Check:** Is it the right time?
```bash
# If 00:00 is set, wait until midnight UTC
# You can manually trigger:
node services/warehouse-file-watcher/queue-manager.js process
```

### Items Stuck in Queue

**Check:** Number of retry attempts
```bash
cat data/upload-queue.json | grep "attempts"
```

**Solution:** If attempts >= 5, item failed and was skipped
- Check `lastError` field for details
- Consider fixing data issue and re-uploading

### Running Out of Daily Limit

**Current usage:**
```bash
node services/warehouse-file-watcher/queue-manager.js status
```

**Options:**
1. **Increase limit** (if under 50k):
   ```bash
   node services/warehouse-file-watcher/queue-manager.js limit 20000
   ```

2. **Add mid-day processing** (advanced - requires code change)

3. **Reduce batch size** (code change in uploadRateLimiter.js)

### Items Showing Old Dates

**Prune old stats:**
```bash
# Keep only last 30 days (default)
node services/warehouse-file-watcher/queue-manager.js prune 30

# Or keep only 7 days
node services/warehouse-file-watcher/queue-manager.js prune 7
```

## 📈 Performance Metrics

### Processing Speed
- **Batch size:** 100 items/batch
- **Batch delay:** 500ms between batches (prevents throttling)
- **Expected rate:** ~120 items/minute

### For 50,000 item import:
- **Total time:** ~416 minutes (~7 hours) with rate limiting
- **Daily limit:** 10,000 items/day
- **Duration:** ~5 days

### Optimization
If you need faster processing:
1. Increase `DAILY_UPLOAD_LIMIT` (max ~40k to stay safe)
2. Reduce `BATCH_DELAY_MS` in code (risky, may hit rate limits)
3. Process queue multiple times per day (code change needed)

## 🔒 Security Notes

- **Queue files stored locally:** `data/` directory
- **Sensitive data:** Items stored in plain JSON
- **Best practice:** Don't commit `data/` to version control
- **Access control:** File permissions on `data/` directory

Add to `.gitignore`:
```
data/upload-queue.json
data/upload-stats.json
```

## 🎓 API Examples

### Programmatic Queue Usage

```javascript
import UploadRateLimiter from './services/uploadRateLimiter.js';

const limiter = new UploadRateLimiter({
  dailyLimit: 10000,
  dataDir: './data'
});

// Queue items from code
const items = [...]; // Your items
limiter.queueItems(items, 'source-file.xlsx', 'normal');

// Check status
console.log(limiter.getInfo());
// Output:
// {
//   dailyLimit: 10000,
//   todayUsage: 5000,
//   remaining: 5000,
//   queuedItems: 15000,
//   ...
// }

// Process queue manually
await limiter.processQueue(uploadFunction);

// Display detailed status
limiter.displayStatus();
```

### Priority-Based Queuing

```javascript
// Critical items (processed first)
limiter.queueItems(criticalItems, 'urgent.xlsx', 'critical');

// Normal items
limiter.queueItems(regularItems, 'regular.xlsx', 'normal');

// Low priority
limiter.queueItems(archiveItems, 'archive.xlsx', 'low');
```

## 📚 Next Steps

1. **Test the system**
   - Upload a 5,000 item file
   - Verify it queues (if > 1000 items)
   - Check queue status
   - Wait for scheduled processing

2. **Monitor Firebase**
   - Watch write operations in console
   - Verify queue is processing daily
   - Check for errors in logs

3. **Fine-tune settings**
   - Adjust `DAILY_UPLOAD_LIMIT` based on actual usage
   - Change `UPLOAD_SCHEDULE_TIME` if needed
   - Test on small data first

4. **Production deployment**
   - Keep rate limiting enabled
   - Set conservative daily limit
   - Monitor Firestore metrics
   - Keep backup of queue files

## 🆘 Support Resources

- **Configuration Help:** See [RATE_LIMITING_SETUP.md](./RATE_LIMITING_SETUP.md)
- **Queue Manager Help:** `node queue-manager.js help`
- **Firebase Limits:** https://firebase.google.com/docs/firestore/quotas
- **Cron Syntax:** https://crontab.guru/

---

**Version:** 1.0.0  
**Updated:** December 14, 2025  
**Status:** ✅ Production Ready
