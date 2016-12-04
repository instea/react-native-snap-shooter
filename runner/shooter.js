const _ = require('lodash');

const {
  initProject,
  installDependencies,
  copyDemo,
  linkNative,
  runIOS,
  runAndroid,
  registerDemo,
  killPackager,
  startPackager,
} = require('./util/rn');
const { receiveSnapshots } = require('./server/server');
const {
  listExistingRuns,
  enumerateRuns,
  getProjectDir,
  joinPath,
  runStr,
} = require('./util/fs');

function makeAllRuns(cfg, server) {
  let runs = enumerateRuns(cfg);
  if (cfg.diffRun) {
    const existingRuns = listExistingRuns(cfg);
    console.log("existing runs", existingRuns);
    runs = _.differenceBy(runs, existingRuns, runStr);
  }
  function makeByIdx(i) {
    if (i >= runs.length) {
      return Promise.resolve();
    }
    return makeProjectVersion(cfg, runs[i], server)
      .then(() => makeByIdx(i+1));
  }
  if (runs.length === 0) {
    throw new Error("Nothing to run");
  }
  // run them in sequence
  return makeByIdx(0);
}

function makeProjectVersion(baseCfg, run, server) {
  const { rnVersion } = run;
  // TODO handle different devices later on (i.e. split runs for same RN etc.)
  console.log("Going to make project with RN@", rnVersion);
  const cfg = Object.assign({}, baseCfg, { run })
  return initProject(cfg)
    .then(() => copyDemo(cfg.demoSrc, joinPath(getProjectDir(cfg), cfg.demoDest)))
    .then(() => registerDemo(cfg))
    .then(() => server.currentProject = cfg)
    .then(() => installDependencies(cfg))
    .then(() => linkNative(cfg))
    .then(() => killPackager(cfg))
    .then(() => startPackager(cfg))
    .then(() => (cfg.android ? runAndroid(cfg) : runIOS(cfg)))
    .then(() => receiveSnapshots(server, cfg));
}

module.exports = {
  makeAllRuns,
}
