import { generateCave } from "caveGenerator";
import { GameRenderer } from "graphics/gameRenderer";
import { GameState } from "gameplay/state";
import { InputGrabber } from "gameplay/inputs";
import { BasicGameRenderer } from "graphics/basicGameRenderer";

const FRAME_SECONDS = 1 / 60;

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const deb = document.getElementById('debug-canvas') as HTMLCanvasElement;

const cave = generateCave(1339, .7);
const renderer = new GameRenderer(canvas, cave);
const debber = new BasicGameRenderer(deb, cave);
const startTime = (new Date).getTime() / 1000;
const inputGrabber = new InputGrabber(document);

console.log(cave);

let previousTime = startTime;
let frameAccTime = 0;
let gameState = GameState.create(cave);

const frame = () => {
    const newTime = (new Date).getTime() / 1000;
    const deltaTime = newTime - previousTime;
    const monotonicTime = newTime - startTime;
    previousTime = newTime;

    frameAccTime += deltaTime;
    if (frameAccTime >= FRAME_SECONDS) {
        frameAccTime -= FRAME_SECONDS;
        gameState = GameState.step(gameState, inputGrabber.getCurrentState());
    }

    renderer.draw(gameState, monotonicTime);
    debber.draw(gameState, monotonicTime);

    requestAnimationFrame(frame);
};

frame();
