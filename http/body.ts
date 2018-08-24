interface RawBodyLib {
  (req: IncomingMessage, opts: object): Promise<Buffer>;
}
interface RawBodyError extends Error {
  type: string;
}

interface ContentTypeLib {
  parse: (type: string) => ContentTypeResult;
}

interface ContentTypeResult {
  parameters: {
    charset: string;
  };
}

// Packages
const getRawBody: RawBodyLib = require('raw-body');
const contentType: ContentTypeLib = require('content-type');
import {IncomingMessage} from 'http';

// Utilities
import {createError} from '../error';

// Maps requests to buffered raw bodies so that
// multiple calls to `json` work as expected
const rawBodyMap = new WeakMap();

const parseJSON = (str: string): object => {
  try {
    return JSON.parse(str);
  } catch (err) {
    throw createError(400, 'Invalid JSON', err);
  }
};

exports.buffer = (
  req: IncomingMessage,
  {limit = '1mb', encoding}: {limit?: string; encoding?: string} = {},
) =>
  Promise.resolve().then(() => {
    const type = req.headers['content-type'] || 'text/plain';
    const length = req.headers['content-length'];

    if (encoding === undefined) {
      encoding = contentType.parse(type).parameters.charset;
    }

    const body = rawBodyMap.get(req);

    if (body) {
      return body;
    }

    return getRawBody(req, {limit, length, encoding})
      .then(buf => {
        rawBodyMap.set(req, buf);
        return buf;
      })
      .catch(err => {
        if (err.type === 'entity.too.large') {
          throw createError(413, `Body exceeded ${limit} limit`, err);
        } else {
          throw createError(400, 'Invalid body', err);
        }
      });
  });

exports.text = async (
  req: IncomingMessage,
  {limit, encoding}: {limit?: string; encoding?: string} = {},
) => (await exports.buffer(req, {limit, encoding})).toString(encoding);

exports.json = async (req: IncomingMessage, opts: object) =>
  parseJSON(await exports.text(req, opts));
