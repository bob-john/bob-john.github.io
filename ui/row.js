const ViewGroup = require('./view-group');

class Row extends ViewGroup {
    constructor(...views) {
        super(document.createElement('div'), ...views);
        this.element.classList.add('row');
        this.group = 'rows';
    }
}

module.exports = Row;