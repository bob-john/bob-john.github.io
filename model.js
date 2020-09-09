const Cursor = require('./cursor');
const Player = require('./player');
const Sequence = require('./sequence');

class Model {
    constructor() {
        this.sequence = new Sequence('midigator-seq-000.json');
        this.cursor = new Cursor();
        this.player = new Player(this);
        this.poly = false;
        this.noteOn = [];
    }

    async load() {
        this.midi = await navigator.requestMIDIAccess({ sysex: false });
        this.sequence.load();
    }

    bwd() {
        if (this.cursor.bar > 0) {
            this.cursor.bar--;
        }
    }

    fwd() {
        this.cursor.bar++;
    }

    top() {
        this.cursor.bar = 0;
    }

    play() {
        this.player.time = this.cursor.bar * 16;
        this.player.continue();
    }

    stop() {
        this.player.stop();
    }

    rec() {

    }

    nextVelocity() {
        let { velocity } = this;
        if (velocity === 127) {
            velocity = 16;
        } else {
            velocity = Math.min(Math.max(16, velocity + 16), 127);
        }
        this.velocity = velocity;
    }

    set len(val) {
        let { seq, track, time } = this.cursor;
        this.sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time).forEach((e) => e.len = val);
        this.cursor.len = val;
    }

    get len() {
        let { seq, track, time } = this.cursor;
        let len = this.sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time).map((e) => e.len)[0];
        return len || this.cursor.len;
    }

    set velocity(val) {
        let { seq, track, time } = this.cursor;
        this.sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time).forEach((e) => e.velocity = val);
        this.cursor.velocity = val;
    }

    get velocity() {
        let { seq, track, time } = this.cursor;
        let velocity = this.sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time).map((e) => e.velocity)[0];
        return velocity || this.cursor.velocity;
    }
}

module.exports = Model;