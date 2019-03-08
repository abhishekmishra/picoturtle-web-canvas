const axios = require('axios');
const { track_turtle_common } = require('./turtle_fetch_common');

async function getCommand(picoturtle_server_url, turtle_name, cmd_id) {
    let req = await axios.get(picoturtle_server_url + '/turtle/' + turtle_name + '/command?id=' + cmd_id);
    let cmd = await req.data;
    return cmd;
}

async function getCommandsBulk(picoturtle_server_url, turtle_name, cmd_id, limit) {
    let req = await axios.get(picoturtle_server_url + '/turtle/' + turtle_name + '/commands?start=' + cmd_id + '&limit=' + limit);
    let cmdres = await req.data;
    return cmdres;
}

async function getTurtleState(picoturtle_server_url, turtle_name) {
    let req = await axios.get(picoturtle_server_url + '/turtle/' + turtle_name + '/start_state');
    let t = await req.data;
    return t;
}

async function track_turtle(picoturtle_server_url, local_turtle, name, options) {
    if (!options) options = {};
    options['getCommandsBulkFn'] = getCommandsBulk;
    track_turtle_common(picoturtle_server_url, local_turtle, name, getTurtleState, options);
}

module.exports.track_turtle_node = track_turtle;
