// FOSS stub for enterprise API middleware compatible with Hono/HTTP router
export const license = (_options: any, _License: any) => {
	return async (_c: any, next: () => Promise<void>): Promise<void> => {
		await next();
	};
};

