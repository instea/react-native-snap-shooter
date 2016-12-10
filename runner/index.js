#!/usr/bin/env node
/* eslint-disable no-process-exit */

const argv = require('yargs')
  .usage('$0 [options]')
  .describe('check', 'if set the shooter will check screenshots otherwise it will capture screenshots')
  .describe('src', 'directory where demo sources and shooter.json is stored')
  .default('src', 'demo')
  .help()
  .argv;

const { ensureDir } = require('./util/shell');
const { readConfig } = require('./util/config');
const { startServer } = require('./server/server');
const { makeAllRuns } = require('./shooter');
const { checkImages } = require('./checker');
const log = require('./util/log');

log.trace("Arguments:", argv);

const demoDir = argv.src;
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
.then(res => log.info("Done", res))
.catch(err => log.error(err))
// TODO properly close server
.then(() => process.exit())
