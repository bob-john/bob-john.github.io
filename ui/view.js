class View {
    constructor(element) {
        this.element = element;
        this.element.style.flex = 1;
    }

    onclick(handler) {
        this.onclick_ = handler;
        return this;
    }

    onupdate(handler) {
        this.onupdate_ = handler;
        return this;
    }

    click(...args) {
        this.onclick_ && this.onclick_(...args);
        this.parent && this.parent.notify('update');
    }

    update() {
        this.onupdate_ && this.onupdate_(this);
    }

    notify(event, ...args) { }
}

module.exports = View;