import { generateCave } from "caveGenerator";
import { GameRenderer } from "graphics/gameRenderer";
import { GameState } from "gameplay/state";
import { InputGrabber } from "gameplay/inputs";
import { BasicGameRenderer } from "graphics/basicGameRenderer";
import { magicRange, magic } from "gameplay/magic";

const REWIND_COUNT = 300;
const FRAME_SECONDS = 1 / 60;
const TEXTURES = [
    'ship.png',
    'normals.png',
];

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const deb = document.getElementById('debug-canvas') as HTMLCanvasElement;

const cave = generateCave(1339, .7);
const renderer = new GameRenderer(canvas, cave, TEXTURES);
const debber = new BasicGameRenderer(deb);
const startTime = (new Date).getTime() / 1000;
const inputGrabber = new InputGrabber(canvas);
const rewindStack: GameState[] = [];

let previousTime = startTime;
let frameAccTime = 0;
let gameState = GameState.create(cave);
let currentRewindIndex = -1;

const frame = () => {
    const newTime = (new Date).getTime() / 1000;
    const deltaTime = newTime - previousTime;
    const monotonicTime = newTime - startTime;
    previousTime = newTime;

    if (currentRewindIndex < 0) {
        frameAccTime += deltaTime;
        if (frameAccTime >= FRAME_SECONDS) {
            frameAccTime -= FRAME_SECONDS;
            gameState = GameState.step(gameState, inputGrabber.getCurrentState());

            rewindStack.push(gameState);
            if (rewindStack.length > REWIND_COUNT) {
                rewindStack.shift();
            }
        }
    } else {
        gameState = rewindStack[currentRewindIndex];
    }

    renderer.draw(gameState);
    debber.draw(gameState);

    requestAnimationFrame(frame);
};

const buildSliders = () => {
    const rootElem = document.getElementById('sliders') as HTMLDivElement;
    const template = document.getElementById('slider-template') as HTMLTemplateElement;

    const makeSlider = (name: string, lower: number, upper: number, val: number, steps: number, onChange: (val: number) => void) => {
        const newSlider = template.content.cloneNode(true) as any;
        const label = newSlider.firstElementChild.getElementsByClassName('slider-label')[0];
        const input = newSlider.firstElementChild.getElementsByClassName('slider-input')[0];
        const value = newSlider.firstElementChild.getElementsByClassName('slider-value')[0];

        label.innerHTML = name;
        value.innerHTML = val;
        input.min = lower;
        input.max = upper;
        input.step = (upper - lower) / steps;
        input.value = val;

        input.oninput = input.onchange = () => {
            let newValue = parseFloat(input.value);
            onChange(newValue);
            value.innerHTML = newValue;
        };

        rootElem.appendChild(newSlider);
    };

    makeSlider('Rewind', 0, REWIND_COUNT, REWIND_COUNT, REWIND_COUNT, val => {
        currentRewindIndex = val;
        if (currentRewindIndex >= rewindStack.length) {
            currentRewindIndex = rewindStack.length - 1;
        }
    });

    for (let k in magicRange) {
        makeSlider(k, (magicRange as any)[k].lower, (magicRange as any)[k].upper, (magic as any)[k], 100, val => (magic as any)[k] = val);
    }

    document.getElementById('save-numbers')!.onclick = () => {
        console.log(JSON.stringify(magic).replace(/"/g, ''));
    };
};

buildSliders();
frame();
