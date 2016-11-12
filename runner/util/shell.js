const fs = require('fs-extra');
const { exec : node_exec , spawn : node_spawn } = require('child_process');

function exec(cmd, options) {
  return new Promise((resolve, reject) => {
    console.log('executing', cmd);
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
  return new Promise((resolve, reject) => {
    console.log('spawning', cmd, options);
    const child = node_spawn(cmd, options);

    child.on('error', (err) => {
      console.log('Failed to start child process.');
      reject(err);
    });

    child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      resolve(code);
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

module.exports = {
  exec,
  spawn,
  ensureDir,
  readJSON,
  overwriteFile,
};
