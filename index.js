const { Turtle, Point } = require('./turtle_canvas');
const { componentToHex, rgbToHex, hexToRgb, hexToColour, Colour } = require('./colour_utils');
const { track_turtle_node } = require('./turtle_fetch_node');
const { track_turtle_browser } = require('./turtle_fetch_browser');

module.exports.Turtle = Turtle;
module.exports.Point = Point;
module.exports.componentToHex = componentToHex;
module.exports.rgbToHex = rgbToHex;
module.exports.hexToRgb = hexToRgb;
module.exports.hexToColour = hexToColour;
module.exports.Colour = Colour;
module.exports.track_turtle_node = track_turtle_node;
module.exports.track_turtle_browser = track_turtle_browser;

console.log(track_turtle_node);
console.log(track_turtle_browser);
