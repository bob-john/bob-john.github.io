
const Format = require('./format');
const Message = require('./message');
const Model = require('./model');
const Formatter = require('./formatter');

window.onload = async () => {
    let model = new Model();
    let view = new View(model);

    let controller = new RootController(model);

    try {
        await model.sequence.load();
    } catch (err) {
        console.error(err);
    }

    let canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 320;
    document.body.append(canvas);
    let ctx = canvas.getContext('2d');

    let reloadView = () => {
        view.draw(ctx, canvas.width, canvas.height);

        return;

        // info
        setFont(ctx, '10px Arial', 'top')
        ctx.fillStyle = 'gray';
        ctx.fillText('SEQ', 8, 8);
        ctx.fillText('TRK', 8 + 5 * 8, 8);
        ctx.fillText('BAR', 8 + 10 * 8, 8);
        ctx.fillText('LEN', 8 + 20 * 8, 8);

        setFont(ctx, '18px Monospace', 'top')
        ctx.fillStyle = 'whitesmoke'
        ctx.fillText(1 + seq, 8, 8 + 8);
        ctx.fillText(1 + track, 8 + 5 * 8, 8 + 8);
        ctx.fillText(1 + bar, 8 + 10 * 8, 8 + 8);
        ctx.fillText(len ? len : '', 8 + 20 * 8, 8 + 8);

        // notes
        for (let i = 0; i <= 16; i++) {
            ctx.fillStyle = i % 4 == 0 ? 'gray' : 'darkgray';
            ctx.fillRect(8 + i * 16, 8 + 8 + 16 + 8, 1, 24);

            if (i < 16) {
                let time = bar * 16 + i;
                let events = sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time);
                if (events.length) {
                    ctx.fillStyle = 'gray';
                    ctx.fillRect(8 + i * 16 + 2, 8 + 8 + 16 + 8 + 2, 13, 20);
                }
            }
        }

        // cursor
        ctx.fillStyle = cursor.view === 'sequencer' && !player.playing ? 'deepskyblue' : 'whitesmoke';
        ctx.fillRect(8 + step * 16 + 2, 8 + 8 + 16 + 8 + 2, 13, 20);
        if (len === 0) {
            ctx.fillStyle = 'black';
            ctx.fillRect(8 + step * 16 + 3, 8 + 8 + 16 + 8 + 3, 11, 18);
        }

        // tracks
        setFont(ctx, '10px Arial', 'bottom', 'center');
        for (let i = 0; i < 16; i++) {
            ctx.fillStyle = cursor.bar === i ? cursor.view === 'arranger' ? 'deepskyblue' : 'whitesmoke' : 'gray';
            ctx.fillText(`${1 + i}`, 8 + 24 + i * 24 + 12, 8 + 64 + 20);
        }

        setFont(ctx, '10px Arial', 'middle', 'right');
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = cursor.track === i ? cursor.view === 'arranger' ? 'deepskyblue' : 'whitesmoke' : 'gray';
            ctx.fillText(`T${1 + i}`, 8 + 20, 8 + 64 + 24 + i * 16 + 8);
            for (let j = 0; j < 16; j++) {
                ctx.fillStyle = cursor.track === i && cursor.bar === j ? cursor.view === 'arranger' ? 'deepskyblue' : 'whitesmoke' : 'darkgray';
                ctx.fillRect(8 + 24 + j * 24, 8 + 64 + 24 + i * 16, 23, 15);
                if (sequence.events.filter((e) => e.seq === cursor.seq && e.track === i && e.time < (j + 1) * 16 && e.time + e.len > j * 16).length === 0) {
                    ctx.fillStyle = 'black';
                    ctx.fillRect(8 + 24 + j * 24 + 1, 8 + 64 + 24 + i * 16 + 1, 21, 13);
                }
            }
        }

    };

    let midi = await navigator.requestMIDIAccess({ sysex: false });
    for (let output of midi.outputs.values()) {
        if (output.name === 'loopMIDI Port') {
            model.player.output = output;
        }
    }
    for (let input of midi.inputs.values()) {
        input.onmidimessage = (event) => {
            let message = new Message(event.data);
            if (message.isRealTime) {
                return;
            }
            console.log(input.name, message);
            switch (input.name) {
                case 'Keystation Mini 32': {
                    switch (message.status) {
                        case 'noteOn': {
                            sequence.push(cursor.seq, cursor.track, cursor.bar * 16 + cursor.step, message.note, message.velocity, 1);
                            if (model.poly) {
                                model.noteOn.push(event);
                            } else {
                                model.noteOn = [event];
                                cursor.right();
                            }
                            reloadView();
                            break;
                        }

                        case 'noteOff': {
                            let index = model.noteOn.findIndex((m) => m.note === message.note);
                            if (index >= 0) {
                                model.noteOn.splice(index, 1);
                            }
                            if (model.poly && model.noteOn.length === 0) {
                                cursor.right();
                            }
                            reloadView();
                            break;
                        }
                    }
                    model.player.send(message, true);
                    break;
                }

                default:
                    if (message.status === 'controlChange' && message.controller === 7) {
                        if (message.value > 64) {
                            controller.onkeydown({ code: 'ArrowRight' });
                        } else if (message.value < 64) {
                            controller.onkeydown({ code: 'ArrowLeft' });
                        }
                        reloadView();
                    }
                    break;
            }
        };
    }

    model.player.onchange = () => reloadView();

    window.onkeydown = (event) => {
        console.log(event);
        if (controller.onkeydown(event)) {
            reloadView();
        }
    };

    window.onkeyup = (event) => {
        if (controller.onkeyup(event)) {
            reloadView();
        }
    };

    reloadView();
};

class RootController {
    constructor(cursor, sequence, player, model) {
        this.cursor = cursor;
        this.sequence = sequence;
        this.player = player;
        this.model = model;
        this.view = 'sequencer';
    }

    onkeydown(event) {
        switch (event.code) {
            case 'NumpadAdd':
                this.cursor.inc(this.sequence);
                break;

            case 'NumpadSubtract':
                this.cursor.dec(this.sequence);
                break;

            case 'F4':
                this.player.start();
                break;

            case 'F5':
                this.player.stop();
                break;

            case 'F6':
                this.player.time = this.cursor.bar * 16;
                this.player.continue();
                break;

            case 'Tab':
                if (!event.repeat) {
                    if (this.view === 'sequencer') {
                        this.view = 'arranger';
                    } else if (this.view === 'arranger') {
                        this.view = 'sequencer';
                    }
                }
                break;

            case 'PageUp':
                if (this.cursor.seq > 0) {
                    this.player.stop();
                    this.cursor.seq--;
                }
                break;

            case 'PageDown':
                if (this.cursor.seq < 63) {
                    this.player.stop();
                    this.cursor.seq++;
                }
                break;

            default:
                if (this.controller.onkeydown(event)) {
                    break;
                }
                return false;
        }
        return true;
    }

    onkeyup(event) {
        switch (event.code) {
            // case 'Tab':
            //     this.view = 'sequencer';
            //     break;

            default:
                return false;
        }
        return true;
    }

    set view(view) {
        switch (view) {
            case 'sequencer':
                this.controller = new SequencerController(this, this.cursor, this.sequence, this.player, this.model);
                this.cursor.view = view;
                break;

            case 'arranger':
                this.controller = new ArrangerController(this, this.cursor, this.sequence);
                this.cursor.view = view;
                break;
        }
    }

    get view() {
        return this.cursor.view;
    }
}

class SequencerController {
    constructor(root, cursor, sequence, player, model) {
        this.root = root;
        this.cursor = cursor;
        this.sequence = sequence;
        this.player = player;
        this.model = model;
        this.cursor.view = 'sequencer';
    }

    onkeydown(event) {
        switch (event.code) {
            case 'ArrowLeft': {
                this.cursor.left();
                break;
            }

            case 'ArrowRight': {
                this.cursor.right();
                break;
            }

            case 'ArrowUp':
                this.cursor.up();
                break;

            case 'ArrowDown':
                this.cursor.down();
                break;

            case 'Home':
                this.cursor.home();
                break;

            case 'End':
                this.cursor.end();
                break;

            case 'Delete':
                this.sequence.delete(this.cursor.seq, this.cursor.track, this.cursor.time);
                break;

            case 'Backspace':
                this.sequence.delete(this.cursor.seq, this.cursor.track, this.cursor.time);
                this.cursor.left();
                break;

            case 'KeyP':
                this.model.poly = !this.model.poly;
                break;

            default:
                return false;
        }
        return true;
    }
}

class ArrangerController {
    constructor(root, cursor, sequence) {
        this.root = root;
        this.cursor = cursor;
        this.cursor.view = 'arranger';
        this.sequence = sequence;
    }

    onkeydown(event) {
        switch (event.code) {
            case 'ArrowLeft':
                if (this.cursor.bar > 0) {
                    this.cursor.bar--;
                }
                break;

            case 'ArrowRight':
                if (this.cursor.bar != 15) {
                    this.cursor.bar++;
                }
                break;

            case 'ArrowUp':
                if (this.cursor.track > 0) {
                    this.cursor.track--;
                }
                break;

            case 'ArrowDown':
                if (this.cursor.track < 7) {
                    this.cursor.track++;
                }
                break;

            default:
                return false;
        }
        return true;
    }
}

class ValueView {
    constructor(label, value) {
        this.label = label;
        this.value = value;
    }

    draw(ctx, x, y) {
        setFont(ctx, '10px Arial', 'top')
        ctx.fillStyle = 'gray';
        ctx.fillText(this.label, x, y);
        setFont(ctx, '18px Monospace', 'top')
        ctx.fillStyle = 'whitesmoke'
        ctx.fillText(this.value, x, y + 8);
    }
}

class TrackView {
    constructor(selectedIndex) {
        this.selectedIndex = selectedIndex;
    }

    draw(ctx, x, y) {
        setFont(ctx, '10px Arial', 'top')
        ctx.fillStyle = 'gray';
        ctx.fillText('TRACK', x, y);
        setFont(ctx, '18px Monospace', 'top')
        for (let t = 0; t < 8; t++) {
            ctx.fillStyle = t === this.selectedIndex ? 'whitesmoke' : 'gray';
            ctx.fillText(new String(1 + t).padStart(2, '0'), x + t * 30, y + 8);
        }
    }
}

function setFont(ctx, font, baseline = 'alphabetic', align = 'start') {
    ctx.font = font;
    ctx.textBaseline = baseline;
    ctx.textAlign = align;
}

class SequencerView {
    constructor(model) {
        this.model = model;
    }

    draw(ctx, x, y) {
        //data
        let { sequence, player, cursor } = this.model;
        let { seq, track, bar, step } = cursor;
        if (player.playing) {
            bar = Math.floor(player.time / 16);
            step = Math.floor(player.time) % 16;
        }
        let time = bar * 16 + step;
        let len = Math.max(0, ...sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time).map((e) => e.len));

        // notes
        for (let i = 0; i <= 16; i++) {
            ctx.fillStyle = i % 4 == 0 ? 'whitesmoke' : 'gray';
            ctx.fillRect(x + i * 16, y, 1, 24);

            if (i < 16) {
                let time = bar * 16 + i;
                let events = sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time);
                if (events.length) {
                    ctx.fillStyle = 'gray';
                    ctx.fillRect(x + i * 16 + 2, y + 2, 13, 20);
                }
            }
        }

        // cursor
        ctx.fillStyle = cursor.view === 'sequencer' && !player.playing ? 'deepskyblue' : 'whitesmoke';
        ctx.fillRect(x + step * 16 + 2, y + 2, 13, 20);
        if (len === 0) {
            ctx.fillStyle = 'black';
            ctx.fillRect(x + step * 16 + 3, y + 3, 11, 18);
        }

    }
}

class Button {
    constructor(label) {
        this.label = label;
    }

    draw(ctx, x, y, w, h) {
        setFont(ctx, '15px Monospace', 'middle', 'center');
        ctx.fillStyle = 'gray';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'black';
        ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
        ctx.fillStyle = 'gray';
        ctx.fillText(this.label, x + w / 2, y + h / 2);
    }
}

class View {
    constructor(model) {
        this.model = model;
    }

    draw(ctx, width, height) {
        // data
        let { sequence, cursor, player } = this.model;
        let { seq, track, bar, step } = cursor;
        if (player.playing) {
            bar = Math.floor(player.time / 16);
            step = Math.floor(player.time) % 16;
        }
        let time = bar * 16 + step;
        let len = Math.max(0, ...sequence.events.filter((e) => e.seq === seq && e.track === track && e.time === time).map((e) => e.len));

        // bg
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        new ValueView('SONG', Formatter.song(0)).draw(ctx, 8, 8);
        new ValueView('BPM ', Formatter.bpm(120)).draw(ctx, 8 + 50, 8);
        new TrackView(track).draw(ctx, 8 + 100, 8);
        new ValueView('SEQ', Formatter.seq(seq)).draw(ctx, 8 + 350, 8);
        new ValueView('BAR', Formatter.bar(bar)).draw(ctx, 8 + 400, 8);

        new SequencerView(this.model).draw(ctx, 8, 8 + 40);

        new ValueView('NOTE', 'C-3').draw(ctx, 8 + 300, 8 + 40);
        new ValueView('VEL', '100').draw(ctx, 8 + 350, 8 + 40);
        new ValueView('LEN', '016').draw(ctx, 8 + 400, 8 + 40);

        new Button('COPY').draw(ctx, 8, 8 + 80, 50, 25);
        new Button('PASTE').draw(ctx, 8, 8 + 110, 50, 25);
        new Button('CLEAR').draw(ctx, 8, 8 + 140, 50, 25);

        new Button('|<').draw(ctx, 8 + 70, 8 + 80, 50, 25);
        new Button('<<').draw(ctx, 8 + 70 + 55, 8 + 80, 50, 25);
        new Button('>>').draw(ctx, 8 + 70 + 110, 8 + 80, 50, 25);

        new Button('STOP').draw(ctx, 8 + 70, 8 + 110, 50, 50);
        new Button('PLAY').draw(ctx, 8 + 70 + 55, 8 + 110, 50, 50);
        new Button('REC').draw(ctx, 8 + 70 + 110, 8 + 110, 50, 50);

        new Button('+').draw(ctx, 8 + 70 + 185, 8 + 80, 50, 35);
        new Button('-').draw(ctx, 8 + 70 + 185, 8 + 125, 50, 35);
    }
}