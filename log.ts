const {name} = require('./package.json');
const {pid} = process;

interface CoisoError extends Error {
  errorCode?: string;
}

const logError = (obj: string | CoisoError) => {
  if (obj instanceof Error && obj.errorCode) {
    console.error(`${name} [${pid}]: ${obj.message}`);
    console.error(
      `${name} [${pid}]: https://gitlab.app.betfair/node-aggregator/fabric-next/tree/master/errors/${
        obj.errorCode
      }.md`,
    );
  } else {
    console.error(`${name} [${pid}]: ${obj}`);
  }
};

const log = (obj: string | Error) => {
  if (obj instanceof Error) {
    return logError(obj);
  } else {
    console.log(`${name} [${pid}]: ${obj}`);
  }
};

export {log, logError};
