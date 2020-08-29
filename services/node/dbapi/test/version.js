import { assert } from 'chai';
import { copyDatabase, clearDatabase } from 'chess_jstransfer';
import upgrade, { migrations, getCurrentVersion } from '../src/models/version';
import Model from '../src/models/version/schema';

const copy = () => copyDatabase({ limit: 100 });

let currentVersion;
describe('Version', () => {
  it('should return the correct version from the database', () => getCurrentVersion()
    .then((version) => { currentVersion = version; }));

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
    it('copy database', () => copy()).timeout(30000);

    it('should upgrade to the latest version', () => upgrade());

    it('should upgrade in the correct order', () => Model.find({}).sort({ date: -1 })
      .then((versions) => {
        for (let i = 0; i < versions.length; i += 1) {
          if (i > 0) {
            assert.isBelow(versions[i].version, versions[i - 1].version);
          }
        }
      }));

    after((() => clearDatabase({ collections: ['matches', 'versions', 'users'] })));
  });

  describe('performing a migration', () => {
    it('should upgrade to the latest version', () => upgrade());

    it('should upgrade in the correct order', () => Model.find({}).sort({ date: -1 })
      .then((versions) => {
        const upgradePath = versions.map((v) => v.version)
          .filter((v) => v >= currentVersion)
          .reverse();
        const correctPath = migrations.filter((v) => v.version >= currentVersion)
          .map((v) => v.version).reverse();

        // make sure that the path to upgrade follows the same order as the migrations
        assert.sameOrderedMembers(upgradePath, correctPath);
      }));
  });
});
