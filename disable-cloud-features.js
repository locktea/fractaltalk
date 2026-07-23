#!/usr/bin/env node

/**
 * Script to disable all Rocket.Chat cloud features and make it fully self-hosted
 * This removes dependency on centralized Rocket.Chat servers
 */

const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_PREFIX = '/api/v1';
const BASE_API_URL = BASE_URL + API_PREFIX;

const ADMIN_EMAIL = requireEnv('BOOTSTRAP_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('BOOTSTRAP_ADMIN_PASSWORD');

async function login() {
	console.log('Logging in...');
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

async function updateSetting(authToken, userId, settingId, value) {
	const response = await fetch(`${BASE_API_URL}/settings/${settingId}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': authToken,
			'X-User-Id': userId,
		},
		body: JSON.stringify({
			value: value,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to update setting ${settingId}: ${response.status} ${response.statusText}\n${errorText}`);
	}

	return await response.json();
}

async function main() {
	try {
		const { authToken, userId } = await login();
		console.log('Login successful!\n');

		console.log('Disabling cloud features...\n');

		const settingsToDisable = [
			{ id: 'Register_Server', value: false },
			{ id: 'Cloud_Service_Agree_PrivacyTerms', value: false },
		];

		for (const setting of settingsToDisable) {
			try {
				await updateSetting(authToken, userId, setting.id, setting.value);
				console.log(`✅ Disabled: ${setting.id}`);
			} catch (error) {
				console.log(`⚠️  Could not disable ${setting.id} via API: ${error.message}`);
			}
		}

		console.log('\n📋 Use MongoDB to completely disable cloud features:');
		console.log('```javascript');
		console.log('use rocketchat;');
		console.log('// Disable server registration');
		console.log('db.rocketchat_settings.updateOne({_id: "Register_Server"}, {$set: {value: false}});');
		console.log('// Clear cloud workspace data');
		console.log('db.rocketchat_settings.updateMany({_id: {$in: ["Cloud_Workspace_Id", "Cloud_Workspace_Client_Id", "Cloud_Workspace_Client_Secret", "Cloud_Workspace_Access_Token"]}}, {$set: {value: ""}});');
		console.log('db.rocketchat_settings.updateOne({_id: "Cloud_Service_Agree_PrivacyTerms"}, {$set: {value: false}});');
		console.log('```');

	} catch (error) {
		console.error('\n❌ Error:', error.message);
		console.log('\n📋 Use MongoDB directly to disable cloud features.');
		process.exit(1);
	}
}

main();

