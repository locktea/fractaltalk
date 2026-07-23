#!/usr/bin/env node

const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

const ADMIN_EMAIL = requireEnv('ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD');

// Department channels with their users
const DEPARTMENTS = [
	{
		name: 'engineering',
		displayName: 'Engineering',
		description: 'Engineering team discussions',
		users: [
			'cto@fractaltalk.com',
			'vpeng@fractaltalk.com',
			'techlead@fractaltalk.com',
			'fullstack@fractaltalk.com',
			'frontend@fractaltalk.com',
			'backend@fractaltalk.com',
			'devops@fractaltalk.com',
			'qa@fractaltalk.com',
			'dataengineer@fractaltalk.com',
			'blockchain@fractaltalk.com',
			'mobile@fractaltalk.com',
			'security@fractaltalk.com' // Security engineer
		]
	},
	{
		name: 'product',
		displayName: 'Product & Design',
		description: 'Product management, design, and UX discussions',
		users: [
			'cpo@fractaltalk.com',
			'pm@fractaltalk.com',
			'designer@fractaltalk.com',
			'uxresearcher@fractaltalk.com'
		]
	},
	{
		name: 'marketing',
		displayName: 'Marketing & Growth',
		description: 'Marketing, growth, and communications',
		users: [
			'cmo@fractaltalk.com',
			'growth@fractaltalk.com',
			'marketer@fractaltalk.com',
			'content@fractaltalk.com',
			'pr@fractaltalk.com'
		]
	},
	{
		name: 'operations',
		displayName: 'Business Operations',
		description: 'HR, legal, finance, sales, and partnerships',
		users: [
			'coo@fractaltalk.com',
			'cfo@fractaltalk.com',
			'accountant@fractaltalk.com',
			'legal@fractaltalk.com',
			'hr@fractaltalk.com',
			'recruiter@fractaltalk.com',
			'sdr@fractaltalk.com',
			'partnerships@fractaltalk.com',
			'onboarding@fractaltalk.com'
		]
	},
	{
		name: 'leadership',
		displayName: 'Leadership',
		description: 'Executive leadership discussions',
		users: [
			'coo@fractaltalk.com',
			'cto@fractaltalk.com',
			'cpo@fractaltalk.com',
			'cmo@fractaltalk.com',
			'cfo@fractaltalk.com'
		]
	}
];

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
	const response = await fetch(`${BASE_API_URL}/users.list?query=${encodeURIComponent(JSON.stringify({"emails.address": email}))}`, {
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
		const exactMatch = data.users.find(u => 
			u.emails && u.emails.some(e => e.address && e.address.toLowerCase() === email.toLowerCase())
		);
		return exactMatch || null;
	}
	return null;
}

async function createChannel(authToken, userId, channelName, displayName, description) {
	console.log(`Creating channel: #${channelName}...`);
	const response = await fetch(`${BASE_API_URL}/channels.create`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
		body: JSON.stringify({
			name: channelName,
			description: description,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		if (errorText.includes('already exists') || errorText.includes('duplicate')) {
			console.log(`  Channel #${channelName} already exists, getting info...`);
			const infoRes = await fetch(`${BASE_API_URL}/channels.info?roomName=${channelName}`, {
				headers: {
					'X-Auth-Token': authToken,
					'X-User-Id': userId,
				},
			});
			if (infoRes.ok) {
				const infoData = await infoRes.json();
				return infoData.channel;
			}
			return null;
		}
		throw new Error(`Failed to create channel: ${response.status} ${response.statusText}\n${errorText}`);
	}

	const data = await response.json();
	console.log(`  ✅ Channel created: #${channelName}`);
	return data.channel;
}

async function addUserToChannel(authToken, userId, channelId, userEmail) {
	const user = await findUserByEmail(authToken, userId, userEmail);
	if (!user) {
		console.log(`    ⚠️  User ${userEmail} not found, skipping`);
		return false;
	}

	if (!user.username) {
		console.log(`    ⚠️  User ${userEmail} has no username, skipping`);
		return false;
	}

	const response = await fetch(`${BASE_API_URL}/channels.invite`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
		body: JSON.stringify({
			roomId: channelId,
			username: user.username,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		if (errorText.includes('already in room') || errorText.includes('already in channel') || errorText.includes('already in here')) {
			return true; // User already in channel, that's fine
		}
		console.log(`    ⚠️  Failed to add ${userEmail} (${user.username}): ${errorText.substring(0, 100)}`);
		return false;
	}

	return true;
}

async function main() {
	try {
		const { authToken, userId } = await login();
		console.log('✅ Admin login successful!\n');

		let created = 0;
		let updated = 0;
		let errors = 0;

		for (const dept of DEPARTMENTS) {
			try {
				console.log(`\n${'='.repeat(60)}`);
				console.log(`Processing: ${dept.displayName}`);
				console.log('='.repeat(60));

				// Create channel
				const channel = await createChannel(authToken, userId, dept.name, dept.displayName, dept.description);
				if (!channel) {
					console.log(`  ❌ Failed to create/get channel: #${dept.name}`);
					errors++;
					continue;
				}

				if (channel._id) {
					created++;
				} else {
					updated++;
				}

				// Add users to channel
				console.log(`  Adding ${dept.users.length} users to #${dept.name}...`);
				let added = 0;
				for (const userEmail of dept.users) {
					const success = await addUserToChannel(authToken, userId, channel._id, userEmail);
					if (success) {
						added++;
					}
				}
				console.log(`  ✅ Added ${added}/${dept.users.length} users to #${dept.name}`);
			} catch (error) {
				console.error(`  ❌ Error processing ${dept.name}:`, error.message);
				errors++;
			}
		}

		console.log('\n' + '='.repeat(60));
		console.log('SUMMARY');
		console.log('='.repeat(60));
		console.log(`Total departments: ${DEPARTMENTS.length}`);
		console.log(`✅ Created/Updated: ${created + updated}`);
		console.log(`❌ Errors: ${errors}`);
		console.log('='.repeat(60));
		console.log('\nChannels created:');
		DEPARTMENTS.forEach(dept => {
			console.log(`  - #${dept.name} (${dept.displayName})`);
		});

	} catch (error) {
		console.error('\n❌ Fatal Error:', error.message);
		process.exit(1);
	}
}

main();

