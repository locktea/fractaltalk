#!/bin/bash

cd "$(dirname "$0")/apps/meteor"

export PATH="$HOME/.meteor:$PATH"
export PORT=4000
export ROOT_URL=http://localhost:4000

# Use external MongoDB on Docker (port 27018)
export MONGO_URL="mongodb://localhost:27018/rocketchat?retryWrites=false&serverSelectionTimeoutMS=3000&connectTimeoutMS=5000&socketTimeoutMS=30000&maxPoolSize=10&minPoolSize=2&directConnection=true"
export MONGO_OPLOG_URL="mongodb://localhost:27018/local?retryWrites=false&serverSelectionTimeoutMS=3000&connectTimeoutMS=5000&socketTimeoutMS=30000&maxPoolSize=5&minPoolSize=1&directConnection=true"

export DISABLE_CLOUD_SYNC=true
export USE_NATIVE_OPLOG=false
export IGNORE_CHANGE_STREAM=true
export AUTO_ACCEPT_FINGERPRINT=true

# Ensure unhandled rejections don't crash the dev server
unset EXIT_UNHANDLEDPROMISEREJECTION
unset TEST_MODE
export NODE_ENV=production

# Prevent Meteor from starting its own MongoDB
export METEOR_NO_MONGO=true

echo "Starting Rocket.Chat Community Edition on port 4000..."
echo "MongoDB should be running on localhost:27018"
echo "Access the app at: http://localhost:4000"

~/.meteor/meteor --port 4000
