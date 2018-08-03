// Native
const url = require('url');

// Packages
const accepts = require('accepts');
const { parseBody } = require('./_parse-body');

/**
 * Helper function to get the GraphQL params from the request.
 */
function parseGraphQLParams(
    urlData,
    bodyData,
) {
    // GraphQL Query string.
    let query = urlData.query || bodyData.query;
    if (typeof query !== 'string') {
        query = null;
    }

    // Parse the variables if needed.
    let variables = urlData.variables || bodyData.variables;
    if (variables && typeof variables === 'string') {
        try {
            variables = JSON.parse(variables);
        } catch (error) {
            throw httpError(400, 'Variables are invalid JSON.');
        }
    } else if (typeof variables !== 'object') {
        variables = null;
    }

    // Name of GraphQL operation to execute.
    let operationName = urlData.operationName || bodyData.operationName;
    if (typeof operationName !== 'string') {
        operationName = null;
    }

    const raw = urlData.raw !== undefined || bodyData.raw !== undefined;

    return { query, variables, operationName, raw };
}

module.exports.getGraphQLParams = function getGraphQLParams(request) {
    return parseBody(request).then(bodyData => {
        const urlData = (request.url && url.parse(request.url, true).query) || {};
        return parseGraphQLParams(urlData, bodyData);
    });
}

/**
* Helper function to determine if GraphiQL can be displayed.
*/
module.exports.canDisplayGraphiQL = function (request, params) {
    // If `raw` exists, GraphiQL mode is not enabled.
    // Allowed to show GraphiQL if not requested as raw and this request
    // prefers HTML over JSON.
    return !params.raw && accepts(request).types(['json', 'html']) === 'html';
}

/**
 * Helper function for sending a response using only the core Node server APIs.
 */
module.exports.sendResponse = function sendResponse(response, type, data) {
    const chunk = Buffer.from(data, 'utf8');
    response.setHeader('Content-Type', type + '; charset=utf-8');
    response.setHeader('Content-Length', String(chunk.length));
    response.end(chunk);
}