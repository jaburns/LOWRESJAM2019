import { vec2 } from "gl-matrix";

type Enemy = {angle:number, pos:vec2};

export type CavePlacements = {
    enemies: Enemy[],
    floorMid: vec2,
    dudes: vec2[],
    door: vec2,
};

export const getCavePlacements = (lines: vec2[][]): CavePlacements => {
    const floorCandidates: {m: vec2, t: vec2}[] = [];
    let enemyCandidates: {m: vec2, t: vec2}[] = [];

    lines.forEach(blob => {
        for (let i = 0; i < blob.length; ++i) {
            const j = (i + 1) % blob.length;

            const diff = vec2.sub(vec2.create(), blob[i], blob[j]);
            vec2.normalize(diff, diff);
            const dir = vec2.dot(diff, [1,0]);
            const mid = vec2.add(vec2.create(), blob[i], blob[j]);
            vec2.scale(mid, mid, 0.5);

                if (blob[i][0] < -.9 || blob[j][0] < -0.9
                 || blob[i][1] < -.9 || blob[j][1] < -0.9
                 || blob[i][1] >  .9 || blob[j][1] >  0.9
                 || blob[i][0] >  .9 || blob[j][0] >  0.9) {
                }
                else 
                    enemyCandidates.push({m: mid, t: diff});

            if ((Math.abs(diff[0]) - Math.abs(diff[1]) > 0.5) && dir < 0) {

                if (blob[i][0] < -.9 || blob[j][0] < -0.9
                 || blob[i][1] < -.9 || blob[j][1] < -0.9
                 || blob[i][1] >  .9 || blob[j][1] >  0.9
                 || blob[i][0] >  .9 || blob[j][0] >  0.9) {
                }
                else 
                    floorCandidates.push({m: mid, t: diff});
            }
        }
    });


    const lower: vec2 = vec2.create();
    const upper: vec2 = vec2.create();

    floorCandidates.forEach(x => {
        if (x.m[0] < lower[0]) lower[0] = x.m[0];
        if (x.m[1] < lower[1]) lower[1] = x.m[1];
        if (x.m[0] > upper[0]) upper[0] = x.m[0];
        if (x.m[1] > upper[1]) upper[1] = x.m[1];
    });

    const mid = vec2.fromValues(
        (lower[0] + upper[0]) / 2,
        (lower[1] + upper[1]) / 2
    );

    const findFloor = (corno: vec2 | number[]): vec2 => {
        let ret: vec2 = vec2.create();
        let dist = 1000000;
        floorCandidates.forEach(x => {
            const d = vec2.sqrDist(x.m, corno);
            if (d < dist) {
                dist = d;
                ret = x.m;
            }
        });
        return ret;
    };

    const findFlatestClose = (v: vec2): vec2 => {
        const CLOSE = 0.05;

        let flattest = 1;

        const ret = vec2.clone(v);
        floorCandidates.forEach(x => {
            const d = vec2.sqrDist(x.m, v);
            if (d < CLOSE * CLOSE) {
                if (Math.abs(x.t[1]) < flattest) {
                    flattest = Math.abs(x.t[1]);
                    vec2.copy(ret, x.m);
                }
            }
        });

        return ret;
    };

    let door = findFloor(mid);
    let dudes = [
        [1,1], [1,-1], [-1,1], [-1,-1],
        [0,1], [0,-1], [-1,0], [1,0],
        [1-2*Math.random(), 1-2*Math.random()],
        [1-2*Math.random(), 1-2*Math.random()]
    ].map(findFloor);

    door = findFlatestClose(door);

    for (let tries = 0; tries < 10; ++tries) {
        for (let i = dudes.length - 2; i >= 0; --i) {
            for (let j = i+1; j < dudes.length; ++j) {
                if (vec2.sqrDist(dudes[i], dudes[j]) < ((10-tries) / 256) * ((10-tries) / 256)) {
                    dudes.splice(j, 1);
                }
            }
        }

        if (dudes.length === 10) break;

        while (dudes.length < 10) {
            dudes.push(findFloor([1-2*Math.random(), 1-2*Math.random()]));
        }
    }

    const ENEMY_DIST_FROM_DUDE = 0.01;
    const ENEMY_MUTUAL_DISTANCE= 0.1;

    enemyCandidates = enemyCandidates.filter(y => vec2.sqrDist(door, y.m) > ENEMY_DIST_FROM_DUDE);
    dudes.forEach(x => { enemyCandidates = enemyCandidates.filter(y => vec2.sqrDist(x, y.m) > ENEMY_DIST_FROM_DUDE); });

    let enemies: Enemy[] = [];
    while (enemyCandidates.length > 0) {
        const newEnemy = enemyCandidates[Math.floor(Math.random() * enemyCandidates.length)];
        enemies.push({
            pos: newEnemy.m,
            angle: Math.atan2(-newEnemy.t[0], newEnemy.t[1])
        });
        enemyCandidates = enemyCandidates.filter(y => vec2.sqrDist(newEnemy.m, y.m) > ENEMY_MUTUAL_DISTANCE);
    }

    door[1] += 4/256;
    dudes.forEach(x => x[1] += 3/256);

    return {
        floorMid: mid,
        door,
        dudes,
        enemies
    };
};
