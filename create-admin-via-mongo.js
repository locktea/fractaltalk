#!/usr/bin/env node

// This script generates MongoDB commands to create the admin user
// You'll need to run these commands in MongoDB

const path = require('path');
const { execSync } = require('child_process');
const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const email = requireEnv('NEW_ADMIN_EMAIL');
const username = process.env.NEW_ADMIN_USERNAME || email.split('@')[0];
const password = requireEnv('NEW_ADMIN_PLAIN_PASSWORD');
const name = 'Admin User';

console.log('Generating password hash...');
console.log('Note: You need to generate a bcrypt hash for the password.');
console.log('\nTo create the user, run this in MongoDB:');
console.log('==========================================\n');

// We'll use a placeholder hash - user will need to generate it properly
// Or we can try to use Rocket.Chat's password hashing
console.log(`
// Option 1: Use Rocket.Chat's password hashing (recommended)
// First, generate the hash using Rocket.Chat's code or a bcrypt tool
// Then run:

db.users.insertOne({
  _id: "adminuser",
  username: "${username}",
  emails: [{address: "${email}", verified: true}],
  name: "${name}",
  roles: ["admin", "user"],
  active: true,
  type: "user",
  services: {
    password: {
      bcrypt: "<GENERATED_HASH_HERE>"
    }
  },
  createdAt: new Date(),
  _updatedAt: new Date()
});

// Option 2: Use the registration API endpoint to create the user first,
// then assign admin role via MongoDB:

db.users.updateOne(
  {emails: {$elemMatch: {address: "${email}"}}},
  {$push: {roles: "admin"}}
);
`);

console.log('\nAlternatively, you can use the Rocket.Chat web UI to create the user,');
console.log('then assign admin role via MongoDB using the update command above.');

