const Message = require('./message');

class Player {
    constructor(model) {
        this.model = model;
        this.playing = false;
        this.tick = 0;
        this.tempo = 120;
        this.ppq = 24;
        this.output = null;
        this.inflight = [];
        setInterval(() => this.ontick(), 60000 / (this.tempo * this.ppq));
    }

    start() {
        this.stop();
        this.tick = 0;
        this.playing = true;
        this.onchange && this.onchange();
    }

    stop() {
        for (let event of this.inflight) {
            this.output.send(Message.noteOff(event.track, event.note).data);
        }
        this.inflight = [];
        this.playing = false;
        this.onchange && this.onchange();
    }

    continue() {
        this.stop();
        this.playing = true;
        this.onchange && this.onchange();
    }

    ontick() {
        if (!this.playing || !this.output) {
            return;
        }
        let { sequence, cursor } = this.model;
        let time = this.tick * 4 / this.ppq;
        for (let event of sequence.events.filter((e) => e.seq === cursor.seq && (e.time === time || e.time + e.len === time))) {
            if (event.time === time) {
                this.send(Message.noteOn(event.track, event.note, event.velocity));
                this.inflight.push({ track: event.track, note: event.note });
            } else if (event.time + event.len === time) {
                this.send(Message.noteOff(event.track, event.note));
                let index = this.inflight.findIndex((e) => e.track === event.track && e.note === event.note);
                if (index >= 0) {
                    this.inflight.splice(index, 1);
                }
            }
        }
        if (time === sequence.endOfTrack(cursor.seq)) {
            this.stop();
        } else {
            this.tick++;
        }
        this.onchange && this.onchange();
    }

    send(message, preview = false) {
        let data = Array.from(message.data);
        if (preview && (message.status === 'noteOn' || message.status === 'noteOff')) {
            data[0] = (data[0] & 0xf0) | (this.model.cursor.track & 0x0f);
        }
        this.output && this.output.send(data);
    }

    get time() {
        return this.tick * 4 / this.ppq;
    }

    set time(time) {
        this.tick = time * this.ppq / 4;
    }
}

module.exports = Player;