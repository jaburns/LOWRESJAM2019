// https://en.wikipedia.org/wiki/Linear_congruential_generator

const M = 4294967296;
const A = 1664525;
const C = 1013904223;

export class PRNG {
    static readonly MAX_SEED: number = M - 1;

    static getRandomSeed(): number {
        return Math.floor(Math.random() * M);
    }

    private seed: number;

    constructor(seed?: number) {
        if (typeof seed !== 'undefined') {
            this.seed = Math.floor(seed) % M;
        } else {
            this.seed = PRNG.getRandomSeed();
        }
    }

    next(): number {
        this.seed = (A * this.seed + C) % M;
        return this.seed / M;
    }
}