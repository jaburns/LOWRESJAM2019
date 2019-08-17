import { vec2 } from "gl-matrix";
import { InputState } from "./inputs";
import { circleCollision } from "./collision";
import { Cave, generateCave } from "caveGenerator";
import { magic } from "./magic";
import { END_FADE, GameRenderer } from "graphics/gameRenderer";

const DUDE_COLLECT_SQR_DIST = 0.025 * 0.025;
const DOOR_COLLECT_SQR_DIST = 0.015 * 0.015;

let globalGL: WebGLRenderingContext;

export type Light = {
    pos: vec2,
    depth: number,
    brightness: number,
    colorIndex: number,
};

export type GameSceneState = {
    scene: 'game',
    cave: Cave,
    time: number,
    shipFiring: boolean,
    playerPos: vec2,
    playerRads: number,
    playerVel: vec2,
    cameraPos: vec2,
    cameraShake: vec2,
    cameraShakeT: number,
    rolls: number[],
    dudes: vec2[],
    wonTime: number,
};

export type TransitionSceneState = {
    scene: 'transition',
    newCave: Cave,
    newGameRenderer: GameRenderer,
    time: number,
};

export type GameState = GameSceneState | TransitionSceneState;

export const getLightsForGameState = (state: GameState): Light[] => {
    if (state.scene !== 'game') return [];

    const ret = [{
        pos: vec2.fromValues(
            state.playerPos[0],
            state.playerPos[1]
        ),
        depth: 0,
        brightness: magic.caveBrightness,
        colorIndex: 0
    }];

    if (state.wonTime < 0 && state.shipFiring) {
        ret.push({
            pos: vec2.fromValues(
                state.playerPos[0] - magic.fireShipDistance*Math.cos(state.playerRads),
                state.playerPos[1] - magic.fireShipDistance*Math.sin(state.playerRads),
            ),
            depth: magic.fireSurfaceDepth,
            brightness: state.shipFiring ? magic.fireBrightness : 0,
            colorIndex: 1
        });
    }

    state.dudes.forEach(dude => {
        ret.push({
            pos: vec2.fromValues(dude[0], dude[1]+magic.lampPlacement),
            depth: magic.lampSurfaceDepth,
            brightness: magic.lampBrightness,
            colorIndex: 2
        });
    });

    if (state.dudes.length > 0) {
        ret.push({
            pos: vec2.fromValues(state.cave.placements.door[0]+magic.doorLightXposRed, state.cave.placements.door[1]+magic.doorLightYpos),
            depth: magic.doorLightSurfaceDepth,
            brightness: magic.doorLightBrightness,
            colorIndex: 3,
        });
    } else {
        ret.push({
            pos: vec2.fromValues(state.cave.placements.door[0]+magic.doorLightXposGreen, state.cave.placements.door[1]+magic.doorLightYpos),
            depth: magic.doorLightSurfaceDepth,
            brightness: magic.doorLightBrightness,
            colorIndex: 4,
        });
    }

    return ret;
};

const stepGameScene = (prevState: GameSceneState, inputs: InputState): GameState => {
    if (prevState.wonTime > 0 && prevState.time > prevState.wonTime + END_FADE) {
        return GameState.createTransition(globalGL);
    }

    const state: GameSceneState = {
        scene: 'game',
        cave: prevState.cave as any,
        time: prevState.time + 1,
        shipFiring: inputs.mouseDown,
        playerPos: vec2.clone(prevState.playerPos as any), 
        playerRads: inputs.mouseRads,
        playerVel: vec2.clone(prevState.playerVel as any),
        cameraPos: vec2.clone(prevState.cameraPos as any),
        cameraShake: vec2.clone(prevState.cameraShake as any), 
        cameraShakeT: prevState.cameraShakeT + 1,
        rolls: [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()],
        dudes: prevState.dudes as any,
        wonTime: prevState.wonTime,
    };

    const alreadyWon = state.wonTime > 0;

    if (alreadyWon) {
        state.playerVel[0] *= 0.95;
        state.playerVel[1] *= 0.95;
    } 
    else {
        state.playerVel[1] -= 2.5e-5;

        if (inputs.mouseDown) {
            state.playerVel[0] += 9e-5 * Math.cos(state.playerRads);
            state.playerVel[1] += 9e-5 * Math.sin(state.playerRads);
        }
    }

    vec2.add(state.playerPos, state.playerPos, state.playerVel);

    vec2.scale(state.cameraShake, state.cameraShake, 0.87);

    const targetCameraPos = vec2.clone(state.playerVel);
    vec2.scale(targetCameraPos, targetCameraPos, 20);
    vec2.add(targetCameraPos, targetCameraPos, state.playerPos);

    state.cameraPos[0] += (targetCameraPos[0] - state.cameraPos[0]) / 10;
    state.cameraPos[1] += (targetCameraPos[1] - state.cameraPos[1]) / 10;

    if (alreadyWon) return state;

    state.cave.edges.forEach(blob => {
        const col = circleCollision(blob, state.playerPos[0], state.playerPos[1], 3 / 256);

        if (col) {
            state.playerPos[0] = col.restore[0];
            state.playerPos[1] = col.restore[1];

            const tangent = vec2.fromValues(col.normal[1], -col.normal[0]);

            let normVelLen = vec2.dot(state.playerVel, col.normal);
            let tangVelLen = vec2.dot(state.playerVel, tangent);

            normVelLen *= -.5;
            tangVelLen *= .9;

            const v0 = vec2.clone(col.normal);
            const v1 = vec2.clone(tangent);

            const normVel = vec2.scale(v0, v0, normVelLen);
            const tangVel = vec2.scale(v1, v1, tangVelLen);

            const X = vec2.fromValues(1, 0);
            const Y = vec2.fromValues(0, 1); 

            const newVX = vec2.dot(normVel, X) + vec2.dot(tangVel, X);
            const newVY = vec2.dot(normVel, Y) + vec2.dot(tangVel, Y);

            state.cameraShakeT = 0;
            state.cameraShake[0] = 4 * (newVX - state.playerVel[0]);
            state.cameraShake[1] = 4 * (newVY - state.playerVel[1]);

            state.playerVel[0] = newVX;
            state.playerVel[1] = newVY;
        }
    });

    for (let i = state.dudes.length - 1; i >= 0; --i) {
        if (vec2.sqrDist(state.dudes[i], state.playerPos) < DUDE_COLLECT_SQR_DIST) {
            state.dudes.splice(i, 1);
        }
    }

    if (state.dudes.length < 1) {
        if (vec2.sqrDist(state.cave.placements.door, state.playerPos) < DOOR_COLLECT_SQR_DIST) {
            state.wonTime = state.time;
        }
    }

    return state;
};

const stepTransitionScene = (prevState: TransitionSceneState, inputs: InputState) :GameState => {
    return GameState.createGameScene(prevState.newCave);
};

const TEXTURES = [
    'ship.png',
    'normals.png',
];

export const GameState = {
    createGameScene: (cave: Cave): GameState => ({
        scene: 'game',
        cave,
        time: 0,
        shipFiring: false,
        playerPos: vec2.fromValues( cave.placements.door[0], cave.placements.door[1] ),
        playerRads: -Math.PI / 2, 
        playerVel: vec2.fromValues( 0, 0 ),
        cameraPos: vec2.fromValues( cave.placements.door[0], cave.placements.door[1] ),
        cameraShake: vec2.fromValues( 0, 0 ),
        cameraShakeT: 0,
        rolls: [0,0,0,0,0],
        dudes: cave.placements.dudes,
        wonTime: -1,
    }),

    createTransition: (gl: WebGLRenderingContext): GameState => {
        globalGL = gl;

        //const cave = generateCave(1339, .7);
        const cave = generateCave(Math.floor(Math.random() * 100000000), .7);
        const renderer = new GameRenderer(gl, cave, TEXTURES);

        return {
            scene: 'transition',
            newCave: cave,
            newGameRenderer: renderer,
            time: 0,
        };
    },

    step: (prevState: GameState, inputs: InputState): GameState => {
        switch (prevState.scene) {
            case "game": return stepGameScene(prevState, inputs);
            case "transition": return stepTransitionScene(prevState, inputs);
        }
        return prevState;
    },
};