import { assert } from 'chai';
import upgrade, { migrations, getCurrentVersion } from '../src/models/version';
import Model from '../src/models/version/schema';

let currentVersion;
describe('Version', () => {
  it('should return the correct version from the database', () => getCurrentVersion()
    .then((version) => {
      if (!process.env.MIGRATION) {
        currentVersion = migrations[migrations.length - 1].version;
        assert.strictEqual(version, currentVersion);
      } else {
        currentVersion = version;
      }
    }));

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

  describe('performing a migration', () => {
    it('should upgrade to the latest version', () => upgrade());

    it('should upgrade in the correct order', () => Model.find({}).sort({ date: -1 })
      .then((versions) => {
        const upgradePath = versions.map((v) => v.version)
          .filter((v) => v >= currentVersion)
          .reverse();
        const correctPath = migrations.filter((v) => v.version >= currentVersion)
          .map((v) => v.version).reverse();

        if (!process.env.MIGRATION) {
          assert.lengthOf(versions, 1);
        }

        // make sure that the path to upgrade follows the same order as the migrations
        assert.sameOrderedMembers(upgradePath, correctPath);
      }));
  });
});
