/* eslint-disable no-await-in-loop */
import mongoose, { Schema } from 'mongoose';
import { assert } from 'chai';
import {
  promisefy, emptyDatabase, clearDatabase, copyDatabase
} from '../src';

const models = ['User', 'Tank'].map((n) => mongoose.model(n, new Schema({ name: String })));
const opt = { useNewUrlParser: true };

const createTestData = async (url, users = 4, tanks = 4) => new Promise((resolve) => {
  mongoose.connect(url, opt);

  const db = mongoose.connection;
  db.once('open', () => {
    Promise.all(
      [
        [users, models[0]],
        [tanks, models[1]],
      ]
        .filter(([n]) => n > 0)
        .flatMap(async ([n, Model]) => {
          for (let i = 0; i < n; i += 1) {
            const doc = new Model({ name: `${Math.random().toString(36).substring(20)}${i}` });
            await doc.save();
          }
        }),
    )
      .then(() => mongoose.disconnect())
      .then(() => resolve(true));
  });
});
process.env.MONGOURL_READ = `${process.env.MONGODB}read`;

const getDocs = async (url, collection) => {
  const conn = await mongoose.createConnection(url, opt);
  const docs = (await promisefy((cb) => conn.collection(collection)
    .find({})
    .toArray(cb))
  );
  await conn.close();
  return docs;
};

describe('clear database', () => {
  beforeEach(() => emptyDatabase({ collections: ['users', 'tanks'] })
    .then(() => createTestData(process.env.MONGODB))
    .then(() => getDocs(process.env.MONGODB, 'users'))
    .then((docs) => assert.lengthOf(docs, 4)));

  it('should empty collection and not drop', () => clearDatabase({ collections: ['users'] })
    .then(() => getDocs(process.env.MONGODB, 'users'))
    .then((docs) => assert.lengthOf(docs, 0))
    .then(() => getDocs(process.env.MONGODB, 'tanks'))
    .then((docs) => assert.lengthOf(docs, 4)));

  it('should empty collection with read url', () => createTestData(process.env.MONGOURL_READ)
    .then(() => clearDatabase())
    .then(() => getDocs(process.env.MONGODB, 'users'))
    .then((docs) => assert.lengthOf(docs, 0))
    .then(() => getDocs(process.env.MONGODB, 'tanks'))
    .then((docs) => assert.lengthOf(docs, 0)));

  it('should empty collection with read url', () => createTestData(process.env.MONGOURL_READ, 3, 0)
    .then(() => clearDatabase())
    .then(() => getDocs(process.env.MONGODB, 'users'))
    .then((docs) => assert.lengthOf(docs, 0))
    .then(() => getDocs(process.env.MONGODB, 'tanks'))
    .then((docs) => assert.lengthOf(docs, 4)));

  afterEach(() => emptyDatabase({ collections: ['users', 'tanks'] })
    .then(() => emptyDatabase({ dbURL: process.env.MONGOURL_READ })));
});

describe('transferring database', () => {
  beforeEach(() => emptyDatabase({ collections: ['users', 'tanks'] }));

  it('should transfer', () => createTestData(process.env.MONGOURL_READ, 8, 12)
    .then(() => copyDatabase())
    .then(() => getDocs(process.env.MONGODB, 'users'))
    .then((docs) => assert.lengthOf(docs, 8))
    .then(() => getDocs(process.env.MONGODB, 'tanks'))
    .then((docs) => assert.lengthOf(docs, 12)));

  it('should transfer based on read db', () => createTestData(process.env.MONGOURL_READ, 0, 1)
    .then(() => createTestData(process.env.MONGODB, 3))
    .then(() => copyDatabase())
    .then(() => getDocs(process.env.MONGODB, 'users'))
    .then((docs) => assert.lengthOf(docs, 3))
    .then(() => getDocs(process.env.MONGODB, 'tanks'))
    .then((docs) => assert.lengthOf(docs, 1)));

  afterEach(() => emptyDatabase({ collections: ['users', 'tanks'] })
    .then(() => emptyDatabase({ dbURL: process.env.MONGOURL_READ })));
});

describe('empty database', () => {
  before(() => createTestData(process.env.MONGODB)
    .then(async () => {
      const conn = await mongoose.createConnection(process.env.MONGODB, opt);
      const cols = await promisefy((cb) => conn.db.listCollections({}).toArray(cb));
      assert.lengthOf(cols, 2);
    }));

  it('should drop all collections', () => emptyDatabase({ collections: ['users', 'tanks'] })
    .then(async () => {
      const conn = await mongoose.createConnection(process.env.MONGODB, opt);
      const cols = await promisefy((cb) => conn.db.listCollections({}).toArray(cb));
      assert.lengthOf(cols, 0);
    }));

  it('should drop collections from read url', () => createTestData(process.env.MONGODB)
    .then(() => createTestData(process.env.MONGOURL_READ, 0))
    .then(() => emptyDatabase())
    .then(async () => {
      const conn = await mongoose.createConnection(process.env.MONGODB, opt);
      const cols = await promisefy((cb) => conn.db.listCollections({}).toArray(cb));
      assert.lengthOf(cols, 1);
    }));
});
