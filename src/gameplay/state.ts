import { vec2 } from "gl-matrix";
import { Const } from "utils/lang";
import { InputState } from "./inputs";
import { circleCollision } from "./collision";
import { Cave } from "caveGenerator";

export type GameState = {
    cave: Cave,
    playerPos: vec2,
    playerVel: vec2,
};

export const GameState = {
    create: (cave: Cave): GameState => ({
        cave,
        playerPos: vec2.fromValues( 0, 0 ),
        playerVel: vec2.fromValues( 0, 0 )
    }),

    step: (prevState: Const<GameState>, inputs: InputState): GameState => {
        const state: GameState = {
            cave: prevState.cave as any,
            playerPos: vec2.clone(prevState.playerPos as any), 
            playerVel: vec2.clone(prevState.playerVel as any)
        };

        if (inputs.left)  state.playerVel[0] -= 2e-5;
        if (inputs.up)    state.playerVel[1] += 5e-5;
        if (inputs.right) state.playerVel[0] += 2e-5;

        state.playerVel[1] -= 2.5e-5;

        vec2.add(state.playerPos, state.playerPos, state.playerVel);

        state.cave.edges.forEach(blob => {
            const col = circleCollision(blob, prevState.playerPos[0], prevState.playerPos[1], state.playerPos[0], state.playerPos[1], 3 / 256);

            if (col) {
                state.playerPos[0] = col.restore[0];
                state.playerPos[1] = col.restore[1];

                const tangent = vec2.fromValues(col.normal[1], -col.normal[0]);

                let normVelLen = vec2.dot(state.playerVel, col.normal);
                let tangVelLen = vec2.dot(state.playerVel, tangent);

                normVelLen *= -.9;
                tangVelLen *= .9;

                const v0 = vec2.clone(col.normal);
                const v1 = vec2.clone(tangent);

                const normVel = vec2.scale(v0, v0, normVelLen);
                const tangVel = vec2.scale(v1, v1, tangVelLen);

                const X = vec2.fromValues(1, 0);
                const Y = vec2.fromValues(0, 1); 

                state.playerVel[0] = vec2.dot(normVel, X) + vec2.dot(tangVel, X);
                state.playerVel[1] = vec2.dot(normVel, Y) + vec2.dot(tangVel, Y);
            }
        });


        return state;
    },
};