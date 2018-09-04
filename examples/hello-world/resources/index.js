module.exports = async (req /*http.IncomingMessage*/, res /*http.ServerResponse*/) => {
    res.end(`Hello World! ${req.method}`);
};