const axios = require('axios');
const sleep = require('./utils').sleep;

async function track_turtle(picoturtle_server_url, local_turtle, name, options) {
    if (!options) options = {};
    if (!options.limit) options.limit = 10;
    if (!options.cmd_cb) options.cmd_cb = null;

    // console.log('running turtle -> ' + name);
    let req = await axios.get(picoturtle_server_url + '/turtle/' + name + '/start_state');
    let t = await req.data;
    local_turtle.init(t);

    fetch_commands_bulk(picoturtle_server_url, local_turtle, 0, options.limit, options.cmd_cb);
}

async function fetch_commands(picoturtle_server_url, local_turtle, cmd_id) {
    let req = await axios.get(picoturtle_server_url + '/turtle/' + local_turtle.name + '/command?id=' + cmd_id);
    let cmd = await req.data;

    if ('cmd' in cmd) {
        let args = [cmd.cmd];
        if (cmd.args != null) {
            Array.prototype.push.apply(args, cmd.args);
        }
        // console.log(args);
        local_turtle.reset();
        local_turtle.batchStart();
        local_turtle.exec.apply(local_turtle, args);
        local_turtle.batchEnd();
    }

    if ('cmd' in cmd) {
        cmd_id += 1;
    }
    if (cmd.hasmore) {
        // console.log('there are more commands pending, after ' + cmd_id - 1);
        fetch_commands(picoturtle_server_url, local_turtle, cmd_id);
    } else {
        if (cmd.turtle.last == -1 || cmd.turtle.last > cmd_id) {
            await sleep(1000);
            fetch_commands(picoturtle_server_url, local_turtle, cmd_id);
        } else {
            //console.log(local_turtle);
        }
    }
}

async function fetch_commands_bulk(picoturtle_server_url, local_turtle, cmd_id, limit, cmd_cb) {
    let req = await axios.get(picoturtle_server_url + '/turtle/' + local_turtle.name + '/commands?start=' + cmd_id + '&limit=' + limit);
    let cmdres = await req.data;
    let turtle_stopped = false;

    local_turtle.reset();
    local_turtle.batchStart();
    for (var i = 0; i < cmdres.commands.length; i++) {
        let cmd = cmdres.commands[i];
        if ('cmd' in cmd) {
            if (cmd.cmd == 'stop') {
                turtle_stopped = true;
            }
            let args = [cmd.cmd];
            if (cmd.args != null) {
                Array.prototype.push.apply(args, cmd.args);
            }
            local_turtle.batchExec.apply(local_turtle, args);
            if (cmd_cb != null) {
                cmd_cb(args);
            }
        }
        if ('cmd' in cmd) {
            cmd_id += 1;
        }
    }
    local_turtle.batchEnd();

    if (!turtle_stopped) {
        if (cmdres.hasmore) {
            // console.log('there are more commands pending, after ' + cmd_id - 1);
            fetch_commands_bulk(picoturtle_server_url, local_turtle, cmd_id, limit, cmd_cb);
        } else {
            await sleep(1000);
            fetch_commands_bulk(picoturtle_server_url, local_turtle, cmd_id, limit, cmd_cb);
        }
    }
}


module.exports.track_turtle_node = track_turtle;
