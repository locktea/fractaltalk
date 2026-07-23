#!/usr/bin/env node

const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

const USERNAME = process.argv[2] || requireEnv('MAKE_ADMIN_USER_EMAIL');
const PASSWORD = process.argv[3] || requireEnv('PASSWORD');

const CREDENTIALS = {
	username: USERNAME,
	password: PASSWORD,
};

async function login() {
	console.log('Logging in...');
	const response = await fetch(`${BASE_API_URL}/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			user: CREDENTIALS.username,
			password: CREDENTIALS.password,
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
	try {
		const response = await fetch(`${BASE_API_URL}/users.list?query={"emails.address":"${email}"}`, {
			method: 'GET',
			headers: {
				'X-Auth-Token': authToken,
				'X-User-Id': userId,
			},
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		if (data.users && data.users.length > 0) {
			// Filter out system users like rocket.cat
			const realUsers = data.users.filter(u => (u.type === 'user' || !u.type) && u.emails?.[0]?.address === email);
			if (realUsers.length > 0) {
				return realUsers[0];
			}
		}
		return null;
	} catch (error) {
		return null;
	}
}

async function assignAdminRole(authToken, userId, targetUserId) {
	console.log(`Assigning admin role to user ${targetUserId}...`);
	const response = await fetch(`${BASE_API_URL}/users.update`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
		body: JSON.stringify({
			userId: targetUserId,
			data: {
				roles: ['admin'],
			},
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to assign admin role: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	return data.user;
}

async function getUserInfo(authToken, userId, targetUserId) {
	const response = await fetch(`${BASE_API_URL}/users.info?userId=${targetUserId}`, {
		method: 'GET',
		headers: {
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to get user info: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	return data.user;
}

async function main() {
	try {
		// Login
		const { authToken, userId } = await login();
		console.log('Login successful!\n');

		// Get current user info
		const currentUser = await getUserInfo(authToken, userId, userId);
		console.log(`Logged in as: ${currentUser.name || currentUser.username} (${currentUser.emails?.[0]?.address || 'no email'})`);
		console.log(`Current roles: ${currentUser.roles?.join(', ') || 'none'}\n`);

		// Check if current user is the target user
		const isTargetUser = currentUser.emails?.[0]?.address === TARGET_EMAIL;
		
		if (isTargetUser) {
			console.log(`✅ You are logged in as the target user: ${TARGET_EMAIL}`);
			console.log(`   User ID: ${currentUser._id}`);
			console.log(`   Current roles: ${currentUser.roles?.join(', ') || 'none'}\n`);

			if (currentUser.roles?.includes('admin')) {
				console.log('✅ User already has admin role!');
				return;
			}

			// Try to assign admin role via API (may require admin permissions)
			console.log('Attempting to assign admin role...');
			try {
				const updatedUser = await assignAdminRole(authToken, userId, userId);
				console.log('✅ Admin role assigned successfully via API!');
				console.log(`   New roles: ${updatedUser.roles?.join(', ')}`);
				return;
			} catch (error) {
				console.log(`❌ Failed to assign admin role via API: ${error.message}`);
				console.log('   (This is expected - you need admin permissions to assign admin role)');
			}
		} else {
			// Find target user
			console.log(`Finding user: ${TARGET_EMAIL}...`);
			const targetUser = await findUserByEmail(authToken, userId, TARGET_EMAIL);

			if (!targetUser) {
				console.log(`❌ User ${TARGET_EMAIL} not found via search.`);
				console.log('   (User may exist but search failed)');
			} else {
				console.log(`✅ Found user: ${targetUser.username || targetUser.name}`);
				console.log(`   User ID: ${targetUser._id}`);
				console.log(`   Current roles: ${targetUser.roles?.join(', ') || 'none'}\n`);

				if (targetUser.roles?.includes('admin')) {
					console.log('✅ User already has admin role!');
					return;
				}

				// Try to assign admin role via API
				try {
					const updatedUser = await assignAdminRole(authToken, userId, targetUser._id);
					console.log('✅ Admin role assigned successfully via API!');
					console.log(`   New roles: ${updatedUser.roles?.join(', ')}`);
					return;
				} catch (error) {
					console.log(`❌ Failed to assign admin role via API: ${error.message}`);
				}
			}
		}

		// If API method failed, provide MongoDB instructions
		console.log('\n📋 Use MongoDB to add admin role:');
		console.log('```javascript');
		console.log('use meteor;');
		console.log(`db.users.update(`);
		console.log(`  { "emails.address": "${TARGET_EMAIL}" },`);
		console.log(`  { $addToSet: { roles: "admin" } }`);
		console.log(`);`);
		console.log('```');
		console.log('\nOr run this command:');
		console.log(`mongosh mongodb://localhost:27017/meteor --eval 'db.users.update({"emails.address":"${TARGET_EMAIL}"}, {$addToSet: {roles: "admin"}})'`);

	} catch (error) {
		console.error('\n❌ Error:', error.message);
		console.log('\n📋 Use MongoDB to add admin role:');
		console.log('```javascript');
		console.log('use meteor;');
		console.log(`db.users.update(`);
		console.log(`  { "emails.address": "${TARGET_EMAIL}" },`);
		console.log(`  { $addToSet: { roles: "admin" } }`);
		console.log(`);`);
		console.log('```');
		process.exit(1);
	}
}

main();

