import { PRNG } from 'utils/prng';
import { WriteGrid, Grid } from 'utils/grid';

const getNeighborhood = (map: Grid<boolean>, x: number, y: number): number => {
    let result: number = 0;

    for (let nx = x-1; nx <= x+1; ++nx) {
        for (let ny = y-1; ny <= y+1; ++ny) {
            if (nx == x && ny == y) continue;
            if (nx < 1 || ny < 1 || nx >= map.width-1 || ny >= map.height-1) result++;
            else result += map.at(nx,ny) ? 1 : 0;
        }
    }

    return result;
}

export const runCellularAutomaton = (width: number, height: number, seed: number, population: number, birth: number, survival: number, iterations: number): Grid<boolean> => {
    const result = new WriteGrid<boolean>(width, height);
    const buffer = new WriteGrid<boolean>(width, height);
    const rng = new PRNG(seed);

    for (let x = 0; x < width; ++x) {
        for (let y = 0; y < height; ++y) {
            const fill = x === 0 || y === 0 || x === width-1 || y === height-1 || rng.next() < population;
            result.write(x, y, fill);
            buffer.write(x, y, fill);
        }
    }

    for (let i = 0; i < iterations; ++i) {
        for (let x = 1; x < width-1; ++x) {
            for (let y = 1; y < height-1; ++y) {
                const neighbors = getNeighborhood(result, x, y);
                buffer.write(x, y, neighbors >= (result.at(x, y) ? survival : birth));
            }
        }
        result.copyFrom(buffer);
    }

    return result;
}