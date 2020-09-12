(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{}],2:[function(require,module,exports){
const Binding = require('./ui/binding');
const Body = require('./ui/body');
const Button = require('./ui/button');
const Label = require('./ui/label');
const ListView = require('./ui/list-view');
const Message = require('./message');
const Model = require('./model');
const Popup = require('./ui/popup');
const Row = require('./ui/row');
const SVG = require('./ui/svg');
const TabbedView = require('./ui/tabbed-view');
const Column = require('./ui/column');

window.onload = () => {
    let model = new Model();
    let body = new Body(
        new Row(
            new Label('SONG'),
            new Label('TEMPO'),
            new Label('TRACK'),
            new Label('SEQ'),
            new Label('BAR'),
            new Label('STEPS'),
        ),
        new Row(
            new Button('1', 'value').onmousedown(() => body.element.requestFullscreen()),
            new Button('120', 'value').onmousedown(() => null),
            new Button(new Binding(model.cursor, 'track', (val) => 1 + val), 'value').onmousedown(() => {
                body.tabbedViews[0].selectedIndex = 1;
            }),
            new Button(new Binding(model.cursor, 'seq', (val) => 1 + val), 'value').onmousedown(() => null),
            new Button(new Binding(model.cursor, 'bar', (val) => 1 + val), 'value').onmousedown(() => null),
            new Button('Notes', 'value').onmousedown(() => {
                body.tabbedViews[0].selectedIndex = 0;
            }),
        ),
        new Label('TRACK'),
        new Row().onreload((view) => {
            for (let i = 0; i < 16; i++) {
                view.append(new Button(1 + i, 'value').onmousedown(() => model.cursor.track = i));
            }
        }).onupdate((view) => {
            for (let i = 0; i < 16; i++) {
                view.buttons[i].select(model.cursor.track === i);
            }
        }),
        new TabbedView(
            new Column(
                new Row(
                    new Label('LEN', 5),
                    new Label('VEL', 1),
                    new Label('OCTAVE', 5),
                    new Label('INPUT', 2),
                ),
                new Row(
                    new NoteLenPicker(model, '&#119133;', 16),
                    new NoteLenPicker(model, '&#119134;', 8),
                    new NoteLenPicker(model, '&#119135;', 4),
                    new NoteLenPicker(model, '&#119136;', 2),
                    new NoteLenPicker(model, '&#119137;', 1),

                    new Button(new Binding(model, 'velocity', Binding.number), 'value').onmousedown(() => model.nextVelocity()),
                    new Button('-', 'value').onmousedown(() => model.cursor.octaveDown()),
                    new OctavePicker(model),
                    new Button('+', 'value').onmousedown(() => model.cursor.octaveUp()),
                    new Button('Tie', 'value'),
                    new Button('Rest', 'value'),
                ),
                new PianoKeyboard(model),
                new Row(
                    new Label('STEPS'),
                ),
                new Sequencer(model),
            ),
            new TrackListView(),
        ),
        new Row(
            new Column(
                new Button('<div class="button-label">COPY</div>', 'no-style').onmousedown(() => model.copy()),
                new Button('<div class="button-label">PASTE</div>', 'no-style').onmousedown(() => model.paste()),
            ).flex(1),
            new Button('<div class="button-label">CLEAR</div>', 'no-style').onmousedown(() => model.clear()).flex(1),
            new Column(
                new Row(
                    new Button('|<', 'small').onmousedown(() => model.top()),
                    new Button('<<', 'small').onmousedown(() => model.bwd()),
                    new Button('>>', 'small').onmousedown(() => model.fwd()),
                ),
                new Row(
                    new Button('STOP').onmousedown(() => model.stop()),
                    new Button('PLAY').onmousedown(() => model.play()),
                    new Button('REC').onmousedown(() => model.rec()),
                ),
            ).flex(3),
        )
    );
    model.player.onchange = () => body.update();
    model.load().then(() => body.reload());
    window.body = body;
    window.model = model;
};

class PianoKeyboard extends SVG {
    constructor(model) {
        super();
        this.model = model;
        this.element.setAttribute('viewBox', '0 0 630 60');
        this.keys = {};
        this.marks = {};
        this.group = 'pianoKeyboards';

        // white keys
        for (let i = 0; i < 3 * 7; i++) {
            let n = Math.floor(i / 7) * 12 + (i % 7) * 2;
            if (i % 7 > 2) n--;
            if (i % 7 > 6) n--;
            let key = this.keys[n] = this.rect(i * 30, 0, 29, 60, 'fill: whitesmoke;');
            key.onmousedown = () => {
                key.style.fill = 'gray';
                this.mousedown(n);
            };
            key.onmouseup = () => {
                key.style.fill = 'whitesmoke';
                this.mouseup(n);
            };
            key.onmouseout = () => {
                key.style.fill = 'whitesmoke';
                this.mouseup(n);
            };
            this.marks[n] = this.circle(i * 30 + 15, 50, 4, 'fill: gray; display: none; pointer-events: none;');
        }

        // black keys
        for (let i = 0; i < 3 * 7; i++) {
            if (i % 7 !== 2 && i % 7 !== 6) {
                let n = Math.floor(i / 7) * 12 + (i % 7) * 2 + 1;
                if (i % 7 > 2) n--;
                if (i % 7 > 6) n--;
                let key = this.rect(i * 30 + 20, 0, 20, 35, 'fill: black;');
                key.onmousedown = () => {
                    key.style.fill = 'gray';
                    this.mousedown(n);
                };
                key.onmouseup = () => {
                    key.style.fill = 'black';
                    this.mouseup(n);
                };
                key.onmouseout = () => {
                    key.style.fill = 'black';
                    this.mouseup(n);
                };
                this.marks[n] = this.circle(i * 30 + 30, 25, 4, 'fill: gray; display: none; pointer-events: none;');
            }
        }
    }

    mark(note, marked) {
        this.marks[note].style.display = marked ? 'initial' : 'none';
    }

    mousedown(note) {
        let { sequence, cursor, player } = this.model;
        let { seq, track, time, octave, velocity, len } = cursor;
        note += octave * 12;
        sequence.toggle(seq, track, time, note, velocity, len);
        player.send(Message.noteOn(0, note, velocity), true);
        super.mousedown(note);
    }

    mouseup(note) {
        let { cursor, player } = this.model;
        let { octave } = cursor;
        note += octave * 12;
        player.send(Message.noteOff(0, note), true);
        super.mouseup(note);
    }

    update() {
        let { sequence, cursor } = this.model;
        let { seq, track, time, octave } = cursor;
        let events = sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time);
        for (let i = 0; i < 3 * 12; i++) {
            let note = octave * 12 + i;
            this.mark(i, events.find((e) => e.note === note));
        }
        super.update();
    }
}

class OctavePicker extends SVG {
    constructor(model) {
        super();
        this.element.style.flex = 3;
        this.element.setAttribute('viewBox', '0 0 150 30');
        this.marks = {};
        this.group = 'octavePickers';
        this.model = model;

        for (let i = 0; i < 5; i++) {
            let frame = this.rect(i * 30, 0, 30, 30, 'fill: transparent;')
            frame.onmousedown = () => {
                this.mousedown(i);
            };
            this.marks[i] = this.circle(30 * i + 15, 15, 4, 'fill: white; stroke: gray; stroke-width: 1; pointer-events: none;');
        }
    }

    fill(i, color) {
        if (this.marks[i]) this.marks[i].style.fill = color;
    }

    mousedown(i) {
        this.model.cursor.octave = -2 + i * 3;
    }

    update() {
        for (let i = 0; i < 5; i++) {
            let { sequence, cursor } = this.model;
            let { seq, track, time } = cursor;
            let events = sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time && e.note >= (-2 + i * 3) * 12 && e.note < (-2 + i * 3 + 1) * 12);
            this.fill(i, -2 + i * 3 == cursor.octave ? 'gray' : events.length ? 'lightgray' : 'white');
        }
    }
}

class Sequencer extends SVG {
    constructor(model) {
        super();
        this.stepCount = 16;
        this.element.setAttribute('viewBox', `0 0 ${this.stepCount * 30} 60`);
        this.steps = {};
        this.marks = {};
        this.fills = {};
        this.beats = {};
        this.group = 'stepSequencers';
        this.model = model

        for (let i = 0; i < this.stepCount; i++) {
            let step = this.steps[i] = this.rect(i * 30, 10, 29, 60, 'fill: whitesmoke');
            step.onmousedown = () => {
                step.setAttribute('fill', 'gray');
                this.mousedown(i);
            };
            step.onmouseup = () => {
                step.setAttribute('fill', this.fills[i] || 'whitesmoke');
                this.mouseup(i);
            };
            step.onmouseout = () => {
                step.setAttribute('fill', this.fills[i] || 'whitesmoke');
                this.mouseup(i);
            };
            this.marks[i] = this.circle(i * 30 + 15, 50, 4, 'fill: gray; display: none;');
        }
        for (let i = 0; i < this.stepCount; i += 4) {
            this.rect(i * 30, 0, 4 * 30 - 1, 9, 'fill: whitesmoke;');
            this.beats[i] = this.text(i * 30 + 2 * 30, 5, 'fill: gray; font-size: 8px; dominant-baseline: middle; pointer-events: none; user-select: none;');
        }
    }

    fill(i, color) {
        this.steps[i].style.fill = color;
        this.fills[i] = color;
    }

    mark(i, display) {
        this.marks[i].style.display = display;
    }

    mousedown(step) {
        this.model.cursor.step = step;
        let { len, velocity, events } = this.model;
        if (len) {
            this.model.cursor.len = len;
        }
        if (velocity) {
            this.model.cursor.velocity = velocity;
        }
        for (let event of events) {
            this.model.player.send(Message.noteOn(0, event.note, event.velocity), true);
        }
        super.mousedown(step);
    }

    mouseup(step) {
        for (let event of this.model.events) {
            this.model.player.send(Message.noteOff(0, event.note), true);
        }
        super.mouseup(step);
    }

    update() {
        let { seq, track, bar, step } = this.model.cursor;
        for (let i = 0; i < this.stepCount; i++) {
            let events = this.model.sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === bar * 16 + i);
            this.fill(i, i === step ? 'deepskyblue' : 'whitesmoke');
            this.mark(i, events.length > 0 ? 'initial' : 'none');
        }
        for (let i = 0; i < this.stepCount; i += 4) {
            let step = model.cursor.bar * 16 + i;
            let bar = 1 + Math.floor(step / 16);
            let beat = 1 + Math.floor((step % 16) / 4);
            this.beats[i].innerHTML = `${bar}.${beat}`;
        }
        super.update();
    }
}

class NoteLenPicker extends Button {
    constructor(model, label, value) {
        super(label, 'value');
        this.model = model;
        this.value = value;
    }

    mousedown() {
        this.model.len = this.value;
        super.mousedown();
    }

    update() {
        this.model && this.select(this.model.len === this.value);
        super.update();
    }
}

class TrackListView extends Row {
    constructor() {
        super();
        for (let j = 0; j < 2; j++) {
            let col = new Column(new Row(
                new Label('TR').flex(1),
                new Label('PORT').flex(6),
                new Label('CH').flex(1),
                new Label('M').flex(1),
            )).flex(1);
            for (let i = 0; i < 8; i++) {
                let track = j * 8 + i;
                col.append(new Row(
                    new Button(1 + track, 'list-item').flex(1).onmousedown(() => {
                        model.cursor.track = track;
                    }),
                    new Button('', 'list-item').flex(6).onmousedown(() => {
                        body.present(new Popup(new ListView().onreload((l) => {
                            l.items = Array.from(model.midi.outputs.values()).map((p) => { return { label: p.name, port: p } }).concat([{ label: '(NONE)', port: null }]);
                        }).onmousedown((it) => {
                            if (it.port) {
                                model.trackList.assign(track, it.port.name);
                                model.player.output = it.port;
                                model.cursor.track = track;
                            } else {
                                model.trackList.assign(track, null);
                                model.player.output = null;
                                model.cursor.track = track;
                            }
                            body.dismiss();
                        })));
                    }),
                    new Button('', 'list-item').flex(1),
                    new Button('OFF', 'list-item').flex(1).onmousedown(() => {
                        model.trackList.tracks[track].muted = !model.trackList.tracks[track].muted;
                    }),
                ));
            }
            this.append(col);
        }
    }

    update() {
        super.update();
        let i = 0;
        for (let col of this.columns) {
            for (let row of col.rows) {
                if (row.buttons) {
                    let { port, channel, muted } = model.trackList.tracks[i];
                    row.buttons[0].select(model.cursor.track === i);
                    row.buttons[1].element.innerHTML = port === null ? '' : port;
                    row.buttons[2].element.innerHTML = channel === null ? '' : 1 + channel;
                    row.buttons[3].element.innerHTML = muted ? 'ON' : 'OFF';
                    i++;
                }
            }
        }
    }
}
},{"./message":3,"./model":4,"./ui/binding":8,"./ui/body":9,"./ui/button":10,"./ui/column":11,"./ui/label":12,"./ui/list-view":13,"./ui/popup":14,"./ui/row":15,"./ui/svg":16,"./ui/tabbed-view":17}],3:[function(require,module,exports){
class Message {
    constructor(data) {
        this.data = Array.from(data);
        this.isRealTime = data.length > 0 && (data[0] & 0xf8) == 0xf8;
        if (data.length) {
            switch (data[0] & 0xf0) {
                case 0x80:
                    this.status = 'noteOff';
                    this.channel = data[0] & 0x0f
                    this.note = data[1] & 0x7f
                    this.velocity = data[2] & 0x7f
                    break;
                case 0x90:
                    this.status = 'noteOn';
                    this.channel = data[0] & 0x0f
                    this.note = data[1] & 0x7f
                    this.velocity = data[2] & 0x7f
                    if (this.velocity == 0) {
                        this.status = 'noteOff';
                    }
                    break;
                case 0xa0:
                    this.status = 'polyphonicAftertouch';
                    this.channel = data[0] & 0x0f
                    this.note = data[1] & 0x7f
                    this.value = data[2] & 0x7f
                    break;
                case 0xb0:
                    this.status = 'controlChange';
                    this.channel = data[0] & 0x0f
                    this.controller = data[1] & 0x7f
                    this.value = data[2] & 0x7f
                    break;
                case 0xc0:
                    this.status = 'programChange';
                    this.channel = data[0] & 0x0f
                    this.program = data[1] & 0x0f
                    break;
                case 0xd0:
                    this.status = 'channelAftertouch';
                    this.channel = data[0] & 0x0f
                    this.value = data[1] & 0x0f
                    break;
                case 0xe0:
                    this.status = 'pitchBend';
                    this.channel = data[0] & 0x0f
                    this.value = data[1] & 0x0f | (data[2] & 0x0f << 7)
                    break;
                case 0xf0:
                    switch (data[0]) {
                        case 0xf8:
                            this.status = 'clock';
                            break;
                        case 0xfa:
                            this.status = 'start';
                            break;
                        case 0xfb:
                            this.status = 'continue';
                            break;
                        case 0xfc:
                            this.status = 'stop';
                            break;
                        case 0xff:
                            this.status = 'systemReset';
                            break;
                    }
                    break;
            }
        }
    }

    static noteOn(ch, note, velocity = 100) {
        return new Message([0x90 | (ch & 0x0f), note, velocity]);
    }

    static noteOff(ch, note) {
        return new Message([0x80 | (ch & 0x0f), note, 0x00]);
    }

    static clock() {
        return new Message([0xf8]);
    }

    static start() {
        return new Message([0xfa]);
    }

    static stop() {
        return new Message([0xfc]);
    }
}

module.exports = Message;
},{}],4:[function(require,module,exports){
const Cursor = require('./cursor');
const Player = require('./player');
const Sequence = require('./sequence');
const TrackList = require('./track-list');

class Model {
    constructor() {
        this.sequence = new Sequence('midigator-seq-000.json');
        this.cursor = new Cursor();
        this.player = new Player(this);
        this.poly = false;
        this.trackList = new TrackList();
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
        this.cursor.step = 0;
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
        this.events.forEach((e) => e.len = val);
        this.cursor.len = val;
    }

    get len() {
        let len = this.events.map((e) => e.len)[0];
        return len || this.cursor.len;
    }

    set velocity(val) {
        this.events.forEach((e) => e.velocity = val);
        this.cursor.velocity = val;
    }

    get velocity() {
        let velocity = this.events.map((e) => e.velocity)[0];
        return velocity || this.cursor.velocity;
    }

    get events() {
        let { seq, track, time } = this.cursor;
        return this.sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time);
    }

    copy() {
        this.clipboard = this.events.map((e) => Object.assign({}, e));
    }

    paste() {
        if (this.clipboard) {
            this.clipboard.forEach((e) => this.sequence.push(e.seq, e.track, this.cursor.time, e.note, e.velocity, e.len));
        }
    }

    clear() {
        let { seq, track, time } = this.cursor;
        this.sequence.delete(seq, track, time);
    }
}

module.exports = Model;
},{"./cursor":1,"./player":5,"./sequence":6,"./track-list":7}],5:[function(require,module,exports){
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
},{"./message":3}],6:[function(require,module,exports){
// const fs = require('fs');

class Sequence {
    constructor(filename) {
        this.events = [];
        this.filename = filename;
    }

    async load() {
        // return new Promise((resolve, reject) => {
        //     fs.readFile(this.filename, 'utf-8', (err, data) => {
        //         if (err) {
        //             reject(err);
        //         } else {
        //             this.events = JSON.parse(data);
        //             resolve();
        //         }
        //     });
        // });
    }

    save() {
        // let data = JSON.stringify(this.events);
        // fs.writeFile(this.filename, data, (err) => {
        //     if (err) {
        //         console.error(err);
        //     }
        // });
    }

    push(seq, track, time, note, velocity, len) {
        let event = { seq, track, time, note, velocity, len };
        let index = this.events.findIndex((e) => e.seq === seq && e.track === track && e.time === time && e.note === note);
        if (index > -1) {
            this.events.splice(index, 1, event);
        } else {
            this.events.push(event);
        }
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
},{}],7:[function(require,module,exports){
class TrackList {
    constructor() {
        this.tracks = [];
        for (let i = 0; i < 16; i++) {
            this.tracks.push({ track: 0, port: null, channel: null, muted: false });
        }
    }

    assign(track, port) {
        if (port) {
            let ch = Math.min(Math.max(0, ...this.tracks.filter((t) => t.port === port).map((t) => t.channel + 1)), 15);
            this.tracks[track].port = port;
            if (this.tracks[track].channel === null) {
                this.tracks[track].channel = ch;
            }
        } else {
            this.tracks[track].port = null;
            this.tracks[track].channel = null;
        }
    }
}

module.exports = TrackList;
},{}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
const ViewGroup = require('./view-group');

class Body extends ViewGroup {
    constructor(...views) {
        super(document.body, ...views);
        this.element.style.backgroundColor = 'white';
        this.overlay = document.createElement('div');
        this.overlay.className = 'overlay';
        this.overlay.onmousedown = (event) => {
            if (event.target === this.overlay) {
                this.dismiss();
            }
        }
    }

    reload() {
        super.reload();
        this.update();
    }

    notify(event, ...args) {
        super.notify(event, ...args);
        if (event === 'update') {
            this.update();
        }
    }

    present(popup) {
        popup.reload();
        this.popup && this.popup.element.remove();
        this.overlay.append(popup.element);
        this.element.append(this.overlay);
        this.popup = popup;
    }

    dismiss() {
        this.overlay.remove();
        this.popup && this.popup.element.remove();
        delete this.popup;
        this.update();
    }
}

module.exports = Body;
},{"./view-group":18}],10:[function(require,module,exports){
const View = require('./view');

class Button extends View {
    constructor(label = '', className = null) {
        super(document.createElement('div'));
        this.element.style.flex = 1;
        this.element.classList.add('button');
        if (className) {
            this.element.classList.add(className);
        }
        this.element.onmousedown = (event) => {
            if (event.target === this.element) {
                this.element.classList.toggle('active', true);
                this.mousedown();
            }
        };
        this.element.onmouseup = (event) => {
            if (event.target === this.element) {
                this.element.classList.toggle('active', this.selected);
                this.mouseup();
            }
        };
        this.element.onmouseout = (event) => {
            if (event.target === this.element) {
                this.element.classList.toggle('active', this.selected);
                this.mouseup();
            }
        };
        this.group = 'buttons';
        this.label = label;
        this.selected = false;
        this.update();
    }

    update() {
        this.element.innerHTML = (this.label && this.label.get) ? this.label.get() : this.label;
    }

    select(on) {
        this.element.classList.toggle('active', on);
        this.selected = on;
    }
}

module.exports = Button;
},{"./view":19}],11:[function(require,module,exports){
const ViewGroup = require("./view-group");

class Column extends ViewGroup {
    constructor(...views) {
        super(document.createElement('div'), ...views);
        this.element.classList.add('column');
        this.group = 'columns';
    }
}

module.exports = Column;
},{"./view-group":18}],12:[function(require,module,exports){
const View = require('./view');

class Label extends View {
    constructor(text, span = 1) {
        super(document.createElement('div'));
        this.element.style.flex = 1;
        this.element.innerHTML = text;
        this.element.className = 'label';
        this.element.style.flex = span;
    }
}

module.exports = Label;
},{"./view":19}],13:[function(require,module,exports){
const Column = require('./column');
const Button = require('./button');

class ListView extends Column {
    set items(items) {
        this.element.innerHTML = null;
        for (let item of items) {
            this.append(new Button(item.label, 'value').onmousedown(() => this.mousedown(item)));
        }
    }
}

module.exports = ListView;
},{"./button":10,"./column":11}],14:[function(require,module,exports){
const View = require('./view');
const ViewGroup = require('./view-group');

class Popup extends ViewGroup {
    constructor(view) {
        super(document.createElement('div'));
        this.element.classList.add('popup');
        this.append(view);
    }
}

module.exports = Popup;
},{"./view":19,"./view-group":18}],15:[function(require,module,exports){
const ViewGroup = require('./view-group');

class Row extends ViewGroup {
    constructor(...views) {
        super(document.createElement('div'), ...views);
        this.element.classList.add('row');
        this.group = 'rows';
    }
}

module.exports = Row;
},{"./view-group":18}],16:[function(require,module,exports){
const View = require('./view');

class SVG extends View {
    constructor() {
        super(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    }

    line(x1, y1, x2, y2, style) {
        return this.tag('line', { x1, y1, x2, y2 }, style);
    }

    rect(x, y, width, height, style) {
        return this.tag('rect', { x, y, width, height }, style);
    }

    circle(cx, cy, r, style) {
        return this.tag('circle', { cx, cy, r }, style);
    }

    text(x, y, style) {
        return this.tag('text', { x, y }, style);
    }

    tag(name, attr, style) {
        let tag = document.createElementNS('http://www.w3.org/2000/svg', name);
        for (const [key, value] of Object.entries(attr)) {
            tag.setAttribute(key, value);
        }
        tag.style = style;
        this.element.append(tag);
        return tag;
    }
}

module.exports = SVG;
},{"./view":19}],17:[function(require,module,exports){
const View = require('./view');
const ViewGroup = require('./view-group');

class TabbedView extends ViewGroup {
    constructor(...views) {
        super(document.createElement('div'));
        this.element.classList.add('tabbed-view-content');
        this.views = views;
        this.selectedIndex = 0;
        this.group = 'tabbedViews';
    }

    set selectedIndex(i) {
        let view = this.selectedView;
        if (view) {
            this.remove(view);
        }
        view = this.views[i];
        if (view) {
            view.reload();
            this.append(view);
            this.selectedIndex_ = i;
        } else {
            this.selectedIndex_ = undefined;
        }
    }

    get selectedIndex() {
        return this.selectedIndex_;
    }

    get selectedView() {
        return this.views[this.selectedIndex_];
    }
}

module.exports = TabbedView;
},{"./view":19,"./view-group":18}],18:[function(require,module,exports){
const View = require('./view');

class ViewGroup extends View {
    constructor(element, ...views) {
        super(element);
        this.children = [];
        this.append(...views);
    }

    append(...views) {
        for (let view of views) {
            let { element, group } = view;
            view.parent = this;
            this.element.append(element);
            this.children.push(view);
            if (group) {
                this[group] = this[group] || [];
                this[group].push(view);
            }
        }
    }

    remove(view) {
        let { element, group } = view;
        if (this[group]) {
            let i = this[group].indexOf(element);
            if (i > -1) {
                this[group].splice(i, 1);
            }
        }
        let i = this.children.indexOf(view);
        if (i > -1) {
            this.children.splice(i, 1);
        }
        element.remove();
        view.parent = null;
    }

    reload() {
        if (this.onreload_) {
            super.reload();
        } else {
            this.children.forEach((view) => view.reload());
        }
    }

    update() {
        super.update();
        this.children.forEach((view) => view.update());
    }

    notify(event, ...args) {
        switch (event) {
            case 'update':
                this.parent && this.parent.notify(event, ...args);
                break;
        }
    }
}

module.exports = ViewGroup;
},{"./view":19}],19:[function(require,module,exports){
class View {
    constructor(element) {
        this.element = element;
    }

    flex(flex) {
        this.element.style.flex = flex;
        return this;
    }

    onreload(handler) {
        this.onreload_ = handler;
        return this;
    }

    onmousedown(handler) {
        this.onmousedown_ = handler;
        return this;
    }

    onmouseup(handler) {
        this.onmouseup_ = handler;
        return this;
    }

    onupdate(handler) {
        this.onupdate_ = handler;
        return this;
    }

    reload() {
        if (this.onreload_) {
            this.element.innerHTML = null;
            this.onreload_(this);
            this.update();
        }
    }

    update() {
        this.onupdate_ && this.onupdate_(this);
    }

    mousedown(...args) {
        this.onmousedown_ && this.onmousedown_(...args);
        this.parent && this.parent.notify('update');
    }

    mouseup(...args) {
        this.onmouseup_ && this.onmouseup_(...args);
        this.parent && this.parent.notify('update');
    }

    notify(event, ...args) { }
}

module.exports = View;
},{}]},{},[2]);
