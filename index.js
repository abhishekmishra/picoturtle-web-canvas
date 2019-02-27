const { Turtle, Point } = require('./canvas/turtle_canvas.js');
const { componentToHex, rgbToHex, hexToRgb, hexToColour, Colour } = require('./canvas/colour_utils.js');

module.exports.Turtle = Turtle;
module.exports.Point = Point;
module.exports.componentToHex = componentToHex;
module.exports.rgbToHex = rgbToHex;
module.exports.hexToRgb = hexToRgb;
module.exports.hexToColour = hexToColour;
module.exports.Colour = Colour;
