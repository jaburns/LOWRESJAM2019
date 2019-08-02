import { vec2 } from 'gl-matrix';

export const triangulate = (points: ReadonlyArray<vec2>): number[] => {
    const indices: number[] = [];
    const n = points.length;
    if (n < 3) return indices;

    const V: number[] = new Array(n);
    if (area(points) > 0) {
        for (let v = 0; v < n; v++) V[v] = v;
    } else {
        for (let v = 0; v < n; v++) V[v] = (n - 1) - v;
    }

    let nv = n;
    let count = 2 * nv;
    for (let v = nv - 1; nv > 2; ) {
        if ((count--) <= 0) return indices;

        let u = v;
        if (nv <= u) u = 0;
        v = u + 1;
        if (nv <= v) v = 0;
        let w = v + 1;
        if (nv <= w) w = 0;

        if (snip(points, u, v, w, nv, V)) {
            indices.push(V[u]);
            indices.push(V[v]);
            indices.push(V[w]);
            for (let s = v, t = v + 1; t < nv; s++, t++) V[s] = V[t];
            nv--;
            count = 2 * nv;
        }
    }

    return indices;
};

const area = (points: ReadonlyArray<vec2>): number => {
    let A = 0;
    for (let p = points.length - 1, q = 0; q < points.length; p = q++) {
        A += points[p][0] * points[q][1] - points[q][0] * points[p][1];
    }
    return A / 2;
};

const insideTriangle = (A: vec2, B: vec2, C: vec2, P: vec2): boolean => {
    const ax = C[0] - B[0], ay = C[1] - B[1];
    const bx = A[0] - C[0], by = A[1] - C[1];
    const cx = B[0] - A[0], cy = B[1] - A[1];
    const apx = P[0] - A[0], apy = P[1] - A[1];
    const bpx = P[0] - B[0], bpy = P[1] - B[1];
    const cpx = P[0] - C[0], cpy = P[1] - C[1];

    const aCROSSbp = ax * bpy - ay * bpx;
    const cCROSSap = cx * apy - cy * apx;
    const bCROSScp = bx * cpy - by * cpx;

    return aCROSSbp >= 0 && bCROSScp >= 0 && cCROSSap >= 0;
};

const snip = (points: ReadonlyArray<vec2>, u: number, v: number, w: number, n: number, V: number[]): boolean => {
    const A = points[V[u]];
    const B = points[V[v]];
    const C = points[V[w]];

    const pdiff = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
    if (pdiff < 1e-7) return false;

    for (let p = 0; p < n; p++) {
        if ((p == u) || (p == v) || (p == w)) continue;
        const P = points[V[p]];
        if (insideTriangle(A, B, C, P)) return false;
    }

    return true;
};