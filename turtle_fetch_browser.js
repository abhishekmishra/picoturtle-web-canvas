const { sleep } = require('./utils');

async function track_turtle(local_turtle, name, cmd_cb, options) {
    if(!options) options = {};
    if(!options.limit) options.limit = 10;

    let req = await fetch('/turtle/' + name + '/start_state');
    let t = await req.json();
    await fetch_commands_bulk(local_turtle, 0, options.limit, cmd_cb);
}

async function fetch_commands(local_turtle, cmd_id, cmd_cb = null) {
    let req = await fetch('/turtle/' + local_turtle.name + '/command?id=' + cmd_id);
    let cmd = await req.json();
    //console.log(cmd);
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
        cmd_cb(args);
    }
    if ('cmd' in cmd) {
        cmd_id += 1;
    }
    if (cmd.hasmore) {
        //console.log('there are more commands pending, after ' + (cmd_id - 1));
        fetch_commands(local_turtle, cmd_id, cmd_cb);
    } else {
        if (cmd.turtle.last == -1 || cmd.turtle.last > cmd_id) {
            await sleep(5000);
            fetch_commands(local_turtle, cmd_id, cmd_cb);
        } else {
            //console.log(local_turtle);
        }
    }
}

async function fetch_commands_bulk(local_turtle, cmd_id, limit, cmd_cb) {
    let req = await fetch('/turtle/' + local_turtle.name + '/commands?start=' + cmd_id + '&limit=' + limit);
    let cmdres = await req.json();
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
            //console.log('there are more commands pending, after ' + (cmd_id - 1));
            fetch_commands_bulk(local_turtle, cmd_id, limit, cmd_cb);
        } else {
            await sleep(5000);
            fetch_commands_bulk(local_turtle, cmd_id, limit, cmd_cb);
        }
    }
}


module.exports.track_turtle_browser = track_turtle;