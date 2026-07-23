# Instructions to Create Admin User

## User Details
- **Email**: [redacted-email]
- **Password**: [redacted]
- **Username**: think

## Method 1: Using MongoDB (Recommended if you have database access)

### Step 1: Connect to MongoDB
```bash
# If MongoDB is running locally
mongosh mongodb://localhost:27017/meteor

# Or if using Docker
docker exec -it <mongodb-container-name> mongosh mongodb://localhost:27017/meteor
```

### Step 2: Run the creation script
```bash
mongosh mongodb://localhost:27017/meteor < create-admin-mongodb.js
```

### Step 3: Set the password (if user was created without password)
You'll need to generate a bcrypt hash. The easiest way is to use Rocket.Chat's password reset feature or set it via the web UI after logging in.

Alternatively, if you have access to the Rocket.Chat codebase, you can generate the hash:
```bash
cd Rocket.Chat
node -e "
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const password = '[redacted]';
const sha256 = crypto.createHash('sha256').update(password).digest('hex');
bcrypt.hash(sha256, 10).then(hash => console.log(hash));
"
```

Then update the user in MongoDB:
```javascript
use meteor;
db.users.update(
  { "emails.address": "[redacted-email]" },
  { $set: { "services.password.bcrypt": "<generated-hash>" } }
);
```

## Method 2: Using Environment Variables (Requires Server Restart)

### Step 1: Set environment variables
```bash
export ADMIN_USERNAME=think
export ADMIN_EMAIL=[redacted-email]
export ADMIN_PASS=[redacted]
export ADMIN_EMAIL_VERIFIED=true
```

### Step 2: Restart Rocket.Chat server
The server will automatically create the admin user on startup if no admins exist.

## Method 3: Using Rocket.Chat Registration (If registration is open)

1. Go to your Rocket.Chat instance
2. Click "Register" or "Create Account"
3. Register with email: [redacted-email] and password: [redacted]
4. If you're the first user, you'll automatically be admin
5. Otherwise, use MongoDB to add admin role (see Method 1, Step 2)

## Method 4: Using Web UI (If you have admin access)

1. Log in as an existing admin
2. Go to Administration → Users
3. Click "New User"
4. Fill in the details:
   - Name: Admin User
   - Username: think
   - Email: [redacted-email]
   - Password: [redacted]
   - Roles: Select "admin"
5. Click "Save"

## Verification

After creating the user, verify it works:
```bash
node check-admin-users.js [redacted-email] [redacted]
```

Or log in via the web interface at: http://localhost:4000

