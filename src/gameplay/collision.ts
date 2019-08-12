import { vec2, vec3 } from "gl-matrix";

type CollisionResult = {
    normal: vec2,
    restore: vec2,
    lineA: vec2,
    lineB: vec2,
};

class Vec2 {
    private readonly v: vec2 = vec2.create();

    get x(): number { return this.v[0]; }
    get y(): number { return this.v[1]; }

    set x(a: number) { this.v[0] = a; }
    set y(a: number) { this.v[1] = a; }

    constructor(x: number, y: number) {
        this.v[0] = x;
        this.v[1] = y;
    }

    clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    scale(n: number): Vec2 {
        vec2.scale(this.v, this.v, n);
        return this;
    }

    magnitude2(): number {
        return vec2.squaredLength(this.v);
    }

    normalize(): Vec2 {
        vec2.normalize(this.v, this.v);
        return this;
    }

    cross(a: Vec2): number {
        return vec2.cross(vec3.create(), this.v, vec2.fromValues(a.x, a.y))[2];
    }

    add(a: Vec2): Vec2 {
        vec2.add(this.v, this.v, vec2.fromValues(a.x, a.y));
        return this;
    }

    getRaw(): vec2 {
        return this.v;
    }
}

const pointInLinePerpSpace = (ax: number, ay: number, bx: number, by: number, px: number, py: number): boolean => {
    let _ax:number, _ay:number, _bx:number, _by:number, _cx:number, _cy:number;
    let perpSlope = (ax-bx) / (by-ay);

    if (perpSlope > 1) {
        _ax = ay; _bx = by; _cx = py;
        _ay = ax; _by = bx; _cy = px;
        perpSlope = (_ax-_bx)/(_by-_ay);
    } else {
        _ax = ax; _bx = bx; _cx = px;
        _ay = ay; _by = by; _cy = py;
    }

    let yMin: number, yMax: number;

    if (_ay > _by) {
        yMin = perpSlope*(_cx - _bx) + _by;
        yMax = perpSlope*(_cx - _ax) + _ay;
    } else {
        yMin = perpSlope*(_cx - _ax) + _ay;
        yMax = perpSlope*(_cx - _bx) + _by;
    }

    return _cy > yMin && _cy < yMax;
}

const projectPointOnLine = (m: number, x: number, y: number): Vec2 => {
    if (Math.abs(m) < 1e-9) {
        return new Vec2(x, 0);
    }
    else if (Math.abs (m) > 1e9) {
        return new Vec2(0, y);
    }
    const retY = (y*m+x)*m/(1+m*m);
    return new Vec2(retY/m, retY);
};


export const circleCollision = (lines: vec2[], x :number, y :number, r :number) :CollisionResult | null => {
    const r2 = r*r;

    let lined = false;
    let lineA: vec2 | null = null;
    let lineB: vec2 | null = null;
    let normal: Vec2 | null = null;
    let restore: Vec2 | null = null;

    for (let i = 0; i < lines.length; i++) {
        const ax = lines[i][0];
        const ay = lines[i][1];
        const bx = lines[(i+1) % lines.length][0];
        const by = lines[(i+1) % lines.length][1];

        if (pointInLinePerpSpace (ax, ay, bx, by, x, y)) {
            const m  = (by-ay)/(bx-ax);
            const lx = x-ax;
            const ly = y-ay;

            const pointOnLine = projectPointOnLine (m, lx, ly);
            const projection = pointOnLine.clone().scale(-1);

            projection.x += lx;
            projection.y += ly;

            if (projection.magnitude2() < r2) {
                normal = projection.clone().normalize();
                if (projection.cross (new Vec2 (bx - ax, by - ay)) > 0) {
                    normal.scale(-1);
                }
                restore = (new Vec2(ax,ay))
                    .add(pointOnLine)
                    .add(normal.clone().scale(r));

                lineA = lines[i];
                lineB = lines[i+1];

                x = restore.x;
                y = restore.y;
                lined = true;
            }
        }
    }

    if (lined) return {
        normal: normal!.getRaw(),
        restore: restore!.getRaw(),
        lineA: lineA!, 
        lineB: lineB!
    };

    for (let i = 0; i < lines.length; i++) {
        const delta = new Vec2 (x - lines[i][0], y - lines[i][1]);
        if (delta.magnitude2() < r2) {
            const norm = delta.normalize();
            return {
                normal: norm.getRaw(),
                restore: (new Vec2 (lines[i][0],lines[i][1])).add(norm.clone().scale(r)).getRaw(),
                lineA: lines[i],
                lineB: lines[i]
            };
        }
    }

    return null;
};