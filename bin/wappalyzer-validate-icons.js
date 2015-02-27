var readChunk = require('read-chunk');
var fileType = require('file-type');
var path = require('path');
var fs = require('fs-extra');
var async = require('async');
var glob = require('glob');

var appsJSON = require(process.argv[2]);
var iconsDir = process.argv[3];

var appsIconPaths = [];

function arrayDiff(a1, a2) {
  var o1={}, o2={}, diff=[], i, len, k;
  for (i=0, len=a1.length; i<len; i++) { o1[a1[i]] = true; }
  for (i=0, len=a2.length; i<len; i++) { o2[a2[i]] = true; }
  for (k in o1) { if (!(k in o2)) { diff.push(k); } }
  for (k in o2) { if (!(k in o1)) { diff.push(k); } }
  return diff;
}
function removeA(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

async.each(Object.keys(appsJSON.apps), function (app, callback) {
	glob(iconsDir + "/" + app + ".+(png|gif|jpg|jpeg|ico|icon|icns|tiff|tif|svg|bmp|psd|pspimage|thm|yuv|ai|drw|eps|ps)", function (err, files) {
		if (err) throw err;
		if (files.length < 1) {
			var err = new Error("There is no icon for '" + app + "'!");
			throw err;
		} else if (files.length > 1) {
			var err = new Error("There is more than one icon for '" + app + "'!");
			throw err;
		} else {
			if (files[0].split('.').pop() !== 'png') {
				var err = new Error("The icon at " + files[0] + " does not have a '.png' extension!");
				throw err;
			} else {
				var buffer = fileType(readChunk.sync(files[0], 0, 262));
				if (buffer.mime !== 'image/png' || buffer.ext !== 'png') {
					var err = new Error("The icon at " + files[0] + " has a '.png' extension, but it is not actually a PNG file! It is actually a " + buffer.mime + " which usually has an extension of '" + buffer.ext + "'.");
					throw err;
				} else {
					appsIconPaths.push(path.basename(files[0]));
					callback();
				}
			}
		}
	});
}, function(err) {
	if (err) throw err;
	fs.readdir(iconsDir, function(err, iconsList) {
		if (err) throw err;
		iconsList = removeA(iconsList, 'Thumbs.db');				// While Thumbs.db is excluded from git, Windows still adds it and it messes up tests
		appsIconPaths.push("default.png");
		if (appsIconPaths.length < iconsList.length) {
			var err = new Error("There are " + (iconsList.length - appsIconPaths.length) + " more files in the icons directory (" + iconsDir + ") than there are apps! There are " + appsIconPaths.length + " verified icons (one is the default), but there are " + iconsList.length + " total files." + "\n" + "The extra files are: " + arrayDiff(iconsList, appsIconPaths));
			throw err;
		}
	});
});