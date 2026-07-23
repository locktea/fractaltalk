#!/usr/bin/env node

const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

// Use existing admin to create new admin
const ADMIN_EMAIL = requireEnv('BOOTSTRAP_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('BOOTSTRAP_ADMIN_PASSWORD');

const NEW_ADMIN_EMAIL = requireEnv('NEW_ADMIN_EMAIL');
const NEW_ADMIN_PASSWORD = requireEnv('NEW_ADMIN_PASSWORD');

async function login() {
	console.log(`Logging in as ${ADMIN_EMAIL}...`);
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

async function findUserByEmail(authToken, userId, email) {
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
		return data.users[0];
	}
	return null;
}

async function createUser(authToken, userId, email, name, username, password, roles) {
	console.log(`Creating user: ${email}...`);
	const response = await fetch(`${BASE_API_URL}/users.create`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
		body: JSON.stringify({
			email: email,
			name: name,
			username: username,
			password: password,
			roles: roles,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to create user: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	return data.user;
}

async function main() {
	try {
		const { authToken, userId } = await login();
		console.log('✅ Login successful!\n');

		// Check if user already exists
		const existingUser = await findUserByEmail(authToken, userId, NEW_ADMIN_EMAIL);
		if (existingUser) {
			console.log(`User ${NEW_ADMIN_EMAIL} already exists.`);
			console.log('You can now run: node create-all-users.js');
			return;
		}

		// Create the admin user
		const user = await createUser(
			authToken,
			userId,
			NEW_ADMIN_EMAIL,
			'Admin User',
			'user',
			NEW_ADMIN_PASSWORD,
			['admin']
		);

		console.log(`✅ Admin user created: ${NEW_ADMIN_EMAIL}`);
		console.log('You can now run: node create-all-users.js');
	} catch (error) {
		console.error('\n❌ Error:', error.message);
		process.exit(1);
	}
}

main();

