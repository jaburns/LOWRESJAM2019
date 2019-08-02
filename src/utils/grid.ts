export type Grid<T> = {
    readonly width: number;
    readonly height: number;
    at(x: number, y: number): T;
};

export type GridCallback<T> = (x: number, y: number, val: T) => void;
export type GridMapper<T,U> = (x: number, y: number, val: T) => U;

export class WriteGrid<T> implements Grid<T> {
    public readonly width: number;
    public readonly height: number;

    private vals: T[];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.vals = new Array(width * height);
    }

    write(x: number, y: number, val: T): void {
        this.vals[x + y*this.width] = val;
    }

    at(x: number, y: number): T {
        return this.vals[x + y*this.width];
    }

    copyFrom(grid: Grid<T>): void {
        for (let x = 0; x < this.width && x < grid.width; ++x) {
            for (let y = 0; y < this.height && y < grid.height; ++y) {
                this.write(x, y, grid.at(x, y));
            }
        }
    }
}

export const safeOutOfBounds = <T>(grid: Grid<T>, oobValue: T): Grid<T> => ({
    width: grid.width,
    height: grid.height,
    at: (x, y) => x < 0 || y < 0 || x >= grid.width || y >= grid.width ? oobValue : grid.at(x, y)
});

export const Grid = {
    find: <T>(grid: Grid<T>, test: GridMapper<T, boolean>): { x: number, y: number } | null => {
        for (let x = 0; x < grid.width; ++x) {
            for (let y = 0; y < grid.height; ++y) {
                if (test(x, y, grid.at(x, y))) {
                    return { x, y };
                }
            }
        }
        return null;
    },

    forEach: <T>(grid: Grid<T>, fn: GridCallback<T>): void => {
        for (let x = 0; x < grid.width; ++x) {
            for (let y = 0; y < grid.height; ++y) {
                fn(x, y, grid.at(x, y));
            }
        }
    },

    map: <T, U>(grid: Grid<T>, fn: GridMapper<T, U>): WriteGrid<U> => {
        const result = new WriteGrid<U>(grid.width, grid.height);

        for (let x = 0; x < grid.width; ++x) {
            for (let y = 0; y < grid.height; ++y) {
                result.write(x, y, fn(x, y, grid.at(x, y)));
            }
        }

        return result;
    },
};