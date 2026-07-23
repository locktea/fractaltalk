# MongoDB Replica Set Connection Fix

## Issue
Rocket.Chat is crashing with connection errors to port 4001:
```
PoolClearedOnNetworkError: Connection to 127.0.0.1:4001 interrupted due to server monitor timeout
```

## Root Cause
MongoDB is running as a replica set (`rs0`), and the MongoDB driver automatically discovers all replica set members. When the driver discovers replica set members, it tries to connect to all of them. If there's a stale or misconfigured member (like one on port 4001), the driver will attempt to connect to it and fail.

## Solution
Added `directConnection=true` to both `MONGO_URL` and `MONGO_OPLOG_URL` connection strings. This parameter tells the MongoDB driver to:
- Connect directly to the specified host/port
- Skip replica set member discovery
- Use the connection as-is without trying to find other members

## Changes Made

### `Rocket.Chat/start-dev.sh`
```bash
export MONGO_URL=mongodb://localhost:27017/rocketchat?retryWrites=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&socketTimeoutMS=45000&maxPoolSize=10&minPoolSize=2&directConnection=true
export MONGO_OPLOG_URL=mongodb://localhost:27017/local?retryWrites=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&socketTimeoutMS=45000&maxPoolSize=5&minPoolSize=1&directConnection=true
```

## Why This Works
- `directConnection=true` bypasses replica set member discovery
- The driver connects only to `localhost:27017` as specified
- No attempts to connect to other replica set members (like port 4001)
- Works perfectly for single-node replica sets in development

## Notes
- This is safe for development/single-node setups
- For production multi-node replica sets, you'd typically want member discovery enabled
- The replica set is still functional, we're just telling the driver to connect directly

