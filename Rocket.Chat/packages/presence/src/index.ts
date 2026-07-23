// FOSS stub for @rocket.chat/presence
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IPresence } from '@rocket.chat/core-services';
import type { UserStatus } from '@rocket.chat/core-typings';

// Basic Presence service implementation for Community Edition
export class Presence extends ServiceClassInternal implements IPresence {
	protected name = 'presence';

	async newConnection(
		uid: string | undefined,
		session: string | undefined,
		nodeId: string,
	): Promise<{ uid: string; connectionId: string } | undefined> {
		// Basic implementation for Community Edition
		if (!uid || !session) {
			return undefined;
		}
		return { uid, connectionId: session };
	}

	async removeConnection(
		uid: string | undefined,
		session: string | undefined,
		nodeId: string,
	): Promise<{ uid: string; session: string } | undefined> {
		// Basic implementation for Community Edition
		if (!uid || !session) {
			return undefined;
		}
		return { uid, session };
	}

	async removeLostConnections(nodeID: string): Promise<string[]> {
		// Basic implementation for Community Edition
		return [];
	}

	async setStatus(uid: string, status: UserStatus, statusText?: string): Promise<boolean> {
		// Basic implementation for Community Edition
		return true;
	}

	async setConnectionStatus(uid: string, status: UserStatus, session: string): Promise<boolean> {
		// Basic implementation for Community Edition
		return true;
	}

	async updateUserPresence(uid: string): Promise<void> {
		// Basic implementation for Community Edition
	}

	toggleBroadcast(enabled: boolean): void {
		// Basic implementation for Community Edition
	}

	getConnectionCount(): { current: number; max: number } {
		// Basic implementation for Community Edition
		return { current: 0, max: 0 };
	}

	getPeakConnections(reset?: boolean): number {
		// Basic implementation for Community Edition
		return 0;
	}

	resetPeakConnections(): void {
		// Basic implementation for Community Edition
	}
}

export default {};
