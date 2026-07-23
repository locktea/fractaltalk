# Test Post Message Script Documentation

## Overview
This document describes the test script created for logging into Rocket.Chat and posting test messages via the API.

## Files Created/Modified

### 1. `test-post-message.js`
A Node.js script that:
- Logs into Rocket.Chat using the REST API
- Retrieves or creates a channel
- Posts a test message to the channel

**Location:** `/test-post-message.js` (root directory)

**Features:**
- Reads credentials from `.env` file
- Supports command-line arguments for credentials
- Automatically detects email vs username format
- Handles channel discovery and creation
- Provides detailed error messages

### 2. `.env` file
Environment configuration file containing:
- Rocket.Chat server URL and port
- User credentials (username/email and password)

**Location:** `/.env` (root directory, gitignored)

**Contents:**
```
# Rocket.Chat Test Credentials
USERNAME=[redacted-email]
PASSWORD=testing
BASE_URL=http://localhost:4000
```

**Security Note:** The `.env` file is excluded from git via `.gitignore` to protect credentials.

## Configuration

### Server Configuration
- **Default Port:** 4000 (configured in `.env`)
- **API Endpoint:** `/api/v1`
- **Base URL:** `http://localhost:4000`

### Credentials
- **Email:** [redacted-email]
- **Password:** testing
- Stored in `.env` file for automatic loading

## Usage

### Basic Usage
Simply run the script - it will automatically use credentials from `.env`:
```bash
node test-post-message.js
```

### Override Credentials
You can override credentials via command-line arguments:
```bash
node test-post-message.js your-email@example.com yourpassword
```

Or via environment variables:
```bash
USERNAME=your-email@example.com PASSWORD=yourpassword node test-post-message.js
```

### Custom Server URL
Set the `BASE_URL` environment variable:
```bash
BASE_URL=http://localhost:3000 node test-post-message.js
```

## Script Workflow

1. **Server Check:** Verifies Rocket.Chat server is running
2. **Login:** Authenticates using email/username and password
3. **Channel Discovery:** 
   - Fetches available channels
   - Uses first available channel if found
   - Creates a test channel if none exist
4. **Post Message:** Sends "Test message from login script" to the channel
5. **Output:** Displays success message with message ID

## API Endpoints Used

- `POST /api/v1/login` - User authentication
- `GET /api/v1/channels.list` - List available channels
- `POST /api/v1/channels.create` - Create new channel (if needed)
- `POST /api/v1/chat.postMessage` - Post message to channel

## Authentication Format

The script uses the Rocket.Chat API login format:
```json
{
  "user": "[redacted-email]",
  "password": "testing"
}
```

The API automatically detects if `user` is an email (contains `@`) or username.

## Error Handling

The script includes comprehensive error handling:
- Server connectivity checks
- Detailed login error messages
- Channel creation fallbacks
- Clear error output with debugging information

## Dependencies

- Node.js (built-in `fetch` API - Node 18+)
- No external npm packages required

## Testing

The script has been tested and verified to:
- ✅ Successfully authenticate with email and password
- ✅ Connect to Rocket.Chat server on port 4000
- ✅ Retrieve existing channels
- ✅ Post messages to channels
- ✅ Handle errors gracefully

## Example Output

```
Checking if server is running at http://localhost:4000...
Server appears to be running
Logging in...
Using username/email: [redacted-email]
Password: *******
Login successful!
User ID: W5ixehPovwwaDscCi
Fetching channels...
Using existing channel: general (GENERAL)
Posting message to room GENERAL...
Message posted successfully!
Message ID: 6917b4be8467dcc206354ace
Message: Test message from login script

✅ Successfully logged in and posted test message!
```

## Maintenance

### Updating Credentials
Edit the `.env` file:
```bash
nano .env
# or
vim .env
```

### Changing Server Port
Update `BASE_URL` in `.env`:
```
BASE_URL=http://localhost:NEW_PORT
```

## Notes

- The script prioritizes command-line arguments over environment variables over `.env` file
- The `.env` file is automatically loaded if it exists in the same directory as the script
- All credentials are masked in output (password shown as asterisks)
- The script uses the first available channel or creates a test channel if needed

## Date Created
November 14, 2025

## Last Updated
November 14, 2025

