import { cronJobs } from '@rocket.chat/cron';
import { Meteor } from 'meteor/meteor';

import { connectWorkspace } from './functions/connectWorkspace';
import { CloudWorkspaceAccessTokenEmptyError, getWorkspaceAccessToken } from './functions/getWorkspaceAccessToken';
import { getWorkspaceAccessTokenWithScope } from './functions/getWorkspaceAccessTokenWithScope';
import { retrieveRegistrationStatus } from './functions/retrieveRegistrationStatus';
import { syncWorkspace } from './functions/syncWorkspace';
import { SystemLogger } from '../../../server/lib/logger/system';
import './methods';

const licenseCronName = 'Cloud Workspace Sync';

Meteor.startup(async () => {
	// Skip cloud sync if explicitly disabled via environment variable (check this first, no DB access needed)
	const disableCloudSync = process.env.DISABLE_CLOUD_SYNC === 'true' || process.env.DISABLE_CLOUD_SYNC === '1';
	
	if (disableCloudSync) {
		SystemLogger.info('Cloud workspace sync is disabled via DISABLE_CLOUD_SYNC environment variable');
		return;
	}

	// Use setImmediate to defer settings check until after initial startup
	setImmediate(async () => {
		// Dynamically import settings to avoid import errors if module not available
		let settings: any;
		try {
			const settingsModule = await import('../../settings/server');
			settings = settingsModule.settings;
		} catch (e) {
			SystemLogger.info('Settings module not available, skipping cloud sync');
			return;
		}

		// Check Register_Server setting (non-blocking, deferred)
		let registerServer = false;
		try {
			registerServer = settings.get<boolean>('Register_Server') || false;
		} catch (e) {
			// Settings might not be loaded yet, assume disabled
			SystemLogger.info('Settings not available, skipping cloud sync');
			return;
		}
		
		if (!registerServer) {
			SystemLogger.info('Cloud workspace sync is disabled (Register_Server is false)');
			return;
		}

		// Continue with cloud sync only if enabled
		await continueCloudSync();
	});
});

async function continueCloudSync() {

	const { workspaceRegistered } = await retrieveRegistrationStatus();

	if (process.env.REG_TOKEN && process.env.REG_TOKEN !== '' && !workspaceRegistered) {
		try {
			SystemLogger.info('REG_TOKEN Provided. Attempting to register');

			if (!(await connectWorkspace(process.env.REG_TOKEN))) {
				throw new Error("Couldn't register with token.  Please make sure token is valid or hasn't already been used");
			}

			console.log('Successfully registered with token provided by REG_TOKEN!');
		} catch (e: any) {
			SystemLogger.error('An error occurred registering with token.', e.message);
		}
	}

	// Only sync if workspace is registered
	if (!workspaceRegistered) {
		SystemLogger.info('Workspace is not registered, skipping cloud sync');
		return;
	}

	setImmediate(async () => {
		try {
			await syncWorkspace();
		} catch (e: any) {
			if (e instanceof CloudWorkspaceAccessTokenEmptyError) {
				return;
			}
			if (e.type && e.type === 'AbortError') {
				return;
			}
			SystemLogger.error('An error occurred syncing workspace.', e.message);
		}
	});
	const minute = Math.floor(Math.random() * 60);
	await cronJobs.add(licenseCronName, `${minute} */12 * * *`, async () => {
		try {
			await syncWorkspace();
		} catch (e: any) {
			if (e instanceof CloudWorkspaceAccessTokenEmptyError) {
				return;
			}
			if (e.type && e.type === 'AbortError') {
				return;
			}
			SystemLogger.error('An error occurred syncing workspace.', e.message);
		}
	});
}

export { getWorkspaceAccessToken, getWorkspaceAccessTokenWithScope };
