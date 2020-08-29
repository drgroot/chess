import { assert } from 'chai';
import { copyDatabase, clearDatabase } from 'chess_jstransfer';
import upgrade, { migrations, getCurrentVersion } from '../src/models/version';
import Model from '../src/models/version/schema';

export const copy = () => copyDatabase({ limit: 100 });
export const clear = () => clearDatabase();

describe('Version', () => {
  it('migrations should be integers without missing numbers', () => {
    const versions = migrations.map((m) => m.version);
    versions.map((v) => assert.isNumber(v));

    for (const [i, version] of versions.entries()) {
      if (i !== versions.length - 1) {
        const difference = versions[i + 1] - version;
        assert.strictEqual(difference, 1, `Version ${version + 1} missing between [${version},${versions[i + 1]}]`);
      }
    }
  });

  describe('migrating an existing database', () => {
    let currentVersion;
    before(() => copy());

    it('should return the correct version from the database', () => getCurrentVersion()
      .then((version) => { currentVersion = version; }));

    it('should upgrade to the latest version', () => upgrade());

    it('should upgrade in the correct order', () => Model.find({}).sort({ date: -1 })
      .then((versions) => {
        for (let i = 0; i < versions.length; i += 1) {
          if (i > 0) {
            assert.isBelow(versions[i].version, versions[i - 1].version);
          }
        }

        // it should follow the correct upgrade path
        const upgradePath = versions.map((v) => v.version)
          .filter((v) => v >= currentVersion)
          .reverse();
        const correctPath = migrations.filter((v) => v.version >= currentVersion)
          .map((v) => v.version).reverse();
        assert.sameDeepMembers(upgradePath, correctPath);
      }));

    after((() => clear()));
  });

  describe('performing a migration', () => {
    before(() => clear());

    it('should upgrade to the latest version', () => upgrade());

    it('should upgrade in the correct order', () => Model.find({}).sort({ date: -1 })
      .then((versions) => {
        const currentVersion = -1;
        const upgradePath = versions.map((v) => v.version)
          .filter((v) => v >= currentVersion)
          .reverse();

        // make sure that the path to upgrade follows the same order as the migrations
        // for a new db, it should just be one migration
        assert.lengthOf(upgradePath, 1);
      }));
  });
});
