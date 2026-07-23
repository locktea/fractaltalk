import { schemas } from '@rocket.chat/core-typings';
import { ajv } from '@rocket.chat/rest-typings';

const components = schemas.components?.schemas;
if (components) {
	// Suppress strict mode warnings during schema compilation
	const originalWarn = console.warn;
	console.warn = (...args: any[]) => {
		// Filter out AJV strict mode warnings
		const message = args[0]?.toString() || '';
		if (message.includes('strict mode:') && message.includes('strictTypes')) {
			return; // Suppress these warnings
		}
		originalWarn.apply(console, args);
	};

	try {
		for (const key in components) {
			if (Object.prototype.hasOwnProperty.call(components, key)) {
				ajv.addSchema(components[key], `#/components/schemas/${key}`);
			}
		}
	} finally {
		// Restore original console.warn
		console.warn = originalWarn;
	}
}
