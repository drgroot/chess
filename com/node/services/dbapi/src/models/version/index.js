/* eslint-disable no-await-in-loop */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import log from 'chess_jslog';
import Version from './schema';

export const migrations = fs.readdirSync(path.join(__dirname, 'migrations'))
  .map((basef) => ({
    location: path.join(__dirname, 'migrations', basef),
    version: parseInt(basef.replace(/\D+/g, ''), 10),
  }))
  .sort((a, b) => a.version - b.version);

export const getCurrentVersion = () => Version.findOne({})
  .sort({ version: -1 })
  .lean()
  .exec()
  .then((version) => {
    if (version === null) {
      return -1;
    }

    return version.version;
  });

const upgrade = async () => {
  const currentVersion = await getCurrentVersion();

  // version is -1, then just create indices and set version to latest
  if (currentVersion === -1) {
    for (const modelName of mongoose.modelNames()) {
      const model = mongoose.model(modelName);
      await model.syncIndexes();
    }

    const version = new Version({
      version: migrations[migrations.length - 1].version,
    });
    await version.save();
  } else {
    log('Starting migrations');

    // perform migrations
    for (const migration of migrations.filter((m) => m.version > currentVersion)) {
      try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        const fun = require(migration.location);
        await fun();
        log(`migrated to version ${migration.version}`);

        const version = new Version({
          version: migration.version,
        });
        await version.save();
      } catch (e) {
        log(`[ERROR] unable to migrate to version ${migration.version}.`, e);
        return;
      }
    }

    log('Completed migrations');
  }
};

export default upgrade;
