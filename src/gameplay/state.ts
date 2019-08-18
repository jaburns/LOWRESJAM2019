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
    bullets: {pos: vec2, vel: vec2}[],
    health: number,
    dead: number,
    challenge: number,
};

export type LoadMenuState = {
    scene: 'menu',
    time: number,
    clicked: number,
};

export type TransitionSceneState = {
    scene: 'transition',
    newCave: Cave,
    newGameRenderer: GameRenderer,
    time: number,
    challenge: number,
};


const getLockedAngle = (angle: number): number => {
    const aa = Math.abs(angle);
    let z = 0;

    if      (aa <    3.14159 / 8) z= 0;
    else if (aa < 3.*3.14159 / 8) z= 2*3.14159/8;
    else if (aa < 5.*3.14159 / 8) z= 4*3.14159/8;
    else if (aa < 7.*3.14159 / 8) z= 6*3.14159/8;
    else z = 3.14159;

    if (angle < 0) z *= -1;
    return z;
};


export type GameState = LoadMenuState | GameSceneState | TransitionSceneState;

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

    state.cave.placements.enemies.forEach(x => {
        ret.push({
            pos: vec2.fromValues(
                x.pos[0] + magic.enemyLightDist*Math.cos(getLockedAngle(x.angle)),
                x.pos[1] + magic.enemyLightDist*Math.sin(getLockedAngle(x.angle)),
            ),
            depth: magic.enemySurfaceDepth,
            brightness: magic.enemyBrightness,
            colorIndex: 5,
        });
    });

    state.bullets.forEach(x => {
        ret.push({
            pos: x.pos,
            depth: magic.enemySurfaceDepth,
            brightness: magic.enemyBrightness,
            colorIndex: 5,
        });
    });

    return ret;
};

const stepGameScene = (prevState: GameSceneState, inputs: InputState): GameState => {
    if (prevState.wonTime > 0 && prevState.time > prevState.wonTime + END_FADE) {
        return GameState.createTransition(globalGL, prevState.challenge + 1);
    }

    if (prevState.dead >= END_FADE) {
        return GameState.createMenu(globalGL);
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
        bullets: prevState.bullets,
        health: 3,
        dead: prevState.dead > 0 ? prevState.dead + 1 : 0,
        challenge: prevState.challenge,
    };

    const alreadyWon = state.wonTime > 0;

    if (alreadyWon || state.dead > 0) {
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

    if (alreadyWon || state.dead > 0) return state;

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

    state.bullets.forEach(b => {
        b.pos[0] += b.vel[0];
        b.pos[1] += b.vel[1];
    });

    state.bullets = state.bullets.filter(b => {
        for (let i = 0; i < state.cave.edges.length; ++i) {
            const col = circleCollision(state.cave.edges[i], b.pos[0], b.pos[1], 3 / 256);
            if(col) return false;
        }

        if (vec2.sqrDist(state.playerPos, b.pos) < (2 / 256)*(2 / 256)) {
            state.dead = 1;
            return false;
        }

        return true;
    });

    if (state.time % 60 === 0) {
        state.cave.placements.enemies.forEach(e => {
            const vel = vec2.fromValues(
                Math.cos(getLockedAngle(e.angle)),
                Math.sin(getLockedAngle(e.angle))
            );

            vec2.scale(vel, vel, 0.005);

            state.bullets.push({
                pos: vec2.fromValues(
                    e.pos[0] + 5*vel[0],
                    e.pos[1] + 5*vel[1]
                ),
                vel
            });
        });
    }

    return state;
};

const stepTransitionScene = (prevState: TransitionSceneState, inputs: InputState) :GameState => {
    return GameState.createGameScene(prevState.newCave, prevState.challenge);
};

const stepMenu = (prevState: LoadMenuState, inputs: InputState) :GameState => {
    prevState.time++;

    if (prevState.clicked < 0 && inputs.mouseDown) {
        prevState.clicked = prevState.time;
    }

    if (prevState.clicked > 0 && prevState.time > prevState.clicked + 30) {
        return GameState.createTransition(globalGL, 0);
    }

    return prevState;
};


const TEXTURES = [
    'ship.png',
    'normals.png',
    'title.png',
    'score0.png',
    'score1.png',
    'score2.png',
    'score3.png',
    'score4.png',
    'score5.png',
    'score6.png',
    'score7.png',
    'score8.png',
    'score9.png',
    'score10.png'
];

export const GameState = {
    createMenu: (gl: WebGLRenderingContext): GameState => {
        globalGL = gl;
        return {
            scene: "menu",
            clicked: -1,
            time: 0,
        };
    },

    createGameScene: (cave: Cave, challenge: number): GameState => ({
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
        bullets: [],
        health: 3,
        dead: 0,
        challenge,
    }),

    createTransition: (gl: WebGLRenderingContext, challenge: number): GameState => {
        globalGL = gl;

        //const cave = generateCave(1339, .7);
        const cave = generateCave(Math.floor(Math.random() * 100000000), .7, challenge);
        const renderer = new GameRenderer(gl, cave, TEXTURES);

        return {
            scene: 'transition',
            newCave: cave,
            newGameRenderer: renderer,
            challenge,
            time: 0,
        };
    },

    step: (prevState: GameState, inputs: InputState): GameState => {
        switch (prevState.scene) {
            case "game": return stepGameScene(prevState, inputs);
            case "transition": return stepTransitionScene(prevState, inputs);
            case "menu": return stepMenu(prevState, inputs);
        }
        return prevState;
    },
};