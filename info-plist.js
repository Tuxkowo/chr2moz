/*jshint -W069 */

var plist = require('plist');
var concat = require('concat-files');
var fs = require('fs');

var manifestExtrasFile = process.env.PWD + '/manifest-extras.json';
var manifestExtrasJSFile = process.env.PWD + '/manifest-extras.js';
var plistFile = process.env.PWD + '/Info.plist';
var safariBGPage = 'safari-background.html';
var safariBGFile = process.env.PWD + '/' + safariBGPage;

var createPlist = function (data) {
    var i, j;
    var plistData = {};
    var contentScripts = {};

    plistData['Author'] = data.author;
    plistData['Builder Version'] = '10600.3.18';
    plistData['CFBundleDisplayName'] = data.name;
    plistData['CFBundleIdentifier'] = data.safari_id;
    plistData['CFBundleInfoDictionaryVersion'] = '6.0';
    plistData['CFBundleShortVersionString'] = data.version;
    plistData['CFBundleVersion'] = data.safari_rev;
    plistData['Chrome'] = {};
    plistData['Chrome']['Database Quota'] = 10485760;
    plistData['Chrome']['Global Page'] = safariBGPage;
    plistData['Chrome']['Popovers'] = [];
    plistData['Chrome']['Popovers'].push({
        'Filename': data.browser_action.default_popup,
        'Identifier': 'extension-popover',
        'Height': data.browser_action.height,
        'Width': data.browser_action.width,
    });
    plistData['Chrome']['Toolbar Items'] = [];
    plistData['Chrome']['Toolbar Items'].push({
        'Identifier': 'extension-toolbar-item',
        'Image': data.browser_action.default_icon,
        'Label': data.name,
        'Popover': 'extension-popover',
    });
    plistData['Content'] = {};
    plistData['Content']['Scripts'] = {};
    plistData['Content']['Scripts']['End'] = [];


    plistData['Content']['Whitelist'] = [];
    for (i in data.content_scripts) {
        if (data.content_scripts.hasOwnProperty(i)) {
            for (j in data.content_scripts[i].matches) {
                if (data.content_scripts[i].matches.hasOwnProperty(j)) {
                    var pattern = data.content_scripts[i].matches[j];

                    if (pattern.substr(0, 4) !== '*://') {
                        plistData['Content']['Whitelist'].push(
                            pattern
                        );
                    } else {
                        plistData['Content']['Whitelist'].push(
                            'http://' + pattern.substr(4)
                        );

                        plistData['Content']['Whitelist'].push(
                            'https://' + pattern.substr(4)
                        );
                    }
                }
            }

            for (j in data.content_scripts[i].js) {
                if (data.content_scripts[i].js.hasOwnProperty(j)) {
                    var scriptFile = data.content_scripts[i].js[j];

                    contentScripts[scriptFile] = scriptFile;
                }
            }
        }
    }

    contentScriptsArray = [];

    for (i in contentScripts) {
        if (contentScripts.hasOwnProperty(i)) {
            contentScriptsArray.push(contentScripts[i]);
        }
    }

    if (contentScriptsArray.length > 0) {
        createManifestJS(data, function () {
            contentScriptsArray.unshift('data/watchers/conditional-loading.js');
            contentScriptsArray.unshift(manifestExtrasJSFile);

            concat(contentScriptsArray, 'data/content_scripts.js', function () {
                for (var i in contentScriptsArray) {
                    if ([
                        'data/watchers/messaging-safari.js',
                        ].indexOf(contentScriptsArray[i]) === -1) {
                        fs.unlink(contentScriptsArray[i]);
                    }
                }
            });
        });

        plistData['Content']['Scripts']['End'] = ['data/content_scripts.js'];
    }

    plistData['DeveloperIdentifier'] = data.safari_dev_id;
    plistData['ExtensionInfoDictionaryVersion'] = '1.0';
    plistData['Permissions'] = {};
    plistData['Permissions']['Website Access'] = {};
    plistData['Permissions']['Website Access']['Allowed Domains'] = [];

    for (i in data.permissions) {
        if (data.permissions.hasOwnProperty(i) &&
            data.permissions[i].indexOf('://') !== -1) {
            var domain = data.permissions[i]
                .replace(/(?:.*:\/\/)([^\/]+)(.*)/, '$1');

            plistData['Permissions']['Website Access']['Allowed Domains']
                .push(domain);
        }
    }
    plistData['Permissions']['Website Access']['Include Secure Pages'] = true;
    plistData['Permissions']['Website Access']['Level'] = 'Some';
    //plistData['Website'] = '';

    return fs.writeFile(plistFile, plist.build(plistData),
        function (err, data) {
            if (err) {
                console.error('Error while writing Info.plist');
            }
        }
    );
};

var createBackground = function (data) {
    var html = '<!DOCTYPE html><html><head><title>Safari BG Page</title>' +
        '<meta charset="UTF-8">';

    for (var i in data.background.scripts) {
        if (data.background.scripts.hasOwnProperty(i)) {
            html = html + '<script src="' + data.background.scripts[i] + '">' +
                '</script>';
        }
    }

    html = html + '</head><body></body></html>';

    return fs.writeFile(safariBGFile, html,
        function (err, data) {
            if (err) {
                console.error('Error while writing background page');
            }
        }
    );
};

var createManifestJS = function (data, cb) {
    data = 'var manifest_json = ' + JSON.stringify(data) + ';';


    return fs.writeFile(manifestExtrasJSFile, data,
        function (err, data) {
            if (err) {
                console.error('Error while writing manifest-extras.js');
            }

            cb();
        }
    );
};

return fs.readFile(manifestExtrasFile, 'utf8', function (err, data) {
    if (err) {
        console.error('Error while loading file manifest-extras.json');
        return;
    }

    data = JSON.parse(data);

    createPlist(data);
    createBackground(data);
});