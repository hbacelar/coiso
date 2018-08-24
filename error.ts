interface CoisoError extends Error {
  errorCode?: number | string;
  originalError?: Error;
}

const createError = (
  code: number | string,
  message: string,
  original?: Error,
): CoisoError => {
  const err = new Error(message) as CoisoError;

  err.errorCode = code;
  err.originalError = original;

  return err;
};

export {createError, CoisoError};
