const View = require('./view');

class ViewGroup extends View {
    constructor(element, ...views) {
        super(element);
        this.children = [];
        this.append(...views);
    }

    append(...views) {
        for (let view of views) {
            let { element, group } = view;
            view.parent = this;
            this.element.append(element);
            this.children.push(view);
            if (group) {
                this[group] = this[group] || [];
                this[group].push(view);
            }
        }
    }

    update() {
        super.update();
        this.children.forEach((view) => view.update && view.update());
    }

    notify(event, ...args) {
        switch (event) {
            case 'update':
                this.parent && this.parent.notify(event, ...args);
                break;
        }
    }
}

module.exports = ViewGroup;