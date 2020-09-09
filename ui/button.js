const View = require('./view');

class Button extends View {
    constructor(label = '', className = null) {
        super(document.createElement('div'));
        this.element.className = 'button';
        if (className) {
            this.element.classList.add(className);
        }
        this.element.onmousedown = () => {
            this.element.classList.toggle('active', true);
            this.click();
        };
        this.element.onmouseup = () => {
            this.element.classList.toggle('active', this.selected);
        };
        this.element.onmouseout = () => {
            this.element.classList.toggle('active', this.selected);
        };
        this.group = 'buttons';
        this.label = label;
        this.selected = false;
        this.update();
    }

    update() {
        this.element.innerHTML = (this.label && this.label.get) ? this.label.get() : this.label;
    }

    select(on) {
        this.element.classList.toggle('active', on);
        this.selected = on;
    }
}

module.exports = Button;