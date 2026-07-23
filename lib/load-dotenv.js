'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Load KEY=VALUE lines from repo-root .env (no npm dotenv dependency).
 * Does not override variables already set in the environment.
 */
function loadDotenv(rootDir) {
	const envPath = path.join(rootDir, '.env');
	if (!fs.existsSync(envPath)) {
		return;
	}
	const envContent = fs.readFileSync(envPath, 'utf8');
	for (const line of envContent.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
			continue;
		}
		const eq = trimmed.indexOf('=');
		const key = trimmed.slice(0, eq).trim();
		const value = trimmed.slice(eq + 1).trim();
		if (key && process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
}

module.exports = { loadDotenv };
