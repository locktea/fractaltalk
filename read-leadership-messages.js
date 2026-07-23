#!/usr/bin/env node

const path = require('path');
const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

const ADMIN_EMAIL = requireEnv('ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD');
const SOURCE_USERNAME = requireEnv('LEADERSHIP_SOURCE_USERNAME');
const OUTPUT_PATH = path.resolve(
  __dirname,
  process.env.LEADERSHIP_DATA_PATH || 'leadership-data.local.json'
);

(async () => {
  try {
    // Login as admin
    const loginRes = await fetch(BASE_API_URL + '/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        user: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.data) {
      console.error('Login failed:', loginData);
      process.exit(1);
    }
    
    const {authToken, userId} = loginData.data;
    
    // Get leadership channel info
    const channelRes = await fetch(`${BASE_API_URL}/channels.info?roomName=leadership`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': authToken,
        'X-User-Id': userId
      }
    });
    
    const channelData = await channelRes.json();
    if (!channelData.channel) {
      console.error('Channel not found');
      process.exit(1);
    }
    
    const channelId = channelData.channel._id;
    
    // Get recent messages
    const messagesRes = await fetch(`${BASE_API_URL}/channels.messages?roomId=${channelId}&count=50`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': authToken,
        'X-User-Id': userId
      }
    });
    
    const messagesData = await messagesRes.json();
    
    // Filter by a configured username instead of embedding a person's identity.
    const sourceMessages = messagesData.messages.filter(msg =>
      msg.u?.username === SOURCE_USERNAME
    );
    
    console.log(`Found ${sourceMessages.length} messages from the configured source user:\n`);
    sourceMessages.forEach((msg, idx) => {
      console.log(`--- Message ${idx + 1} ---`);
      console.log(`Time: ${new Date(msg.ts).toLocaleString()}`);
      console.log(`Message: ${msg.msg}`);
      console.log('');
    });
    
    // Get all users in leadership channel
    const membersRes = await fetch(`${BASE_API_URL}/channels.members?roomId=${channelId}`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': authToken,
        'X-User-Id': userId
      }
    });
    
    const membersData = await membersRes.json();
    console.log(`\nUsers in leadership channel: ${membersData.members.length}`);
    
    // Keep the local export minimal and avoid copying member identities or emails.
    const output = {
      latestMessage: sourceMessages[0]?.msg || '',
      allMessages: sourceMessages.map(m => ({ text: m.msg, time: m.ts })),
      memberCount: membersData.members.length
    };
    
    require('fs').writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`\n✅ Data saved to ${OUTPUT_PATH}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();


