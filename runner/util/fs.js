/**
This file represents "logical" file system for snap-shooter.
Snapshots are stored in directories that corresponds to the runs.

Currently run is determined by following attributes:
- device: device type ( OS - android / ios + sim type)
- rnVersion: RN version

Each attribute defines one directory (in given order)
*/
const fs = require('fs-extra');
const _ = require('lodash');

/**
List all existing runs for given project.
@return {array of runs}
*/
function listExistingRuns(cfg) {
  const outDir = getOutputDir(cfg);
  fs.ensureDirSync(outDir);
  var files = fs.walkSync(outDir);
  const projectPathLength = splitPath(outDir).length;
  const runs = files.map(f => splitPath(f))
    .map(segments => segments.slice(projectPathLength))
    .filter(seg => seg[2] === 'done.txt')
    .map(seg => ({ device: seg[0], rnVersion: seg[1]}));
  return _.uniqBy(runs, runStr);
}

/**
Enumerate all runs for given configuration
*/
function enumerateRuns(cfg) {
  return _.flatten(cfg.rnVersions.map(v => cfg.devices.map(device =>({rnVersion : v, device}))));
}

/**
Returns array of arrays where all runs in nested arrays share "by" condition
@param by function run=>value which is used to make groups
*/
function groupRunsBy(runs, by) {
  return _.map(_.groupBy(runs, by));
}

function isAndroidRun(run) {
  return run.device.startsWith('android');
}

/**
Return canonical string representation for run
*/
function runStr(r) {
  return joinPath(r.device, r.rnVersion);
}

/**
Returns dir path for given project and run.
It does NOT ensure that dir exists.
*/
function getDirForRun(cfg, run) {
  const outDir = getOutputDir(cfg);
  return joinPath(outDir, run.device, run.rnVersion);
}

/**
Get project (working) directory
*/
function getProjectDir(cfg) {
  return joinPath(cfg.workDir, cfg.project);
}

/**
Get output directory for project
*/
function getOutputDir(cfg) {
  return joinPath(cfg.outputDir, cfg.project);
}

/**
Split path to the segments (directories + filename)
*/
function splitPath(file) {
  return file.split('/');
}

function joinPath(...segments) {
  return segments.join('/');
}


module.exports = {
  listExistingRuns,
  enumerateRuns,
  groupRunsBy,
  joinPath,
  getDirForRun,
  getProjectDir,
  runStr,
  isAndroidRun,
}
