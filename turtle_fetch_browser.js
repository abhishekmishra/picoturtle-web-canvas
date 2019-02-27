const { sleep } = require('./utils');
const { Turtle } = require('./turtle_canvas');

async function track_turtle(name, cmd_cb) {
    let req = await fetch('/turtle/' + name + '/start_state');
    let t = await req.json();
    var local_turtle = new Turtle("turtle_canvas", t);
    await fetch_commands(local_turtle, 0, cmd_cb);
}

async function fetch_commands(local_turtle, cmd_id, cmd_cb) {
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

module.exports.track_turtle_browser = track_turtle;