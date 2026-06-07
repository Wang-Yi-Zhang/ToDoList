const http = require('http');
const { v4: uuidv4 } = require('uuid');
const errorHandle = require('./errorHandle');
const successHandle = require('./successHandle');

const todos = [];

const headers = require('./headers');

const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1MB

class PayloadTooLargeError extends Error {}

const handleRequestError = (res, error) => {
    if (error instanceof PayloadTooLargeError) {
        errorHandle(res, 413, "請求內容過大");
    } else {
        errorHandle(res, 400, "欄位未填寫正確");
    }
};

const getRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = "";
        let size = 0;
        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > MAX_BODY_SIZE) {
                reject(new PayloadTooLargeError());
                return;
            }
            body += chunk;
        });
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
        successHandle(res, todos);
        return;
    }

    if (req.url === '/todos' && req.method === 'POST') {
        try {
            const { title } = await getRequestBody(req);
            if (!isValidTitle(title)) {
                errorHandle(res, 400, "欄位未填寫正確");
                return;
            }
            const todo = { title: title.trim(), id: uuidv4() };
            todos.push(todo);
            successHandle(res, todo);
        } catch (error) {
            handleRequestError(res, error);
        }
        return;
    }

    if (req.url === '/todos' && req.method === "DELETE") {
        todos.length = 0;
        successHandle(res, todos);
        return;
    }

    if (req.url.startsWith("/todos/") && req.method === "DELETE") {
        const id = req.url.split("/").pop();
        const index = todos.findIndex((todo) => todo.id === id);
        if (index === -1) {
            errorHandle(res, 404, "查無此 todo");
            return;
        }
        todos.splice(index, 1);
        successHandle(res, todos);
        return;
    }

    if (req.url.startsWith("/todos/") && req.method === "PATCH") {
        try {
            const id = req.url.split("/").pop();
            const { title } = await getRequestBody(req);
            const index = todos.findIndex((todo) => todo.id === id);
            if (index === -1) {
                errorHandle(res, 404, "查無此 todo");
                return;
            }
            if (!isValidTitle(title)) {
                errorHandle(res, 400, "欄位未填寫正確");
                return;
            }
            todos[index].title = title.trim();
            successHandle(res, todos[index]);
        } catch (error) {
            handleRequestError(res, error);
        }
        return;
    }

    res.writeHead(404, headers);
    res.write(JSON.stringify({ status: "false", message: "Not Found" }));
    res.end();
};

const server = http.createServer(requestListener);
server.listen(process.env.PORT || 3005);
