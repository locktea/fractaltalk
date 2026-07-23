# Rocket.Chat Taskbot

A task management bot for Rocket.Chat that allows channel heads (owners/leaders) to create tasks and all users to complete them with evidence.

## Features

- ✅ **Permission-based task creation**: Only channel owners or leaders can create tasks
- ✅ **Task assignment**: Tasks can be assigned to specific team members
- ✅ **Task completion with evidence**: Any user can mark tasks as done and provide evidence
- ✅ **Task listing**: View all tasks, filter by status (pending/completed)
- ✅ **Evidence tracking**: Link completion to specific chat messages as proof

## Commands

### `/task-history` - Show task history for a date
**Permission**: All users

View tasks created or completed on a specific date. Supports relative dates (today, yesterday, tomorrow) or specific dates in MM-DD-YY format.

### `/task-add` - Create a new task
**Permission**: Only channel owners or leaders

**Usage:**
```
/task-add "Task Title" [description] [@username]
```

**Examples:**
```
/task-add "Fix login bug"
/task-add "Fix login bug" Fix the authentication issue
/task-add "Fix login bug" Fix the authentication issue @developer
/task-add "Update documentation" Update API docs @techlead
```

**Parameters:**
- `"Task Title"` - The task title (required, can be with or without quotes)
- `description` - Optional description of the task
- `@username` - Optional username to assign the task to

### `/task-list` - List all tasks
**Permission**: All users

**Usage:**
```
/task-list [pending|completed]
```

**Examples:**
```
/task-list              # List all tasks
/task-list pending      # List only pending tasks
/task-list completed    # List only completed tasks
```

**Output:**
- Shows task title, description, assigned user (if any)
- Displays task ID for easy reference
- Separates pending and completed tasks

### `/task-done` - Mark a task as completed
**Permission**: All users

**Usage:**
```
/task-done <task_id> [message_id]
```

**Examples:**
```
/task-done abc123                    # Mark task as done
/task-done abc123 xyz789             # Mark task as done with evidence from message xyz789
```

**Tip**: Reply to a message with evidence, then use `/task-done <task_id>` - it will automatically use the replied message as evidence.

**Parameters:**
- `task_id` - The task ID (shown in `/task-list` output)
- `message_id` - Optional message ID to use as evidence

### `/task-assign` - Assign a task to a user
**Permission**: Only channel owners or leaders

**Usage:**
```
/task-assign <task_id> @username
```

**Examples:**
```
/task-assign abc123 @developer
/task-assign abc123 @techlead
```

**Parameters:**
- `task_id` - The task ID
- `@username` - The username to assign the task to

### `/task-history` - Show task history for a specific date
**Permission**: All users

**Usage:**
```
/task-history [date]
```

**Examples:**
```
/task-history              # Shows today's tasks (default)
/task-history today        # Shows today's tasks
/task-history yesterday    # Shows yesterday's tasks
/task-history tomorrow     # Shows tomorrow's tasks
/task-history 9-15-25      # Shows tasks for September 15, 2025
/task-history 12-31-24     # Shows tasks for December 31, 2024
```

**Parameters:**
- `date` - Optional. Can be:
  - `today` (default if omitted)
  - `yesterday`
  - `tomorrow`
  - `MM-DD-YY` format (e.g., `9-15-25` for September 15, 2025)

**Output:**
- Shows all pending tasks created on that date
- Shows all completed tasks completed on that date
- Displays task details including creator, assignee, completion info, and evidence

## Workflow Example

1. **Channel head creates a task:**
   ```
   /task-add "Implement user authentication" Add OAuth2 support @backend
   ```

2. **User checks their tasks:**
   ```
   /task-list pending
   ```

3. **User completes the task and provides evidence:**
   - User posts a message: "OAuth2 implementation complete. Here's the PR: https://github.com/..."
   - User replies to that message with: `/task-done <task_id>`
   - Or user uses: `/task-done <task_id> <message_id>`

4. **Task is marked as completed** with evidence linked

## Technical Details

- Tasks are stored as messages with custom fields in the Rocket.Chat database
- Task status is tracked in `customFields.taskStatus` (pending/completed)
- Evidence is stored in `customFields.taskCompletionEvidence`
- Channel head permissions are checked via subscription roles (owner/leader)

## Installation

The taskbot is integrated into Rocket.Chat and will be available after server restart. No additional installation required.

## Permissions

- **Task Creation**: Requires `owner` or `leader` role in the channel
- **Task Assignment**: Requires `owner` or `leader` role in the channel
- **Task Completion**: Available to all users in the channel
- **Task Listing**: Available to all users in the channel

## Notes

- Task IDs are MongoDB ObjectIds and are shown in the task list output
- Evidence can be linked to any message in the channel
- Completed tasks are marked with strikethrough and show completion details
- System notifications are posted when tasks are completed

