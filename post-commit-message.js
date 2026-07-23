#!/usr/bin/env node

const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

const ADMIN_EMAIL = requireEnv('ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD');

const commitMessage = `🚀 **New Commit: Task History Feature Added**

**Commit:** 81b83f7
**Branch:** main

## New Feature: /task-history Command

Added comprehensive task history viewing functionality to the taskbot!

### ✨ Features
- View tasks by date: Shows all tasks (pending and completed) for a specific date
- Relative date support: \`today\`, \`yesterday\`, \`tomorrow\`
- Specific date format: \`MM-DD-YY\` (e.g., \`9-15-25\`)
- Comprehensive task details: Creator, assignee, completion info, and evidence
- Smart filtering: Pending tasks by creation date, completed tasks by completion date

### 📝 Usage Examples
\`\`\`
/task-history              # Shows today's tasks (default)
/task-history today        # Shows today's tasks
/task-history yesterday    # Shows yesterday's tasks
/task-history tomorrow     # Shows tomorrow's tasks
/task-history 9-15-25      # Shows tasks for September 15, 2025
\`\`\`

### 🔧 Technical Implementation
- Added \`parseDate()\` function for date string parsing
- Added \`getTasksByDate()\` function for date-based task filtering
- Enhanced task display with full details and evidence preview
- Timezone-aware date comparison

### 📊 Changes
- **2 files changed**
- **176 insertions**
- Updated \`tasks.ts\` with new command and helper functions
- Updated \`TASKBOT_README.md\` with documentation

### 🎯 Impact
- Enables users to review task activity for any date
- Supports daily standups and retrospectives
- Provides historical task tracking and analysis
- Complements existing \`/task-list\` command with date-based filtering

The taskbot now has **5 commands**:
1. \`/task-add\` - Create tasks (channel heads only)
2. \`/task-list\` - List all tasks
3. \`/task-done\` - Mark tasks as completed
4. \`/task-assign\` - Assign tasks to users
5. \`/task-history\` - View tasks by date ✨ **NEW**

Ready to use! Try \`/task-history today\` in any channel.`;

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
    
    const postRes = await fetch(BASE_API_URL + '/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': authToken,
        'X-User-Id': userId
      },
      body: JSON.stringify({
        channel: '#engineering',
        text: commitMessage
      })
    });
    
    const postData = await postRes.json();
    if (postData.success) {
      console.log('✅ Commit message posted to #engineering channel!');
      console.log('Message ID:', postData.message._id);
    } else {
      console.error('Failed to post:', postData);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();



