# Fix Rocket.Chat Crash - MongoDB Timeout Issue

## Problem
Rocket.Chat is crashing with MongoDB connection timeout errors. The app is trying to connect to MongoDB but timing out.

## Solution Applied

### 1. Updated MongoDB Connection String
I've updated `Rocket.Chat/start-dev.sh` to include timeout parameters:
- `serverSelectionTimeoutMS=5000` - 5 seconds to find MongoDB server
- `connectTimeoutMS=10000` - 10 seconds to establish connection  
- `socketTimeoutMS=45000` - 45 seconds for socket operations
- `retryWrites=false` - Disable retry writes for development

### 2. Disabled Cloud Features
All cloud/workspace registration features have been disabled to prevent connection attempts to centralized servers.

## Steps to Fix

### Step 1: Stop Current Rocket.Chat Process
Press `Ctrl+C` in the terminal where Rocket.Chat is running, or kill the process:
```bash
pkill -f "meteor.*4000"
```

### Step 2: Restart Rocket.Chat
```bash
cd Rocket.Chat
./start-dev.sh
```

### Step 3: If Still Crashing - Restart MongoDB
```bash
docker restart rocketchat-mongo-1
# Wait 10 seconds for MongoDB to be ready
sleep 10
# Then restart Rocket.Chat again
cd Rocket.Chat
./start-dev.sh
```

## Alternative: Use MONGO_OPTIONS Environment Variable

If the connection string parameters don't work, you can also set MongoDB options via environment variable:

```bash
export MONGO_OPTIONS='{"serverSelectionTimeoutMS":5000,"connectTimeoutMS":10000,"socketTimeoutMS":45000,"maxPoolSize":10}'
```

Then add this to your `start-dev.sh` before the `meteor` command.

## Verify MongoDB is Healthy

```bash
# Check MongoDB is running
docker ps | grep mongo

# Test MongoDB connection
docker exec rocketchat-mongo-1 mongosh --eval 'db.adminCommand("ping")'

# Check connection stats
docker exec rocketchat-mongo-1 mongosh rocketchat --eval 'db.serverStatus().connections'
```

## If Issues Persist

1. **Check MongoDB logs**:
   ```bash
   docker logs rocketchat-mongo-1 --tail 100
   ```

2. **Check for connection leaks**:
   - The connection pool shows 54,184 total connections created, which is very high
   - This suggests possible connection leaks

3. **Restart both services**:
   ```bash
   docker restart rocketchat-mongo-1
   sleep 15
   # Then restart Rocket.Chat
   ```

4. **Check MongoDB resource usage**:
   ```bash
   docker stats rocketchat-mongo-1
   ```

## Current Status

✅ Cloud features disabled
✅ MongoDB connection string updated with timeouts
⏳ **You need to restart Rocket.Chat for changes to take effect**

