# MongoDB Crash Fix

## Problem
The app was crashing with:
```
PoolClearedOnNetworkError: Connection to 127.0.0.1:4001 interrupted due to server monitor timeout
```

## Root Cause
1. MongoDB is running as a replica set (`rs0`) in Docker on port 27017
2. Meteor's development mode was starting its own MongoDB instance on port 4001 as part of a replica set
3. The MongoDB driver was discovering both instances and trying to connect to the secondary on port 4001, which was causing timeouts

## Solution
Updated `start-dev.sh` to:
1. Add `replicaSet=rs0` to explicitly tell the driver about the replica set configuration
2. Add `readPreference=primary` to ensure it only connects to the primary member
3. Keep `directConnection=true` to prevent replica set member discovery issues

## Connection String Parameters
- `directConnection=true`: Forces direct connection to specified host
- `readPreference=primary`: Only reads from primary member
- `replicaSet=rs0`: Explicitly specifies the replica set name
- `serverSelectionTimeoutMS=5000`: Fast timeout for server selection
- `connectTimeoutMS=10000`: Connection timeout
- `socketTimeoutMS=45000`: Socket timeout
- `maxPoolSize=10&minPoolSize=2`: Connection pool settings

## Additional Fixes
- Kill any Meteor MongoDB processes on port 4001 before starting
- Ensure Docker MongoDB is the only MongoDB instance running

