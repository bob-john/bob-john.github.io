const Binding = require('./ui/binding');
const Body = require('./ui/body');
const Button = require('./ui/button');
const Label = require('./ui/label');
const Model = require('./model');
const Row = require('./ui/row');
const SVG = require('./ui/svg');
const Popup = require('./ui/popup');
const ListView = require('./ui/list-view');

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
            new Button('1', 'value').onclick(() => { }),
            new Button('120', 'value').onclick(() => { }),
            new Button(new Binding(model.cursor, 'seq', (val) => 1 + val), 'value').onclick(() => { }),
            new Button('1', 'value').onclick(() => body.present(new Popup(new ListView().onupdate((l) => {
                l.items = Array.from(model.midi.outputs.values()).map((p) => { return { label: p.name, port: p } });
            }).onclick((i) => {
                model.player.output = i.port;
                body.dismiss();
            })))),
            new Button(new Binding(model.cursor, 'bar', (val) => 1 + val), 'value').onclick(() => { }),
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

            new Button(new Binding(model, 'velocity', Binding.number), 'value').onclick(() => model.nextVelocity()),
            new Button('-', 'value').onclick(() => model.cursor.octaveDown()),
            new OctavePicker().onclick((i) => {
                model.cursor.octave = -2 + i * 3;
            }).onupdate((op) => {
                for (let i = 0; i < 5; i++) {
                    let { sequence, cursor } = model;
                    let { seq, track, time } = model.cursor;
                    let events = sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time && e.note >= (-2 + i * 3) * 12 && e.note < (-2 + i * 3 + 1) * 12);
                    op.fill(i, -2 + i * 3 == cursor.octave ? 'gray' : events.length ? 'lightgray' : 'white');
                }
            }),
            new Button('+', 'value').onclick(() => model.cursor.octaveUp()),
            new Button('Tie', 'value'),
            new Button('Rest', 'value'),
        ),
        new Row(
            new PianoKeyboard().onclick((note) => {
                let { sequence, cursor } = model;
                let { seq, track, time, octave, velocity, len } = cursor;
                note += octave * 12;
                sequence.toggle(seq, track, time, note, velocity, len);
            }).onupdate((kb) => {
                let { sequence, cursor } = model;
                let { seq, track, time, octave } = cursor;
                let events = sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time);
                for (let i = 0; i < 3 * 12; i++) {
                    let note = octave * 12 + i;
                    kb.mark(i, events.find((e) => e.note === note));
                }
            }),
        ),
        new Row(
            new Label('STEPS'),
        ),
        new Sequencer().onclick((step) => {
            model.cursor.step = step;
            let { len, velocity } = model;
            if (len) {
                model.cursor.len = len;
            }
            if (velocity) {
                model.cursor.velocity = velocity;
            }
        }).onupdate((sq) => {
            let { seq, track, bar, step } = model.cursor;
            for (let i = 0; i < 16; i++) {
                let events = model.sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === bar * 16 + i);
                sq.fill(i, i === step ? 'deepskyblue' : 'whitesmoke');
                sq.mark(i, events.length > 0 ? 'initial' : 'none');
            }
        }),
        new Row(
            new Button('|<', 'small').onclick(() => model.top()),
            new Button('<<', 'small').onclick(() => model.bwd()),
            new Button('>>', 'small').onclick(() => model.fwd()),
        ),
        new Row(
            new Button('STOP').onclick(() => model.stop()),
            new Button('PLAY').onclick(() => model.play()),
            new Button('REC').onclick(() => model.rec()),
        ),
    );
    model.player.onchange = () => body.update();
    model.load().then(() => body.update());
};

class PianoKeyboard extends SVG {
    constructor() {
        super();
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
                this.click(n);
            };
            key.onmouseup = () => {
                key.style.fill = 'whitesmoke';
            };
            key.onmouseout = () => {
                key.style.fill = 'whitesmoke';
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
                    this.click(n);
                };
                key.onmouseup = () => {
                    key.style.fill = 'black';
                };
                key.onmouseout = () => {
                    key.style.fill = 'black';
                };
                this.marks[n] = this.circle(i * 30 + 30, 25, 4, 'fill: gray; display: none; pointer-events: none;');
            }
        }
    }

    mark(note, marked) {
        this.marks[note].style.display = marked ? 'initial' : 'none';
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
                this.click(i);
            };
            this.marks[i] = this.circle(30 * i + 15, 15, 4, 'fill: white; stroke: gray; stroke-width: 1; pointer-events: none;');
        }
    }

    fill(i, color) {
        if (this.marks[i]) this.marks[i].style.fill = color;
    }
}

class Sequencer extends SVG {
    constructor() {
        super();
        this.element.style.flex = 3;
        this.element.setAttribute('viewBox', '0 0 480 60');
        this.steps = {};
        this.marks = {};
        this.fills = {};
        this.group = 'sequencers';

        for (let i = 0; i < 16; i++) {
            let step = this.steps[i] = this.rect(i * 30 + 1, 0, 28, 60, 'fill: whitesmoke');
            step.onmousedown = () => {
                step.setAttribute('fill', 'gray');
                this.click(i);
            };
            step.onmouseup = () => {
                step.setAttribute('fill', this.fills[i] || 'whitesmoke');
            };
            step.onmouseout = () => {
                step.setAttribute('fill', this.fills[i] || 'whitesmoke');
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
}

class NoteLenPicker extends Button {
    constructor(model, label, value) {
        super(label, 'value');
        this.model = model;
        this.value = value;
    }

    click() {
        this.model.len = this.value;
        super.click();
    }

    update() {
        this.model && this.select(this.model.len === this.value);
        super.update();
    }
}
