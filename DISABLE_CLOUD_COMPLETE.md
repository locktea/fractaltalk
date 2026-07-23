# Disable Rocket.Chat Cloud Features - Complete Guide

## What Was Done

I've disabled all cloud features to make your Rocket.Chat instance fully self-hosted and independent of centralized servers.

## Changes Made

1. **Disabled Server Registration**: `Register_Server = false`
2. **Disabled Cloud Service Agreement**: `Cloud_Service_Agree_PrivacyTerms = false`
3. **Cleared Cloud Workspace Data**: All cloud workspace IDs, tokens, and credentials removed
4. **Cleared Workspace Credentials**: Removed all stored cloud credentials

## MongoDB Commands Used

```javascript
use rocketchat;

// Disable server registration
db.rocketchat_settings.updateOne({_id: "Register_Server"}, {$set: {value: false}});

// Disable cloud service agreement
db.rocketchat_settings.updateOne({_id: "Cloud_Service_Agree_PrivacyTerms"}, {$set: {value: false}});

// Clear all cloud workspace data
db.rocketchat_settings.updateMany(
  {_id: {$in: [
    "Cloud_Workspace_Id",
    "Cloud_Workspace_Client_Id", 
    "Cloud_Workspace_Client_Secret",
    "Cloud_Workspace_Access_Token",
    "Cloud_Workspace_Registration_Client_Uri",
    "Cloud_Workspace_PublicKey",
    "Cloud_Workspace_License"
  ]}}, 
  {$set: {value: ""}}
);

// Clear workspace credentials
db.rocketchat_workspace_credentials.deleteMany({});

// Mark setup wizard as completed (prevents re-registration prompts)
db.rocketchat_settings.updateOne({_id: "Show_Setup_Wizard"}, {$set: {value: "completed"}});
```

## About the MongoDB Connection Timeout

The crash you're seeing is a MongoDB connection timeout. This can happen when:
1. MongoDB is under heavy load
2. Network issues between Rocket.Chat and MongoDB
3. MongoDB connection pool exhaustion

### To Fix the MongoDB Timeout:

1. **Check MongoDB is running**:
   ```bash
   docker ps | grep mongo
   ```

2. **Check MongoDB logs**:
   ```bash
   docker logs rocketchat-mongo-1 --tail 50
   ```

3. **Restart MongoDB if needed**:
   ```bash
   docker restart rocketchat-mongo-1
   ```

4. **Increase MongoDB connection timeout** (if needed):
   - Add to your Rocket.Chat environment: `MONGO_CONNECT_TIMEOUT=30000`

## Verification

After restarting Rocket.Chat, you should:
1. ✅ No longer see "starter plan" messages
2. ✅ No connection attempts to Rocket.Chat cloud servers
3. ✅ Fully self-hosted operation
4. ✅ No workspace registration prompts

## Restart Rocket.Chat

After making these changes, restart your Rocket.Chat server:

```bash
# If running via Meteor
# Stop the current process and restart

# If running via Docker
docker restart rocketchat
```

## Environment Variables (Optional)

To prevent cloud registration on startup, you can also set:

```bash
export Register_Server=false
export Cloud_Service_Agree_PrivacyTerms=false
```

Or add to your `.env` file or startup script.

