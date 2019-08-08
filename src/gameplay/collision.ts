import { vec2, vec3 } from "gl-matrix";

type CollisionResult = {
    normal: vec2,
    restore: vec2,
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
        return vec2.cross(vec3.create(), this.v, vec2.fromValues(a.x, a.y))[2]; // maybe negative of this
    }

    add(a: Vec2): Vec2 {
        vec2.add(this.v, this.v, vec2.fromValues(a.x, a.y));
        return this;
    }

    getRaw(): vec2 {
        return this.v;
    }
}

const pointInLinePerpSpace = (ax: number, ay: number, bx: number, by: number, x: number, y: number): boolean => {
    const perpSlope = (ax-bx)/(by-ay);

    if (perpSlope > 1) {
        const oax = ax, obx = bx, ox = x;
        ax =  ay; bx =  by; x =  y;
        ay = oax; by = obx; y = ox;
    }

    let yMin: number, yMax: number;
    if (ay > by) {
        yMin = perpSlope*(x - bx) + by;
        yMax = perpSlope*(x - ax) + ay;
    } else {
        yMin = perpSlope*(x - ax) + ay;
        yMax = perpSlope*(x - bx) + by;
    }

    return y > yMin && y < yMax;
};

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


const circleCollisionStep = (lines: vec2[], x :number, y :number, r :number) :CollisionResult | null => {
    const r2 = r*r;

    let lined = false;
    let normal: Vec2 | null = null;
    let restore: Vec2 | null = null;

    for (let i = 0; i < lines.length - 1; i++) {
        const ax = lines[i][0];
        const ay = lines[i][1];
        const bx = lines[i+1][0];
        const by = lines[i+1][1];

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

                x = restore.x;
                y = restore.y;
                lined = true;
            }
        }
    }

    if (lined) return {
        normal: normal!.getRaw(),
        restore: restore!.getRaw(),
    };

    for (let i = 0; i < lines.length - 1; i++) {
        const delta = new Vec2 (x - lines[i][0], y - lines[i][1]);
        if (delta.magnitude2() < r2) {
            const norm = delta.normalize();
            return {
                normal: norm.getRaw(),
                restore: (new Vec2 (lines[i][0],lines[i][1])).add(norm.clone().scale(r)).getRaw()
            };
        }
    }

    return null;
};

export const circleCollision = (lines: vec2[], x0: number,y0: number,x1: number,y1: number,r: number): CollisionResult | null => {
    const r2 = r * r;
    let dx = x1 - x0;
    let dy = y1 - y0;
    const d2 = dx*dx + dy*dy;

    let col = circleCollisionStep(lines,x1,y1,r);
    if (col) return col;
    if (d2 < r2) return null;

    const dist = Math.sqrt (d2);
    const stepx = r * (dx / dist);
    const stepy = r * (dy / dist);

    do {
        x0 += stepx;
        y0 += stepy;

        col = circleCollisionStep(lines,x0,y0,r);
        if (col) return col;

        dx = x1 - x0;
        dy = y1 - y0;
    }
    while (dx*dx + dy*dy >= r2);

    return circleCollisionStep(lines,x1,y1,r);
}