#!/bin/bash
# Simple script to start Rocket.Chat

cd "$(dirname "$0")/Rocket.Chat/apps/meteor" || exit 1

export PATH="$HOME/.meteor:$PATH"
export PORT=4000
export ROOT_URL=http://localhost:4000
export MONGO_URL=mongodb://localhost:27017/rocketchat?retryWrites=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&socketTimeoutMS=45000&maxPoolSize=10&minPoolSize=2
export MONGO_OPLOG_URL=mongodb://localhost:27017/local?retryWrites=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&socketTimeoutMS=45000&maxPoolSize=5&minPoolSize=1
export DISABLE_CLOUD_SYNC=true
export USE_NATIVE_OPLOG=false

echo "=========================================="
echo "Starting Rocket.Chat on port 4000..."
echo "MongoDB: localhost:27017"
echo "URL: http://localhost:4000"
echo "=========================================="
echo ""

# Check if MongoDB is accessible
if ! docker exec rocketchat-mongo-1 mongosh --eval 'db.adminCommand("ping")' > /dev/null 2>&1; then
    echo "⚠️  Warning: MongoDB might not be accessible"
    echo "Trying to start anyway..."
    echo ""
fi

~/.meteor/meteor --port 4000

