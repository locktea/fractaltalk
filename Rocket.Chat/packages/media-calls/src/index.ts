// FOSS stub for @rocket.chat/media-calls
import { Emitter } from '@rocket.chat/emitter';
import type { IMediaCallServerSettings, ClientMediaSignal, ServerMediaSignal } from '@rocket.chat/media-signaling';

// Stub emitter for callServer events
const emitter = new Emitter<{
	signalRequest: { toUid: string; signal: ServerMediaSignal };
	callUpdated: any;
}>();

// Stub callServer object for Community Edition
// Media calls functionality is limited in FOSS builds
export const callServer = {
	emitter,
	configure(_settings: IMediaCallServerSettings): void {
		// No-op in Community Edition
	},
	receiveSignal(_uid: string, _signal: ClientMediaSignal): void {
		// No-op in Community Edition
	},
	receiveCallUpdate(_params: any): void {
		// No-op in Community Edition
	},
	hangupExpiredCalls(): Promise<void> {
		// No-op in Community Edition
		return Promise.resolve();
	},
	scheduleExpirationCheck(): void {
		// No-op in Community Edition
	},
};

export default {};
