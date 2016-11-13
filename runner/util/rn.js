const fs = require('fs-extra');
const { spawn, overwriteFile } = require('./shell');

/**
Initiate new RN project
@return Promise resolved to configuration with projectDir filled in
*/
function initProject(cfg) {
  // TODO make sure directory is not there (leave for now to speed up development)
  const name = cfg.project;
  return spawn('react-native init ' + name, {
    cwd : cfg.workDir,
  }).then(() => Object.assign({}, cfg, {projectDir: cfg.workDir + '/' + name}));
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
  // TODO use proper version once published to NPM
  deps['react-native-snap-shooter-tools'] = '../../../tools';
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

module.exports = {
  initProject,
  copyDemo,
  installDependencies,
  linkNative,
  runIOS,
  registerDemo,
};
