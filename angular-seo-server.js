var system = require('system');

if (system.args.length < 3) {
    console.log("Missing arguments.");
    phantom.exit();
}

// http://phantomjs.org/api/webserver/
var server = require('webserver').create();
var port = parseInt(system.args[1]);
var urlPrefix = system.args[2];

if (urlPrefix.indexOf('http') != 0) {
	urlPrefix = "http://" + urlPrefix;
}

var renderHtml = function(url, cb) {
    var page = require('webpage').create();
    page.settings.loadImages = false;
    page.settings.localToRemoteUrlAccessEnabled = true;
    page.onCallback = function(data) {
		// fired by window.callPhantom (fired by $scope.htmlReady() )
		var status = data && data.status ? data.status : 200;
        cb(page.content, status);
        page.close();
    };
    page.viewportSize = {
        width: 1200,
        height: 1200
    };
	// This callback is invoked after the web page is created but before a URL is loaded.
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
    // Route should be everything after the _escaped_fragment_=
    var route = request.url.substring(request.url.indexOf('_escaped_fragment_=') + 19) || '';
    var url = urlPrefix
      + request.url.slice(1, request.url.indexOf('?'))
      + '/#!';
    if (route) {
    	url += decodeURIComponent(route);
    }
	// TODO: command line flag to turn this logging on or off
    console.log(url);
    renderHtml(url, function(html, statusCode) {
        response.statusCode = statusCode;
		response.setHeader('Content-Type', 'text/html');
        response.write(html);
        response.close();
    });
});

console.log('Listening on ' + port + '...');
console.log('Press Ctrl+C to stop.');
