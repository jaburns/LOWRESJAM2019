import { vec2 } from "gl-matrix";

type Pt = {
    pt: vec2,
    controlA: vec2,
    controlB: vec2,
};

export const smoothCurve = (input: ReadonlyArray<vec2>, resolution: number, curviness: number): vec2[] => {
    const pts: Pt[] = [];

    if (resolution < 1) resolution = 1;

    for (let i = 0; i < input.length; ++i) {
        const prev = input[i == 0 ? input.length-1 : i-1];
        const curr = input[i];
        const next = input[(i + 1) % input.length];

        const lenA = vec2.length(vec2.sub(vec2.create(), prev, curr));
        const lenB = vec2.length(vec2.sub(vec2.create(), curr, next));

        let midA = vec2.add(vec2.create(), prev, curr);
        vec2.scale(midA, midA, 0.5);

        let midB = vec2.add(vec2.create(), curr, next);
        vec2.scale(midB, midB, 0.5);

        let midDiff = vec2.sub(vec2.create(), midA, midB);
        vec2.scale(midDiff, midDiff, curviness);

        const diffA = vec2.scale(vec2.create(), midDiff,  lenA / (lenA + lenB));
        const diffB = vec2.scale(vec2.create(), midDiff, -lenB / (lenA + lenB));

        pts.push({
            pt: curr,
            controlA: vec2.add(vec2.create(), diffA, curr),
            controlB: vec2.add(vec2.create(), diffB, curr),
        });
    }

    const inc = 1 / resolution;

    const result: vec2[] = [];
    for (let i = 0; i < pts.length; ++i) {
        const curr = pts[i];
        const next = pts[(i + 1) % pts.length];

        for (let t = 0; t < 1 - (inc / 2); t += inc) {
            let newVal: vec2 = vec2.fromValues(0, 0);

            vec2.scaleAndAdd(newVal, newVal, curr.pt       , (1-t)*(1-t)*(1-t));
            vec2.scaleAndAdd(newVal, newVal, curr.controlB , 3*(1-t)*(1-t)*t);
            vec2.scaleAndAdd(newVal, newVal, next.controlA , 3*(1-t)*t*t);
            vec2.scaleAndAdd(newVal, newVal, next.pt       , t*t*t);

            result.push(newVal);
        }
    }

    return result;
};