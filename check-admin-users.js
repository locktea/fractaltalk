#!/usr/bin/env node

const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

// Get credentials from environment variables or command line
const USERNAME = process.argv[2] || requireEnv('SCRIPT_LOGIN_EMAIL');
const PASSWORD = process.argv[3] || requireEnv('SCRIPT_LOGIN_PASSWORD');

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

async function getRoles(authToken, userId) {
	const response = await fetch(`${BASE_API_URL}/roles.list`, {
		method: 'GET',
		headers: {
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to get roles: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	return data.roles;
}

async function getUsersInRole(authToken, userId, roleName) {
	const response = await fetch(`${BASE_API_URL}/roles.getUsersInRole?role=${roleName}`, {
		method: 'GET',
		headers: {
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to get users in role: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	return data.users;
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
		console.log(`User ID: ${currentUser._id}`);
		console.log(`Roles: ${currentUser.roles?.join(', ') || 'none'}`);
		console.log(`Is Admin: ${currentUser.roles?.includes('admin') ? '✅ YES' : '❌ NO'}\n`);

		// Check if user has admin permission
		if (!currentUser.roles?.includes('admin')) {
			console.log('⚠️  Warning: You are not logged in as an admin user.');
			console.log('You need admin privileges to view all admin users.\n');
		}

		// Try to get all admin users
		console.log('Fetching all admin users...\n');
		try {
			const adminUsers = await getUsersInRole(authToken, userId, 'admin');

			if (adminUsers && adminUsers.length > 0) {
				console.log(`Found ${adminUsers.length} admin user(s):\n`);
				adminUsers.forEach((user, index) => {
					console.log(`${index + 1}. ${user.name || user.username || 'Unknown'}`);
					console.log(`   Username: ${user.username || 'N/A'}`);
					console.log(`   Email: ${user.emails?.[0]?.address || 'N/A'}`);
					console.log(`   User ID: ${user._id}`);
					console.log(`   Active: ${user.active ? '✅' : '❌'}`);
					console.log('');
				});
			} else {
				console.log('No admin users found.');
			}
		} catch (error) {
			console.log('❌ Cannot access admin user list (requires admin permissions)');
			console.log('\n📋 To find admin users, you can:');
			console.log('1. Check the Rocket.Chat server logs during startup');
			console.log('2. Access the database directly and query users with admin role');
			console.log('3. Try logging in with other user accounts you may have created');
			console.log('4. If this is a fresh installation, the first registered user becomes admin');
			console.log('\n💡 If you need to create an admin user, you can:');
			console.log('- Set environment variables: ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASS');
			console.log('- Or use the MongoDB shell to manually add admin role to a user');
		}

	} catch (error) {
		console.error('\n❌ Error:', error.message);
		process.exit(1);
	}
}

main();

