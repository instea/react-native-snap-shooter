const fs = require('fs-extra');
const { spawn, overwriteFile, exec, deleteDir } = require('./shell');
const { getProjectDir } = require('../util/fs');
const log = require('../util/log');

/**
Initiate new RN project
*/
function initProject(cfg) {
  const name = cfg.project;
  log.warn("Initialization of project - it might take several minutes to finish");
  const projectDir = getProjectDir(cfg);
  return deleteDir(projectDir)
    .then(() => spawn(`react-native init ${name} --version ${cfg.run.rnVersion}`, {
      cwd : cfg.workDir,
      quite: !cfg.verbose,
    }));
}

function copyDemo(demoDir, projectDir) {
  return new Promise((resolve, reject) => {
    fs.copy(demoDir, projectDir, function(err) {
      return err ? reject(err) : resolve();
    });
  });
}

/**
Install dependencies for demo project
@param deps dependencies as object in package.json
*/
function installDependencies(cfg) {
  const deps = cfg.dependencies;
  // add our dependencies
  deps['react-native-snap-shooter-tools'] = '^0.1.1';
  // deps['react-native-snap-shooter-tools'] = '../../../tools';
  deps['react-native-view-shot'] = '^1.5.0';
  let args = '';
  for(let d in deps) {
    const version = deps[d];
    args += `${d}@${version} `;
  }
  return spawn('npm install --save ' + args, {
    cwd : getProjectDir(cfg),
    quite: !cfg.verbose,
  });
}

/**
Return (as promise) list of all RN versions
*/
function listRNVersions() {
  return spawn('npm view react-native versions --json', { stdio: 'pipe' }).
    then(({ output }) => JSON.parse(output));
}

/**
Register `demoApp` to generated project
*/
function registerDemo(cfg) {
  const demoJs = `
import React, { Component } from 'react';
import { AppRegistry, View } from 'react-native';

import tools from 'react-native-snap-shooter-tools';
import DemoApp from './${cfg.demoDest}/${cfg.demoApp}';

class Shotter extends Component {
  render() {
    return (
      <View ref="root" style={{flex:1,backgroundColor: 'yellow'}}>
        <DemoApp/>
      </View>
    )
  }

  componentDidMount() {
    setTimeout(() => this.snap(), ${cfg.snapTimeout});
  }

  snap() {
    tools.snapshot(this.refs.root).catch(err => console.warn(err));
  }
}

tools.init({ serverPort : ${cfg.serverPort}});
AppRegistry.registerComponent('${cfg.project}', () => Shotter);
  `;
  return overwriteFile(getProjectDir(cfg) + '/index.ios.js', demoJs)
    .then(() => overwriteFile(getProjectDir(cfg) + '/index.android.js', demoJs));
}

function linkNative(cfg){
  return spawn('react-native link', {
    cwd : getProjectDir(cfg),
    quite: !cfg.verbose,
   });
}

function runIOS(cfg){
  return spawn('react-native run-ios', {
    cwd : getProjectDir(cfg),
    quite: !cfg.verbose,
   });
}

function runAndroid(cfg){
  const port = cfg.serverPort;
  const adb = getAdbPath();
  return spawn(`${adb} reverse tcp:${port} tcp:${port}`, { cwd : getProjectDir(cfg) })
    .then(() => spawn('react-native run-android', {
      cwd : getProjectDir(cfg),
      quite: !cfg.verbose,
     }));
}

function getAdbPath() {
  return process.env.ANDROID_HOME
    ? process.env.ANDROID_HOME + '/platform-tools/adb'
    : 'adb';
}

function killPackager() {
  return exec("lsof -n -i4TCP:8081 | grep node | awk '{print $2}' | xargs kill -9 || echo done");
}

/* starts packager and return (promised) child */
function startPackager(cfg){
  return spawn('npm start', { cwd : getProjectDir(cfg), background: true })
    .then((child) => sleep(5000).then(() => child));  // TODO better wait until is started
}

function stopPackager(child) {
  log.info("Going to stop packager");
  return new Promise(resolve => {
    child.on('close', resolve);
    child.kill();
  });
}

function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

module.exports = {
  initProject,
  copyDemo,
  installDependencies,
  linkNative,
  runIOS,
  runAndroid,
  registerDemo,
  startPackager,
  killPackager,
  stopPackager,
  listRNVersions,
};
