#!/usr/bin/env node

const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

const NEW_ADMIN_EMAIL = requireEnv('NEW_ADMIN_EMAIL');
const NEW_ADMIN_PASSWORD = requireEnv('NEW_ADMIN_PASSWORD');
const NEW_ADMIN_USERNAME = process.env.NEW_ADMIN_USERNAME || 'adminuser';
const NEW_ADMIN_NAME = process.env.NEW_ADMIN_NAME || 'Admin User';

async function registerUser() {
	console.log(`Registering user: ${NEW_ADMIN_EMAIL}...`);
	const response = await fetch(`${BASE_API_URL}/users.register`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			email: NEW_ADMIN_EMAIL,
			username: NEW_ADMIN_USERNAME,
			name: NEW_ADMIN_NAME,
			pass: NEW_ADMIN_PASSWORD,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		// If user already exists, that's okay
		if (errorText.includes('already exists') || errorText.includes('duplicate')) {
			console.log('User already exists, proceeding to make admin...');
			return true;
		}
		throw new Error(`Registration failed: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	console.log('✅ User registered successfully');
	return true;
}

async function makeAdminViaMongo() {
	console.log('\nMaking user admin via MongoDB...');
	const { execSync } = require('child_process');
	try {
		const result = execSync(
			`docker exec rocketchat-mongo-1 mongosh rocketchat --eval 'db.users.updateOne({emails: {$elemMatch: {address: "${NEW_ADMIN_EMAIL}"}}}, {$addToSet: {roles: "admin"}})'`,
			{ encoding: 'utf8' }
		);
		console.log('MongoDB result:', result);
		console.log('✅ Admin role assigned');
		return true;
	} catch (error) {
		console.error('Error making admin:', error.message);
		return false;
	}
}

async function main() {
	try {
		await registerUser();
		await makeAdminViaMongo();
		console.log('\n✅ Admin user created and assigned admin role!');
		console.log('You can now run: node create-all-users.js');
	} catch (error) {
		console.error('\n❌ Error:', error.message);
		process.exit(1);
	}
}

main();

