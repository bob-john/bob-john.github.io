const Format = require("./format");

class Formatter {
    static song(song) {
        return new String(1 + song).padStart(3, '0');
    }

    static bpm(bpm) {
        return new String(bpm).padStart(3, '0');
    }

    static seq(seq) {
        let banks = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        return banks[Math.floor(seq / 16) % banks.length] + new String(1 + seq % 16).padStart(2, '0');
    }

    static bar(bar) {
        return new String(1 + bar).padStart(3, '0');
    }
}

module.exports = Formatter;