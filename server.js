const http = require('http');
const { v4: uuidv4 } = require('uuid');
const errorHandle = require('./errorHandle');

const todos = [{
    "title": "今天寫作業",
    "id": uuidv4()
}];

const headers = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
    'Content-Type': 'application/json'
};

const sendResponse = (res, statusCode, body) => {
    res.writeHead(statusCode, headers);
    res.write(JSON.stringify(body));
    res.end();
};

const getRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
    });
};

const isValidTitle = (title) => typeof title === 'string' && title.trim().length > 0;

const requestListener = async (req, res) => {
    if (req.method === "OPTIONS") {
        res.writeHead(200, headers);
        res.end();
        return;
    }

    if (req.url === '/todos' && req.method === 'GET') {
        sendResponse(res, 200, { status: "success", data: todos });
        return;
    }

    if (req.url === '/todos' && req.method === 'POST') {
        try {
            const { title } = await getRequestBody(req);
            if (!isValidTitle(title)) {
                errorHandle(res);
                return;
            }
            const todo = { title: title.trim(), id: uuidv4() };
            todos.push(todo);
            sendResponse(res, 200, { status: "success", data: todos });
        } catch (error) {
            errorHandle(res);
        }
        return;
    }

    if (req.url === '/todos' && req.method === "DELETE") {
        todos.length = 0;
        sendResponse(res, 200, { status: "success", data: todos });
        return;
    }

    if (req.url.startsWith("/todos/") && req.method === "DELETE") {
        const id = req.url.split("/").pop();
        const index = todos.findIndex((todo) => todo.id === id);
        if (index === -1) {
            errorHandle(res);
            return;
        }
        todos.splice(index, 1);
        sendResponse(res, 200, { status: "success", data: todos });
        return;
    }

    if (req.url.startsWith("/todos/") && req.method === "PATCH") {
        try {
            const id = req.url.split("/").pop();
            const { title } = await getRequestBody(req);
            const index = todos.findIndex((todo) => todo.id === id);
            if (index === -1 || !isValidTitle(title)) {
                errorHandle(res);
                return;
            }
            todos[index].title = title.trim();
            sendResponse(res, 200, { status: "success", data: todos });
        } catch (error) {
            errorHandle(res);
        }
        return;
    }

    res.writeHead(404, headers);
    res.write(JSON.stringify({ status: "false", message: "Not Found" }));
    res.end();
};

const server = http.createServer(requestListener);
server.listen(process.env.PORT || 3005);
