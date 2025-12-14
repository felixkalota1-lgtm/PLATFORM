# ✅ UPLOAD RATE LIMITING - DEPLOYMENT CHECKLIST

## Pre-Deployment Verification

### Code Quality
- [ ] No syntax errors in new files
- [ ] All imports resolve correctly
- [ ] No circular dependencies
- [ ] Console logs are appropriate
- [ ] Error handling is comprehensive

### Dependencies
- [ ] `node-cron` is installed (`npm install node-cron`)
- [ ] All Firebase packages available
- [ ] No conflicting package versions
- [ ] No deprecated APIs used

### Configuration
- [ ] `.env.local` has `USE_RATE_LIMITING=true`
- [ ] `DAILY_UPLOAD_LIMIT` set (default: 10000)
- [ ] `UPLOAD_SCHEDULE_TIME` set (default: 00:00)
- [ ] `USE_QUEUE` set (default: true)
- [ ] All variables in correct format

## Local Testing

### Initial Startup
- [ ] Warehouse watcher starts without errors
- [ ] Logs show "Daily scheduler started"
- [ ] Schedule time is correctly parsed
- [ ] Firebase initializes successfully

### Queue Functionality
- [ ] `data/` directory created automatically
- [ ] `upload-queue.json` is empty initially
- [ ] `upload-stats.json` is created
- [ ] Both files are valid JSON

### Small File Upload
- [ ] Upload file with ≤1000 items
- [ ] File uploads immediately (no queuing)
- [ ] Firestore receives data
- [ ] No errors in logs

### Large File Upload
- [ ] Upload file with >1000 items
- [ ] File is queued instead of uploading
- [ ] Queue file updates with new items
- [ ] Queue status shows correct count

### CLI Tool
- [ ] `queue-manager.js help` displays options
- [ ] `queue-manager.js status` shows correct info
- [ ] `queue-manager.js process` runs without error
- [ ] `queue-manager.js limit <num>` changes limit
- [ ] `queue-manager.js export` creates backup file

### Daily Processing
- [ ] Set schedule to 1 minute in future
- [ ] Wait for scheduled time to pass
- [ ] Logs show "Daily Upload Processing Started"
- [ ] Items are processed from queue
- [ ] Queue count decreases
- [ ] Stats file updates with new numbers

### Priority Handling
- [ ] Queue items sorted by priority
- [ ] Critical items process first
- [ ] Normal items process second
- [ ] Low items process last

### Persistence
- [ ] Stop and restart warehouse watcher
- [ ] Queue items still present
- [ ] Stats preserved from previous runs
- [ ] Scheduler restarts correctly

### Error Recovery
- [ ] Invalid item handled gracefully
- [ ] Item retried automatically
- [ ] Max 5 retry attempts enforced
- [ ] Failed items tracked in queue

### Cleanup
- [ ] Old stats cleaned (>30 days)
- [ ] Memory usage stable over time
- [ ] No file handle leaks
- [ ] No infinite loops in scheduling

## Staging/Production Deployment

### Pre-Production
- [ ] Code reviewed by team member
- [ ] All tests pass locally
- [ ] Documentation reviewed
- [ ] No console.errors in production

### Firebase Setup
- [ ] Firebase project credentials verified
- [ ] Service account has necessary permissions
- [ ] Firestore quotas visible in console
- [ ] Rate limiting won't conflict with other usage

### Environment Configuration
- [ ] `.env.local` updated for environment
- [ ] `DAILY_UPLOAD_LIMIT` matches capacity
- [ ] `UPLOAD_SCHEDULE_TIME` aligned with operations
- [ ] Sensitive data not in logs

### Monitoring Setup
- [ ] Firestore usage dashboard open
- [ ] Logs being monitored
- [ ] Alert rules configured (optional)
- [ ] Backup strategy for queue files

### First Production Run
- [ ] Warehouse watcher started
- [ ] Logs monitored for 30 minutes
- [ ] No errors or warnings
- [ ] Scheduler confirmed active

### Small File Test
- [ ] Upload test file (500 items)
- [ ] Verify immediate processing
- [ ] Check Firestore for data
- [ ] Confirm no queuing

### Large File Test
- [ ] Upload test file (5000+ items)
- [ ] Verify queuing works
- [ ] Check queue count
- [ ] Monitor first daily processing
- [ ] Verify items uploaded to Firestore

### Performance Check
- [ ] CPU usage stable (<20%)
- [ ] Memory usage stable (<200MB)
- [ ] No disk space issues
- [ ] Network connectivity stable

### Firebase Quota Check
- [ ] Daily write ops stay under 50k
- [ ] Daily read ops normal
- [ ] Storage usage as expected
- [ ] No quota exceeded errors

## Post-Deployment

### Week 1 Monitoring
- [ ] [ ] Daily check queue status
- [ ] [ ] Monitor Firestore metrics
- [ ] [ ] Review error logs
- [ ] [ ] Confirm items processing
- [ ] [ ] Adjust limits if needed

### Week 2+ Maintenance
- [ ] [ ] Weekly queue reviews
- [ ] [ ] Monthly stats analysis
- [ ] [ ] Quarterly performance review
- [ ] [ ] Update documentation if needed

### Ongoing Operations
- [ ] Monitor queue growth
- [ ] Check processing timeline
- [ ] Review error rates
- [ ] Track estimation accuracy
- [ ] Plan for growth

## Rollback Plan

If issues occur:

### Disable Rate Limiting
```bash
# Set to false to bypass rate limiting
USE_RATE_LIMITING=false

# Restart warehouse watcher
# Files will upload immediately (risky for large files!)
```

### Clear Problematic Queue
```bash
node queue-manager.js clear --confirm
# Clears all queued items
# Start fresh with new uploads
```

### Restore from Backup
```bash
# If you have a backup from earlier:
cp queue-backup.json data/upload-queue.json
cp stats-backup.json data/upload-stats.json

# Restart and resume processing
```

## Success Criteria

✅ **System is working correctly when:**
- [ ] Large files are queued automatically
- [ ] Daily processing runs at scheduled time
- [ ] Items are uploaded to Firestore daily
- [ ] Queue empties within estimated timeline
- [ ] Firestore write ops stay under 50k/day
- [ ] No errors in logs
- [ ] CLI tool shows accurate status
- [ ] Stats file updates daily
- [ ] System survives restarts
- [ ] CPU/memory usage stable

❌ **Something is wrong if:**
- [ ] Files not queuing (check `USE_QUEUE=true`)
- [ ] Scheduler not running (check logs for start message)
- [ ] Items not processing (check scheduled time)
- [ ] Queue growing indefinitely (check for errors)
- [ ] Firestore errors appearing (check Firebase console)
- [ ] Memory leaks (usage keeps growing)
- [ ] CLI tool not working (check node-cron installed)

## Documentation Completeness

- [ ] [UPLOAD_RATE_LIMITING_QUICK_REFERENCE.md](./UPLOAD_RATE_LIMITING_QUICK_REFERENCE.md) ✅
- [ ] [UPLOAD_RATE_LIMITING_VISUAL_SUMMARY.md](./UPLOAD_RATE_LIMITING_VISUAL_SUMMARY.md) ✅
- [ ] [UPLOAD_RATE_LIMITING_COMPLETE.md](./UPLOAD_RATE_LIMITING_COMPLETE.md) ✅
- [ ] [UPLOAD_RATE_LIMITING_GUIDE.md](./UPLOAD_RATE_LIMITING_GUIDE.md) ✅
- [ ] [RATE_LIMITING_SETUP.md](./RATE_LIMITING_SETUP.md) ✅
- [ ] [UPLOAD_RATE_LIMITING_DOCUMENTATION_INDEX.md](./UPLOAD_RATE_LIMITING_DOCUMENTATION_INDEX.md) ✅

## Code Files

- [ ] `services/warehouse-file-watcher/services/uploadRateLimiter.js` ✅
- [ ] `services/warehouse-file-watcher/services/dailyUploadScheduler.js` ✅
- [ ] `services/warehouse-file-watcher/queue-manager.js` ✅
- [ ] `services/warehouse-file-watcher/index.js` (updated) ✅
- [ ] `services/warehouse-file-watcher/services/warehouseFirestore.js` (updated) ✅

## Team Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | __________ | ______ | ☐ Approved |
| DevOps | __________ | ______ | ☐ Approved |
| QA | __________ | ______ | ☐ Approved |
| Manager | __________ | ______ | ☐ Approved |

## Deployment Summary

| Item | Value |
|------|-------|
| **Deployment Date** | __________ |
| **Environment** | Development / Staging / Production |
| **Deployed By** | __________ |
| **Reviewed By** | __________ |
| **Status** | ☐ Complete ☐ Partial ☐ Rolled Back |

## Notes

```
Deployment Notes:
_____________________________
_____________________________
_____________________________
_____________________________
_____________________________
```

## Contact & Support

- **Documentation:** See [UPLOAD_RATE_LIMITING_DOCUMENTATION_INDEX.md](./UPLOAD_RATE_LIMITING_DOCUMENTATION_INDEX.md)
- **Troubleshooting:** See [UPLOAD_RATE_LIMITING_GUIDE.md](./UPLOAD_RATE_LIMITING_GUIDE.md)
- **CLI Help:** `node queue-manager.js help`

---

**Deployment Checklist Version:** 1.0  
**Last Updated:** December 14, 2025  
**Status:** Ready to Deploy
