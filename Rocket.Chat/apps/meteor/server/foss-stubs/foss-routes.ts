import { Meteor } from 'meteor/meteor';

import { API } from '../../app/api/server/api';

Meteor.methods({
	'license:getModules'() {
		return [];
	},
	'license:getTags'() {
		return [];
	},
});

API.v1.addRoute(
	'licenses.info',
	{ authRequired: true },
	{
		async get() {
			return API.v1.success({
				license: null,
				activeModules: [],
				externalModules: [],
				preventedActions: {},
				limits: {},
				tags: [],
				trial: false,
			});
		},
	},
);

API.api.get(
	'apps/languages',
	{ authRequired: true, response: { 200: { schema: {} as any } } },
	async function () {
		return {
			statusCode: 200,
			body: { languages: [] },
		};
	},
);

API.api.get(
	'apps/actionButtons',
	{ authRequired: true, response: { 200: { schema: {} as any } } },
	async function () {
		return {
			statusCode: 200,
			body: { actions: [] },
		};
	},
);





