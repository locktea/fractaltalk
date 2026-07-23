#!/usr/bin/env node

/**
 * Attempt to register admin user via Rocket.Chat registration endpoint
 * This works if user registration is enabled
 */

const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

const ADMIN_EMAIL = requireEnv('BOOTSTRAP_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('BOOTSTRAP_ADMIN_PASSWORD');
const ADMIN_USERNAME = requireEnv('BOOTSTRAP_ADMIN_USERNAME');
const ADMIN_NAME = process.env.BOOTSTRAP_ADMIN_NAME || 'Admin User';

async function registerUser() {
	console.log('Attempting to register admin user via registration endpoint...\n');
	console.log(`Email: ${ADMIN_EMAIL}`);
	console.log(`Username: ${ADMIN_USERNAME}`);
	console.log(`Name: ${ADMIN_NAME}\n`);

	const response = await fetch(`${BASE_API_URL}/users.register`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			email: ADMIN_EMAIL,
			username: ADMIN_USERNAME,
			pass: ADMIN_PASSWORD,
			name: ADMIN_NAME,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Registration failed: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	return data.user;
}

async function login() {
	console.log('Logging in with new credentials...\n');
	const response = await fetch(`${BASE_API_URL}/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			user: ADMIN_EMAIL,
			password: ADMIN_PASSWORD,
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

async function checkAdminRole(authToken, userId) {
	const response = await fetch(`${BASE_API_URL}/users.info?userId=${userId}`, {
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
	return data.user;
}

async function main() {
	try {
		// Try to register
		const user = await registerUser();
		console.log('✅ User registered successfully!');
		console.log(`User ID: ${user._id}`);
		console.log(`Username: ${user.username}`);
		console.log(`Email: ${user.emails?.[0]?.address}\n`);

		// Try to login
		const { authToken, userId } = await login();
		console.log('✅ Login successful!\n');

		// Check if user is admin
		const userInfo = await checkAdminRole(authToken, userId);
		if (userInfo) {
			console.log('User roles:', userInfo.roles?.join(', ') || 'none');
			if (userInfo.roles?.includes('admin')) {
				console.log('\n✅ User has admin role!');
			} else {
				console.log('\n⚠️  User does not have admin role yet.');
				console.log('If this is the first user, you should be admin automatically.');
				console.log('Otherwise, you need to add admin role via MongoDB (see CREATE_ADMIN_INSTRUCTIONS.md)');
			}
		}

		console.log('\n✅ Setup complete! You can now log in at:');
		console.log(`   ${BASE_URL}`);
		console.log(`   Email: ${ADMIN_EMAIL}`);
		console.log(`   Password: ${ADMIN_PASSWORD}`);

	} catch (error) {
		console.error('\n❌ Error:', error.message);
		console.log('\n📋 Registration endpoint may be disabled or require additional setup.');
		console.log('Please use one of the methods in CREATE_ADMIN_INSTRUCTIONS.md:');
		console.log('  1. MongoDB (recommended)');
		console.log('  2. Environment variables');
		console.log('  3. Web UI (if you have admin access)');
		process.exit(1);
	}
}

main();

