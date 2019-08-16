type NumberRange = {
    readonly lower: number,
    readonly upper: number,
};

type Magic<T> = {
    bgParallax:       T,
    bgSurfaceDepth:   T, 
    bgBrightness:     T,
    caveSurfaceDepth: T,
    caveBrightness:   T
};

export const magicRange: Magic<NumberRange> = {
    bgParallax:       { lower: 1, upper: 4 },
    bgSurfaceDepth:   { lower: 0, upper: 1 },
    bgBrightness:     { lower: 0, upper: 1 },
    caveSurfaceDepth: { lower: 0, upper: 1 },
    caveBrightness:   { lower: 0, upper: 1 },
};

export let magic: Magic<number> =

{bgParallax:2.05,bgSurfaceDepth:0.09,bgBrightness:0.58,caveSurfaceDepth:0.07,caveBrightness:0.17}

;
