import { vec2 } from "gl-matrix";

export type Rect = {
    xmin: number,
    ymin: number,
    xmax: number,
    ymax: number,
};

export const RectTool = {
    area: (r: Rect): number =>
        (r.xmax - r.xmin) * (r.ymax - r.ymin),
};

export const smallestDifferenceRadians = (a: number, b: number): number => {
    a %= 2 * Math.PI;
    b %= 2 * Math.PI;

    if (Math.abs(a - b) > Math.PI) {
        if (a > 0) a -= 2 * Math.PI;
        else a += 2 * Math.PI;
    }

    return a - b;
};

export const lerpRadians = (a: number, b: number, t: number): number =>
    a + t * smallestDifferenceRadians(b, a);

export const findBounds = (pts: ReadonlyArray<vec2>): Rect => {
    const result: Rect = { xmin: Infinity, ymin: Infinity, xmax: -Infinity, ymax: -Infinity };

    pts.forEach(p => {
        if (p[0] < result.xmin) result.xmin = p[0];
        if (p[1] < result.ymin) result.ymin = p[1];
        if (p[0] > result.xmax) result.xmax = p[0];
        if (p[1] > result.ymax) result.ymax = p[1];
    });

    return result;
};