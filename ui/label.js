const View = require('./view');

class Label extends View {
    constructor(text, span = 1) {
        super(document.createElement('div'));
        this.element.innerHTML = text;
        this.element.className = 'label';
        this.element.style.flex = span;
    }
}

module.exports = Label;