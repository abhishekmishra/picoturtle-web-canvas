const TurtleProxy = require('./turtle_proxy').TurtleProxy;
const { track_turtle_browser } = require('./turtle_fetch_browser');

async function show_turtle(turtle_name) {
    let oc = document.getElementById('object_code');
    oc.innerText = '';

    await track_turtle_browser(turtle_name, add_object_code_line);
}

async function list_turtles() {
    let req = await fetch('/turtle/list');
    let ls = await req.json();
    let turtle_list = document.getElementById('turtle_list');
    turtle_list.innerHTML = '';
    ls.forEach(element => {
        turtle_list.innerHTML += '<li id="' + element + '">' + element + '</li>';
    });
    ls.forEach(element => {
        let el = document.getElementById(element);
        el.className += " name-li";
        el.onclick = function () {
            mark_selected(element);
            show_turtle(element);
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

list_turtles();

async function square(t, side) {
    for (var i = 0; i < 4; i++) {
        await t.forward(side);
        await t.right(90);
    }
}

async function poly(t, side, angle, incs, inca) {
    for (var i = 0; i < 10; i++) {
        await t.forward(side);
        await t.right(angle);
        side += incs;
        angle += inca;
    }
}

async function my_turtle() {
    var t = new TurtleProxy();
    let state = await t.init();
    await t.pencolour(255, 0, 0);
    await t.pendown();
    // for(var i = 0; i < 2; i++) {
    //     await t.penup();
    //     await t.forward(60);
    //     await t.pendown();
    //     await square(t, 50);
    // }
    await poly(t, 5, 120, 3, 0);
    await t.stop();
    return t.name;
}

async function run_turtle() {
    let turtle_name = await my_turtle();
    await list_turtles();
    mark_selected(turtle_name);
    show_turtle(turtle_name);
};

/**
 * Check if details and list columns are to be shown.
 * 
 * If there is a name in the url, track the turtle with that name
 */
var url = new URL(window.location.href);
var name = url.searchParams.get("name");
var show_details = url.searchParams.get('details');
var show_list = url.searchParams.get('list');

if (show_details != null && show_details == 0) {
    let details_container = document.getElementById('turtle_details_container');
    details_container.hidden = true;
}

if (show_list != null && show_list == 0) {
    let list_container = document.getElementById('turtle_list_container');
    list_container.hidden = true;
}

if (name != null) {
    show_turtle(name);
} else {
    run_turtle();
}
