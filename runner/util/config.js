const semver = require('semver');
const _ = require('lodash');

const { readJSON } = require('../util/shell');
const { listRNVersions } = require('../util/rn');
const log = require('../util/log');

// defaults for `shooter.json`
const defaultCfg = {
  // directory path where shooter performs its work.
  workDir : "work",
  // name of the RN project that will be created in work directory
  project: "sampleProject",
  // directory within generated RN project where your demo sources will be copied
  // source directory is always where your `shooter.json` file is located and it defaults to `demo` but can be overriden by `src` command line argument
  demoDest : "demo",
  // file within demo sources that should be "executed". Must export valid React component as a default.
  demoApp : "DemoApp.js",
  // timout (ms) after which the automatic snapshot will be taken
  snapTimeout: 1000,
  // port used for receiving of snapshots from the simulator
  serverPort: 8023,
  // directory where the results are stored. Do not have to be inside work directory.
  outputDir: "work/results",
  // timeout (ms) for receiving of snap shots. This time includes also initial packager load thus should not be too low.
  receiveTimeout: 100000,
  // list of RN versions that will be snapped. Can contain also any valid semver range (this range will be further restricted to versions supported by us)
  // First RN version will be used as base against which the next versions will be compared to.
  // Therefore it is recommended to set it to non-range version and ideally the one you are testing our component against during development
  // Special value `RC` stands for latest rc version
  rnVersions: ["0.34.0", "0.35.0"],
  // list of RN versions for exclusion. Can't be a semver range.
  // Used only with ranges. Use it to explicitly disable (broken) version.
  excludedVersions: [ "0.39.0", "0.39.1" ],
  // if execute only diff runs i.e. don't rerun versions we already have results . Otherwise rewrites old results
  diffRun: true,
  // list of all devices against which the project should be run.
  devices: ["ios", "android"],
  // if to show more verbose output
  verbose: false,
  // iff the generated demo app will take snapshots automatically. Otherwise code in `demoApp` is responsible for taking snapshots and `done` action
  automatic: true,
}

function readConfig(dir) {
  return readJSON(dir + '/shooter.json')
    .then(logTap)
    .then(cfg => Object.assign({ demoSrc: dir }, defaultCfg, cfg))
    .then(expandVersions)
}

function logTap(arg) {
  log.trace(arg);
  return arg;
}

function expandVersions(cfg) {
  let versions = cfg.rnVersions;
  if (!versions) {
    throw new Error("no RN versions defined in config");
  }
  if (!versions.some(v => semver.validRange(v) || isOurSpecial(v))) {
    return cfg;
  }
  return listRNVersions()
    .then((allVersions) => {
      versions = _.flatten(versions.map(v => expandVersion(v, allVersions)));
      cfg.rnVersions = _.pullAll(_.uniq(versions), cfg.excludedVersions);
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
  if (isOurSpecial(ver)) {
    return retrieveSpecial(ver, all);
  }
  throw new Error('invalid version ' + ver);
}

// our special version type
function isOurSpecial(ver) {
  if (ver === "RC") {
    return true;
  }
  return false;
}

function retrieveSpecial(ver, all) {
  if (ver === "RC") {
    // return latest RC if any
    const last = all[all.length - 1];
    if (last.indexOf("rc") > 0) {
      return last;
    }
    // latest RC is from prior version -> not interested
    return [];
  }
  throw new Error('Invalid special version ' + ver);
}

module.exports = {
  readConfig,
}
