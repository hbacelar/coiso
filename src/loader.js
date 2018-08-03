const http = require("./stereotype/http");

// TODO: process creation (tagged processes)
module.exports = async (schedule, options) => {
    const tasksToBeLoaded = [];

    // Load tasks in-process
    if (schedule['main']) {
        tasksToBeLoaded.push(http(schedule['main'], options.endpoint));
    }

    Object.keys(schedule).filter(processTag => processTag !== 'main').forEach((processTag) => {
        // TODO: tasksToBeLoaded.push(httpFork(schedule[processTag], options.endpoint));
    });

    return Promise.all(tasksToBeLoaded);
};
