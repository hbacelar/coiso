module.exports.createError = (code, message, original) => {
    const err = new Error(message);

    err.errorCode = code;
    err.originalError = original;

    return err;
};