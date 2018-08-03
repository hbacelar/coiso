// Packages
const fabric = require("fabric/http");

module.exports.all = function get(req, res) {
    return fabric(req, res, async (name) => {
        return `Hello ${name || 'World'}`;
    });
}
