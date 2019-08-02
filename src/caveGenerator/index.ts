import { WriteGrid, Grid, safeOutOfBounds } from 'utils/grid';
import { runCellularAutomaton } from './automaton';
import { markEdges, findContours, EdgeMarkedMapTile, FindContoursResult } from './findContours';
import { smoothCurve } from './smoothCurve';
import { findBounds, RectTool } from 'utils/math';
import { triangulate } from './triangulate';
import { vec2 } from 'gl-matrix';

export type Cave = {
    edges: vec2[][],
    triangles: number[][],
};

export type CaveBuildDetails = {
    automatonResult: Grid<boolean>,
    coloredGrid: Grid<number>,
    filledGrid: Grid<boolean>,
    edgeMarkedGrid: Grid<EdgeMarkedMapTile>,
    findContoursResult: FindContoursResult,
    outerMostContourIndex: number,
    topLeftMostVertexIndex: number,
};

const floodFill = (grid: WriteGrid<number>, x: number, y: number, replace: number, value: number, count: number): number => {
    if (x < 0 || y < 0) return count;
    if (x >= grid.width || y >= grid.height) return count;

    const tile = grid.at(x, y);

    if (tile === value) return count;
    if (tile !== replace) return count;

    grid.write(x, y, value);
    count++;

    count = floodFill(grid, x - 1, y, replace, value, count);
    count = floodFill(grid, x + 1, y, replace, value, count);
    count = floodFill(grid, x, y - 1, replace, value, count);
    count = floodFill(grid, x, y + 1, replace, value, count);
    return count;
};

const colorGridRegions = (grid: WriteGrid<number>): number => {
    let color = 1;
    let largestColor = -1;
    let largestRegion = 0;

    while (true) {
        const pos = Grid.find(grid, (x, y, val) => val === 0);
        if (pos === null) return largestColor;

        const size = floodFill(grid, pos.x, pos.y, 0, color, 0);

        if (size > largestRegion) {
            largestRegion = size;
            largestColor = color;
        }

        color++;
    }
};

const fixSingleTileBridges = (grid: WriteGrid<boolean>): void => {
    Grid.forEach(safeOutOfBounds(grid, true), (x, y, val) => {
        if (!val) return;

        if (val && !grid.at(x - 1, y) && !grid.at(x + 1, y)) {
            grid.write(x + 1, y, true);
        }

        if (val && !grid.at(x, y - 1) && !grid.at(x, y + 1)) {
            grid.write(x, y + 1, true);
        }
    });
};

export const generateCave = (seed: number): Cave => 
    generateCaveVerbose(seed).cave;

export const generatePartialAutomatonResult = (seed: number, generation: number): Grid<boolean> =>
    runCellularAutomaton(75, 75, seed, 0.48, 5, 4, generation);

export const generateCaveVerbose = (seed: number): { cave: Cave, details: CaveBuildDetails } => {
    const automatonResult = runCellularAutomaton(75, 75, seed, 0.48, 5, 4, 30);

    const coloredGrid = Grid.map(automatonResult, (x, y, val) => val ? -1 : 0);
    const bigColor = colorGridRegions(coloredGrid);

    const filledGrid = Grid.map(coloredGrid, (x, y, val) => val !== bigColor);
    fixSingleTileBridges(filledGrid);

    const edgeMarkedGrid = markEdges(filledGrid);

    const findContoursResult = findContours(edgeMarkedGrid, 2);

    const outerMostContourIndex = findContoursResult.contours
        .map((c, i) => ({ i, area: RectTool.area(findBounds(c)) }))
        .sort((a, b) => b.area - a.area)
        [0].i;

    const smoothContours = findContoursResult.contours.map(x => smoothCurve(x, 10, 0.7));

    const BOUNDS = 1.0;

    const mostTopLeft = (pts: vec2[]): number =>
        pts.map((p, i) => ({ i, len: (p[0]+BOUNDS)*(p[0]+BOUNDS) + (p[1]+BOUNDS)*(p[1]+BOUNDS) }))
            .sort((a, b) => a.len - b.len)
            [0].i;

    const topLeftPtI = mostTopLeft(smoothContours[outerMostContourIndex]);
    const topLeftPt = smoothContours[outerMostContourIndex][topLeftPtI];
    const topLeftPrevPt = smoothContours[outerMostContourIndex][topLeftPtI === 0 ? smoothContours[outerMostContourIndex].length - 1 : topLeftPtI - 1];

    const bumpDownAmount = Math.abs(topLeftPt[1] - topLeftPrevPt[1]);

    smoothContours[outerMostContourIndex].splice(topLeftPtI, 0,
        vec2.fromValues( -BOUNDS,  -BOUNDS+bumpDownAmount),
        vec2.fromValues( -BOUNDS,   BOUNDS),
        vec2.fromValues(  BOUNDS,   BOUNDS),
        vec2.fromValues(  BOUNDS,  -BOUNDS),
        vec2.fromValues( -BOUNDS,  -BOUNDS),
        vec2.fromValues( 
            (topLeftPt[0] + topLeftPrevPt[0]) / 2, 
            (topLeftPt[1] + topLeftPrevPt[1]) / 2
        )
    );

    const triangles = smoothContours.map(triangulate);

    smoothContours[outerMostContourIndex][topLeftPtI][1] -= bumpDownAmount;
    smoothContours[outerMostContourIndex][topLeftPtI+5][0] = topLeftPrevPt[0];
    smoothContours[outerMostContourIndex][topLeftPtI+5][1] = topLeftPrevPt[1];

    return {
        cave: {
            edges: smoothContours,
            triangles
        },
        details: {
            automatonResult,
            coloredGrid,
            filledGrid,
            edgeMarkedGrid,
            findContoursResult,
            outerMostContourIndex,
            topLeftMostVertexIndex: topLeftPtI
        }
    };
};
