const {
  initProject,
  installDependencies,
  copyDemo,
  linkNative,
  runIOS,
  registerDemo,
  killPackager,
} = require('./util/rn');
const { receiveSnapshots } = require('./server/server');

function makeAllVersions(cfg, server) {
  function makeByIdx(i) {
    if (i >= cfg.rnVersions.length) {
      return Promise.resolve();
    }
    return makeProjectVersion(cfg, cfg.rnVersions[i], server)
      .then(() => makeByIdx(i+1));
  }
  if (cfg.rnVersions) {
    // run them in sequence
    return makeByIdx(0);
  }
  throw new Error("no RN versions to process");
}

function makeProjectVersion(baseCfg, rnVersion, server) {
  console.log("Going to make project with RN@", rnVersion);
  const projectCfg = Object.assign({}, baseCfg, { rnVersion })
  return initProject(projectCfg)
    .then((cfg) => {
      return copyDemo(cfg.demoSrc, cfg.projectDir + '/' + cfg.demoDest)
        .then(() => registerDemo(cfg))
        .then(() => server.currentProject = cfg)
        .then(() => installDependencies(cfg))
        .then(() => linkNative(cfg))
        .then(() => killPackager(cfg))  // TODO start it nicely as our process so it can be cleaned
        .then(() => runIOS(cfg))
        .then(() => receiveSnapshots(server, cfg))
    });
}

module.exports = {
  makeAllVersions,
}
