#!/usr/bin/env node

const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

// Account used to log in and call the API (must be an admin)
const LOGIN_EMAIL = process.argv[2] || requireEnv('SCRIPT_LOGIN_EMAIL');
const LOGIN_PASSWORD = process.argv[3] || requireEnv('SCRIPT_LOGIN_PASSWORD');

// User this script creates or promotes
const ADMIN_EMAIL = requireEnv('TARGET_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('TARGET_ADMIN_PASSWORD');
const ADMIN_USERNAME = process.env.TARGET_ADMIN_USERNAME || ADMIN_EMAIL.split('@')[0];

const CREDENTIALS = {
	username: LOGIN_EMAIL,
	password: LOGIN_PASSWORD,
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

async function createUser(authToken, userId, email, username, password, name) {
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
			username: username,
			password: password,
			name: name || username,
			roles: ['admin'], // Try to set admin role during creation
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to create user: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	return data.user;
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

async function main() {
	try {
		// Login
		const { authToken, userId } = await login();
		console.log('Login successful!\n');

		// Check if user already exists
		console.log(`Checking if user ${ADMIN_EMAIL} already exists...`);
		const existingUser = await findUserByEmail(authToken, userId, ADMIN_EMAIL);
		
		if (existingUser) {
			console.log(`User already exists: ${existingUser.username || existingUser.name}`);
			console.log(`User ID: ${existingUser._id}`);
			console.log(`Current roles: ${existingUser.roles?.join(', ') || 'none'}`);
			
			if (existingUser.roles?.includes('admin')) {
				console.log('\n✅ User already has admin role!');
				return;
			}
			
			// Try to assign admin role
			console.log('\nAttempting to assign admin role...');
			try {
				await assignAdminRole(authToken, userId, existingUser._id);
				console.log('✅ Admin role assigned successfully!');
			} catch (error) {
				console.log(`\n❌ Failed to assign admin role via API: ${error.message}`);
				console.log('\n📋 You will need to use MongoDB to assign the admin role.');
				console.log('\nMongoDB commands:');
				console.log('```javascript');
				console.log('use meteor');
				console.log(`db.users.update(`);
				console.log(`  { "emails.address": "${ADMIN_EMAIL}" },`);
				console.log(`  { $addToSet: { roles: "admin" } }`);
				console.log(`);`);
				console.log('```');
			}
			return;
		}

		// Try to create the user
		console.log(`Creating new admin user...`);
		try {
			const newUser = await createUser(authToken, userId, ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD, 'Admin User');
			console.log('\n✅ User created successfully!');
			console.log(`User ID: ${newUser._id}`);
			console.log(`Username: ${newUser.username}`);
			console.log(`Email: ${newUser.emails?.[0]?.address}`);
			console.log(`Roles: ${newUser.roles?.join(', ') || 'none'}`);
			
			if (!newUser.roles?.includes('admin')) {
				console.log('\n⚠️  User created but admin role not assigned. Attempting to assign...');
				try {
					await assignAdminRole(authToken, userId, newUser._id);
					console.log('✅ Admin role assigned successfully!');
				} catch (error) {
					console.log(`\n❌ Failed to assign admin role: ${error.message}`);
					console.log('\n📋 You will need to use MongoDB to assign the admin role.');
					console.log('\nMongoDB commands:');
					console.log('```javascript');
					console.log('use meteor');
					console.log(`db.users.update(`);
					console.log(`  { "emails.address": "${ADMIN_EMAIL}" },`);
					console.log(`  { $addToSet: { roles: "admin" } }`);
					console.log(`);`);
					console.log('```');
				}
			} else {
				console.log('\n✅ User created with admin role!');
			}
		} catch (error) {
			console.log(`\n❌ Failed to create user via API: ${error.message}`);
			console.log('\n📋 You will need to use MongoDB to create the admin user.');
			console.log('\nMongoDB commands:');
			console.log('```javascript');
			console.log('use meteor');
			console.log(`db.users.insertOne({`);
			console.log(`  _id: "${ADMIN_USERNAME}",`);
			console.log(`  username: "${ADMIN_USERNAME}",`);
			console.log(`  name: "Admin User",`);
			console.log(`  emails: [{ address: "${ADMIN_EMAIL}", verified: true }],`);
			console.log(`  roles: ["admin", "user"],`);
			console.log(`  active: true,`);
			console.log(`  type: "user",`);
			console.log(`  status: "offline",`);
			console.log(`  statusDefault: "online",`);
			console.log(`  utcOffset: 0,`);
			console.log(`  createdAt: new Date(),`);
			console.log(`  services: {`);
			console.log(`    password: {`);
			console.log(`      bcrypt: "$2b$10$LNYaqDreDE7tt9EVEeaS9uw.C3hic9hcqFfIocMBPTMxJaDCC6QWW"`);
			console.log(`    }`);
			console.log(`  }`);
			console.log(`});`);
			console.log('```');
			console.log('\nNote: The bcrypt hash above is for password "password".');
			console.log('You may need to generate a proper bcrypt hash for your password.');
		}

	} catch (error) {
		console.error('\n❌ Error:', error.message);
		process.exit(1);
	}
}

main();

