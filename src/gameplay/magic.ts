type NumberRange = {
    readonly lower: number,
    readonly upper: number,
};

type Magic<T> = {
    bgParallax:       T,
    bgSurfaceDepth:   T, 
    bgBrightness:     T,
    caveSurfaceDepth: T,
    caveBrightness:   T,
    fireSurfaceDepth: T,
    fireBrightness:   T,
    fireShipDistance: T,
    lampSurfaceDepth: T,
    lampBrightness:   T,
    lampPlacement:    T,
    doorLightSurfaceDepth: T,
    doorLightBrightness:   T,
    doorLightYpos:         T,
    doorLightXposRed:      T,
    doorLightXposGreen:    T,
    enemySurfaceDepth: T,
    enemyBrightness:   T,
    enemyLightDist:    T,
};

export const magicRange: Magic<NumberRange> = {
    bgParallax:       { lower: 1, upper: 4 },
    bgSurfaceDepth:   { lower: 0, upper: 1 },
    bgBrightness:     { lower: 0, upper: 1 },
    caveSurfaceDepth: { lower: 0, upper: 1 },
    caveBrightness:   { lower: 0, upper: 1 },
    fireSurfaceDepth: { lower: -1, upper: 1 },
    fireBrightness:   { lower: 0, upper: 1 },
    fireShipDistance: {lower: 0, upper: 0.2},
    lampSurfaceDepth: { lower: -.1, upper: .1 },
    lampBrightness:   { lower: 0, upper: 1 },
    lampPlacement: { lower: -.1, upper: .1 },

    doorLightSurfaceDepth: { lower: -.1, upper: .1 },
    doorLightBrightness:   { lower: 0, upper: 1 },
    doorLightYpos: { lower: -.1, upper: .1 },
    doorLightXposRed: { lower: -.1, upper: .1 },
    doorLightXposGreen: { lower: -.1, upper: .1 },

    enemySurfaceDepth: { lower: -.1, upper: .1 },
    enemyBrightness:   { lower: 0, upper: 1 },
    enemyLightDist: { lower: -.1, upper: .1 },
};

export let magic: Magic<number> =

// PAASSTTEE ============================================



{bgParallax:4,bgSurfaceDepth:0.09,bgBrightness:0.58,caveSurfaceDepth:0.07,caveBrightness:0.17,fireSurfaceDepth:-0.06,fireBrightness:0.09,fireShipDistance:0.018,lampSurfaceDepth:-0.032,lampBrightness:0.22,lampPlacement:0.018,doorLightSurfaceDepth:-0.052,doorLightBrightness:0.08,doorLightYpos:0.014,doorLightXposRed:0.006,doorLightXposGreen:-0.004,enemySurfaceDepth:-0.066,enemyBrightness:0.09,enemyLightDist:0.014}

// =======================================================

;
