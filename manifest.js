var fs = require('fs');
var manifestFile = process.env.PWD + '/manifest.json';
var packageFile = process.env.PWD + '/package.json';

return fs.readFile(manifestFile, 'utf8', function (err, data) {
    if (err) {
        console.error('Error while loading file package.json');
        return;
    }

    var manifest = JSON.parse(data);

    var pack = {
      "name": manifest.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-'),
      "title": manifest.name,
      "id": manifest.moz_id ||
        "jid" + Math.random().toString(36).replace(/\./g, ''),
      "description": manifest.name,
      "author": manifest.author,
      "version": manifest.version,
      "licence": manifest.licence || "MIT",
    };

    return fs.writeFile(packageFile, JSON.stringify(pack),
        function (err, data) {
            if (err) {
                console.error('Error while writing package.json');
            }
        }
    );
});