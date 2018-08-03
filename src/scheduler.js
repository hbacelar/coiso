/**
 * {
 *    'main': 'run in the fabric main process',
 *    '<tag>': 'run in a new process',
 *    '<tag2>': '...',
 *    ...
 * }
 * @param {String} resources 
 * @return {Object}
 */
module.exports.sameProcess = (resources) => {
    // same process (dev)
    return { 'main': resources };
}

// TODO: multi process scheduling