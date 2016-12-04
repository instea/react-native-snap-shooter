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
    let output = '';

    child.on('error', (err) => {
      console.log('Failed to start child process.');
      reject(err);
    });

    if (options.background) {
      console.log('Starting process in background');
      return resolve(child);
    }

    if (child.stdout) {
      child.stdout.on('data', data => output += data);
    }

    child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
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
  console.log("Deleting dir", dir);
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
};
