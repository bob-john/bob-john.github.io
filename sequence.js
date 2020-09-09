const fs = require('fs');

class Sequence {
    constructor(filename) {
        this.events = [];
        this.filename = filename;
    }

    load() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.filename, 'utf-8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    this.events = JSON.parse(data);
                    resolve();
                }
            });
        });
    }

    save() {
        let data = JSON.stringify(this.events);
        fs.writeFile(this.filename, data, (err) => {
            if (err) {
                console.error(err);
            }
        });
    }

    push(seq, track, time, note, velocity, len) {
        let event = { seq, track, time, note, velocity, len };
        this.events.push(event);
        this.save();
        return event;
    }

    delete(seq, track, time) {
        this.events = this.events.filter((e) => e.seq !== seq || e.track !== track || e.time !== time);
        this.save();
    }

    toggle(seq, track, time, note, velocity, len) {
        if (note < 0 || note > 127) {
            return;
        }
        let i = this.events.findIndex((e) => e.seq === seq && e.track === track && e.time === time && e.note === note);
        if (i > -1) {
            this.events.splice(i, 1);
        } else {
            this.events.push({ seq, track, time, note, velocity, len });
        }
        this.save();
    }

    endOfTrack(seq) {
        return Math.ceil(Math.max(0, ...this.events.filter((e) => e.seq === seq).map((e) => e.time + e.len)) / 16) * 16;
    }
}

module.exports = Sequence;