const http = require('http');
// const url = require('url');
const formidable = require('formidable');
const fs = require('fs-extra');

const { ensureDir } = require('../util/shell');

function startServer(cfg) {
  const port = cfg.serverPort;
  return new Promise((resolve, reject) => {
    var server = http.createServer(handleRequest);

    function handleRequest(request, response){
      console.log("incomming request");
      handleSnapshot(request, response, server);
    }

    server.listen(port, function(){
      console.log("Server listening on: http://localhost:%s", port);
      resolve(server);
    });

    server.on('error', (e) => reject(e));
  })
}

function receiveSnapshots(server) {
  console.log("receiveSnapshots...");
  // TODO reject on timeout
  return new Promise((resolve) => {
    server.on('snapfile', snap => resolve(snap));
  });
}

function handleSnapshot(request, response, server) {
  // const queryData = url.parse(request.url, true).query;
  // const name = queryData.name;
  const cfg = server.currentProject;
  const dir = cfg.outputDir + '/' + cfg.project + '/' + cfg.rnVersion;
  return ensureDir(dir)
    .then(() => {
      var form = new formidable.IncomingForm();
      form.parse(request, function(err, fields, files) {
        if (err) {
          console.log("error parsing request", err);
          return;
        }
        const file = files.photo;
        const fileName = dir + '/' + file.name;
        // TODO future make it async
        fs.renameSync(file.path, fileName);
        console.log("received snap", fileName);
        server.emit('snapfile', { fileName });
        response.end('It Works!! Path Hit: ' + request.url);
      });
    });
}

module.exports = {
  startServer,
  receiveSnapshots,
}
