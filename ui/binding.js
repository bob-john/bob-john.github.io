class Binding {
    constructor(obj, key, transform) {
        this.obj = obj;
        this.key = key;
        this.transform = transform;
    }

    get() {
        let val = this.obj[this.key]
        return this.transform ? this.transform(val) : val;
    }

    static number(val) {
        return Number.isFinite(val) ? val : '-';
    }
}

module.exports = Binding;