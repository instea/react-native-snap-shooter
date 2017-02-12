const { takeSnapshot } = require('react-native-view-shot');

const DEF_OPTIONS = {
  serverPort : 0,
};

let options = DEF_OPTIONS;
let idx = 0;

/**
Takes snapshot and optionally send it to server
@param view - reference to the view that should be snap shooted
@param name - optional name of the snapshot (like `snap0` or `firstScreen`)
*/
function snapshot(view, name) {
  name = (name || generateName()) + '.png';
  console.log("taking snapshot", name);
  return takeSnapshot(view, {})
    .then(uri => {
      console.log("taken", uri);
      if (options.serverPort) {
        return sendFile(name, uri)
          .then(() => uri);
      }
      return uri;
    });
}

/**
Called when you are done with taking snapshots
*/
function done() {
  console.log("sending done signal")
  return postForm('/done')
}

function sendFile(name, uri) {
  console.log("sending file", name, uri);
  const photo = {
    uri,
    type: 'image/png',
    name
  };
  const body = new FormData();
  body.append('photo', photo);

  return postForm('/snap', body);
}

function postForm(uriPath, body) {
  const serverURL = `http://localhost:${options.serverPort}${uriPath}`;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', serverURL);
  return new Promise((resolve, reject) => {
    xhr.onerror = (e) => reject(e);
    xhr.onload = () => resolve(xhr.status);

    xhr.send(body);
  });
}

function generateName() {
  return 'snap-'+(idx++);
}

/**
initialize shooter with options
*/
function init(opts) {
  options = Object.assign({}, DEF_OPTIONS, opts);
  console.log("new options", opts);
}

module.exports = {
  init,
  snapshot,
  done,
}
