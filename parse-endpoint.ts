// Native
import { URL } from 'url';

type Endpoint = [string, number?];

export default (str: string): Endpoint => {
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
            return [url.hostname, parseInt(url.port || "8080", 10)];
        default:
            throw new Error(`Unknown endpoint scheme (protocol): ${url.protocol}`);
    }
};
