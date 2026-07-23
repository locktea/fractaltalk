import type { ITeam } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../Ajv';

type GeneralProps = {
	filter?: string;
	type?: 'channels' | 'discussions';
};

export type TeamsListChildrenProps =
	| PaginatedRequest<
			{
				teamId: ITeam['_id'];
			} & GeneralProps
	  >
	| PaginatedRequest<{ teamName: ITeam['name'] } & GeneralProps>
	| PaginatedRequest<{ roomId: ITeam['roomId'] } & GeneralProps>;

const TeamsListChildrenPropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				teamId: { type: 'string' },
				type: { type: 'string', enum: ['channels', 'discussions'] },
				filter: { type: 'string' },
				offset: { type: 'number' },
				count: { type: 'number' },
				sort: { type: 'string' },
			},
			required: ['teamId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				teamName: { type: 'string' },
				type: { type: 'string', enum: ['channels', 'discussions'] },
				filter: { type: 'string' },
				offset: { type: 'number' },
				count: { type: 'number' },
				sort: { type: 'string' },
			},
			required: ['teamName'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomId: { type: 'string' },
				type: { type: 'string', enum: ['channels', 'discussions'] },
				filter: { type: 'string' },
				offset: { type: 'number' },
				count: { type: 'number' },
				sort: { type: 'string' },
			},
			required: ['roomId'],
			additionalProperties: false,
		},
	],
};

export const isTeamsListChildrenProps = ajv.compile<TeamsListChildrenProps>(TeamsListChildrenPropsSchema);
