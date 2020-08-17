/* eslint-disable no-await-in-loop */
import mongoose from 'mongoose';
import yargs from 'yargs';

const promisefy = (fun) => new Promise((resolve) => fun(() => resolve(true)));

const transferCommand = async (inputArgs) => {
  const opt = { useNewUrlParser: true };
  const { argv } = (!inputArgs) ? yargs
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
    })
    : {
      argv: {
        _: [],
        operation: 'drop',
        skipTransfer: false,
        ...inputArgs,
      },
    };

  if (argv._.length === 0 && process.env.MONGOURL_READ) {
    const read = await mongoose.createConnection(process.env.MONGOURL_READ, opt);
    const collections = await read.db.listCollections().toArray();
    for (const collection of collections) {
      argv._.push(collection.name);
    }
    await read.close();
  } else if (argv._.length === 0) {
    // eslint-disable-next-line no-console
    console.log(argv._);
    throw new Error('You must specify atleast one collection!');
  }

  // check if collections are to be dropped are reset
  const conn = await mongoose.createConnection(process.env.MONGODB, opt);
  if (['reset', 'drop'].includes(argv.operation)) {
    for (const collection of argv._) {
      if (argv.operation === 'reset') {
        await promisefy((c) => conn.collection(collection).deleteMany({}, c));
      } else {
        await promisefy((c) => conn.collection(collection).drop(c));
      }
    }
  }

  if (!argv.skipTransfer) {
    const read = await mongoose.createConnection(process.env.MONGOURL_READ, opt);

    for (const collection of argv._) {
      const docs = await read.collection(collection).find({}).limit(argv.limit).toArray();

      if (docs.length > 0) {
        const newDocs = docs.map((d) => {
          const { _id, ...newDoc } = d;
          return newDoc;
        });
        await promisefy((c) => conn.collection(collection).insertMany(newDocs, c));
      }
      // eslint-disable-next-line no-console
      console.log(`${collection}: transfered ${docs.length} document`);
    }

    await read.close();
  }

  await conn.close();
};

if (require.main === module) {
  transferCommand()
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.log(e);
      process.exit(1);
    });
}

export default transferCommand;
