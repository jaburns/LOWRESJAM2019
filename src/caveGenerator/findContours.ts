import { WriteGrid, Grid, safeOutOfBounds } from 'utils/grid';
import { smallestDifferenceRadians } from 'utils/math';
import { vec2 } from 'gl-matrix';

export type EdgeMarkedMapTile = {
    kind: 'air' | 'dirt' | 'edge',
    normal: number,
};

export const markEdges = (grid: Grid<boolean>): WriteGrid<EdgeMarkedMapTile> => {
    const result = Grid.map(grid, (x, y, val): EdgeMarkedMapTile => 
        ({ kind: val ? 'dirt' : 'air', normal: 0 }));

    for (let x = 0; x < grid.width; x++) {
        for (let y = 0; y < grid.height; y++) {
            if (!grid.at(x, y)) continue;

            const l = x > 0               && !grid.at(x-1, y);
            const r = x < grid.width - 2  && !grid.at(x+1, y);
            const u = y > 0               && !grid.at(x, y-1);
            const d = y < grid.height - 2 && !grid.at(x, y+1);

            if (!l && !r && !u && !d) continue;

            const normal = r && d ? 45 :
                d && l ?  135 :
                l && u ? -135 :
                u && r ?  -45 :
                r ? 0 :
                d ? 90 :
                l ? 180 :
                -90;

            result.write(x, y, { kind: 'edge', normal });
        }
    }

    return result;
};

export enum WalkedStatus {
    Unwalked,
    Walked,
    WalkedImportant,
}

type WalkCandidate = {
    dx: number,
    dy: number,
    normal: number,
};

type GridPoint = {
    x: number,
    y: number,
};

export type FindContoursResult = {
    contours: vec2[][],
    walkMap: WriteGrid<WalkedStatus>,
};

export const findContours = (grid: Grid<EdgeMarkedMapTile>, spaceInsurance: 0 | 1 | 2): FindContoursResult => {
    const MAX_ITER = 100;
    const walkMap = Grid.map(new WriteGrid<WalkedStatus>(grid.width, grid.height), _ => WalkedStatus.Unwalked);
    const contours: vec2[][] = [];

    let iter = 0;
    let newContour: vec2[] | null = null;

    do {
        newContour = findOneContour(walkMap, grid, spaceInsurance);
        if (newContour !== null && newContour.length > 2) {
            contours.push(newContour);
        }
    } while (newContour != null && iter++ < MAX_ITER);

    return { contours, walkMap };
}

const findFreshContour = (walkMap: Grid<WalkedStatus>, grid: Grid<EdgeMarkedMapTile>): GridPoint | null => {
    for (let x = 0; x < grid.width; x++) {
        for (let y = 0; y < grid.height; y++) {
            if (grid.at(x, y).kind === 'edge' && walkMap.at(x, y) === WalkedStatus.Unwalked) {
                return { x, y };
            }
        }
    }

    return null;
};

const bestCandidate = (prev: WalkCandidate, candidates: WalkCandidate[]): WalkCandidate => {
    let minVal = 100;
    let minI = 0;

    for (let i = 0; i < candidates.length; ++i) {
        const c = candidates[i];
        const d = Math.abs(smallestDifferenceRadians(
            c.normal * Math.PI / 180,
            prev.normal * Math.PI / 180
        ));

        if (d < minVal) {
            minVal = d;
            minI = i;
        }
    }

    return candidates[minI];
};

const findOneContour = (walkMap: WriteGrid<WalkedStatus>, grid: Grid<EdgeMarkedMapTile>, spaceInsurance: 0 | 1 | 2): vec2[] | null => {
    const MAX_ITER = 5000;

    const freshStart = findFreshContour(walkMap, grid);
    if (freshStart === null) {
        return null;
    }

    grid = safeOutOfBounds(grid, {kind: 'dirt', normal: 0} as EdgeMarkedMapTile);

    const points: vec2[] = [];
    let x = freshStart.x;
    let y = freshStart.y;

    let iter = 0;
    let lastCan: WalkCandidate = { dx: 0, dy: 0, normal: 0 };
    let lastStatus = WalkedStatus.Walked;
    let candidates: WalkCandidate[] = [];

    do {
        candidates = [];

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                if (grid.at(x+dx, y+dy).kind === 'edge'
                && walkMap.at(x+dx, y+dy) === WalkedStatus.Unwalked) {
                    candidates.push({dx, dy, normal: grid.at(x+dx, y+dy).normal});
                }
            }
        }

        if (candidates.length > 0) {
            const c = bestCandidate(lastCan, candidates);
            x += c.dx;
            y += c.dy;

            let newStatus = WalkedStatus.Walked;
            if (c.normal !== lastCan.normal) {
                let important;
                if (spaceInsurance === 0) {
                    important = true;
                } else if (spaceInsurance === 1) {
                    important = c.dx != 0 && c.dy != 0 || lastStatus != WalkedStatus.WalkedImportant;
                } else {
                    important = lastStatus != WalkedStatus.WalkedImportant;
                }

                if (important) {
                    newStatus = WalkedStatus.WalkedImportant;
                }
            }

            if (newStatus === WalkedStatus.WalkedImportant) {
                points.push(vec2.fromValues(
                    2*(x + 0.5)/grid.width - 1,
                    2*(y + 0.5)/grid.height - 1,
                ));
            }

            walkMap.write(x, y, newStatus);
            lastStatus = newStatus;
            lastCan = c;
        }
    }
    while (candidates.length > 0 && iter++ < MAX_ITER);

    return points;
};