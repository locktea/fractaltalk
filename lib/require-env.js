'use strict';

function requireEnv(name) {
	const v = process.env[name];
	if (v === undefined || v === null || String(v).trim() === '') {
		console.error(`Missing required environment variable: ${name}`);
		console.error('Create a .env file in the repo root (see .env.example). Never commit .env.');
		process.exit(1);
	}
	return String(v).trim();
}

module.exports = { requireEnv };
