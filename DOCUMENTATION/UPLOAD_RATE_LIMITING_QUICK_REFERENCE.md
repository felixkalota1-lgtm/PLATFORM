# 📊 Upload Rate Limiting - Quick Reference Card

## ⚡ One-Minute Setup

```bash
# 1. Add to .env.local
USE_RATE_LIMITING=true
DAILY_UPLOAD_LIMIT=10000
UPLOAD_SCHEDULE_TIME=00:00
USE_QUEUE=true

# 2. Install dependencies
npm install node-cron

# 3. Start warehouse watcher
npm run warehouse-watcher
```

## 🎯 What It Does

| Scenario | Before | After |
|----------|--------|-------|
| Upload 50k items | ❌ Hits quota, fails | ✅ Queues, processes over 5 days |
| Upload 500 items | ⚡ Instant | ⚡ Instant (unchanged) |
| Daily uploads | ⚠️ Risky | ✅ Safe, scheduled |
| Free tier usage | ❌ Unpredictable | ✅ Capped at 10k/day |

## 📋 Key Commands

```bash
# View queue status
node queue-manager.js status

# Process queue now
node queue-manager.js process

# Change daily limit
node queue-manager.js limit 15000

# Clear queue
node queue-manager.js clear --confirm

# Export for backup
node queue-manager.js export backup.json

# Show help
node queue-manager.js help
```

## 📊 Monitoring

| File | Purpose | Check |
|------|---------|-------|
| `data/upload-queue.json` | Current queue | `cat data/upload-queue.json` |
| `data/upload-stats.json` | Historical stats | `cat data/upload-stats.json` |
| Firestore Console | Live metrics | Write ops / day |

## ⚙️ Environment Variables

| Variable | Default | Options |
|----------|---------|---------|
| `USE_RATE_LIMITING` | `true` | `true` / `false` |
| `DAILY_UPLOAD_LIMIT` | `10000` | `1000` - `40000` (stay under 50k) |
| `UPLOAD_SCHEDULE_TIME` | `00:00` | Any `HH:MM` UTC |
| `USE_QUEUE` | `true` | `true` / `false` |

## 🔢 Free Tier Limits

| Metric | Free Tier | Safe Limit | Buffer |
|--------|-----------|-----------|--------|
| Writes/day | 50,000 | 10,000 | 40,000 |
| Reads/day | 20,000 | 5,000 | 15,000 |
| Storage | 1 GB | — | — |

## ✅ Workflow

```
File Upload
    ↓
≤1,000 items? → YES → Upload now (if under limit)
    ↓ NO
Queue for later
    ↓
Daily at scheduled time
    ↓
Process up to DAILY_UPLOAD_LIMIT
    ↓
Remaining → Tomorrow
```

## 🚨 Troubleshooting Checklist

- [ ] `USE_RATE_LIMITING=true` in `.env.local`?
- [ ] `npm install node-cron` run?
- [ ] Logs show "Daily scheduler started"?
- [ ] Check queue: `node queue-manager.js status`
- [ ] Files > 1000 items should queue
- [ ] Wait until `UPLOAD_SCHEDULE_TIME` for processing
- [ ] Can manually process: `node queue-manager.js process`

## 📈 Upload Timeline Examples

### 50,000 items @ 10k/day
```
Day 1: Queue
Day 2: 10k ✅
Day 3: 10k ✅
Day 4: 10k ✅
Day 5: 10k ✅
Day 6: 10k ✅ Done!
```

### 100,000 items @ 10k/day
```
Estimated: 10 days
Completion: ~12/24
```

### 5,000 items @ 10k/day
```
Immediate: ⚡ Uploaded same day
(No queuing needed)
```

## 🎮 Common Tasks

**Check queue growth**
```bash
watch -n 5 'node queue-manager.js status'
```

**Export queue daily**
```bash
node queue-manager.js export "queue-$(date +%Y-%m-%d).json"
```

**Increase limit on high-traffic days**
```bash
node queue-manager.js limit 20000
# Later, reset
node queue-manager.js limit 10000
```

**See what's queued**
```bash
cat data/upload-queue.json | jq '.items[0:5]'
```

## 🔒 Best Practices

1. ✅ Keep `USE_RATE_LIMITING=true` in production
2. ✅ Set limit to 10,000-15,000 (stay safe)
3. ✅ Check stats daily during initial rollout
4. ✅ Monitor Firestore metrics dashboard
5. ✅ Add `data/` to `.gitignore`
6. ⚠️ Don't set limit > 40,000
7. ⚠️ Don't manually clear queue without backup
8. ⚠️ Test on small data first

## 📞 Support

- **Full Setup Guide:** [RATE_LIMITING_SETUP.md](./RATE_LIMITING_SETUP.md)
- **Implementation Guide:** [UPLOAD_RATE_LIMITING_GUIDE.md](./UPLOAD_RATE_LIMITING_GUIDE.md)
- **CLI Help:** `node queue-manager.js help`
- **Firebase Docs:** https://firebase.google.com/docs/firestore/quotas

---

**Version:** 1.0  
**Last Updated:** Dec 14, 2025  
**Status:** ✅ Ready to Use
