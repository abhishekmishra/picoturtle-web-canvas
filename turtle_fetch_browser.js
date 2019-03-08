const { track_turtle_common } = require('./turtle_fetch_common');

async function getCommand(picoturtle_server_url, turtle_name, cmd_id) {
    let req = await fetch('/turtle/' + turtle_name + '/command?id=' + cmd_id);
    let cmd = await req.json();
    return cmd;
}

async function getCommandsBulk(picoturtle_server_url, turtle_name, cmd_id, limit) {
    let req = await fetch('/turtle/' + turtle_name + '/commands?start=' + cmd_id + '&limit=' + limit);
    let cmdres = await req.json();
    return cmdres;
}

async function getTurtleState(picoturtle_server_url, turtle_name) {
    let req = await fetch('/turtle/' + turtle_name + '/start_state');
    let t = await req.json();
    return t;
}

async function track_turtle(local_turtle, name, options) {
    if (!options) options = {};
    options['getCommandsBulkFn'] = getCommandsBulk;
    track_turtle_common(null, local_turtle, name, getTurtleState, options);
}

module.exports.track_turtle_browser = track_turtle;