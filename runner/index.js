/* eslint-disable no-process-exit */

const argv = require('yargs').argv;

const { ensureDir } = require('./util/shell');
const { readConfig } = require('./util/config');
const { startServer } = require('./server/server');
const { makeAllVersions } = require('./shooter');

console.log("Arguments:", argv);

const demoDir = 'demo';


let server = undefined;

readConfig(demoDir)
.then((demoCfg) => {
  return ensureDir(demoCfg.workDir)
    .then(() => startServer(demoCfg))
    .then(s => server = s)
    .then(() => makeAllVersions(demoCfg, server))
})
.then(res => console.log("Done", res))
.catch(err => console.error(err))
// TODO properly close server
.then(() => process.exit())
