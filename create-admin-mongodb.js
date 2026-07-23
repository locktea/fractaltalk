// MongoDB script to create admin user
// Run this with: mongosh <connection_string> < create-admin-mongodb.js
// Or connect to MongoDB and paste these commands
//
// Before running: set ADMIN_EMAIL and ADMIN_USERNAME below to your values.

const ADMIN_EMAIL = 'REPLACE_WITH_YOUR_EMAIL@example.com';
const ADMIN_USERNAME = 'REPLACE_WITH_USERNAME';

// Connect to the meteor database
use meteor;

// First, let's check if the user already exists
const existingUser = db.users.findOne({ "emails.address": ADMIN_EMAIL });

if (existingUser) {
  print("User already exists. Adding admin role...");
  db.users.update(
    { "emails.address": ADMIN_EMAIL },
    { $addToSet: { roles: "admin" } }
  );
  print("✅ Admin role added to existing user!");
} else {
  print("Creating new admin user...");

  // Note: You'll need to generate a proper bcrypt hash for the password
  // For now, we'll create the user and you can reset the password via the web interface
  // Or use the Rocket.Chat API to set the password

  const userId = ADMIN_USERNAME + "_" + new Date().getTime();

  db.users.insertOne({
    _id: userId,
    username: ADMIN_USERNAME,
    name: "Admin User",
    emails: [{
      address: ADMIN_EMAIL,
      verified: true
    }],
    roles: ["admin", "user"],
    active: true,
    type: "user",
    status: "offline",
    statusDefault: "online",
    utcOffset: 0,
    createdAt: new Date(),
    services: {
      password: {
        // This is a placeholder - you'll need to set password via web UI or API
        // Or generate bcrypt hash using: node -e "const bcrypt=require('bcrypt');bcrypt.hash(require('crypto').createHash('sha256').update('<your-plain-password>').digest('hex'),10).then(h=>console.log(h))"
        bcrypt: "$2b$10$LNYaqDreDE7tt9EVEeaS9uw.C3hic9hcqFfIocMBPTMxJaDCC6QWW" // placeholder
      }
    }
  });

  print("✅ User created! Note: Password needs to be set via web UI or API.");
  print("User ID: " + userId);
}

// Verify the user was created/updated
const user = db.users.findOne({ "emails.address": ADMIN_EMAIL });
print("\nUser details:");
print(JSON.stringify(user, null, 2));
