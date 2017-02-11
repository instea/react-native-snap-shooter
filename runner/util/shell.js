const fs = require('fs-extra');
const { exec : node_exec , spawn : node_spawn } = require('child_process');

const log = require('../util/log');

function exec(cmd, options) {
  return new Promise((resolve, reject) => {
    log.debug('executing', cmd);
    node_exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      resolve({stdout, stderr});
    });
  });
}

function spawn(cmd, options) {
  options = Object.assign( {
    stdio: 'inherit',
    shell: true,
  }, options);
  if (options.quite) {
    options.stdio = ['ignore', 'ignore', process.stderr]
  }
  return new Promise((resolve, reject) => {
    log.debug('spawning', cmd);
    const child = node_spawn(cmd, options);
    let output = '';

    child.on('error', (err) => {
      log.error('Failed to start child process.');
      reject(err);
    });

    if (options.background) {
      log.trace('Starting process in background');
      return resolve(child);
    }

    if (child.stdout) {
      child.stdout.on('data', data => output += data);
    }

    child.on('close', (code) => {
      log.debug(`child process exited with code ${code}`);
      resolve({ code, output });
    });
  })
}

function ensureDir(dir) {
  return new Promise((resolve, reject) => {
    fs.ensureDir(dir, function(err) {
        return err ? reject(err) : resolve();
      });
  });
}

/** touches file and creates directories if needed */
function touchFile(file) {
  return new Promise((resolve, reject) => {
    fs.ensureFile(file, function(err) {
        return err ? reject(err) : resolve();
      });
  });
}

function readJSON(file) {
  return new Promise((resolve, reject) => {
    fs.readJSON(file,
      (err, obj) => err ? reject(err) : resolve(obj));
  });
}

function overwriteFile(file, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, content,
      (err) => err ? reject(err) : resolve());
  });
}

function deleteDir(dir) {
  log.warn("Deleting dir", dir);
  return new Promise((resolve, reject) => {
    fs.remove(dir, (err) => err ? reject(err) : resolve());
  });
}

/**
pipe streams and return promise then done
*/
function pipe(src, dest) {
  return new Promise((resolve, reject) => {
    dest.on('finish', () => resolve());
    dest.on('error', (e) => reject(e));

    src.pipe(dest);
  });
}

module.exports = {
  exec,
  spawn,
  ensureDir,
  readJSON,
  overwriteFile,
  pipe,
  deleteDir,
  touchFile,
};
