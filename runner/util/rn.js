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
import { AppRegistry } from 'react-native';
import Demo from './${cfg.demoDest}/${cfg.demoApp}';

AppRegistry.registerComponent('${cfg.project}', () => Demo);
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
