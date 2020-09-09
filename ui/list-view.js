const Column = require('./column');
const Button = require('./button');

class ListView extends Column {
    set items(items) {
        for (let child of this.element.children) {
            child.remove();
        }
        for (let item of items) {
            this.append(new Button(item.label, 'value').onclick(() => this.click(item)));
        }
    }
}

module.exports = ListView;