import { vec2 } from "gl-matrix";
import { EventBinder } from "utils/eventBinder";

export type InputState = {
    mouseRads: number,
    mouseDown: boolean,
}

export class InputGrabber {
    private readonly eventBinder: EventBinder;
    private readonly mouseScreenPoint: vec2;

    private mouseDown: boolean;

    constructor() {
        this.eventBinder = new EventBinder(this);
        this.mouseDown = false;
        this.mouseScreenPoint = vec2.create();

        this.eventBinder.bind(document, 'mousemove',  this.onMouseMove);
        this.eventBinder.bind(document, 'mousedown',  this.onMouseDown);
        this.eventBinder.bind(document, 'mouseup',    this.onMouseButtonNegative);
    //  this.eventBinder.bind(document, 'mouseout',   this.onMouseButtonNegative);
    //  this.eventBinder.bind(document, 'mouseleave', this.onMouseButtonNegative);
    }

    getCurrentState(): InputState {
        return {
            mouseRads: Math.atan2(this.mouseScreenPoint[1], this.mouseScreenPoint[0]),
            mouseDown: this.mouseDown,
        };
    }

    private onMouseDown() {
        this.mouseDown = true;
    }

    private onMouseButtonNegative() {
        this.mouseDown = false;
    }

    private onMouseMove(e: MouseEvent) {
        this.mouseScreenPoint[0] =  2 * (e.clientX / window.innerWidth - 0.5);
        this.mouseScreenPoint[1] = -2 * (e.clientY / window.innerHeight - 0.5);

        console.log(this.mouseScreenPoint);
    }

    release() {
        this.eventBinder.unbindAll();
    }
}