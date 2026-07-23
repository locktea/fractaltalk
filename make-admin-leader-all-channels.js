#!/usr/bin/env node

const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

// Admin credentials (the one making the changes)
const ADMIN_EMAIL = requireEnv('ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD');

// Target user (the one to make leader)
const TARGET_EMAIL = requireEnv('TARGET_USER_EMAIL');

async function login(email, password) {
	console.log(`Logging in as: ${email}...`);
	const response = await fetch(`${BASE_API_URL}/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			user: email,
			password: password,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Login failed: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	return {
		authToken: data.data.authToken,
		userId: data.data.userId,
	};
}

async function findUserByEmail(authToken, userId, email) {
	const response = await fetch(`${BASE_API_URL}/users.list?query=${encodeURIComponent(JSON.stringify({"emails.address": email}))}`, {
		method: 'GET',
		headers: {
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to search users: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	if (data.users && data.users.length > 0) {
		const exactMatch = data.users.find(u => 
			u.emails && u.emails.some(e => e.address && e.address.toLowerCase() === email.toLowerCase())
		);
		return exactMatch || null;
	}
	return null;
}

async function getAllChannels(authToken, userId) {
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

async function getAllGroups(authToken, userId) {
	const response = await fetch(`${BASE_API_URL}/groups.list`, {
		method: 'GET',
		headers: {
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to get groups: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	return data.groups || [];
}

async function addUserToChannel(authToken, userId, channelId, targetUserId) {
	// First, make sure user is in the channel
	try {
		const inviteResponse = await fetch(`${BASE_API_URL}/channels.invite`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Auth-Token': authToken,
				'X-User-Id': userId,
			},
			body: JSON.stringify({
				roomId: channelId,
				userId: targetUserId,
			}),
		});

		if (!inviteResponse.ok) {
			const errorText = await inviteResponse.text();
			if (!errorText.includes('already in room') && !errorText.includes('already in channel')) {
				console.log(`    ⚠️  Could not add user to channel (may already be in): ${errorText.substring(0, 100)}`);
			}
		}
	} catch (error) {
		// Ignore invite errors, user might already be in channel
	}

	// Now add as leader
	const response = await fetch(`${BASE_API_URL}/channels.addLeader`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
		body: JSON.stringify({
			roomId: channelId,
			userId: targetUserId,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		if (errorText.includes('already a leader')) {
			return { success: true, alreadyLeader: true };
		}
		throw new Error(`Failed to add leader: ${response.status} ${response.statusText}\n${errorText}`);
	}

	return { success: true, alreadyLeader: false };
}

async function addUserToGroup(authToken, userId, groupId, targetUserId) {
	// First, make sure user is in the group
	try {
		const inviteResponse = await fetch(`${BASE_API_URL}/groups.invite`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Auth-Token': authToken,
				'X-User-Id': userId,
			},
			body: JSON.stringify({
				roomId: groupId,
				userId: targetUserId,
			}),
		});

		if (!inviteResponse.ok) {
			const errorText = await inviteResponse.text();
			if (!errorText.includes('already in room') && !errorText.includes('already in group')) {
				console.log(`    ⚠️  Could not add user to group (may already be in): ${errorText.substring(0, 100)}`);
			}
		}
	} catch (error) {
		// Ignore invite errors, user might already be in group
	}

	// Now add as leader
	const response = await fetch(`${BASE_API_URL}/groups.addLeader`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
		body: JSON.stringify({
			roomId: groupId,
			userId: targetUserId,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		if (errorText.includes('already a leader')) {
			return { success: true, alreadyLeader: true };
		}
		throw new Error(`Failed to add leader: ${response.status} ${response.statusText}\n${errorText}`);
	}

	return { success: true, alreadyLeader: false };
}

async function main() {
	try {
		// Login as admin
		const { authToken, userId } = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Admin login successful!\n');

		// Find target user
		const targetUser = await findUserByEmail(authToken, userId, TARGET_EMAIL);
		if (!targetUser) {
			throw new Error(`User ${TARGET_EMAIL} not found`);
		}
		console.log(`✅ Found target user: ${targetUser.username || targetUser.name} (${targetUser._id})\n`);

		// Get all channels
		console.log('Fetching all channels...');
		const channels = await getAllChannels(authToken, userId);
		console.log(`Found ${channels.length} channels\n`);

		// Get all groups
		console.log('Fetching all groups...');
		const groups = await getAllGroups(authToken, userId);
		console.log(`Found ${groups.length} groups\n`);

		let channelsProcessed = 0;
		let channelsSuccess = 0;
		let channelsAlreadyLeader = 0;
		let channelsErrors = 0;

		let groupsProcessed = 0;
		let groupsSuccess = 0;
		let groupsAlreadyLeader = 0;
		let groupsErrors = 0;

		// Process channels
		console.log('='.repeat(60));
		console.log('Processing Channels');
		console.log('='.repeat(60));
		for (const channel of channels) {
			channelsProcessed++;
			try {
				const result = await addUserToChannel(authToken, userId, channel._id, targetUser._id);
				if (result.alreadyLeader) {
					channelsAlreadyLeader++;
					console.log(`  ✅ #${channel.name} - Already a leader`);
				} else {
					channelsSuccess++;
					console.log(`  ✅ #${channel.name} - Added as leader`);
				}
			} catch (error) {
				channelsErrors++;
				console.log(`  ❌ #${channel.name} - Error: ${error.message.substring(0, 100)}`);
			}
		}

		// Process groups
		console.log('\n' + '='.repeat(60));
		console.log('Processing Groups');
		console.log('='.repeat(60));
		for (const group of groups) {
			groupsProcessed++;
			try {
				const result = await addUserToGroup(authToken, userId, group._id, targetUser._id);
				if (result.alreadyLeader) {
					groupsAlreadyLeader++;
					console.log(`  ✅ ${group.name} - Already a leader`);
				} else {
					groupsSuccess++;
					console.log(`  ✅ ${group.name} - Added as leader`);
				}
			} catch (error) {
				groupsErrors++;
				console.log(`  ❌ ${group.name} - Error: ${error.message.substring(0, 100)}`);
			}
		}

		// Summary
		console.log('\n' + '='.repeat(60));
		console.log('SUMMARY');
		console.log('='.repeat(60));
		console.log(`Channels:`);
		console.log(`  Total: ${channelsProcessed}`);
		console.log(`  ✅ Added as leader: ${channelsSuccess}`);
		console.log(`  ⏭️  Already leader: ${channelsAlreadyLeader}`);
		console.log(`  ❌ Errors: ${channelsErrors}`);
		console.log(`\nGroups:`);
		console.log(`  Total: ${groupsProcessed}`);
		console.log(`  ✅ Added as leader: ${groupsSuccess}`);
		console.log(`  ⏭️  Already leader: ${groupsAlreadyLeader}`);
		console.log(`  ❌ Errors: ${groupsErrors}`);
		console.log('='.repeat(60));

	} catch (error) {
		console.error('\n❌ Fatal Error:', error.message);
		process.exit(1);
	}
}

main();

