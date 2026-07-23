import type { ISetting } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../app/settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getSetupWizardParameters(): Promise<{
			settings: ISetting[];
			serverAlreadyRegistered: boolean;
		}>;
	}
}

Meteor.methods<ServerMethods>({
	async getSetupWizardParameters() {
		const setupWizardSettings = await Settings.findSetupWizardSettings().toArray();
		const registerServer = settings.get<boolean>('Register_Server');
		const serverAlreadyRegistered = !!settings.get('Cloud_Workspace_Client_Id') || process.env.DEPLOY_PLATFORM === 'rocket-cloud';
		
		// Skip cloud registration if Register_Server is explicitly disabled
		const skipRegistration = !registerServer || serverAlreadyRegistered;

		return {
			settings: setupWizardSettings,
			serverAlreadyRegistered: skipRegistration,
		};
	},
});
