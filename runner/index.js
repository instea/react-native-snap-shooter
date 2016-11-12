const argv = require('yargs').argv;
const {
  initProject,
  installDependencies,
  copyDemo,
  linkNative,
  runIOS,
  registerDemo,
} = require('./util/rn');
const { ensureDir, readJSON } = require('./util/shell');

console.log("Arguments:", argv);

const demoDir = 'demo';
const defaultCfg = {
  workDir : 'work',
  project: 'sampleProject',
  demoDest : 'demo',
  demoApp : 'DemoApp.js',
}

readConfig(demoDir)
.then((demoCfg) => {
  return ensureDir(demoCfg.workDir)
    .then(() => initProject(demoCfg))
    .then((cfg) => {
      return copyDemo(demoDir, cfg.projectDir + '/' + cfg.demoDest)
        .then(() => registerDemo(cfg))
        .then(() => installDependencies(cfg))
        .then(() => linkNative(cfg))
        // TODO shut down any packager if it is running
        .then(() => runIOS(cfg))
    });
})
.then(res => console.log("Done", res))
.catch(err => console.error(err))

function readConfig(dir) {
  return readJSON(dir + '/shooter.json')
    .then(logTap)
    .then(cfg => Object.assign({}, defaultCfg, cfg));
}

function logTap(arg) {
  console.log(arg);
  return arg;
}
