const headers = require('./headers');

function successHandle(res, data){
    res.writeHead(200, headers);
    res.write(JSON.stringify({
        "status": "success",
        "data": data
    }));
    res.end();
}

module.exports = successHandle;
