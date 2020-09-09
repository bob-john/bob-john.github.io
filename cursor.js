class Cursor {
    constructor() {
        this.seq = 0;
        this.track = 0;
        this.bar = 0;
        this.step = 0;
        this.octave = 4; // http://computermusicresource.com/midikeys.html
        this.len = 1;
        this.velocity = 96;
        this.view = null;
    }

    left() {
        if (this.step > 0) {
            this.step--;
        } else if (this.bar > 0) {
            this.bar--;
            this.step = 15;
        }
    }

    octaveUp() {
        this.octave = Math.min(this.octave + 1, 11);
    }

    octaveDown() {
        this.octave = Math.max(0, this.octave - 1);
    }

    right() {
        if (this.step < 15) {
            this.step++;
        } else {
            this.bar++;
            this.step = 0;
        }
    }

    up() {
        if (this.track > 0) {
            this.track--;
        }
    }

    down() {
        if (this.track < 63) {
            this.track++;
        }
    }

    home() {
        if (this.step > 0) {
            this.step = 0;
        } else if (this.bar > 0) {
            this.bar--;
        }
    }

    end() {
        if (this.step < 15) {
            this.step = 15;
        } else {
            this.bar++;
        }
    }

    inc(sequence) {
        let { time } = this;
        for (let event of sequence.events.filter((e) => e.seq === this.seq && e.track === this.track && e.time === time)) {
            if (event.len < 16) {
                event.len++;
            }
        }
    }

    dec(sequence) {
        let { time } = this;
        for (let event of sequence.events.filter((e) => e.seq === this.seq && e.track === this.track && e.time === time)) {
            if (event.len > 1) {
                event.len--;
            }
        }
    }

    get time() {
        return this.bar * 16 + this.step;
    }
}

module.exports = Cursor;