const http = require('http');
// const url = require('url');
const formidable = require('formidable');
const fs = require('fs-extra');

const { ensureDir } = require('../util/shell');
const { getDirForRun, joinPath } = require('../util/fs');
const log = require('../util/log');

function startServer(cfg) {
  const port = cfg.serverPort;
  return new Promise((resolve, reject) => {
    var server = http.createServer(handleRequest);

    function handleRequest(request, response){
      log.debug("incomming request");
      handleSnapshot(request, response, server);
    }

    server.listen(port, function(){
      log.info("Server listening on: http://localhost:" + port);
      resolve(server);
    });

    server.on('error', (e) => reject(e));
  })
}

function receiveSnapshots(server, cfg) {
  log.info("receiveSnapshots...");
  return timeoutPromise(new Promise((resolve) => {
    server.on('snapfile', snap => resolve(snap));
  }), cfg.receiveTimeout);
}

function timeoutPromise(p, ms) {
  return new Promise((resolve, reject) => {
    const checker = setTimeout(() => reject("operation timeouted"), ms);
    p.then(resolve).catch(reject).then(() => clearTimeout(checker));
  });
}

function handleSnapshot(request, response, server) {
  const cfg = server.currentProject;
  const dir = getDirForRun(cfg, cfg.run);
  return ensureDir(dir)
    .then(() => {
      var form = new formidable.IncomingForm();
      form.parse(request, function(err, fields, files) {
        if (err) {
          log.error("error parsing request", err);
          return;
        }
        const file = files.photo;
        const fileName = joinPath(dir, file.name);
        fs.renameSync(file.path, fileName);
        log.debug("received snap", fileName);
        server.emit('snapfile', { fileName });
        response.end('It Works!! Path Hit: ' + request.url);
      });
    });
}

module.exports = {
  startServer,
  receiveSnapshots,
}
