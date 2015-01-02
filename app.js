var fs = require('fs');
var properties = require('properties');

var default_locale = {
    'en': 'en-US',
    'fr': 'fr-FR',
};

var convertLocale = function (currLocale) {
    var locale_dir = locales_dir + currLocale + '/';

    fs.stat(locale_dir, function (err, stats) {
        if (err) {
            console.error('Unable to stat ' + currLocale + '. Ignoring.');
            console.error(err);
            return;
        }

        if (stats.isDirectory()) {
            var file = locale_dir + 'messages.json';

            fs.readFile(file, 'utf8', function (err, data) {
                if (err) {
                    console.error('Unable to read messages.json for locale ' +
                        currLocale + '. Ignoring.');
                    console.error(err);
                    return;
                }

                data = JSON.parse(data);

                var moz_data = {};

                if (default_locale[currLocale] !== undefined) {
                    currLocale = default_locale[currLocale];
                }

                for (var j in data) {
                    moz_data[j] = data[j].message;
                }

                var moz_file = moz_locales + currLocale + '.properties';

                properties.stringify(moz_data, {
                    path: moz_file,
                }, function (err) {
                    if (err) {
                        console.error('Unable to save ' + moz_file +
                            '. Ignoring.');
                        console.error(err);
                        return;
                    }

                    console.error('Saved ' + moz_file);
                });
            });
        }
    });
};

var locales_dir = process.env.PWD + '/_locales/';
var moz_locales = process.env.PWD + '/locale/';

fs.readdir(locales_dir, function (err, files) {
    if (err) {
        console.error('Unable to read Chrome _locale directory. Aborting.');
        console.error(err);
        return;
    }

    for (var i in files) {
        var currLocale = files[i];
        convertLocale(currLocale);
    }
});
