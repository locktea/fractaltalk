#!/usr/bin/env node

const path = require('path');
const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

// Get credentials from environment variables, .env file, or command line arguments
// Priority: command line args > environment variables > .env file > defaults
// Usage: USERNAME=myuser PASSWORD=mypass node test-post-message.js
// Or: node test-post-message.js myuser mypass
// Or: node test-post-message.js --read (to read last message)
// Or: node test-post-message.js --summarize (to summarize last 20 messages and post)
const IS_READ_MODE = process.argv[2] === '--read' || process.argv[2] === 'read';
const IS_SUMMARIZE_MODE = process.argv[2] === '--summarize' || process.argv[2] === '--summary';
const IS_SPECIAL_MODE = IS_READ_MODE || IS_SUMMARIZE_MODE;
const USERNAME = IS_SPECIAL_MODE
	? (process.env.USERNAME || requireEnv('RC_TEST_USERNAME'))
	: (process.argv[2] || process.env.USERNAME || requireEnv('RC_TEST_USERNAME'));
const PASSWORD = IS_SPECIAL_MODE
	? (process.env.PASSWORD || requireEnv('RC_TEST_PASSWORD'))
	: (process.argv[3] || process.env.PASSWORD || requireEnv('RC_TEST_PASSWORD'));

const CREDENTIALS = {
	username: USERNAME,
	password: PASSWORD,
};

async function checkServer() {
	console.log(`Checking if server is running at ${BASE_URL}...`);
	try {
		const response = await fetch(`${BASE_URL}/api/info`);
		if (response.ok || response.status === 404) {
			console.log('Server appears to be running');
			return true;
		}
	} catch (error) {
		console.error(`Server check failed: ${error.message}`);
		return false;
	}
	return false;
}

async function login() {
	console.log('Logging in...');
	console.log(`Using username/email: ${CREDENTIALS.username}`);
	console.log(`Password: ${'*'.repeat(CREDENTIALS.password.length)}`);
	
	const response = await fetch(`${BASE_API_URL}/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			user: CREDENTIALS.username, // API will auto-detect if it's email or username
			password: CREDENTIALS.password,
		}),
	});

		if (!response.ok) {
		const errorText = await response.text();
		let errorDetails = `Login failed: ${response.status} ${response.statusText}\n${errorText}`;
		try {
			const errorJson = JSON.parse(errorText);
			if (errorJson.message) {
				errorDetails += `\n\nServer message: ${errorJson.message}`;
			}
		} catch (e) {
			// Not JSON, use as-is
		}
		errorDetails += `\n\nAttempted login with:\n  Email/Username: ${CREDENTIALS.username}\n  Password length: ${CREDENTIALS.password.length} characters`;
		errorDetails += `\n\nTo use custom credentials, run:\n  USERNAME=youruser PASSWORD=yourpass node test-post-message.js\nOr:\n  node test-post-message.js youruser yourpass`;
		throw new Error(errorDetails);
	}

	const data = await response.json();
	console.log('Login successful!');
	console.log(`User ID: ${data.data.userId}`);
	return {
		authToken: data.data.authToken,
		userId: data.data.userId,
	};
}

async function getChannels(authToken, userId) {
	console.log('Fetching channels...');
	const response = await fetch(`${BASE_API_URL}/channels.list`, {
		method: 'GET',
		headers: {
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to get channels: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	return data.channels || [];
}

async function createChannel(authToken, userId, channelName = 'test-channel') {
	console.log(`Creating channel: ${channelName}...`);
	const response = await fetch(`${BASE_API_URL}/channels.create`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
		body: JSON.stringify({
			name: channelName,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		// If channel already exists, that's okay
		if (response.status === 400) {
			console.log(`Channel ${channelName} might already exist, trying to use existing channel...`);
			return null;
		}
		throw new Error(`Failed to create channel: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	console.log(`Channel created: ${data.channel.name} (${data.channel._id})`);
	return data.channel;
}

async function getLastMessage(authToken, userId, roomId) {
	console.log(`Fetching last message from room ${roomId}...`);
	const response = await fetch(`${BASE_API_URL}/channels.messages?roomId=${roomId}&count=1`, {
		method: 'GET',
		headers: {
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to get messages: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	if (data.messages && data.messages.length > 0) {
		const lastMessage = data.messages[0];
		return {
			_id: lastMessage._id,
			msg: lastMessage.msg,
			username: lastMessage.u?.username || 'Unknown',
			name: lastMessage.u?.name || 'Unknown',
			ts: lastMessage.ts,
		};
	}
	return null;
}

async function getLastMessages(authToken, userId, roomId, count = 20) {
	console.log(`Fetching last ${count} messages from room ${roomId}...`);
	const response = await fetch(`${BASE_API_URL}/channels.messages?roomId=${roomId}&count=${count}`, {
		method: 'GET',
		headers: {
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to get messages: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	if (data.messages && data.messages.length > 0) {
		return data.messages.map(msg => ({
			_id: msg._id,
			msg: msg.msg,
			username: msg.u?.username || 'Unknown',
			name: msg.u?.name || 'Unknown',
			ts: msg.ts,
		}));
	}
	return [];
}

function distillMessages(messages) {
	if (messages.length === 0) {
		return 'No messages found.';
	}

	// Extract key information from messages
	const messageTexts = messages.map(m => m.msg).filter(m => m && m.trim().length > 0);
	const participants = [...new Set(messages.map(m => m.username))];
	
	// Technical details extraction
	const techStack = new Set();
	const files = new Set();
	const apis = new Set();
	const configs = new Set();
	const processes = new Set();
	const issues = new Set();
	const solutions = new Set();
	const questions = [];
	const keyTechnicalMessages = [];
	
	// Filter out AI summary messages first
	const filteredMessages = messageTexts.filter(msg => {
		const lower = msg.toLowerCase();
		return !lower.includes('🤖') && !lower.includes('ai summary') && !lower.includes('ai technical context');
	});
	
	filteredMessages.forEach(msg => {
		const lowerMsg = msg.toLowerCase();
		const trimmed = msg.trim();
		
		// Extract technical stack mentions
		if (lowerMsg.includes('node.js') || lowerMsg.includes('nodejs') || lowerMsg.includes('typescript') || 
		    lowerMsg.includes('meteor') || lowerMsg.includes('mongodb') || lowerMsg.includes('react') ||
		    lowerMsg.includes('api') || lowerMsg.includes('rest') || lowerMsg.includes('websocket') ||
		    lowerMsg.includes('docker') || lowerMsg.includes('kubernetes')) {
			techStack.add(msg.match(/(node\.?js|typescript|meteor|mongodb|react|api|rest|websocket|docker|kubernetes)/i)?.[0] || '');
		}
		
		// Extract file mentions
		const fileMatches = msg.match(/(\w+\.(js|ts|tsx|md|json|yml|yaml|sh|env|config|txt))\b/g);
		if (fileMatches) {
			fileMatches.forEach(f => files.add(f));
		}
		
		// Extract API endpoints
		const apiMatches = msg.match(/(\/api\/v\d+\/[\w\.-]+|POST|GET|PUT|DELETE)\s+[\w\/]+/gi);
		if (apiMatches) {
			apiMatches.forEach(a => apis.add(a.substring(0, 50)));
		}
		
		// Extract configuration details
		if (lowerMsg.includes('port') || lowerMsg.includes('localhost') || lowerMsg.includes('base_url') ||
		    lowerMsg.includes('env') || lowerMsg.includes('config') || lowerMsg.includes('credentials')) {
			const configMatch = msg.match(/(port|localhost|base_url|BASE_URL|\.env|credentials|config)[\s:=]+[\w:\.@\/]+/i);
			if (configMatch) {
				configs.add(configMatch[0].substring(0, 60));
			}
		}
		
		// Extract processes/workflows (exclude AI summaries)
		if (!lowerMsg.includes('🤖') && !lowerMsg.includes('ai summary') &&
		    (lowerMsg.includes('build') || lowerMsg.includes('fossify') || lowerMsg.includes('deploy') ||
		     lowerMsg.includes('start') || lowerMsg.includes('run') || lowerMsg.includes('script'))) {
			processes.add(trimmed.substring(0, 80));
		}
		
		// Extract issues/problems (exclude AI summaries)
		if (!lowerMsg.includes('🤖') && !lowerMsg.includes('ai summary') &&
		    (lowerMsg.includes('error') || lowerMsg.includes('failed') || lowerMsg.includes('issue') ||
		     lowerMsg.includes('bug') || lowerMsg.includes('problem') || lowerMsg.includes('fix'))) {
			issues.add(trimmed.substring(0, 100));
		}
		
		// Extract solutions/fixes (exclude AI summaries)
		if (!lowerMsg.includes('🤖') && !lowerMsg.includes('ai summary') &&
		    (lowerMsg.includes('fixed') || lowerMsg.includes('solved') || lowerMsg.includes('resolved') ||
		     lowerMsg.includes('working') || lowerMsg.includes('success') || lowerMsg.includes('✅'))) {
			solutions.add(trimmed.substring(0, 100));
		}
		
		// Extract questions (exclude AI summaries)
		if (!lowerMsg.includes('🤖') && !lowerMsg.includes('ai summary') &&
		    (msg.includes('?') || lowerMsg.includes('how') || lowerMsg.includes('what') || lowerMsg.includes('why'))) {
			questions.push(trimmed.substring(0, 120));
		}
		
		// Collect substantial technical messages (exclude AI summaries)
		if (trimmed.length > 50 && 
		    !lowerMsg.includes('🤖') && !lowerMsg.includes('ai summary') && !lowerMsg.includes('ai technical context') &&
		    (trimmed.includes('.js') || trimmed.includes('.ts') || trimmed.includes('API') ||
		     trimmed.includes('script') || trimmed.includes('build') || trimmed.includes('FOSS') ||
		     trimmed.includes('documentation') || trimmed.includes('test') || trimmed.includes('config') ||
		     trimmed.includes('Rocket.Chat') || trimmed.includes('Community Edition'))) {
			keyTechnicalMessages.push(trimmed.substring(0, 200));
		}
	});
	
	// Build comprehensive technical summary
	let summary = `🤖 **AI Technical Context Summary**\n\n`;
	summary += `**Project Status:** ${messages.length} messages analyzed, ${participants.length} contributors\n\n`;
	
	// Technical Stack
	if (techStack.size > 0) {
		summary += `**Tech Stack:** ${Array.from(techStack).filter(Boolean).slice(0, 5).join(', ')}\n`;
	}
	
	// Key Files
	if (files.size > 0) {
		const fileList = Array.from(files).slice(0, 8);
		summary += `**Key Files:** ${fileList.join(', ')}\n`;
	}
	
	// API Endpoints
	if (apis.size > 0) {
		summary += `**APIs:** ${Array.from(apis).slice(0, 3).join(' | ')}\n`;
	}
	
	// Configuration
	if (configs.size > 0) {
		summary += `**Config:** ${Array.from(configs).slice(0, 2).join(' | ')}\n`;
	}
	
	// Processes/Workflows
	if (processes.size > 0) {
		summary += `**Processes:** ${Array.from(processes).slice(0, 2).join(' | ')}\n`;
	}
	
	// Issues & Solutions
	if (issues.size > 0 || solutions.size > 0) {
		if (issues.size > 0) {
			summary += `**Issues:** ${Array.from(issues).slice(0, 1).join(' | ')}\n`;
		}
		if (solutions.size > 0) {
			summary += `**Solutions:** ${Array.from(solutions).slice(0, 1).join(' | ')}\n`;
		}
	}
	
	// Questions
	if (questions.length > 0) {
		summary += `**Open Questions:** ${questions[questions.length - 1]}\n`;
	}
	
	// Key Technical Messages (most important)
	if (keyTechnicalMessages.length > 0) {
		summary += `\n**Key Technical Details:**\n`;
		keyTechnicalMessages.slice(-3).forEach((msg, i) => {
			summary += `${i + 1}. ${msg}${msg.length >= 200 ? '...' : ''}\n`;
		});
	}
	
	summary += `\n**Contributors:** ${participants.join(', ')}`;
	
	// Ensure summary fits Rocket.Chat limits (aim for ~2000 chars max, but be safe)
	if (summary.length > 4000) {
		// Truncate intelligently
		const lines = summary.split('\n');
		let truncated = '';
		for (const line of lines) {
			if (truncated.length + line.length > 3800) break;
			truncated += line + '\n';
		}
		summary = truncated + '...\n_(truncated)_';
	}
	
	return summary;
}

async function postMessage(authToken, userId, roomId, message) {
	console.log(`Posting message to room ${roomId}...`);
	const response = await fetch(`${BASE_API_URL}/chat.postMessage`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
		body: JSON.stringify({
			roomId: roomId,
			text: message,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to post message: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	console.log('Message posted successfully!');
	console.log(`Message ID: ${data.message._id}`);
	console.log(`Message: ${data.message.msg}`);
	return data;
}

async function main() {
	try {
		// Step 0: Check if server is running
		const serverRunning = await checkServer();
		if (!serverRunning) {
			console.warn(`Warning: Could not connect to server at ${BASE_URL}`);
			console.warn('Make sure Rocket.Chat is running. You can set BASE_URL environment variable if using a different URL.');
		}

		// Step 1: Login
		const { authToken, userId } = await login();

		// Step 2: Get or create a channel
		let roomId;
		const channels = await getChannels(authToken, userId);
		
		// Try to find general channel first
		const generalChannel = channels.find(ch => ch.name === 'general' || ch._id === 'GENERAL');
		if (generalChannel) {
			roomId = generalChannel._id;
			console.log(`Using general channel: ${generalChannel.name} (${roomId})`);
		} else if (channels.length > 0) {
			// Use the first available channel if general not found
			roomId = channels[0]._id;
			console.log(`Using existing channel: ${channels[0].name} (${roomId})`);
		} else {
			// Try to create a test channel
			const channel = await createChannel(authToken, userId, 'test-channel');
			if (channel) {
				roomId = channel._id;
			} else {
				throw new Error('No channels available and could not create one');
			}
		}

		// Check if we should read the last message instead of posting
		if (IS_READ_MODE) {
			const lastMessage = await getLastMessage(authToken, userId, roomId);
			if (lastMessage) {
				console.log('\n📨 Last message in general channel:');
				console.log('─'.repeat(60));
				console.log(`From: ${lastMessage.name} (@${lastMessage.username})`);
				console.log(`Time: ${new Date(lastMessage.ts).toLocaleString()}`);
				console.log(`Message ID: ${lastMessage._id}`);
				console.log('─'.repeat(60));
				console.log(lastMessage.msg);
				console.log('─'.repeat(60));
			} else {
				console.log('\n⚠️  No messages found in the general channel.');
			}
		} else if (IS_SUMMARIZE_MODE) {
			// Summarize last 20 messages and post the summary
			console.log('\n📊 Summarizing last 20 messages...');
			const messages = await getLastMessages(authToken, userId, roomId, 20);
			
			if (messages.length === 0) {
				console.log('\n⚠️  No messages found to summarize.');
			} else {
				const summary = distillMessages(messages);
				const summaryMessage = `🤖 **AI Summary**\n\n${summary}\n\n_Generated: ${new Date().toLocaleString()}_`;
				
				console.log('\n📝 Generated summary:');
				console.log('─'.repeat(60));
				console.log(summary);
				console.log('─'.repeat(60));
				
				await postMessage(authToken, userId, roomId, summaryMessage);
				console.log('\n✅ AI summary posted to general channel!');
			}
		} else {
			// Step 3: Post a test message
			// Check if a message file was provided or message as argument
			let messageToPost = 'Test message from login script';
			if (process.argv[4]) {
				messageToPost = process.argv[4];
			} else if (process.argv[5] === '--file') {
				const fs = require('fs');
				const filePath = process.argv[6] || 'TEST_SCRIPT_DOCUMENTATION.md';
				if (fs.existsSync(filePath)) {
					messageToPost = fs.readFileSync(filePath, 'utf-8');
				}
			}
			await postMessage(authToken, userId, roomId, messageToPost);

			console.log('\n✅ Successfully logged in and posted test message!');
		}
	} catch (error) {
		console.error('\n❌ Error:', error.message);
		process.exit(1);
	}
}

main();

