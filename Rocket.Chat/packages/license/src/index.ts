// FOSS stub for @rocket.chat/license
export default {};

// Stub for License class with enterprise methods
export class License {
	static onValidFeature(_feature: string, _callback: () => void): void {
		// No-op in Community Edition - enterprise features are not available
		// The callback is never executed in FOSS builds
	}
	
	static onLimitReached(_kind: string, _callback: () => void | Promise<void>): void {
		// No-op in Community Edition
	}
	
	static onValidateLicense(_callback: () => void | Promise<void>): void {
		// No-op in Community Edition
	}
	
	static onInvalidateLicense(_callback: () => void | Promise<void>): void {
		// No-op in Community Edition
	}
	
	static hasModule(_module: string): boolean {
		// No enterprise modules available in Community Edition
		return false;
	}
	
	static hasValidLicense(): boolean {
		// No license validation in Community Edition
		return false;
	}
	
	static getModules(): string[] {
		// No enterprise modules available in Community Edition
		return [];
	}
	
	static getLicense(): any {
		// No license in Community Edition
		return null;
	}
	
	static getTags(): any[] {
		// No license tags in Community Edition
		return [];
	}
	
	static async shouldPreventAction(_kind: string, _value?: number): Promise<boolean> {
		// Never prevent actions in Community Edition by license
		return false;
	}
}

// FOSS stub for AirGappedRestriction
export class AirGappedRestriction {
	static computeRestriction(_token?: string): void {
		// No-op in Community Edition - no air-gapped restrictions
	}
}
