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
  stopPackager,
} = require('./util/rn');
const { receiveSnapshots } = require('./server/server');
const { sequence } = require('./util/promises');
const {
  listExistingRuns,
  enumerateRuns,
  groupRunsBy,
  getProjectDir,
  joinPath,
  runStr,
  isAndroidRun,
} = require('./util/fs');
const log = require('./util/log');

function makeAllRuns(cfg, server) {
  let runs = enumerateRuns(cfg);
  if (cfg.diffRun) {
    const existingRuns = listExistingRuns(cfg);
    log.info("existing runs", existingRuns);
    runs = _.differenceBy(runs, existingRuns, runStr);
  }
  const groupedRuns = groupRunsBy(runs, r => r.rnVersion);
  function makeByIdx(i) {
    if (i >= groupedRuns.length) {
      return Promise.resolve();
    }
    return makeProjectVersion(cfg, groupedRuns[i], server)
      .then(() => makeByIdx(i+1));
  }
  if (groupedRuns.length === 0) {
    throw new Error("Nothing to run");
  }
  // run them in sequence
  return makeByIdx(0);
}

/**
Make project and executes runs
@param runs array of runs to execute which all share same project specific settings (i.e. rnVersion)
*/
function makeProjectVersion(baseCfg, runs, server) {
  const { rnVersion } = runs[0];
  log.info("Going to make project with RN@", rnVersion);
  const cfg = Object.assign({}, baseCfg, { run : { rnVersion }});
  return initProject(cfg)
    .then(() => copyDemo(cfg.demoSrc, joinPath(getProjectDir(cfg), cfg.demoDest)))
    .then(() => registerDemo(cfg))
    .then(() => installDependencies(cfg))
    .then(() => linkNative(cfg))
    .then(() => killPackager(cfg))
    .then(() => startPackager(cfg))
    .then(packager => {
      return sequence(runs, run => executeRun(baseCfg, run, server))
        .then(() => stopPackager(packager));
    })
}

function executeRun(baseCfg, run, server) {
  log.info("Going to execute run", run);
  const cfg = Object.assign({}, baseCfg, { run });
  server.currentProject = cfg;
  const runner = isAndroidRun(run) ? runAndroid : runIOS;
  return runner(cfg)
    .then(() => receiveSnapshots(server, cfg));
}

module.exports = {
  makeAllRuns,
}
