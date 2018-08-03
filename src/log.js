const { name } = require("../package");
const { pid } = process;

module.exports.logError = (obj) => {
	if (obj instanceof Error && obj.errorCode) {
		console.error(`${name} [${pid}]: ${obj.message}`);
		console.error(`${name} [${pid}]: https://gitlab.app.betfair/node-aggregator/fabric-next/tree/master/errors/${obj.errorCode}.md`);

	} else {
		console.error(`${name} [${pid}]: ${obj}`);
	}
};

module.exports.log = (obj) => {
	if (obj instanceof Error) {
		console.log(`${name} [${pid}]: ${obj.message}`);
	} else {
		console.log(`${name} [${pid}]: ${obj}`);
	}
};