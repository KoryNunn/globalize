var globalify = require('globalify'),
    packageJson = require('./package.json'),
    path = require('path'),
    fs = require('fs'),
    http = require('http'),
    url = require('url'),
    beeline = require('beeline'),
    server,
    router,
    port = process.env.PORT || 8083;

function buildAndServe(response, module, version){

    version = version || 'x.x.x';

    var modulePath = path.join(process.cwd(), packageJson.moduleDirectory, module + '-' + version + '.js');

    if(fs.existsSync(modulePath)){
        fs.createReadStream(modulePath).pipe(response);
        return;
    }

    var globalifyStream = globalify({
            module: module
        },
        function(error){
            if(error){
                console.log(error);
            }
        }
    );

    globalifyStream.pipe(fs.createWriteStream(modulePath));
    globalifyStream.pipe(response);
}

router = beeline.route({
    "/": beeline.staticFile('./index.html', 'text/html'),
    "/build/`module`/`version`": function(request, response, tokens, values) {
        buildAndServe(response, tokens.module, tokens.version);
    },
    "/build/`module`": function(request, response, tokens, values) {
        buildAndServe(response, tokens.module);
    },
    "/build": function(request, response) {
        var queryParams = url.parse(request.url, true).query,
            module = queryParams.module,
            version = queryParams.version;

        buildAndServe(response, module, version);
    }
});

server = http.createServer(router).listen(port);