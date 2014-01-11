require('newrelic');

var static = require('node-static');
  httpProxy = require('http-proxy');

var port = process.env.PORT || 5000;
var file = new static.Server('./dist');
var proxy = new httpProxy.RoutingProxy({changeOrigin: true});

require('http').createServer(function (request, response) {
  if (request.url.match(/^\/web_api\/.*/)) {
    request.url = request.url.replace('/web_api', '');
    proxy.proxyRequest(request, response, {
      host: 'api.steampowered.com', port: 80
    });
  } else if (request.url.match(/^\/store_api\/.*/)) {
    request.url = request.url.replace('/store_api', '/api');
    proxy.proxyRequest(request, response, {
      host: 'store.steampowered.com', port: 80
    });
  } else if (request.url.match(/^\/id_api\/.*/)) {
    request.url = request.url.replace('/id_api', '');
    proxy.proxyRequest(request, response, {
      host: 'steamcommunity.com', port: 80
    });
  } else {
    request.addListener('end', function () {
      file.serve(request, response);
    }).resume();
  }
}).listen(port, function() {
  console.log("Listening on port " + port);
});
