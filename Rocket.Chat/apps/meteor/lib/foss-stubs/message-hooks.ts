// FOSS stub for enterprise message hooks
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

export class BeforeSaveCannedResponse {
	async replacePlaceholders({
		message,
		room,
		user,
	}: {
		message: IMessage;
		room: IRoom;
		user: Pick<IUser, '_id' | 'username' | 'name' | 'emails' | 'language'>;
	}): Promise<IMessage> {
		// No-op in Community Edition - just return the message as-is
		return message;
	}
}

