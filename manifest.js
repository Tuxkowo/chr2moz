var fs = require('fs');
var manifestFile = process.env.PWD + '/manifest.json';
var manifestExtrasFile = process.env.PWD + '/manifest-extras.json';
var packageFile = process.env.PWD + '/package.json';

var removeExtraneousNode = function (doc, extras) {
  if (typeof extras === 'object') {
    for (var i in extras) {
      if (extras.hasOwnProperty(i) && doc[i] !== undefined) {
        if (extras[i] === true) {
          delete doc[i];
        } else if (typeof extras === 'object') {
          doc[i] = removeExtraneousNode(doc[i], extras[i]);
        }
      }
    }
  }

  return doc;
};

var createManifest = function (doc) {
    var addon_nodes = {
      browser_action: {
        scripts: true,
        height: true,
        width: true,
      },
      licence: true,
      moz_id: true,
      safari_dev_id: true,
      safari_id: true,
      safari_rev: true,
    };

    doc = removeExtraneousNode(doc, addon_nodes);

    return fs.writeFile(manifestFile, JSON.stringify(doc, null, '  '),
        function (err, data) {
            if (err) {
                console.error('Error while writing manifest.json');
            }
        }
    );
};

var createPackage = function (extras) {
    var pack = {
      "name": extras.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-'),
      "title": extras.name,
      "id": extras.moz_id ||
        "jid" + Math.random().toString(36).replace(/\./g, ''),
      "description": extras.name,
      "author": extras.author,
      "version": extras.version,
      "licence": extras.licence || "No licence",
    };

    return fs.writeFile(packageFile, JSON.stringify(pack, null, '  '),
        function (err, data) {
            if (err) {
                console.error('Error while writing package.json');
            }
        }
    );
};


return fs.readFile(manifestExtrasFile, 'utf8', function (err, data) {
    if (err) {
        console.error('Error while loading file manifest-extras.json');
        return;
    }

    createPackage(JSON.parse(data));
    createManifest(JSON.parse(data));
});