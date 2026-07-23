// MongoDB script to add users to channels

const channels = [
	{name: 'engineering', users: ['cto', 'vpeng', 'techlead', 'fullstack', 'frontend', 'backend', 'devops', 'qa', 'dataengineer', 'blockchain', 'mobile', 'security']},
	{name: 'product', users: ['cpo', 'pm', 'designer', 'uxresearcher']},
	{name: 'marketing', users: ['cmo', 'growth', 'marketer', 'content', 'pr']},
	{name: 'operations', users: ['coo', 'CFO', 'accountant', 'legal', 'hr', 'recruiter', 'sdr', 'partnerships', 'onboarding']},
	{name: 'leadership', users: ['coo', 'cto', 'cpo', 'cmo', 'CFO']}
];

channels.forEach(channel => {
	print('Processing #' + channel.name + '...');
	const room = db.rocketchat_room.findOne({name: channel.name, t: 'c'});
	if (!room) {
		print('  Channel ' + channel.name + ' not found');
	} else {
		const users = db.users.find({username: {$in: channel.users}}, {_id: 1, username: 1}).toArray();
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
		print('  Added ' + added + ' users to ' + channel.name);
	}
});

print('\nDone!');

