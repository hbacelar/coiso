// Native
const { basename, join } = require("path");

// Packages
const globby = require('globby');
const { createError } = require('../src/error');

// TODO: load routes using async iterator
/**
 * 
 * @param {String} file Path to resources folder. If not absolute, it's relative to `process.cwd()`
 */
module.exports = async function discover(file) {
    const paths = [... await globby(['**/*.js', '!**/_*'], {
        cwd: file
    })].map(path => {
        return { fullyQualifiedPath: join(process.cwd(), file, path), resource: path, options: {} };
    });

    if (paths.length === 0) {
        throw createError('no-resources-found', `No resources found in path "${basename(file)}"`);
    }

    return paths;
};