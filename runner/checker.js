const Jimp = require("jimp");

const {
  enumerateRuns,
  groupRunsBy,
  joinPath,
  getDirForRun,
  listImages,
} = require('./util/fs');
const { sequence } = require('./util/promises');
const log = require('./util/log');

function checkImages(cfg) {
  const allRuns = enumerateRuns(cfg);
  const groupedRuns = groupRunsBy(allRuns, r => r.device);

  return sequence(groupedRuns, runs => checkByDevice(cfg, runs));
}

function checkByDevice(cfg, runs) {
  log.info("Checking device", runs[0].device);
  const baseDir = getDirForRun(cfg, runs[0]);
  const originals = listImages(baseDir);
  return sequence(originals, imageName => {
    return listImagesByVersion(cfg, runs, imageName)
      .then((files) => compareImages(cfg, files));
  })
}

/**
list images by RN version
*/
function listImagesByVersion(cfg, runs, imageName) {
  const files = runs.map(run => joinPath(getDirForRun(cfg, run), imageName));
  // TODO check if all files exists
  if (files.length < 2) {
    throw new Error('need at least two images to check for ' + imageName);
  }
  return Promise.resolve(files);
}

function compareImages(cfg, files) {
  let totalDistance = 0;
  function compare(img1, img2) {
    const dist = Jimp.distance(img1, img2);
    log.debug("Distance is ", dist);
    totalDistance += dist;
    return dist;
  }
  function readAndCompare(file, originalImg) {
    return Jimp.read(file)
      .then(img => compare(originalImg, img))
      .catch(err => {
        log.error("Can't compare " + file + " : ", err);
      });
  }
  function compareByIdx(original, idx) {
    if (idx >= files.length) {
      return Promise.resolve();
    }
    log.debug("Comparing with ", files[idx]);
    return readAndCompare(files[idx],original)
      .then(() => compareByIdx(original, idx + 1));
  }
  log.debug("Loading first image as original", files[0]);
  return Jimp.read(files[0])
    .then(original => compareByIdx(original, 1))
    .then(() => log.info("total distance = " + totalDistance));
}

module.exports = {
  checkImages,
}
