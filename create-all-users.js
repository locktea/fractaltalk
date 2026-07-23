#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

const ADMIN_EMAIL = requireEnv('ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD');

const usersSeedPath = path.resolve(__dirname, process.env.USERS_SEED_JSON || 'users.seed.json');
if (!fs.existsSync(usersSeedPath)) {
	console.error(`Missing user seed file: ${usersSeedPath}`);
	console.error('Copy users.seed.json.example to users.seed.json and set real passwords (users.seed.json is gitignored).');
	process.exit(1);
}
const USERS = JSON.parse(fs.readFileSync(usersSeedPath, 'utf8'));
const placeholder = 'LOCAL_PASSWORD_PLACEHOLDER';
for (const u of USERS) {
	if (!u.password || u.password === placeholder) {
		console.error(`Invalid password for ${u.email}: set real passwords in ${usersSeedPath}`);
		process.exit(1);
	}
}

async function login() {
	console.log(`Logging in as admin: ${ADMIN_EMAIL}...`);
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
	// Use exact email match by encoding the query properly
	const encodedEmail = encodeURIComponent(email);
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
		// Filter to find exact email match (case-insensitive)
		const exactMatch = data.users.find(u => 
			u.emails && u.emails.some(e => e.address && e.address.toLowerCase() === email.toLowerCase())
		);
		return exactMatch || null;
	}
	return null;
}

async function createUser(authToken, userId, userDef) {
	console.log(`Creating user: ${userDef.email}...`);
	const response = await fetch(`${BASE_API_URL}/users.create`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
		body: JSON.stringify({
			email: userDef.email,
			name: userDef.name,
			username: userDef.username,
			password: userDef.password,
			roles: ['user'],
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		// If user already exists, that's okay
		if (errorText.includes('already exists') || errorText.includes('duplicate')) {
			console.log(`  User ${userDef.email} already exists, skipping creation`);
			return null;
		}
		throw new Error(`Failed to create user: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	console.log(`  ✅ User created: ${userDef.email}`);
	return data.user;
}

async function updateUserBio(authToken, userId, targetUserId, bio) {
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
				bio: bio,
			},
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to update bio: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	return data.user;
}

async function main() {
	try {
		// Login as admin
		const { authToken, userId } = await login();
		console.log('✅ Admin login successful!\n');

		let created = 0;
		let updated = 0;
		let skipped = 0;
		let errors = 0;

		for (const userDef of USERS) {
			try {
				// Check if user exists
				let user = await findUserByEmail(authToken, userId, userDef.email);
				
				// Create user if doesn't exist
				if (!user) {
					user = await createUser(authToken, userId, userDef);
					if (user) {
						created++;
					} else {
						// User already exists, find it again
						user = await findUserByEmail(authToken, userId, userDef.email);
						if (user) {
							skipped++;
						} else {
							console.log(`  ⚠️  Could not find or create user: ${userDef.email}`);
							errors++;
							continue;
						}
					}
				} else {
					skipped++;
					console.log(`  User ${userDef.email} already exists`);
				}

				// Read and set bio
				if (user && fs.existsSync(userDef.promptFile)) {
					const bio = fs.readFileSync(userDef.promptFile, 'utf8').trim();
					
					if (bio.length > 10000) {
						console.log(`  ⚠️  Bio too long (${bio.length} chars), truncating...`);
						bio = bio.substring(0, 9997) + '...';
					}

					await updateUserBio(authToken, userId, user._id, bio);
					console.log(`  ✅ Bio updated (${bio.length} characters)`);
					updated++;
				} else if (user && !fs.existsSync(userDef.promptFile)) {
					console.log(`  ⚠️  Prompt file not found: ${userDef.promptFile}`);
					errors++;
				}
				
				console.log(''); // Blank line between users
			} catch (error) {
				console.error(`  ❌ Error processing ${userDef.email}:`, error.message);
				errors++;
				console.log('');
			}
		}

		console.log('\n' + '='.repeat(60));
		console.log('SUMMARY');
		console.log('='.repeat(60));
		console.log(`Total users processed: ${USERS.length}`);
		console.log(`✅ Created: ${created}`);
		console.log(`📝 Updated bios: ${updated}`);
		console.log(`⏭️  Skipped (already exists): ${skipped}`);
		console.log(`❌ Errors: ${errors}`);
		console.log('='.repeat(60));

	} catch (error) {
		console.error('\n❌ Fatal Error:', error.message);
		process.exit(1);
	}
}

main();

