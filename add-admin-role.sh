#!/bin/bash
# Script to add admin role to [redacted-email] via MongoDB

echo "Adding admin role to [redacted-email]..."
echo ""

# Try different MongoDB connection methods
if command -v mongosh &> /dev/null; then
    echo "Using mongosh..."
    mongosh mongodb://localhost:27017/meteor --eval 'db.users.update({"emails.address":"[redacted-email]"}, {$addToSet: {roles: "admin"}})'
elif command -v mongo &> /dev/null; then
    echo "Using mongo..."
    mongo mongodb://localhost:27017/meteor --eval 'db.users.update({"emails.address":"[redacted-email]"}, {$addToSet: {roles: "admin"}})'
else
    echo "MongoDB client not found. Please run this command manually:"
    echo ""
    echo "mongosh mongodb://localhost:27017/meteor --eval 'db.users.update({\"emails.address\":\"[redacted-email]\"}, {\$addToSet: {roles: \"admin\"}})'"
    echo ""
    echo "Or connect to MongoDB and run:"
    echo "use meteor;"
    echo 'db.users.update({"emails.address":"[redacted-email]"}, {$addToSet: {roles: "admin"}});'
fi

