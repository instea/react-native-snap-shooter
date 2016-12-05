const { readJSON } = require('../util/shell');
const { listRNVersions } = require('../util/rn');
const semver = require('semver');
const _ = require('lodash');

const defaultCfg = {
  workDir : "work",
  project: "sampleProject",
  demoDest : "demo",
  demoApp : "DemoApp.js",
  snapTimeout: 1000,
  serverPort: 8023,
  outputDir: "work/results",
  receiveTimeout: 100000,
  rnVersions: ["0.34.0", "0.35.0"],
  diffRun: true, // if execute only diff runs (otherwise rewrites old execution)
  devices: ["ios", "android"],
}

function readConfig(dir) {
  return readJSON(dir + '/shooter.json')
    .then(logTap)
    .then(cfg => Object.assign({ demoSrc: dir }, defaultCfg, cfg))
    .then(expandVersions)
}

function logTap(arg) {
  console.log(arg);
  return arg;
}

function expandVersions(cfg) {
  let versions = cfg.rnVersions;
  if (!versions) {
    throw new Error("no RN versions defined in config");
  }
  if (!versions.some(v => semver.validRange(v))) {
    return cfg;
  }
  return listRNVersions()
    .then((allVersions) => {
      versions = _.flatten(versions.map(v => expandVersion(v, allVersions)));
      cfg.rnVersions = _.uniq(versions);
      return cfg;
    })
}

function expandVersion(ver, all) {
  if (semver.valid(ver)) {
    return ver;
  }
  if (semver.validRange(ver)) {
    return all.filter(v => semver.satisfies(v, ver) && semver.gte(v, '0.30.0'));
  }
  throw new Error('invalid version ' + ver);
}

module.exports = {
  readConfig,
}
