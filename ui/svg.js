const View = require('./view');

class SVG extends View {
    constructor() {
        super(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    }

    line(x1, y1, x2, y2, style) {
        return this.tag('line', { x1, y1, x2, y2 }, style);
    }

    rect(x, y, width, height, style) {
        return this.tag('rect', { x, y, width, height }, style);
    }

    circle(cx, cy, r, style) {
        return this.tag('circle', { cx, cy, r }, style);
    }

    tag(name, attr, style) {
        let tag = document.createElementNS('http://www.w3.org/2000/svg', name);
        for (const [key, value] of Object.entries(attr)) {
            tag.setAttribute(key, value);
        }
        tag.style = style;
        this.element.append(tag);
        return tag;
    }
}

module.exports = SVG;