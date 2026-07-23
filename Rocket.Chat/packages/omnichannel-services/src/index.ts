// FOSS stub for @rocket.chat/omnichannel-services
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IQueueWorkerService, IOmnichannelTranscriptService, HealthAggResult } from '@rocket.chat/core-services';
import type { Db } from 'mongodb';
import type { ILogger } from '@rocket.chat/logger';

// FOSS stub for QueueWorker service
export class QueueWorker extends ServiceClassInternal implements IQueueWorkerService {
	protected name = 'queue-worker';

	constructor(private db: Db, private logger: ILogger) {
		super();
	}

	async queueWork<T extends Record<string, unknown>>(queue: 'work' | 'workComplete', to: string, data: T): Promise<void> {
		// No-op in Community Edition
		this.logger.debug(`QueueWorker.queueWork called (stub): queue=${queue}, to=${to}`);
	}

	async queueInfo(): Promise<HealthAggResult[]> {
		// Return empty array in Community Edition
		return [];
	}
}

// FOSS stub for OmnichannelTranscript service
export class OmnichannelTranscript extends ServiceClassInternal implements IOmnichannelTranscriptService {
	protected name = 'omnichannel-transcript';

	constructor(private logger: ILogger, private i18n: any) {
		super();
	}

	async workOnPdf({ details }: { details: { rid: string; userId: string; from: string } }): Promise<void> {
		// No-op in Community Edition
		this.logger.debug(`OmnichannelTranscript.workOnPdf called (stub): rid=${details.rid}`);
	}
}
