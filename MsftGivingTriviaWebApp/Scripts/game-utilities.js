
function getCombinedBounds(selector) {
    var topOffset = 1000000;
    var bottomOffset = 0;
    var leftOffset = 1000000;
    var rightOffset = 0;
    $(selector).each(function () {
        var offset = $(this).offset();
        var top = offset.top;
        if (top < topOffset) {
            topOffset = top;
        }
        var height = $(this).outerHeight();
        var bottom = top + height;
        if (bottom > bottomOffset) {
            bottomOffset = bottom;
        }

        var left = offset.left;
        if (left < leftOffset) {
            leftOffset = left;
        }
        var width = $(this).outerWidth();
        var right = left + width;
        if (right > rightOffset) {
            rightOffset = right;
        }
    });
    var result = { width: rightOffset - leftOffset, height: bottomOffset - topOffset };
    return result;
}

function hsv_to_rgb(h, s, v)
{
    var h_i = parseInt(h*6);
    var f = h*6 - h_i;
    var p = v * (1 - s);
    var q = v * (1 - f*s);
    var t = v * (1 - (1 - f) * s);
    var r = 0;
    var g = 0;
    var b = 0;
    if (h_i == 0) {
        r = v; g = t; b = p;
    }
    if (h_i==1) {
        r = q; g = v, b = p;
    }
    else if (h_i == 2) {
        r = p; g = v; b = t;
    }
    else if (h_i == 3) {
        r = p; g = q; b = v;
    }
    else if (h_i == 4) {
        r = t; g = p; b = v;
    }
    else if (h_i == 5) {
        r = v; g = p; b = q;
    }
    return { r: parseInt(r * 256), g: parseInt(g * 256), b: parseInt(b * 256) };
}

function two_digit_hex(i)
{
    var h = i.toString(16).toString();
    if (h.length == 1) {
        h = "0" + h;
    }
    return h;
}

function get_random_color() {
    var rgb = hsv_to_rgb(Math.random(), 0.5, 0.95);
    return "#" + two_digit_hex(rgb.r) + two_digit_hex(rgb.g) + two_digit_hex(rgb.b);
}
