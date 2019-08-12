import { vec2 } from "gl-matrix";
import { EventBinder } from "utils/eventBinder";

export type InputState = {
    mouseRads: number,
    mouseDown: boolean,
}

export class InputGrabber {
    private readonly eventBinder: EventBinder;
    private readonly canvas: HTMLCanvasElement;
    private readonly keys: {[code:number]: boolean} = {};
    private readonly mouseScreenPoint: vec2;

    private mouseDown: boolean;
    private canvasBoundingRect: { left: number, top: number };

    constructor(canvas: HTMLCanvasElement) {
        document.onkeydown = k => this.keys[k.keyCode] = true;
        document.onkeyup = k => delete this.keys[k.keyCode];

        this.eventBinder = new EventBinder(this);
        this.canvas = canvas;
        this.mouseDown = false;
        this.mouseScreenPoint = vec2.create();
        this.canvasBoundingRect = { left: 0, top: 0 };

        this.eventBinder.bind(canvas, 'mousemove',  this.onMouseMove);
        this.eventBinder.bind(canvas, 'mousedown',  this.onMouseDown);
        this.eventBinder.bind(canvas, 'mouseup',    this.onMouseButtonNegative);
        this.eventBinder.bind(canvas, 'mouseout',   this.onMouseButtonNegative);
        this.eventBinder.bind(canvas, 'mouseleave', this.onMouseButtonNegative);

        this.eventBinder.bind(window, 'scroll', this.onWindowChange);
        this.eventBinder.bind(window, 'resize', this.onWindowChange);

        this.onWindowChange();
    }

    getCurrentState(): InputState {
        return {
            mouseRads: Math.atan2(this.mouseScreenPoint[1] - .5, this.mouseScreenPoint[0] - .5),
            mouseDown: this.mouseDown,
        };
    }

    private onMouseDown() {
        this.mouseDown = true;
    }

    private onMouseButtonNegative() {
        this.mouseDown = false;
    }

    private onWindowChange() {
        const clientRect = this.canvas.getBoundingClientRect();
        this.canvasBoundingRect.left = clientRect.left  + this.canvas.clientLeft;
        this.canvasBoundingRect.top = clientRect.top + this.canvas.clientTop;
    }

    private onMouseMove(e: MouseEvent) {
        this.mouseScreenPoint[0] = (e.clientX - this.canvasBoundingRect.left) / this.canvas.width;
        this.mouseScreenPoint[1] = 1 - (e.clientY - this.canvasBoundingRect.top)  / this.canvas.height;
    }

    release() {
        this.eventBinder.unbindAll();
    }
}