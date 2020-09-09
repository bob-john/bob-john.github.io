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