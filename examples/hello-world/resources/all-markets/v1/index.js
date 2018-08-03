// get, post, put, head, del, options, ..., all
module.exports.get = function get(req, res) {
    res.end("Hello World!");
}

module.exports.post = function get(req, res) {
    res.end("Hello World POST!");
}