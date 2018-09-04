// Native
import {createReadStream} from 'fs';

// Packages
const toml = require('@iarna/toml/parse-stream');
const prettyError = require('@iarna/toml/parse-pretty-error');
const {TomlError} = require('@iarna/toml/lib/toml-parser');

// Utilities
import {log, logError} from './log';

// TODO: validate config
export default async (path: string): Promise<object> => {
  try {
    log(`Loading configuration from "${path}"`);
    return await toml(createReadStream(path));
  } catch (err) {
    if (err instanceof TomlError) {
      prettyError(err);
      throw err;
    }
    // File can't be read; move on
    logError(err);
    return {};
  }
};
