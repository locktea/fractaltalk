#!/bin/bash
# Script to fix MongoDB connection timeout issues

echo "Checking MongoDB connection..."
docker exec rocketchat-mongo-1 mongosh --eval 'db.adminCommand("ping")' > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ MongoDB is accessible"
else
    echo "❌ MongoDB is not accessible"
    exit 1
fi

echo ""
echo "Current MongoDB connection settings in start-dev.sh:"
grep "MONGO_URL" Rocket.Chat/start-dev.sh

echo ""
echo "The connection string has been updated with timeout settings:"
echo "  - serverSelectionTimeoutMS=5000 (5 seconds to find server)"
echo "  - connectTimeoutMS=10000 (10 seconds to establish connection)"
echo "  - socketTimeoutMS=45000 (45 seconds for socket operations)"
echo "  - retryWrites=false (disable retry writes for development)"
echo ""
echo "To apply these changes:"
echo "1. Stop your current Rocket.Chat process (Ctrl+C)"
echo "2. Restart using: cd Rocket.Chat && ./start-dev.sh"
echo ""
echo "If issues persist, try restarting MongoDB:"
echo "  docker restart rocketchat-mongo-1"

