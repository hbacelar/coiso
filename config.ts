// Native
const {createReadStream} = require('fs');

// Packages
const toml = require('@iarna/toml/parse-stream');

// Utilities
const {log, logError} = require('./log');

// Constants
const FILENAME = 'fabric.toml';

// TODO: validate config
export default async () => {
  try {
    log(`Loading configuration from "${FILENAME}"`);
    return await toml(createReadStream(FILENAME));
  } catch (err) {
    // File can't be read; move on
    logError(err.message);
    return {};
  }
};
