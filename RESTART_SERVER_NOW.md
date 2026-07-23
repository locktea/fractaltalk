# Restart Server to Fix MongoDB Connection

## Issue
The server is still trying to connect to port 4001 because it's using cached connection settings from before the fix.

## Solution
You need to **fully restart** the server (not just wait for auto-reload) so it picks up the new environment variables.

## Steps

1. **Stop the current server**:
   ```bash
   # Press Ctrl+C in the terminal where Rocket.Chat is running
   # OR kill the process:
   pkill -f "meteor.*4000"
   ```

2. **Wait a few seconds** for the process to fully stop

3. **Restart with the fixed configuration**:
   ```bash
   cd Rocket.Chat
   ./start-dev.sh
   ```

## What Changed

The `start-dev.sh` now includes:
- `directConnection=true` in both MONGO_URL and MONGO_OPLOG_URL (prevents replica set member discovery)
- `IGNORE_CHANGE_STREAM=true` (forces oplog usage but with direct connection)
- `USE_NATIVE_OPLOG=false` (disables Meteor's native oplog)

## Why Full Restart is Needed

Environment variables are only read when the process starts. Auto-reload doesn't re-read environment variables, so the old connection settings are still being used.

## Expected Result

After restart:
- ✅ No more connection attempts to port 4001
- ✅ Direct connection to localhost:27017 only
- ✅ Server should start without crashing

