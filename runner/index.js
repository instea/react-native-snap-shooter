/* eslint-disable no-process-exit */

const argv = require('yargs').argv;
const {
  initProject,
  installDependencies,
  copyDemo,
  linkNative,
  runIOS,
  registerDemo,
  killPackager,
} = require('./util/rn');
const { ensureDir, readJSON } = require('./util/shell');
const { startServer, receiveSnapshots } = require('./server/server');

console.log("Arguments:", argv);

const demoDir = 'demo';
const defaultCfg = {
  workDir : 'work',
  project: 'sampleProject',
  demoDest : 'demo',
  demoApp : 'DemoApp.js',
  snapTimeout: 1000,
  serverPort: 8023,
  outputDir: 'work/results',
  rnVersions: ['0.34.0', '0.35.0'],
}

let server = undefined;

readConfig(demoDir)
.then((demoCfg) => {
  return ensureDir(demoCfg.workDir)
    .then(() => startServer(demoCfg))
    .then(s => server = s)
    .then(() => makeAllVersions(demoCfg))
})
.then(res => console.log("Done", res))
.catch(err => console.error(err))
// TODO properly close server
.then(() => process.exit())

function makeAllVersions(cfg) {
  function makeByIdx(i) {
    if (i >= cfg.rnVersions.length) {
      return Promise.resolve();
    }
    return makeProjectVersion(cfg, cfg.rnVersions[i])
      .then(() => makeByIdx(i+1));
  }
  if (cfg.rnVersions) {
    // run them in sequence
    return makeByIdx(0);
  }
  throw new Error("no RN versions to process");
}

function makeProjectVersion(baseCfg, rnVersion) {
  console.log("Going to make project with RN@", rnVersion);
  const projectCfg = Object.assign({}, baseCfg, { rnVersion })
  return initProject(projectCfg)
    .then((cfg) => {
      return copyDemo(demoDir, cfg.projectDir + '/' + cfg.demoDest)
        .then(() => registerDemo(cfg))
        .then(() => server.currentProject = cfg)
        .then(() => installDependencies(cfg))
        .then(() => linkNative(cfg))
        .then(() => killPackager(cfg))
        .then(() => runIOS(cfg))
        .then(() => receiveSnapshots(server))
    });
}

function readConfig(dir) {
  return readJSON(dir + '/shooter.json')
    .then(logTap)
    .then(cfg => Object.assign({}, defaultCfg, cfg));
}

function logTap(arg) {
  console.log(arg);
  return arg;
}
