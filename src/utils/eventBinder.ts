type EventListenerTarget = {
    addEventListener: (event: string, listener: Function) => void,
    removeEventListener: (event: string, listener: Function) => void,
};

type ListenerBinding = {
    target: EventListenerTarget,
    event: string,
    listener: Function,
};

export class EventBinder {
    private readonly bindings: ListenerBinding[];
    private readonly thisArg: any;

    constructor(thisArg: any) {
        this.bindings = [];
        this.thisArg = thisArg;
    }

    bind(target: EventListenerTarget, event: string, listener: Function) {
        const binding = { target, event, listener: listener.bind(this.thisArg) };
        target.addEventListener(event, binding.listener);
        this.bindings.push(binding);
    }

    unbindAll() {
        this.bindings.forEach(x => x.target.removeEventListener(x.event, x.listener));
        this.bindings.length = 0;
    }
}
