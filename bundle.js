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

window.onload = () => {
    let model = new Model();
    let body = new Body(
        new Row(
            new Label('SONG'),
            new Label('TEMPO'),
            new Label('SEQ'),
            new Label('TRACK'),
            new Label('BAR'),
            new Label('LAYER'),

        ),
        new Row(
            new Button('1', 'value').onmousedown(() => { }),
            new Button('120', 'value').onmousedown(() => { }),
            new Button(new Binding(model.cursor, 'seq', (val) => 1 + val), 'value').onmousedown(() => { }),
            new Button('1', 'value').onmousedown(() => body.present(new Popup(new ListView().onupdate((l) => {
                l.items = Array.from(model.midi.outputs.values()).map((p) => { return { label: p.name, port: p } });
            }).onmousedown((i) => {
                model.player.output = i.port;
                body.dismiss();
            })))),
            new Button(new Binding(model.cursor, 'bar', (val) => 1 + val), 'value').onmousedown(() => { }),
            new Button('Notes', 'value'),
        ),
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
            new OctavePicker().onmousedown((i) => {
                model.cursor.octave = -2 + i * 3;
            }).onupdate((op) => {
                for (let i = 0; i < 5; i++) {
                    let { sequence, cursor } = model;
                    let { seq, track, time } = model.cursor;
                    let events = sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time && e.note >= (-2 + i * 3) * 12 && e.note < (-2 + i * 3 + 1) * 12);
                    op.fill(i, -2 + i * 3 == cursor.octave ? 'gray' : events.length ? 'lightgray' : 'white');
                }
            }),
            new Button('+', 'value').onmousedown(() => model.cursor.octaveUp()),
            new Button('Tie', 'value'),
            new Button('Rest', 'value'),
        ),
        new PianoKeyboard(model),
        new Row(
            new Label('STEPS'),
        ),
        new Sequencer(model),
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
    );
    model.player.onchange = () => body.update();
    model.load().then(() => body.update());
};

class PianoKeyboard extends SVG {
    constructor(model) {
        super();
        this.model = model;
        this.element.style.flex = 3;
        this.element.setAttribute('viewBox', '0 0 630 60');
        this.keys = {};
        this.marks = {};
        this.group = 'piano-keyboards';

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
    constructor() {
        super();
        this.element.style.flex = 3;
        this.element.setAttribute('viewBox', '0 0 150 30');
        this.marks = {};
        this.group = 'octave-pickers';

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
}

class Sequencer extends SVG {
    constructor(model) {
        super();
        this.element.setAttribute('viewBox', '0 0 480 60');
        this.steps = {};
        this.marks = {};
        this.fills = {};
        this.group = 'sequencers';
        this.model = model

        for (let i = 0; i < 16; i++) {
            let step = this.steps[i] = this.rect(i * 30 + 1, 0, 28, 60, 'fill: whitesmoke');
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
            if (i % 4 === 0) {
                this.line(i * 30, 0, i * 30, 60, 'stroke: gray; stroke-width: 1;');
            }
            if (i === 15) {
                this.line(i * 30 + 30, 0, i * 30 + 30, 60, 'stroke: gray; stroke-width: 1;');
            }
            this.marks[i] = this.circle(i * 30 + 15, 50, 4, 'fill: gray; display: none;');
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
        for (let i = 0; i < 16; i++) {
            let events = this.model.sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === bar * 16 + i);
            this.fill(i, i === step ? 'deepskyblue' : 'whitesmoke');
            this.mark(i, events.length > 0 ? 'initial' : 'none');
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

},{"./message":3,"./model":4,"./ui/binding":7,"./ui/body":8,"./ui/button":9,"./ui/label":11,"./ui/list-view":12,"./ui/popup":13,"./ui/row":14,"./ui/svg":15}],3:[function(require,module,exports){
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
}

module.exports = Model;
},{"./cursor":1,"./player":5,"./sequence":6}],5:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
const ViewGroup = require('./view-group');

class Body extends ViewGroup {
    constructor(...views) {
        super(document.body, ...views);
        this.overlay = document.createElement('div');
        this.overlay.className = 'overlay';
        this.overlay.onmousedown = (event) => {
            if (event.target === this.overlay) {
                this.dismiss();
            }
        }
    }

    notify(event, ...args) {
        super.notify(event, ...args);
        if (event === 'update') {
            this.update();
        }
    }

    present(popup) {
        popup.update();
        this.popup && this.popup.element.remove();
        this.overlay.append(popup.element);
        this.element.append(this.overlay);
        this.popup = popup;
    }

    dismiss() {
        this.overlay.remove();
        this.popup && this.popup.element.remove();
        delete this.popup;
    }
}

module.exports = Body;
},{"./view-group":16}],9:[function(require,module,exports){
const View = require('./view');

class Button extends View {
    constructor(label = '', className = null) {
        super(document.createElement('div'));
        this.element.style.flex = 1;
        this.element.classList.add('button');
        if (className) {
            this.element.classList.add(className);
        }
        this.element.onmousedown = () => {
            this.element.classList.toggle('active', true);
            this.mousedown();
        };
        this.element.onmouseup = () => {
            this.element.classList.toggle('active', this.selected);
            this.mouseup();
        };
        this.element.onmouseout = () => {
            this.element.classList.toggle('active', this.selected);
            this.mouseup();
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
},{"./view":17}],10:[function(require,module,exports){
const ViewGroup = require("./view-group");

class Column extends ViewGroup {
    constructor() {
        super(document.createElement('div'));
        this.element.classList.add('column');
    }
}

module.exports = Column;
},{"./view-group":16}],11:[function(require,module,exports){
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
},{"./view":17}],12:[function(require,module,exports){
const Column = require('./column');
const Button = require('./button');

class ListView extends Column {
    set items(items) {
        for (let child of this.element.children) {
            child.remove();
        }
        for (let item of items) {
            this.append(new Button(item.label, 'value').onmousedown(() => this.mousedown(item)));
        }
    }
}

module.exports = ListView;
},{"./button":9,"./column":10}],13:[function(require,module,exports){
const View = require('./view');

class Popup extends View {
    constructor(view) {
        super(document.createElement('div'));
        this.element.classList.add('popup');
        this.element.append(view.element);
        this.view = view;
    }

    update() {
        this.view.update();
        super.update();
    }
}

module.exports = Popup;
},{"./view":17}],14:[function(require,module,exports){
const ViewGroup = require('./view-group');

class Row extends ViewGroup {
    constructor(...views) {
        super(document.createElement('div'), ...views);
        this.element.classList.add('row');
        this.group = 'rows';
    }
}

module.exports = Row;
},{"./view-group":16}],15:[function(require,module,exports){
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
},{"./view":17}],16:[function(require,module,exports){
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

    update() {
        super.update();
        this.children.forEach((view) => view.update && view.update());
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
},{"./view":17}],17:[function(require,module,exports){
class View {
    constructor(element) {
        this.element = element;
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

    mousedown(...args) {
        this.onmousedown_ && this.onmousedown_(...args);
        this.parent && this.parent.notify('update');
    }

    mouseup(...args) {
        this.onmouseup_ && this.onmouseup_(...args);
        this.parent && this.parent.notify('update');
    }

    update() {
        this.onupdate_ && this.onupdate_(this);
    }

    notify(event, ...args) { }
}

module.exports = View;
},{}]},{},[2]);
