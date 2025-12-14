# 🚀 START HERE - UPLOAD RATE LIMITING

## What This Does

Automatically spreads large file uploads across multiple days to stay safely within Firebase's **50,000 writes/day** free tier limit.

**Before:** ❌ Upload fails when too large
**After:** ✅ Queues automatically, processes daily

## 3-Minute Setup

### 1. Add to `.env.local`
```bash
USE_RATE_LIMITING=true
DAILY_UPLOAD_LIMIT=10000
UPLOAD_SCHEDULE_TIME=00:00
USE_QUEUE=true
```

### 2. Install Dependency
```bash
npm install node-cron
```

### 3. Run Warehouse Watcher
```bash
npm run warehouse-watcher
```

**Done!** Rate limiting is now active.

## Test It

```bash
# Check status
node services/warehouse-file-watcher/queue-manager.js status

# Upload a test file (>1000 items should queue)

# Process queue manually
node services/warehouse-file-watcher/queue-manager.js process
```

## Common Commands

```bash
# View queue status
node services/warehouse-file-watcher/queue-manager.js status

# Process queue now (instead of waiting for schedule)
node services/warehouse-file-watcher/queue-manager.js process

# Change daily upload limit
node services/warehouse-file-watcher/queue-manager.js limit 15000

# See all commands
node services/warehouse-file-watcher/queue-manager.js help
```

## How It Works

```
Upload File
   │
   ├─ ≤1,000 items → Upload immediately ✅
   └─ >1,000 items → Queue for daily processing
                       │
                       ├─ Day 1: Process 10,000 items
                       ├─ Day 2: Process 10,000 items
                       ├─ Day 3: Process remaining items
                       └─ All safe under 50k/day limit ✅
```

## Key Files

| File | Purpose |
|------|---------|
| `uploadRateLimiter.js` | Manages the queue |
| `dailyUploadScheduler.js` | Daily processing |
| `queue-manager.js` | CLI tool |
| `data/upload-queue.json` | Current queue |
| `data/upload-stats.json` | Stats & history |

## Need More Info?

| Question | Answer |
|----------|--------|
| How do I configure it? | See [RATE_LIMITING_SETUP.md](./RATE_LIMITING_SETUP.md) |
| How does it work? | See [UPLOAD_RATE_LIMITING_GUIDE.md](./UPLOAD_RATE_LIMITING_GUIDE.md) |
| Visual overview? | See [UPLOAD_RATE_LIMITING_VISUAL_SUMMARY.md](./UPLOAD_RATE_LIMITING_VISUAL_SUMMARY.md) |
| Quick reference? | See [UPLOAD_RATE_LIMITING_QUICK_REFERENCE.md](./UPLOAD_RATE_LIMITING_QUICK_REFERENCE.md) |
| Deployment? | See [UPLOAD_RATE_LIMITING_DEPLOYMENT_CHECKLIST.md](./UPLOAD_RATE_LIMITING_DEPLOYMENT_CHECKLIST.md) |
| All docs? | See [UPLOAD_RATE_LIMITING_DOCUMENTATION_INDEX.md](./UPLOAD_RATE_LIMITING_DOCUMENTATION_INDEX.md) |

## ✅ What You Get

✅ Automatic queuing for large files  
✅ Daily scheduled processing  
✅ Queue persists between restarts  
✅ CLI tool for management  
✅ Real-time status monitoring  
✅ Safe Firebase quota usage  
✅ Complete documentation  
✅ Production ready  

## 🎯 Summary

| Metric | Value |
|--------|-------|
| **Setup Time** | 5 minutes |
| **Code Added** | 3 new services |
| **Configuration** | 4 env variables |
| **Dependencies** | 1 npm package |
| **Documentation** | 7 guides |
| **Status** | Ready to use |

---

## 🚀 Next: Follow Setup Above → Then Check Status

```bash
node services/warehouse-file-watcher/queue-manager.js status
```

**That's it! You're all set.** 

For detailed documentation, see [UPLOAD_RATE_LIMITING_DOCUMENTATION_INDEX.md](./UPLOAD_RATE_LIMITING_DOCUMENTATION_INDEX.md)
