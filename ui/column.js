const ViewGroup = require("./view-group");

class Column extends ViewGroup {
    constructor() {
        super(document.createElement('div'));
        this.element.classList.add('column');
    }
}

module.exports = Column;