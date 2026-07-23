// FOSS stub for enterprise utilities
export const Utilities = {
	getI18nKeyForApp(key: string | undefined, appId: string): string {
		if (!key) {
			return '';
		}
		// Return the key as-is in Community Edition
		// In Enterprise, this would format it as an i18n key
		return key;
	},
	curl(options: {
		url: string;
		method: string;
		params?: any;
		query?: any;
		content?: any;
		headers?: any;
		auth?: string;
	}): string {
		// Basic curl command generation for Community Edition
		let curlCmd = `curl -X ${options.method.toUpperCase()} "${options.url}"`;
		
		if (options.headers) {
			Object.entries(options.headers).forEach(([key, value]) => {
				curlCmd += ` \\\n  -H "${key}: ${value}"`;
			});
		}
		
		if (options.auth) {
			curlCmd += ` \\\n  -H "Authorization: ${options.auth}"`;
		}
		
		if (options.content) {
			curlCmd += ` \\\n  -d '${JSON.stringify(options.content)}'`;
		}
		
		return curlCmd;
	},
};

