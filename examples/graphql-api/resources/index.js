// Packages
const {
    graphql,
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString
} = require('graphql');

// Utilities
const { getGraphQLParams, canDisplayGraphiQL, sendResponse } = require('./_utils');
const renderGraphiQL = require('./_renderGraphiQL');

// Constants
const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'RootQueryType',
        fields: {
            hello: {
                type: GraphQLString,
                resolve() {
                    return 'world';
                }
            }
        }
    })
});

module.exports.all = async function get(req, res) {
    try {
        const params = await getGraphQLParams(req);

        if (canDisplayGraphiQL(req, params)) {
            console.log("graphiql");
            const payload = renderGraphiQL({
                query: params.query,
                variables: params.variables,
                operationName: params.operationName,
                result: null
            });
            return sendResponse(res, 'text/html', payload);
        }
        console.log("query");

        // Run the query
        const response = await graphql(schema, params.query, undefined, undefined, params.variables, params.operationName);
        sendResponse(res, 'application/json', JSON.stringify(response));
    } catch (err) {
        res.statusCode = 500;
        res.end(err.message);
        console.error(err.stack);
    };
}