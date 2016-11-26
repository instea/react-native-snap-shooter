#!/usr/bin/env node
/* eslint-disable no-process-exit */

const argv = require('yargs').argv;

const { ensureDir } = require('./util/shell');
const { readConfig } = require('./util/config');
const { startServer } = require('./server/server');
const { makeAllRuns } = require('./shooter');
const { checkImages } = require('./checker');

console.log("Arguments:", argv);

const demoDir = argv.src || 'demo';
// check images for changes
const shouldCheck = argv.check;
// just print config
const shouldPrint = argv.print;

let server = undefined;

readConfig(demoDir)
.then((demoCfg) => {
  if (shouldCheck) {
    return checkImages(demoCfg);
  }
  if (shouldPrint) {
    return demoCfg;
  }
  return ensureDir(demoCfg.workDir)
    .then(() => startServer(demoCfg))
    .then(s => server = s)
    .then(() => makeAllRuns(demoCfg, server))
})
.then(res => console.log("Done", res))
.catch(err => console.error(err))
// TODO properly close server
.then(() => process.exit())
