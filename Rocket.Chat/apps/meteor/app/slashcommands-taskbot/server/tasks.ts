import { api, Message } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser, SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { i18n } from '../../../server/lib/i18n';
import { notifyOnMessageChange, notifyOnRoomChangedById } from '../../lib/server/lib/notifyListener';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/server/slashCommand';

// Task interface
interface ITask {
	_id: string;
	roomId: string;
	createdBy: string;
	createdAt: Date;
	title: string;
	description?: string;
	assignedTo?: string;
	assignedToUsername?: string;
	status: 'pending' | 'completed';
	completedBy?: string;
	completedAt?: Date;
	completionEvidence?: string;
	completionMessageId?: string;
}

// Check if user is channel head (owner or leader)
async function isChannelHead(userId: string, roomId: string): Promise<boolean> {
	const subscription = await Subscriptions.findOneByRoomIdAndUserId(roomId, userId, {
		projection: { roles: 1 },
	});

	if (!subscription || !subscription.roles) {
		return false;
	}

	return subscription.roles.includes('owner') || subscription.roles.includes('leader');
}

// Get tasks for a room
async function getTasks(roomId: string, status?: 'pending' | 'completed'): Promise<ITask[]> {
	const query: any = {
		rid: roomId,
		'customFields.isTask': true,
	};

	if (status) {
		query['customFields.taskStatus'] = status;
	}

	const taskMessages = await Messages.find(query, { sort: { ts: -1 } }).toArray();

	return taskMessages.map((msg) => ({
		_id: msg._id,
		roomId: msg.rid,
		createdBy: msg.u._id,
		createdAt: msg.ts,
		title: (msg.customFields?.taskTitle as string) || '',
		description: (msg.customFields?.taskDescription as string) || '',
		assignedTo: (msg.customFields?.taskAssignedTo as string) || '',
		assignedToUsername: (msg.customFields?.taskAssignedToUsername as string) || '',
		status: ((msg.customFields?.taskStatus as 'pending' | 'completed') || 'pending') as 'pending' | 'completed',
		completedBy: (msg.customFields?.taskCompletedBy as string) || '',
		completedAt: (msg.customFields?.taskCompletedAt as Date) || undefined,
		completionEvidence: (msg.customFields?.taskCompletionEvidence as string) || '',
		completionMessageId: (msg.customFields?.taskCompletionMessageId as string) || '',
	}));
}

// Parse date string (MM-DD-YY, today, yesterday, tomorrow)
function parseDate(dateStr: string): Date | null {
	const lowerStr = dateStr.toLowerCase().trim();
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	if (lowerStr === 'today') {
		return today;
	}

	if (lowerStr === 'yesterday') {
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		return yesterday;
	}

	if (lowerStr === 'tomorrow') {
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow;
	}

	// Try to parse MM-DD-YY format
	const dateMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
	if (dateMatch) {
		let month = parseInt(dateMatch[1], 10) - 1; // Month is 0-indexed
		let day = parseInt(dateMatch[2], 10);
		let year = parseInt(dateMatch[3], 10);

		// Handle 2-digit years (assume 2000-2099)
		if (year < 100) {
			year += 2000;
		}

		const parsedDate = new Date(year, month, day);
		if (parsedDate.getFullYear() === year && parsedDate.getMonth() === month && parsedDate.getDate() === day) {
			parsedDate.setHours(0, 0, 0, 0);
			return parsedDate;
		}
	}

	return null;
}

// Get tasks for a specific date
async function getTasksByDate(roomId: string, targetDate: Date): Promise<{ pending: ITask[]; completed: ITask[] }> {
	const startOfDay = new Date(targetDate);
	startOfDay.setHours(0, 0, 0, 0);

	const endOfDay = new Date(targetDate);
	endOfDay.setHours(23, 59, 59, 999);

	// Get all tasks in the room
	const allTasks = await getTasks(roomId);

	// Filter tasks by date
	const pendingTasks: ITask[] = [];
	const completedTasks: ITask[] = [];

	for (const task of allTasks) {
		// For pending tasks, check creation date
		if (task.status === 'pending') {
			const taskDate = new Date(task.createdAt);
			taskDate.setHours(0, 0, 0, 0);
			if (taskDate.getTime() === startOfDay.getTime()) {
				pendingTasks.push(task);
			}
		}
		// For completed tasks, check completion date
		else if (task.status === 'completed' && task.completedAt) {
			const completedDate = new Date(task.completedAt);
			completedDate.setHours(0, 0, 0, 0);
			if (completedDate.getTime() === startOfDay.getTime()) {
				completedTasks.push(task);
			}
		}
	}

	return { pending: pendingTasks, completed: completedTasks };
}

// Create a task
async function createTask(
	roomId: string,
	userId: string,
	title: string,
	description?: string,
	assignedTo?: string,
): Promise<ITask> {
	const user = await Users.findOneById(userId);
	if (!user || !user.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	const assignedUser = assignedTo ? await Users.findOneByUsernameIgnoringCase(assignedTo) : null;

	const messageText = `📋 **Task**: ${title}${assignedUser ? `\n👤 Assigned to: @${assignedUser.username}` : ''}${description ? `\n📝 Description: ${description}` : ''}`;

	const taskMessage: Partial<IMessage> = {
		msg: messageText,
		rid: roomId,
		u: {
			_id: user._id,
			username: user.username,
			name: user.name || '',
		},
		ts: new Date(),
		customFields: {
			isTask: true,
			taskTitle: title,
			taskDescription: description || '',
			taskAssignedTo: assignedUser?._id || '',
			taskAssignedToUsername: assignedUser?.username || '',
			taskStatus: 'pending',
		},
	};

	const { insertedId } = await Messages.insertOne(taskMessage as IMessage);
	await Rooms.incMsgCountById(roomId, 1);

	// Notify room
	void notifyOnMessageChange({ id: insertedId });
	void notifyOnRoomChangedById(roomId);

	return {
		_id: insertedId,
		roomId,
		createdBy: userId,
		createdAt: new Date(),
		title,
		description,
		assignedTo: assignedUser?._id,
		assignedToUsername: assignedUser?.username,
		status: 'pending',
	};
}

// Complete a task
async function completeTask(taskId: string, userId: string, evidenceMessageId?: string): Promise<void> {
	const taskMessage = await Messages.findOneById(taskId);
	if (!taskMessage || !taskMessage.customFields?.isTask) {
		throw new Meteor.Error('error-task-not-found', 'Task not found');
	}

	if (taskMessage.customFields?.taskStatus === 'completed') {
		throw new Meteor.Error('error-task-already-completed', 'Task is already completed');
	}

	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	// Get evidence message if provided
	let evidence = '';
	if (evidenceMessageId) {
		const evidenceMsg = await Messages.findOneById(evidenceMessageId);
		if (evidenceMsg) {
			evidence = evidenceMsg.msg;
		}
	}

	// Update task message
	await Messages.updateOne(
		{ _id: taskId },
		{
			$set: {
				'customFields.taskStatus': 'completed',
				'customFields.taskCompletedBy': userId,
				'customFields.taskCompletedAt': new Date(),
				'customFields.taskCompletionEvidence': evidence,
				'customFields.taskCompletionMessageId': evidenceMessageId || '',
			},
		},
	);

	// Update the message text to show it's completed
	const completedText = `✅ ~~${taskMessage.customFields?.taskTitle}~~ **COMPLETED**\n👤 Completed by: @${user.username}${evidence ? `\n📎 Evidence: ${evidence.substring(0, 100)}${evidence.length > 100 ? '...' : ''}` : ''}`;
	await Messages.updateOne({ _id: taskId }, { $set: { msg: completedText } });

	// Post completion notification
	const room = await Rooms.findOneById(taskMessage.rid);
	if (room) {
		await Message.saveSystemMessage(
			'uj',
			taskMessage.rid,
			`✅ Task completed: **${taskMessage.customFields?.taskTitle}**\n👤 Completed by: @${user.username}${evidence ? `\n📎 Evidence provided` : ''}`,
			{
				_id: 'rocket.cat',
				username: 'rocket.cat',
				name: 'Rocket.Cat',
			},
		);
	}

	// Notify room
	void notifyOnMessageChange({ id: taskId });
	void notifyOnRoomChangedById(taskMessage.rid);
}

// Assign task to user
async function assignTask(taskId: string, username: string): Promise<void> {
	const taskMessage = await Messages.findOneById(taskId);
	if (!taskMessage || !taskMessage.customFields?.isTask) {
		throw new Meteor.Error('error-task-not-found', 'Task not found');
	}

	const user = await Users.findOneByUsernameIgnoringCase(username);
	if (!user) {
		throw new Meteor.Error('error-user-not-found', 'User not found');
	}

	await Messages.updateOne(
		{ _id: taskId },
		{
			$set: {
				'customFields.taskAssignedTo': user._id,
				'customFields.taskAssignedToUsername': user.username || '',
			},
		},
	);

	// Update message to show assignment
	const assignedText = `📋 **Task**: ${taskMessage.customFields?.taskTitle}\n👤 Assigned to: @${user.username}${taskMessage.customFields?.taskDescription ? `\n📝 Description: ${taskMessage.customFields.taskDescription}` : ''}`;
	await Messages.updateOne({ _id: taskId }, { $set: { msg: assignedText } });

	// Notify room
	void notifyOnMessageChange({ id: taskId });
	void notifyOnRoomChangedById(taskMessage.rid);
}

// /task-add command - Only channel heads can add tasks
slashCommands.add({
	command: 'task-add',
	callback: async function TaskAdd({ params, message, userId }: SlashCommandCallbackParams<'task-add'>): Promise<void> {
		const room = await Rooms.findOneById(message.rid);
		if (!room) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('error-invalid-room', { lng: settings.get('Language') || 'en' }),
			});
			return;
		}

		// Check if user is channel head (owner or leader)
		if (!(await isChannelHead(userId, message.rid))) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Only channel owners or leaders can add tasks', { lng: settings.get('Language') || 'en' }),
			});
			return;
		}

		// Parse parameters: /task-add "Title" [description] [@username]
		const paramsMatch = params.match(/^"([^"]+)"(?:\s+(.+?))?(?:\s+@(\w+))?$/);
		if (!paramsMatch) {
			// Try without quotes
			const parts = params.split(/\s+/);
			if (parts.length < 1) {
				void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
					msg: 'Usage: /task-add "Task Title" [description] [@username]\nExample: /task-add "Fix login bug" Fix the authentication issue @developer',
				});
				return;
			}
			const title = parts[0];
			const rest = parts.slice(1).join(' ');
			const assignMatch = rest.match(/@(\w+)$/);
			const assignedTo = assignMatch ? assignMatch[1] : undefined;
			const description = assignMatch ? rest.replace(/@\w+$/, '').trim() : rest.trim() || undefined;

			try {
				const task = await createTask(message.rid, userId, title, description, assignedTo);
				void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
					msg: `✅ Task created: **${task.title}**${task.assignedToUsername ? ` (Assigned to @${task.assignedToUsername})` : ''}`,
				});
			} catch (error: any) {
				void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
					msg: `❌ Error creating task: ${error.message || error.reason || 'Unknown error'}`,
				});
			}
			return;
		}

		const [, title, description, assignedTo] = paramsMatch;

		try {
			const task = await createTask(message.rid, userId, title, description || undefined, assignedTo);
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: `✅ Task created: **${task.title}**${task.assignedToUsername ? ` (Assigned to @${task.assignedToUsername})` : ''}`,
			});
		} catch (error: any) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: `❌ Error creating task: ${error.message || error.reason || 'Unknown error'}`,
			});
		}
	},
	options: {
		description: 'Add a new task (only channel owners/leaders)',
		params: '"Task Title" [description] [@username]',
	},
});

// /task-list command - List all tasks
slashCommands.add({
	command: 'task-list',
	callback: async function TaskList({ params, message, userId }: SlashCommandCallbackParams<'task-list'>): Promise<void> {
		const status = params.trim().toLowerCase() as 'pending' | 'completed' | undefined;
		const validStatus = status === 'pending' || status === 'completed' ? status : undefined;

		const tasks = await getTasks(message.rid, validStatus);

		if (tasks.length === 0) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: validStatus ? `No ${validStatus} tasks found.` : 'No tasks found in this channel.',
			});
			return;
		}

		const pendingTasks = tasks.filter((t) => t.status === 'pending');
		const completedTasks = tasks.filter((t) => t.status === 'completed');

		let response = '📋 **Tasks in this channel:**\n\n';

		if (pendingTasks.length > 0 && (!validStatus || validStatus === 'pending')) {
			response += `**Pending Tasks (${pendingTasks.length}):**\n`;
			pendingTasks.forEach((task, index) => {
				response += `${index + 1}. ${task.title}${task.assignedToUsername ? ` 👤 @${task.assignedToUsername}` : ''}${task.description ? `\n   ${task.description}` : ''}\n   📌 Task ID: \`${task._id}\`\n`;
			});
			response += '\n';
		}

		if (completedTasks.length > 0 && (!validStatus || validStatus === 'completed')) {
			response += `**Completed Tasks (${completedTasks.length}):**\n`;
			for (const [index, task] of completedTasks.entries()) {
				const completedByUser = task.completedBy ? await Users.findOneById(task.completedBy) : null;
				response += `${index + 1}. ~~${task.title}~~ ✅${completedByUser ? ` (completed by @${completedByUser.username})` : ''}${task.assignedToUsername ? ` (was assigned to @${task.assignedToUsername})` : ''}\n`;
			}
		}

		void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
			msg: response,
		});
	},
	options: {
		description: 'List all tasks (use "pending" or "completed" to filter)',
		params: '[pending|completed]',
	},
});

// /task-done command - Mark task as done with evidence
slashCommands.add({
	command: 'task-done',
	callback: async function TaskDone({ params, message, userId }: SlashCommandCallbackParams<'task-done'>): Promise<void> {
		// Parse: /task-done <task_id> [message_id for evidence]
		// If message.tmid exists, it means this is a reply - use that as evidence
		const parts = params.trim().split(/\s+/);
		if (parts.length < 1) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: 'Usage: /task-done <task_id> [message_id]\n\nTip: Reply to a message with evidence, then use /task-done <task_id> to automatically use the replied message as evidence.\n\nExample: /task-done abc123\nOr: /task-done abc123 xyz789 (to reference a specific message as evidence)',
			});
			return;
		}

		const taskId = parts[0];
		let evidenceMessageId = parts[1];

		// If no evidence message ID provided but this message is a reply, use the parent message
		if (!evidenceMessageId && message.tmid) {
			evidenceMessageId = message.tmid;
		}

		try {
			await completeTask(taskId, userId, evidenceMessageId);
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: '✅ Task marked as completed!',
			});
		} catch (error: any) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: `❌ Error: ${error.message || error.reason || 'Unknown error'}`,
			});
		}
	},
	options: {
		description: 'Mark a task as done (provide task ID and optional message ID for evidence)',
		params: '<task_id> [message_id]',
	},
});

// /task-assign command - Assign task to user (only channel heads)
slashCommands.add({
	command: 'task-assign',
	callback: async function TaskAssign({ params, message, userId }: SlashCommandCallbackParams<'task-assign'>): Promise<void> {
		// Check if user is channel head
		if (!(await isChannelHead(userId, message.rid))) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Only channel owners or leaders can assign tasks', { lng: settings.get('Language') || 'en' }),
			});
			return;
		}

		// Parse: /task-assign <task_id> @username
		const parts = params.trim().split(/\s+/);
		if (parts.length < 2) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: 'Usage: /task-assign <task_id> @username\nExample: /task-assign abc123 @developer',
			});
			return;
		}

		const taskId = parts[0];
		const username = parts[1].replace('@', '');

		try {
			await assignTask(taskId, username);
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: `✅ Task assigned to @${username}`,
			});
		} catch (error: any) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: `❌ Error: ${error.message || error.reason || 'Unknown error'}`,
			});
		}
	},
	options: {
		description: 'Assign a task to a user (only channel owners/leaders)',
		params: '<task_id> @username',
	},
});

// /task-history command - Show tasks for a specific date
slashCommands.add({
	command: 'task-history',
	callback: async function TaskHistory({ params, message, userId }: SlashCommandCallbackParams<'task-history'>): Promise<void> {
		const dateStr = params.trim() || 'today';
		const targetDate = parseDate(dateStr);

		if (!targetDate) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: 'Usage: /task-history [date]\n\nDate formats:\n  - today\n  - yesterday\n  - tomorrow\n  - MM-DD-YY (e.g., 9-15-25)\n\nExamples:\n  /task-history today\n  /task-history yesterday\n  /task-history 9-15-25',
			});
			return;
		}

		const { pending, completed } = await getTasksByDate(message.rid, targetDate);

		// Format date for display
		const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
		const dateDisplay = targetDate.toLocaleDateString('en-US', dateOptions);

		let response = `📅 **Task History for ${dateDisplay}**\n\n`;

		if (pending.length === 0 && completed.length === 0) {
			response += 'No tasks found for this date.';
		} else {
			if (pending.length > 0) {
				response += `**Pending Tasks (${pending.length}):**\n`;
				for (const [index, task] of pending.entries()) {
					const createdByUser = await Users.findOneById(task.createdBy);
					response += `${index + 1}. ${task.title}${task.assignedToUsername ? ` 👤 @${task.assignedToUsername}` : ''}${task.description ? `\n   ${task.description}` : ''}\n   📌 Task ID: \`${task._id}\`\n   👤 Created by: @${createdByUser?.username || 'Unknown'}\n`;
				}
				response += '\n';
			}

			if (completed.length > 0) {
				response += `**Completed Tasks (${completed.length}):**\n`;
				for (const [index, task] of completed.entries()) {
					const completedByUser = task.completedBy ? await Users.findOneById(task.completedBy) : null;
					const createdByUser = await Users.findOneById(task.createdBy);
					response += `${index + 1}. ~~${task.title}~~ ✅${task.assignedToUsername ? ` (was assigned to @${task.assignedToUsername})` : ''}${task.description ? `\n   ${task.description}` : ''}\n   📌 Task ID: \`${task._id}\`\n   👤 Created by: @${createdByUser?.username || 'Unknown'}\n   ✅ Completed by: @${completedByUser?.username || 'Unknown'}\n`;
					if (task.completionEvidence) {
						const evidencePreview = task.completionEvidence.length > 100 
							? task.completionEvidence.substring(0, 100) + '...' 
							: task.completionEvidence;
						response += `   📎 Evidence: ${evidencePreview}\n`;
					}
				}
			}
		}

		void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
			msg: response,
		});
	},
	options: {
		description: 'Show task history for a specific date (today, yesterday, tomorrow, or MM-DD-YY)',
		params: '[today|yesterday|tomorrow|MM-DD-YY]',
	},
});

