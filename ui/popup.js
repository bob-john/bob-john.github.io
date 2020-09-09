const View = require('./view');

class Popup extends View {
    constructor(view) {
        super(document.createElement('div'));
        this.element.classList.add('popup');
        this.element.append(view.element);
        this.view = view;
    }

    update() {
        this.view.update();
        super.update();
    }
}

module.exports = Popup;