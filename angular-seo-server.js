var system = require('system');

if (system.args.length < 3) {
    console.log("Missing arguments.");
    phantom.exit();
}

var server = require('webserver').create();
var port = parseInt(system.args[1]);
var urlPrefix = system.args[2];

if (urlPrefix.indexOf('http') != 0) {
	urlPrefix = "http://" + urlPrefix;
}

// TODO: this is not compatible with non-hashbang params ?
var parse_qs = function(s) {
    var queryString = {};
    var a = document.createElement("a");
    a.href = s;
    a.search.replace(
        new RegExp("([^?=&]+)(=([^&]*))?", "g"),
        function($0, $1, $2, $3) { queryString[$1] = $3; }
    );
    return queryString;
};

var renderHtml = function(url, cb) {
    var page = require('webpage').create();
    page.settings.loadImages = false;
    page.settings.localToRemoteUrlAccessEnabled = true;
    page.onCallback = function() {
        cb(page.content);
        page.close();
    };
    page.onInitialized = function() {
       page.evaluate(function() {
            setTimeout(function() {
                window.callPhantom();
            }, 5000);
        });
    };
    page.open(url);
};

// keepAlive: false is required since no Content-Length header is sent http://phantomjs.org/api/webserver/method/listen.html
server.listen(port, {'keepAlive': false}, function (request, response) {
    var route = parse_qs(request.url)._escaped_fragment_;
    var url = urlPrefix
      + request.url.slice(1, request.url.indexOf('?'))
      + '#!';
    if (route) {
    	url += decodeURIComponent(route);
    }
	// TODO: command line flag to turn this logging on or off
    console.log(url);
    renderHtml(url, function(html) {
        response.statusCode = 200;
        response.write(html);
        response.close();
    });
});

console.log('Listening on ' + port + '...');
console.log('Press Ctrl+C to stop.');
