const { Colour } = require('./colour_utils.js');
const fs = require('fs');
const Lock = require('lock').Lock;

var lock = Lock();

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toString() {
        return '[' + this.x + ', ' + this.y + ']';
    }
}

class Turtle {

    constructor(canvas_id, t = null) {
        console.log('canvas -> ' + canvas_id);
        this.canvas_id = canvas_id;
        this.initCanvas();
        this.history = [];
        this.batchEnabled = false;
        if (t != null) {
            this.init(t);
        }
        this.location = new Point(this.width / 2, this.height / 2);
        this.location_canvas = new Point(this.location.x, this.height - this.location.y);
        this.angle = 90;
        this.canvas_angle = this.angle + 180;
        this.pen_width = 1;
        this.ctx.lineWidth = 1;
        this.font_str = null;
    }

    resetOptions() {
        this.initOptions(null);
    }

    initOptions(options) {
        if (!options) options = {};
        if (!('draw_turtle' in options)) options.draw_turtle = true;
        this.options = options;
    }

    init(t, options) {
        this.initOptions(options);

        this.orig_t = t;
        this.reset();
        this.clearHistory();
    }

    initCanvas() {
        this.canvas = document.getElementById(this.canvas_id);
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ctx = this.canvas.getContext('2d');
    }

    initTurtle() {
        this.name = this.orig_t.name;
        this.location = this.orig_t.location;
        this.location_canvas = new Point(this.location.x, this.height - this.location.y);
        this.angle = this.orig_t.angle;
        this.canvas_angle = this.angle + 180;
        this.pen = this.orig_t.pen;
        this.penwidth(this.orig_t.pen_width);
        this.pencolour(new Colour(
            this.orig_t.colour.r,
            this.orig_t.colour.g,
            this.orig_t.colour.b,
            this.orig_t.colour.a));
        this.font_str = this.orig_t.font_str;
        this.drawTurtle();
    }

    command(cmd) {
        lock(this.name, (release) => {
            console.log('Locked - ' + this.name);
            this.history.push(cmd);
            this._command(cmd.name, cmd.args);
            release(() => {
                console.log('Released - ' + this.name);
            })();
        });
    }

    _command(name, args) {
        this[name].apply(this, args);
    }

    penup() {
        this.pen = false;
    }

    pendown() {
        this.pen = true;
    }

    penwidth(w) {
        this.pen_width = w;
        this.ctx.lineWidth = w;
    }

    forward(d) {
        let theta = this.angle * Math.PI / 180;
        let canvas_theta = this.canvas_angle * Math.PI / 180;
        // y2 = d sin (theta) + y1
        // x2 = d cos (theta) + x1 
        let y2 = d * (Math.sin(theta)) + this.location.y;
        let x2 = d * (Math.cos(theta)) + this.location.x;
        let cy2 = d * (Math.sin(canvas_theta)) + this.location_canvas.y;
        let cx2 = d * (Math.cos(canvas_theta)) + this.location_canvas.x;

        // console.log('current point is ' + this.location.x + ', ' + this.location.y + ', new point is ' + x2 + ', ' + y2);
        this.ctx.beginPath();

        this.ctx.moveTo(this.location_canvas.x, this.location_canvas.y);
        if (this.pen) {
            this.ctx.lineTo(cx2, cy2);
        } else {
            this.ctx.moveTo(cx2, cy2);
        }

        this.location = new Point(x2, y2);
        this.location_canvas = new Point(cx2, cy2);
        this.ctx.stroke();
    }

    back(d) {
        this.forward(-d);
    }

    goto(x, y) {
        let new_location = new Point(x, y);
        let new_location_canvas = new Point(x, this.height - y);

        // console.log('current point is ' + this.location.x + ', ' + this.location.y + ', new point is ' + x2 + ', ' + y2);
        this.ctx.beginPath();

        this.ctx.moveTo(this.location_canvas.x, this.location_canvas.y);
        if (this.pen) {
            this.ctx.lineTo(new_location_canvas.x, new_location_canvas.y);
        } else {
            this.ctx.moveTo(new_location_canvas.x, new_location_canvas.y);
        }

        this.location = new_location;
        this.location_canvas = new_location_canvas;
        this.ctx.stroke();
    }

    setx(x) {
        this.goto(x, this.location.y);
    }

    sety(y) {
        this.goto(this.location.x, y);
    }

    home() {
        this.goto(this.orig_t.location.x, this.orig_t.location.y);
        this.heading(this.orig_t.angle);
    }

    right(angle) {
        this.angle = this.angle - angle;
        this.canvas_angle = this.canvas_angle + angle;
    }

    left(angle) {
        this.angle = this.angle + angle;
        this.canvas_angle = this.canvas_angle - angle;
    }

    heading(angle) {
        this.angle = angle;
        this.canvas_angle = this.angle + 180;
    }

    stop() {

    }

    //style methods

    pencolour(colour) {
        this.colour = new Colour(colour.r, colour.g, colour.b, colour.a);
        this.ctx.strokeStyle = this.colour.hex;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    reset() {
        this.clear();
        this.initTurtle();
    }

    font(f) {
        this.font_str = f;
    }

    filltext(text) {
        let canvas_theta = this.canvas_angle * Math.PI / 180;
        this.ctx.save();
        this.ctx.font = this.font_str;
        this.ctx.strokeStyle = this.colour.hex;
        this.ctx.fillStyle = this.colour.hex;
        this.ctx.lineWidth = this.pen_width;
        this.ctx.translate(this.location_canvas.x, this.location_canvas.y);
        this.ctx.rotate(canvas_theta);
        // console.log('angle -> ' + canvas_theta + ' x = ' + this.location_canvas.x + ' y = ' + this.location_canvas.y);
        this.ctx.fillText(text, 0, 0);
        this.ctx.restore();
    }

    stroketext(text) {
        let canvas_theta = this.canvas_angle * Math.PI / 180;
        this.ctx.save();
        this.ctx.font = this.font_str;
        this.ctx.strokeStyle = this.colour.hex;
        this.ctx.fillStyle = this.colour.hex;
        this.ctx.lineWidth = this.pen_width;
        this.ctx.translate(this.location_canvas.x, this.location_canvas.y);
        this.ctx.rotate(canvas_theta);
        // console.log('angle -> ' + canvas_theta + ' x = ' + this.location_canvas.x + ' y = ' + this.location_canvas.y);
        this.ctx.strokeText(text, 0, 0);
        this.ctx.restore();
    }
    // home() {
    //     this.location = new Point(this.width / 2, this.height / 2);
    //     this.angle = 0;
    // }

    addToHistory(cmd) {
        this.history.push(cmd);
    }

    clearHistory() {
        this.history = [];
    }

    drawTurtle() {
        if (this.options.draw_turtle) {
            this.ctx.save();
            let hexColour = this.ctx.strokeStyle;
            this.ctx.strokeStyle = 'black';
            this.ctx.fillStyle = 'red';
            this.ctx.lineWidth = 3;
            // this.ctx.fillRect(this.location.x - 5, this.location.y - 5, 10, 10);

            let d = 25;
            let theta1 = (this.canvas_angle - 145) * Math.PI / 180;
            let y2 = d * (Math.sin(theta1)) + this.location_canvas.y;
            let x2 = d * (Math.cos(theta1)) + this.location_canvas.x;

            let theta2 = (this.canvas_angle + 145) * Math.PI / 180;
            let y3 = d * (Math.sin(theta2)) + this.location_canvas.y;
            let x3 = d * (Math.cos(theta2)) + this.location_canvas.x;

            this.ctx.beginPath();
            this.ctx.moveTo(this.location_canvas.x, this.location_canvas.y);
            this.ctx.lineTo(x2, y2);
            this.ctx.lineTo(x3, y3);
            this.ctx.lineTo(this.location_canvas.x, this.location_canvas.y);
            this.ctx.stroke();

            // let canvas_theta = this.canvas_angle * Math.PI / 180;
            // this.ctx.font = '30pt Sans Serif';
            // this.ctx.fillStyle = 'black';
            // this.ctx.lineWidth = 1;
            // this.ctx.translate(this.location_canvas.x, this.location_canvas.y);
            // this.ctx.rotate(canvas_theta);
            // this.ctx.strokeText('🐢', 0, 0);

            this.ctx.restore();
        }
    }

    exec() {
        if (arguments.length > 0) {
            if (!this.batchEnabled) {
                this.clear();

                for (let i = 0; i < this.history.length; i++) {
                    var cmdArgs = this.history[i];
                    if (cmdArgs.length == 1) {
                        this[cmdArgs[0]]();
                    } else if (cmdArgs.length == 2) {
                        this[cmdArgs[0]](cmdArgs[1]);
                    }
                }
            }

            let command = arguments[0];
            this.addToHistory(arguments);
            // console.log('command = ' + command);
            if (arguments.length == 1) {
                this[command]();
            } else if (arguments.length == 2) {
                this[command](arguments[1]);
            }
            if (!this.batchEnabled) {
                this.drawTurtle();
            }
        }
    }

    batchStart() {
        this.batchEnabled = true;
        this.clear();

        for (let i = 0; i < this.history.length; i++) {
            var cmdArgs = this.history[i];
            if (cmdArgs.length == 1) {
                this[cmdArgs[0]]();
            } else if (cmdArgs.length == 2) {
                this[cmdArgs[0]](cmdArgs[1]);
            }
        }
    }

    batchExec() {
        if (arguments.length > 0) {
            let command = arguments[0];
            this.addToHistory(arguments);
            if (arguments.length == 1) {
                this[command]();
            } else if (arguments.length == 2) {
                this[command](arguments[1]);
            }
        }
    }

    /**
     * Add the command to history but don't draw anything
     */
    batchAdd() {
        if (arguments.length > 0) {
            this.addToHistory(arguments);
        }
    }

    batchEnd() {
        this.drawTurtle();
        this.batchEnabled = false;
    }

    export(filePath) {
        // Get the DataUrl from the Canvas
        const url = this.canvas.toDataURL('image/png');
        console.log(url);
        // remove Base64 stuff from the Image
        const base64Data = url.replace(/^data:image\/png;base64,/, "");
        fs.writeFile(filePath, base64Data, 'base64', function (err) {
            console.log(err);
        });
    }
}

module.exports.Point = Point;
module.exports.Turtle = Turtle;