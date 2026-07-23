#!/bin/bash

# Rocket.Chat Complete Backup Script
# Backs up MongoDB database, settings, and all data

set -e  # Exit on error

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="rocketchat_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

echo "🚀 Starting Rocket.Chat Complete Backup..."
echo "Backup will be saved to: ${BACKUP_PATH}"
echo ""

# Create backup directory
mkdir -p "${BACKUP_PATH}"

# Find MongoDB container
MONGO_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i mongo | head -1)

if [ -z "$MONGO_CONTAINER" ]; then
    echo "⚠️  MongoDB container not found. Trying to find stopped containers..."
    MONGO_CONTAINER=$(docker ps -a --format "{{.Names}}" | grep -i mongo | head -1)
    if [ -z "$MONGO_CONTAINER" ]; then
        echo "❌ MongoDB container not found. Please ensure MongoDB is running."
        exit 1
    fi
fi

echo "✅ Found MongoDB container: ${MONGO_CONTAINER}"

# Check if MongoDB is running
if ! docker ps --format "{{.Names}}" | grep -q "^${MONGO_CONTAINER}$"; then
    echo "⚠️  MongoDB container is not running. Starting it..."
    docker start "${MONGO_CONTAINER}"
    sleep 5
fi

# Backup MongoDB database
echo ""
echo "📦 Backing up MongoDB database..."
MONGO_BACKUP_FILE="${BACKUP_PATH}/mongodb_backup.tar.gz"

# Export MongoDB data
docker exec "${MONGO_CONTAINER}" mongodump \
    --db=rocketchat \
    --out=/tmp/mongodb_backup \
    --quiet

# Also backup local database if it exists
if docker exec "${MONGO_CONTAINER}" mongodump --db=local --out=/tmp/mongodb_backup_local --quiet 2>/dev/null; then
    echo "  ✅ Backed up local database"
fi

# Copy backup from container to host
docker cp "${MONGO_CONTAINER}:/tmp/mongodb_backup" "${BACKUP_PATH}/mongodb_backup"
if [ -d "${BACKUP_PATH}/mongodb_backup_local" ]; then
    docker cp "${MONGO_CONTAINER}:/tmp/mongodb_backup_local" "${BACKUP_PATH}/mongodb_backup_local" 2>/dev/null || true
fi

# Compress MongoDB backup
cd "${BACKUP_PATH}"
tar -czf mongodb_backup.tar.gz mongodb_backup mongodb_backup_local 2>/dev/null || tar -czf mongodb_backup.tar.gz mongodb_backup
rm -rf mongodb_backup mongodb_backup_local
cd - > /dev/null

echo "  ✅ MongoDB backup completed: ${MONGO_BACKUP_FILE}"

# Backup Rocket.Chat configuration files
echo ""
echo "⚙️  Backing up Rocket.Chat configuration and settings..."

# Backup .env file if exists
if [ -f ".env" ]; then
    cp .env "${BACKUP_PATH}/.env"
    echo "  ✅ Backed up .env file"
fi

# Backup start script
if [ -f "Rocket.Chat/start-dev.sh" ]; then
    mkdir -p "${BACKUP_PATH}/scripts"
    cp Rocket.Chat/start-dev.sh "${BACKUP_PATH}/scripts/"
    echo "  ✅ Backed up start-dev.sh"
fi

# Backup custom scripts
if [ -d "." ]; then
    mkdir -p "${BACKUP_PATH}/scripts"
    find . -maxdepth 1 -name "*.js" -type f -exec cp {} "${BACKUP_PATH}/scripts/" \;
    find . -maxdepth 1 -name "*.sh" -type f -exec cp {} "${BACKUP_PATH}/scripts/" \;
    echo "  ✅ Backed up custom scripts"
fi

# Backup prompt files
if [ -d "." ] && ls *.txt 2>/dev/null | grep -q prompt; then
    mkdir -p "${BACKUP_PATH}/prompts"
    cp *.txt "${BACKUP_PATH}/prompts/" 2>/dev/null || true
    echo "  ✅ Backed up prompt files"
fi

# Backup Rocket.Chat custom code (taskbot, etc.)
if [ -d "Rocket.Chat/apps/meteor/app/slashcommands-taskbot" ]; then
    mkdir -p "${BACKUP_PATH}/rocketchat_custom"
    cp -r Rocket.Chat/apps/meteor/app/slashcommands-taskbot "${BACKUP_PATH}/rocketchat_custom/"
    echo "  ✅ Backed up custom taskbot code"
fi

# Backup modified Rocket.Chat files
if [ -f "Rocket.Chat/apps/meteor/server/importPackages.ts" ]; then
    mkdir -p "${BACKUP_PATH}/rocketchat_custom"
    cp Rocket.Chat/apps/meteor/server/importPackages.ts "${BACKUP_PATH}/rocketchat_custom/" 2>/dev/null || true
fi

# Backup documentation
if [ -f "TASKBOT_README.md" ]; then
    cp TASKBOT_README.md "${BACKUP_PATH}/" 2>/dev/null || true
    echo "  ✅ Backed up documentation"
fi

# Create backup manifest
echo ""
echo "📋 Creating backup manifest..."
cat > "${BACKUP_PATH}/BACKUP_MANIFEST.txt" << EOF
Rocket.Chat Complete Backup
===========================
Backup Date: $(date)
Backup Name: ${BACKUP_NAME}
MongoDB Container: ${MONGO_CONTAINER}

Contents:
---------
1. MongoDB Database Backup (mongodb_backup.tar.gz)
   - rocketchat database (all collections including messages, users, rooms, settings)
   - local database (if exists)

2. Configuration Files
   - .env (environment variables)
   - start-dev.sh (startup script)
   - Custom scripts (*.js, *.sh)

3. Custom Code
   - Taskbot implementation
   - Modified Rocket.Chat files

4. Documentation
   - TASKBOT_README.md
   - Prompt files

Restore Instructions:
--------------------
1. Extract mongodb_backup.tar.gz
2. Restore MongoDB: docker exec <mongo-container> mongorestore --db=rocketchat /path/to/mongodb_backup/rocketchat
3. Restore configuration files from scripts/ directory
4. Restore custom code from rocketchat_custom/ directory

EOF

echo "  ✅ Manifest created"

# Create compressed archive of entire backup
echo ""
echo "📦 Creating final backup archive..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
cd - > /dev/null

BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)

echo ""
echo "✅ Backup completed successfully!"
echo ""
echo "📊 Backup Summary:"
echo "  Location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "  Size: ${BACKUP_SIZE}"
echo "  Contains:"
echo "    - MongoDB database (all chats, users, settings)"
echo "    - Configuration files"
echo "    - Custom code and scripts"
echo "    - Documentation"
echo ""
echo "💾 To restore, extract the archive and follow instructions in BACKUP_MANIFEST.txt"



