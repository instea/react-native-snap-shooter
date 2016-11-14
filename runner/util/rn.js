const fs = require('fs-extra');
const { spawn, overwriteFile, exec, deleteDir } = require('./shell');

/**
Initiate new RN project
@return Promise resolved to configuration with projectDir filled in
*/
function initProject(cfg) {
  const name = cfg.project;
  console.log("Initialization of project - it might take several minutes to finish");
  return deleteDir(cfg.workDir + '/' + name)
    .then(() => spawn(`react-native init ${name} --version ${cfg.rnVersion}`, {
      cwd : cfg.workDir,
    })).then(() => Object.assign({}, cfg, {projectDir: cfg.workDir + '/' + name}));
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
  deps['react-native-snap-shooter-tools'] = '0.1.x';
  // deps['react-native-snap-shooter-tools'] = '../../../tools';
  deps['react-native-view-shot'] = '^1.5.0';
  let args = '';
  for(let d in deps) {
    const version = deps[d];
    args += `${d}@${version} `;
  }
  return spawn('npm install --save ' + args, { cwd : cfg.projectDir });
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
  return overwriteFile(cfg.projectDir + '/index.ios.js', demoJs);
}

function linkNative(cfg){
  return spawn('react-native link', { cwd : cfg.projectDir });
}

function runIOS(cfg){
  return spawn('react-native run-ios', { cwd : cfg.projectDir });
}

function killPackager() {
  return exec("lsof -n -i4TCP:8081 | sed '1 d' | awk '{print $2}' | xargs kill -9");
}

module.exports = {
  initProject,
  copyDemo,
  installDependencies,
  linkNative,
  runIOS,
  registerDemo,
  killPackager,
};
