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
}

let server = undefined;

readConfig(demoDir)
.then((demoCfg) => {
  return ensureDir(demoCfg.workDir)
    .then(() => startServer(demoCfg))
    .then(s => server = s)
    .then(() => initProject(demoCfg))
    .then((cfg) => {
      return copyDemo(demoDir, cfg.projectDir + '/' + cfg.demoDest)
        .then(() => registerDemo(cfg))
        .then(() => installDependencies(cfg))
        .then(() => linkNative(cfg))
        .then(() => killPackager(cfg))
        .then(() => runIOS(cfg))
        .then(() => receiveSnapshots(server))
    });
})
.then(res => console.log("Done", res))
.catch(err => console.error(err))
// TODO properly close server
.then(() => process.exit())

function readConfig(dir) {
  return readJSON(dir + '/shooter.json')
    .then(logTap)
    .then(cfg => Object.assign({}, defaultCfg, cfg));
}

function logTap(arg) {
  console.log(arg);
  return arg;
}
