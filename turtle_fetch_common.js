const { sleep } = require('./utils');

async function track_turtle_common(picoturtle_server_url, local_turtle, name, getTurtleStateFn, options) {
    if (!options) options = {};
    if (!options.limit) options.limit = 10;
    if (!('animate' in options)) options.animate = true;
    if (!('draw_on_stop' in options)) options.draw_on_stop = false;
    if (!('draw_turtle' in options)) options.draw_turtle = true;
    if (!('cmd_cb' in options)) options.cmd_cb = null;

    let t = await getTurtleStateFn(picoturtle_server_url, name);

    local_turtle.init(t, options);

    options['picoturtle_server_url'] = picoturtle_server_url;
    options['local_turtle'] = local_turtle;

    await fetch_commands_bulk(0, options);
}

async function fetch_commands(cmd_id, options) {
    let cmd = await options.getCommandFn(options.picoturtle_server_url, options.local_turtle.name, cmd_id);

    if ('cmd' in cmd) {
        let args = [cmd.cmd];
        if (cmd.args != null) {
            Array.prototype.push.apply(args, cmd.args);
        }
        // console.log(args);
        options.local_turtle.reset();
        options.local_turtle.batchStart();
        options.local_turtle.exec.apply(options.local_turtle, args);
        options.local_turtle.batchEnd();
    }

    if ('cmd' in cmd) {
        cmd_id += 1;
    }
    if (cmd.hasmore) {
        // console.log('there are more commands pending, after ' + cmd_id - 1);
        fetch_commands(cmd_id, options);
    } else {
        if (cmd.turtle.last == -1 || cmd.turtle.last > cmd_id) {
            await sleep(1000);
            fetch_commands(cmd_id, options);
        } else {
            //console.log(local_turtle);
        }
    }
}

async function fetch_commands_bulk(cmd_id, options) {
    let cmdres = await options.getCommandsBulkFn(options.picoturtle_server_url, options.local_turtle.name, cmd_id, options.limit);
    let turtle_stopped = false;

    if (!options.draw_on_stop) {
        if (options.animate || cmd_id == 0) {
            options.local_turtle.reset();
            options.local_turtle.batchStart();
        }
    }
    for (var i = 0; i < cmdres.commands.length; i++) {
        let cmd = cmdres.commands[i];
        if ('cmd' in cmd) {
            // if turtle stopped, set the flag
            if (cmd.cmd == 'stop') {
                turtle_stopped = true;
            }

            // get the command with args
            let args = [cmd.cmd];
            if (cmd.args != null) {
                Array.prototype.push.apply(args, cmd.args);
            }

            // draw/add command
            if (!options.draw_on_stop) {
                options.local_turtle.batchExec.apply(options.local_turtle, args);
            } else {
                options.local_turtle.batchAdd.apply(options.local_turtle, args);
            }

            // execute callback if exists
            if (options.cmd_cb != null) {
                options.cmd_cb(args);
            }
        }
        if ('cmd' in cmd) {
            cmd_id += 1;
        }
    }
    if (!options.draw_on_stop) {
        if (options.animate || turtle_stopped) {
            options.local_turtle.batchEnd();
        }
    }

    if (options.draw_on_stop && turtle_stopped) {
        options.local_turtle.reset();
        options.local_turtle.batchStart();
        options.local_turtle.batchExec.apply(options.local_turtle, ['stop']);
        options.local_turtle.batchEnd();
    }

    if (!turtle_stopped) {
        if (cmdres.hasmore) {
            // console.log('there are more commands pending, after ' + cmd_id - 1);
            fetch_commands_bulk(cmd_id, options);
        } else {
            await sleep(1000);
            fetch_commands_bulk(cmd_id, options);
        }
    }
}

module.exports.fetch_commands_bulk = fetch_commands_bulk;
module.exports.fetch_commands = fetch_commands;
module.exports.track_turtle_common = track_turtle_common;