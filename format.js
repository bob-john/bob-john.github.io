const Fraction = require('fraction.js');

class Format {
    static noteLen(len) {
        return new Fraction(len, 24).toFraction();
    }

    static timecode(time) {
        let bar = Math.floor(time / 96);
        let beat = Math.floor(time / 24) % 4;
        let tick = Math.round(time % 24);
        return `${new String(bar).padStart(3, '0')}:${beat}:${new String(tick).padStart(2, '0')}`;
    }

    static duration(d) {
        switch (d) {
            case 96:
                return '&#119133;';
            case 48:
                return '&#119134;';
            case 24:
                return '&#119135;';
            case 12:
                return '&#119136;';
            case 6:
                return '&#119137;';
            case 3:
                return '&#119138;';
        }
    }

    static noteName(n) {
        let names = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
        return names[n % 12] + Math.floor(n / 12);
    }

    static rhythm(str) {
        let repr = '';
        for (let c of str) {
            if (c === ' ') {
                repr += '&#9643;';
            } else {
                repr += '&#9642;';
            }
        }
        return repr;
    }
}

module.exports = Format;