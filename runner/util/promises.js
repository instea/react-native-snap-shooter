// @flow
// utility class for promisses

/**
Executes generated promisses in sequence.
@param inputs - array of inputs that are used by generator
@param generator - fn(input):Promise
*/
function sequence(inputs, generator) {
  function next(idx) {
    if (idx >= inputs.length) {
      return Promise.resolve();
    }
    return generator(inputs[idx])
      .then(() => next(idx + 1));
  }
  return next(0);
}

module.exports = {
  sequence,
}
