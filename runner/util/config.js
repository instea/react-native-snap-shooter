const { readJSON } = require('../util/shell');

const defaultCfg = {
  workDir : "work",
  project: "sampleProject",
  demoDest : "demo",
  demoApp : "DemoApp.js",
  snapTimeout: 1000,
  serverPort: 8023,
  outputDir: "work/results",
  rnVersions: ["0.34.0", "0.35.0"],
}

function readConfig(dir) {
  return readJSON(dir + '/shooter.json')
    .then(logTap)
    .then(cfg => Object.assign({ demoSrc: dir }, defaultCfg, cfg));
}

function logTap(arg) {
  console.log(arg);
  return arg;
}

module.exports = {
  readConfig,
}
