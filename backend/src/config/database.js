const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function connectDatabase() {
  const tempDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parksy-mongo-'));
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      dbPath: tempDataDir,
      dbName: 'pms',
      args: ['--quiet'],
    },
  });

  await mongoose.connect(mongoServer.getUri(), { serverSelectionTimeoutMS: 10000 });
  console.log(`✅ Local MongoDB connected at ${tempDataDir}`);

  return mongoServer;
}

module.exports = {
  connectDatabase,
};