export type InputState = {
    left:  boolean,
    up:    boolean,
    right: boolean,
}

export class InputGrabber {
    private readonly keys: {[code:number]: boolean} = {};

    constructor(doc: Document) {
        doc.onkeydown = k => this.keys[k.keyCode] = true;
        doc.onkeyup = k => delete this.keys[k.keyCode];
    }

    getCurrentState(): InputState {
        return {
            left:  this.keys[37],
            up:    this.keys[38],
            right: this.keys[39],
        };
    }
}