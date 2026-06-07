const headers = require('./headers');

function errorHandle(res, statusCode = 400, message = "欄位未填寫正確，或無此 todo id"){
    res.writeHead(statusCode, headers);
    res.write(JSON.stringify({
        "status": "false",
        "message": message,
    }));
    res.end();
}

module.exports = errorHandle;