const { Colour } = require('./colour_utils.js');
const axios = require('axios');
const sleep = require('./utils').sleep;

const port = require('./utils').getTurtlePort();
const TURTLE_SERVER_URL = 'http://localhost:' + port;

async function list_turtles() {
    let req = await axios.get(TURTLE_SERVER_URL + '/turtle/list');
    let ls = await req.data;
    let turtle_list = document.getElementById('turtle_list');
    turtle_list.innerHTML = '';
    ls.forEach(element => {
        turtle_list.innerHTML += '<li id="' + element + '">' + element + '</li>';
    });
    ls.forEach(element => {
        let el = document.getElementById(element);
        el.className += " name-li";
        el.onclick = function () {
            track_turtle(element);
        };
    });
}

function mark_selected(name) {
    let els = document.getElementsByClassName("name-li selected");
    for (var i = 0; i < els.length; i++) {
        var e = els[i];
        e.className = "name-li";
    }

    let sel = document.getElementById(name);
    if (sel != null) {
        sel.className += " selected";
    }
    let turtle_name = document.getElementById('turtle_name');
    turtle_name.innerHTML = name;
}

function add_object_code_line(cmd_args) {
    let oc = document.getElementById('object_code');
    oc.innerText += '\n';
    for (var i = 0; i < cmd_args.length; i++) {
        if (typeof cmd_args[i] == 'object') {
            if ('hex' in cmd_args[i]) {
                oc.innerText += ' ' + cmd_args[i].hex;
            } else {
                oc.innerText += ' ' + JSON.stringify(cmd_args[i]);
            }
        } else {
            oc.innerText += ' ' + cmd_args[i];
        }
    }
}

var x = 0;
async function track_turtle(local_turtle, name) {
    console.log('running turtle -> ' + name);
    //    await list_turtles();
    //    mark_selected(name);

    let oc = document.getElementById('object_code');
    oc.innerText = '';

    let req = await axios.get(TURTLE_SERVER_URL + '/turtle/' + name + '/start_state');
    let t = await req.data;
    //var local_turtle = new Turtle("turtle_canvas", t);
    local_turtle.init(t);

    // let y = x++;
    // console.log('started ' + y);
    fetch_commands(local_turtle, 0);
    // console.log('done ' + y);
}


async function fetch_commands(local_turtle, cmd_id) {
    let req = await axios.get(TURTLE_SERVER_URL + '/turtle/' + local_turtle.name + '/command?id=' + cmd_id);
    let cmd = await req.data;
    // console.log(cmd);
    // await lock(local_turtle.name, (release) => {
    //     console.log('Locked - ' + local_turtle.name);

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
        add_object_code_line(args);
    }

    //     release(() => {
    //         console.log('Released - ' + local_turtle.name);
    //     })();
    // });
    if ('cmd' in cmd) {
        cmd_id += 1;
    }
    if (cmd.hasmore) {
        // console.log('there are more commands pending, after ' + cmd_id - 1);
        // let y = x++;
        // console.log('A: started ' + y);
        fetch_commands(local_turtle, cmd_id);
        // console.log('next complete' + y);
    } else {
        if (cmd.turtle.last == -1 || cmd.turtle.last > cmd_id) {
            await sleep(1000);
            // let y = x++;
            // console.log('B: started ' + y);
            fetch_commands(local_turtle, cmd_id);
            // console.log('new complete' + y);
        } else {
            //console.log(local_turtle);
        }
    }
}