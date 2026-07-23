#!/usr/bin/env node

const fs = require('fs');
const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

// Get credentials from environment variables or command line
// Usage: node set-user-bio.js [username] [password]
const USERNAME = process.argv[2] || requireEnv('SECURITY_EMAIL');
const PASSWORD = process.argv[3] || requireEnv('SECURITY_PASSWORD');

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
	console.log(`Searching for user with email: ${email}...`);
	const response = await fetch(`${BASE_API_URL}/users.list?query={"emails.address":"${email}"}`, {
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
		return data.users[0];
	}
	return null;
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

async function updateOwnBio(authToken, userId, bio) {
	console.log(`Updating own bio...`);
	const response = await fetch(`${BASE_API_URL}/users.updateOwnBasicInfo`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
		body: JSON.stringify({
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
		// Login as the security user (or admin if creating the user)
		const { authToken, userId } = await login();
		console.log('Login successful!');

		// Get current user info to verify
		const currentUser = await getUserInfo(authToken, userId, userId);
		console.log(`Logged in as: ${currentUser.username || currentUser.name} (${currentUser.emails?.[0]?.address || 'no email'})`);

		// Allow updating bio for the currently logged-in user
		// No need to check for specific user - just update the current user's bio

		// Read bio from file or use default
		let bio = process.argv[4];
		if (bio) {
			// If it's a file path, read the file
			if (fs.existsSync(bio)) {
				bio = fs.readFileSync(bio, 'utf8').trim();
				console.log(`Reading bio from file: ${process.argv[4]}`);
			}
			// Otherwise use the argument as the bio text directly
		} else {
			const bioFile = 'security-engineer-prompt.txt';
			if (fs.existsSync(bioFile)) {
				bio = fs.readFileSync(bioFile, 'utf8').trim();
				console.log(`Reading bio from default file: ${bioFile}`);
			} else {
				bio = '🔒 Elite Security Engineer | 15+ yrs | OWASP/CWE/CVE expert | Code review, threat modeling, pen testing | Finds & fixes vulnerabilities | Defense-in-depth, least privilege | SAST/DAST/SCA | Actionable fixes with severity';
			}
		}

		// Check bio length (max is now 10000 characters)
		if (bio.length > 10000) {
			console.warn(`Warning: Bio is ${bio.length} characters, max is 10000. Truncating...`);
			bio = bio.substring(0, 9997) + '...';
		}

		console.log(`\nSetting bio (${bio.length} characters):\n${bio}\n`);

		// Update own bio
		const updatedUser = await updateOwnBio(authToken, userId, bio);

		console.log('✅ Bio updated successfully!');
		console.log(`New bio: ${updatedUser.bio}`);
	} catch (error) {
		console.error('\n❌ Error:', error.message);
		process.exit(1);
	}
}

main();

