/**
 * Patterns in routes
 *  static (/users)
 *  named parameters (/users/[id].js)
 *  nested parameters (/users/[id]/books/[title].js)
 *  any match / wildcards (/users/*.js)
 *
 *  Because of technical limitations, the following characters cannot be used: /, \, ?, :, ( and ).
 */
module.exports.fsPathToURL = function fsPathToURL(path) {
    return path
        .replace(/\[(\w+)\]/g, ":$1")
        .replace('index.js', '') || '/';
}

module.exports.methodToHTTP = function methodToHTTP(method) {
    return method === 'ALL' ? '*' : method;
}