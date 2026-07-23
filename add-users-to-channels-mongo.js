#!/usr/bin/env node

const { execSync } = require('child_process');

const channels = [
	{name: 'engineering', users: ['cto', 'vpeng', 'techlead', 'fullstack', 'frontend', 'backend', 'devops', 'qa', 'dataengineer', 'blockchain', 'mobile', 'security']},
	{name: 'product', users: ['cpo', 'pm', 'designer', 'uxresearcher']},
	{name: 'marketing', users: ['cmo', 'growth', 'marketer', 'content', 'pr']},
	{name: 'operations', users: ['coo', 'CFO', 'accountant', 'legal', 'hr', 'recruiter', 'sdr', 'partnerships', 'onboarding']},
	{name: 'leadership', users: ['coo', 'cto', 'cpo', 'cmo', 'CFO']}
];

console.log('Adding users to channels via MongoDB...\n');

for (const channel of channels) {
	console.log(`Processing #${channel.name}...`);
	
	const mongoScript = `
		const room = db.rocketchat_room.findOne({name: '${channel.name}', t: 'c'});
		if (!room) {
			print('Channel ${channel.name} not found');
		} else {
			const usernames = ${JSON.stringify(channel.users)};
			const users = db.users.find({username: {$in: usernames}}, {_id: 1, username: 1}).toArray();
			let added = 0;
			const now = new Date();
			users.forEach(user => {
				const existing = db.rocketchat_subscription.findOne({rid: room._id, 'u._id': user._id});
				if (!existing) {
					db.rocketchat_subscription.insertOne({
						rid: room._id,
						'u': {_id: user._id, username: user.username},
						t: 'c',
						ts: now,
						open: true,
						alert: true,
						unread: 0,
						userMentions: 0,
						groupMentions: 0
					});
					added++;
				}
			});
			print('Added ' + added + ' users to ' + '${channel.name}');
		}
	`;
	
	try {
		const result = execSync(
			`docker exec rocketchat-mongo-1 mongosh rocketchat --eval "${mongoScript.replace(/"/g, '\\"')}"`,
			{encoding: 'utf8', maxBuffer: 10 * 1024 * 1024}
		);
		console.log(result);
	} catch (e) {
		console.error('Error:', e.message);
	}
}

console.log('\n✅ Done! Users have been added to channels.');

