const Jimp = require("jimp");

const { enumerateRuns, joinPath, getDirForRun } = require('./util/fs');

function checkImages(cfg) {
  return listImagesByVersion(cfg)
    .then((files) => compareImages(cfg, files));
}

/**
list images by RN version
*/
function listImagesByVersion(cfg) {
  const runs = enumerateRuns(cfg);
  const files = runs.map(run => joinPath(getDirForRun(cfg, run), 'snap-0.png'));
  // TODO check if all files exists
  if (files.length < 2) {
    throw new Error('need at least two images to check');
  }
  return Promise.resolve(files);
}

function compareImages(cfg, files) {
  let totalDistance = 0;
  function compare(img1, img2) {
    const dist = Jimp.distance(img1, img2);
    console.log("Distance is ", dist);
    totalDistance += dist;
    return dist;
  }
  function compareByIdx(original, idx) {
    if (idx >= files.length) {
      return Promise.resolve();
    }
    console.log("Comparing with ", files[idx]);
    return Jimp.read(files[idx]).then(img => compare(original, img))
      .then(() => compareByIdx(original, idx + 1));
  }
  console.log("Loading first image as original", files[0]);
  return Jimp.read(files[0])
    .then(original => compareByIdx(original, 1))
    .then(() => "total distance = " + totalDistance);
}

module.exports = {
  checkImages,
}
