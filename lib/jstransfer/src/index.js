/* eslint-disable no-console,no-await-in-loop */
import mongoose from 'mongoose';
import yargs from 'yargs';

export const promisefy = (fun) => new Promise((resolve) => fun((e, r) => {
  if (e) {
    console.log(e);
  }
  return resolve(r);
}));

const transfer = async ({
  collections = [],
  limit = 0,
  operation = 'reset',
  skipTransfer = false,
  readUrl = process.env.MONGOURL_READ,
  dbURL = process.env.MONGODB,
} = {}) => {
  const opt = { useNewUrlParser: true };

  // make sure we have collections to drop
  if (collections.length === 0) {
    if (!readUrl || typeof readUrl === 'undefined') {
      throw new Error('You must specify atleast one collection!');
    }

    // get list of collections
    const read = await mongoose.createConnection(readUrl, opt);
    const cols = await promisefy((cb) => read.db
      .listCollections()
      .toArray(cb));
    for (const col of cols) {
      collections.push(col.name);
    }
    await read.close();
  }

  // drop or reset collections
  const conn = await mongoose.createConnection(dbURL, opt);
  for (const col of collections) {
    if (operation === 'drop') {
      await promisefy((cb) => conn.collection(col).drop(cb));
    } else {
      await promisefy((cb) => conn.collection(col).deleteMany({}, cb));
    }
  }

  if (!skipTransfer) {
    const read = await mongoose.createConnection(readUrl, opt);
    for (const col of collections) {
      const docs = (await promisefy((cb) => read.collection(col)
        .find({})
        .limit(limit)
        .toArray(cb))
      )
        .map(({ _id, ...doc }) => doc);

      if (docs.length > 0) {
        await promisefy((cb) => conn.collection(col).insertMany(docs, cb));
      }
      console.log(`${col}: transferred ${docs.length} documents`);
    }

    await read.close();
  }

  return conn.close();
};

export const emptyDatabase = (args = {}) => transfer({
  operation: 'drop',
  skipTransfer: true,
  ...args,
});

export const clearDatabase = (args = {}) => transfer({
  operation: 'reset',
  skipTransfer: true,
  ...args,
});

export const copyDatabase = (args = {}) => transfer({
  operation: 'drop',
  ...args,
});

if (require.main === module) {
  const {
    argv: {
      _: collections,
      ...args
    },
  } = yargs
    .command({
      command: '[collections]',
      desc: 'collections to apply transformations on',
    })
    .option('limit', {
      alias: 'l',
      type: 'number',
      description: 'Limit the number of documents to copy over',
      default: 0,
    })
    .option('operation', {
      alias: 'o',
      type: 'choices',
      description: 'Operation to run. takes either "reset","transfer", or "drop"',
      choices: ['reset', 'transfer', 'drop'],
      default: 'reset',
    })
    .option('skip-transfer', {
      alias: 's',
      type: 'boolean',
      description: 'Skip the transfer process. Otherwise, transfer will be run after the defined operation',
      default: false,
    });

  transfer({ collections, ...args })
    .then(() => process.exit(0))
    .catch((e) => {
      console.log(e);
      process.exit(1);
    });
}

export default transfer;
