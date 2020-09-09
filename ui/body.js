const ViewGroup = require('./view-group');

class Body extends ViewGroup {
    constructor(...views) {
        super(document.body, ...views);
        this.overlay = document.createElement('div');
        this.overlay.className = 'overlay';
        this.overlay.onclick = (event) => {
            if (event.target === this.overlay) {
                this.dismiss();
            }
        }
    }

    notify(event, ...args) {
        super.notify(event, ...args);
        if (event === 'update') {
            this.update();
        }
    }

    present(popup) {
        popup.update();
        this.popup && this.popup.element.remove();
        this.overlay.append(popup.element);
        this.element.append(this.overlay);
        this.popup = popup;
    }

    dismiss() {
        this.overlay.remove();
        this.popup && this.popup.element.remove();
        delete this.popup;
    }
}

module.exports = Body;