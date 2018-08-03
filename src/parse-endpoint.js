// Native
const { URL } = require('url');

module.exports = (str) => {
    const url = new URL(str);

    switch (url.protocol) {
        case 'pipe:':
            // some special handling
            const cutStr = str.replace(/^pipe:/, '');
            if (cutStr.slice(0, 4) !== '\\\\.\\') {
                throw new Error(`Invalid Windows named pipe endpoint: ${str}`);
            }
            return [cutStr];
        case 'unix:':
            if (!url.pathname) {
                throw new Error(`Invalid UNIX domain socket endpoint: ${str}`);
            }
            return [url.pathname];
        case 'tcp:':
            url.port = url.port || 8080;
            return [parseInt(url.port, 10), url.hostname];
        default:
            throw new Error(`Unknown endpoint scheme (protocol): ${url.protocol}`);
    }
};