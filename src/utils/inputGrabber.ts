import { vec2 } from "gl-matrix";
import { EventBinder } from "./eventBinder";

export class InputGrabber {
    private readonly eventBinder: EventBinder;
    private readonly canvas: HTMLCanvasElement;
    readonly mouseScreenPoint: vec2;
    private _mouseDown: boolean;
    private canvasBoundingRect: { left: number, top: number };

    constructor(canvas: HTMLCanvasElement) {
        this.eventBinder = new EventBinder(this);
        this.canvas = canvas;
        this._mouseDown = false;
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

    get mouseDown(): boolean {
        return this._mouseDown;
    }

    private onMouseDown() {
        this._mouseDown = true;
    }

    private onMouseButtonNegative() {
        this._mouseDown = false;
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