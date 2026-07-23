const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { loadDotenv } = require('./lib/load-dotenv');
const { requireEnv } = require('./lib/require-env');

loadDotenv(__dirname);

const uri = requireEnv('MONGO_URI_RESET');
const username = requireEnv('RESET_TARGET_USERNAME');
const newPassword = requireEnv('RESET_NEW_PASSWORD');

(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const users = db.collection('users');

  const user = await users.findOne({ username });
  if (!user) {
    console.error('User not found:', username);
    process.exit(1);
  }

  const digest = crypto.createHash('sha256').update(newPassword).digest('hex');
  const hash = bcrypt.hashSync(digest, 10);

  await users.updateOne(
    { _id: user._id },
    { $set: { 'services.password.bcrypt': hash }, $unset: { 'services.password.reset': '' } }
  );

  console.log('Password updated for', username);
  await client.close();
})();
