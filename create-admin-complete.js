#!/usr/bin/env node

/**
 * Complete script to create admin user via MongoDB
 * This script can be run directly if you have MongoDB access
 *
 * Usage:
 * 1. If MongoDB is accessible: node create-admin-complete.js
 * 2. Or connect to MongoDB and run the commands manually
 */

const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const ADMIN_EMAIL = requireEnv('BOOTSTRAP_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('BOOTSTRAP_ADMIN_PASSWORD');
const ADMIN_USERNAME = requireEnv('BOOTSTRAP_ADMIN_USERNAME');
const ADMIN_NAME = process.env.BOOTSTRAP_ADMIN_NAME || 'Admin User';

console.log('='.repeat(60));
console.log('Rocket.Chat Admin User Creation Script');
console.log('='.repeat(60));
console.log(`Email: ${ADMIN_EMAIL}`);
console.log(`Username: ${ADMIN_USERNAME}`);
console.log('Password: (value from BOOTSTRAP_ADMIN_PASSWORD in your .env — not printed)');
console.log('='.repeat(60));
console.log('\n📋 MongoDB Commands:\n');
console.log('Copy and paste these commands into MongoDB shell (mongosh):\n');

console.log('// Connect to meteor database');
console.log('use meteor;\n');

console.log('// Check if user exists');
console.log(`const existing = db.users.findOne({ "emails.address": "${ADMIN_EMAIL}" });`);
console.log('if (existing) print("User exists:", existing.username);\n');

console.log('// Create or update user');
console.log(`const userId = existing ? existing._id : "${ADMIN_USERNAME}_" + Date.now();`);
console.log(`const userDoc = {`);
console.log(`  _id: userId,`);
console.log(`  username: "${ADMIN_USERNAME}",`);
console.log(`  name: "${ADMIN_NAME}",`);
console.log(`  emails: [{ address: "${ADMIN_EMAIL}", verified: true }],`);
console.log(`  roles: ["admin", "user"],`);
console.log(`  active: true,`);
console.log(`  type: "user",`);
console.log(`  status: "offline",`);
console.log(`  statusDefault: "online",`);
console.log(`  utcOffset: 0,`);
console.log(`  createdAt: existing ? existing.createdAt : new Date(),`);
console.log(`  services: {`);
console.log(`    password: {`);
console.log(`      bcrypt: "$2b$10$LNYaqDreDE7tt9EVEeaS9uw.C3hic9hcqFfIocMBPTMxJaDCC6QWW"`);
console.log(`    }`);
console.log(`  }`);
console.log(`};`);
console.log(`\nif (existing) {`);
console.log(`  db.users.update({ _id: userId }, { $set: userDoc, $addToSet: { roles: "admin" } });`);
console.log(`  print("✅ User updated with admin role");`);
console.log(`} else {`);
console.log(`  db.users.insertOne(userDoc);`);
console.log(`  print("✅ User created with admin role");`);
console.log(`}\n`);

console.log('// Verify');
console.log(`const user = db.users.findOne({ "emails.address": "${ADMIN_EMAIL}" });`);
console.log('print("\\nUser details:");');
console.log('print("  ID:", user._id);');
console.log('print("  Username:", user.username);');
console.log('print("  Email:", user.emails[0].address);');
console.log('print("  Roles:", user.roles.join(", "));');
console.log('print("  Active:", user.active);\n');

console.log('='.repeat(60));
console.log('\n⚠️  IMPORTANT: The password hash above is a placeholder.');
console.log('You need to set the password using one of these methods:\n');
console.log('1. Use Rocket.Chat web UI password reset feature');
console.log('2. Use the API to set password (if you have another admin account)');
console.log('3. Generate proper bcrypt hash using Rocket.Chat server code\n');
console.log('To generate the hash, run this in Rocket.Chat directory:');
console.log('```bash');
console.log('cd Rocket.Chat');
console.log('node -e "');
console.log('  const crypto=require(\\"crypto\\");');
console.log('  const bcrypt=require(\\"bcrypt\\");');
console.log('  const p=\\"<your-plain-password>\\";');
console.log('  const sha=crypto.createHash(\\"sha256\\").update(p).digest(\\"hex\\");');
console.log('  bcrypt.hash(sha,10).then(h=>console.log(h));');
console.log('"');
console.log('```\n');
console.log('Then update in MongoDB:');
console.log('```javascript');
console.log(`db.users.update(`);
console.log(`  { "emails.address": "${ADMIN_EMAIL}" },`);
console.log(`  { $set: { "services.password.bcrypt": "<generated-hash>" } }`);
console.log(`);`);
console.log('```\n');

