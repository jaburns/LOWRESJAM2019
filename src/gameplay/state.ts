import { vec2 } from "gl-matrix";
import { Const } from "utils/lang";
import { InputState } from "./inputs";
import { circleCollision } from "./collision";
import { Cave } from "caveGenerator";
import { magic } from "./magic";

export type Light = {
    pos: vec2,
    depth: number,
    brightness: number,
    colorIndex: number,
};

export type GameState = {
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
    latestCollisions: {a:vec2, b:vec2, t:number}[],
};

export const getLightsForGameState = (state: GameState): Light[] => {
    const normVel = vec2.normalize(vec2.create(), state.playerVel);

    return [{
        pos: vec2.fromValues(
            state.playerPos[0],
            state.playerPos[1]
        ),
        depth: 0,
        brightness: magic.caveBrightness,
        colorIndex: 0
    },{
        pos: vec2.fromValues(
            state.playerPos[0] - magic.fireShipDistance*Math.cos(state.playerRads),
            state.playerPos[1] - magic.fireShipDistance*Math.sin(state.playerRads),
        ),
        depth: magic.fireSurfaceDepth,
        brightness: state.shipFiring ? magic.fireBrightness : 0,
        colorIndex: 1
    }];
};

export const GameState = {
    create: (cave: Cave): GameState => ({
        cave,
        time: 0,
        shipFiring: false,
        playerPos: vec2.fromValues( 0, 0 ),
        playerRads: -Math.PI / 2, 
        playerVel: vec2.fromValues( 0, 0 ),
        cameraPos: vec2.fromValues( 0, 0 ),
        cameraShake: vec2.fromValues( 0, 0 ),
        cameraShakeT: 0,
        rolls: [0,0,0,0,0],
        latestCollisions: [],
    }),

    step: (prevState: Const<GameState>, inputs: InputState): GameState => {
        const state: GameState = {
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
            latestCollisions: prevState.latestCollisions
                .map(({a, b, t}) => ({ a: vec2.clone(a as any), b: vec2.clone(b as any), t: t-0.05 }))
                .filter(v => v.t >= 0),
        };

        state.playerVel[1] -= 2.5e-5;

        if (inputs.mouseDown) {
            state.playerVel[0] += 9e-5 * Math.cos(state.playerRads);
            state.playerVel[1] += 9e-5 * Math.sin(state.playerRads);
        }

        vec2.add(state.playerPos, state.playerPos, state.playerVel);

        vec2.scale(state.cameraShake, state.cameraShake, 0.87);

        const targetCameraPos = vec2.clone(state.playerVel);
        vec2.scale(targetCameraPos, targetCameraPos, 20);
        vec2.add(targetCameraPos, targetCameraPos, state.playerPos);

        state.cameraPos[0] += (targetCameraPos[0] - state.cameraPos[0]) / 10;
        state.cameraPos[1] += (targetCameraPos[1] - state.cameraPos[1]) / 10;

        state.cave.edges.forEach(blob => {
            const col = circleCollision(blob, state.playerPos[0], state.playerPos[1], 3 / 256);

            if (col) {
                state.latestCollisions.push({
                    a: col.lineA,
                    b: col.lineB,
                    t: 1
                });

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


        return state;
    },
};