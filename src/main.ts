import { drawBuffer } from "graphics/bufferRenderer";
import { getShaders } from "shaders";
import { FrameBufferTexture } from "graphics/frameBufferTexture";
import { generateCave } from "caveGenerator";
import { drawCave } from "graphics/caveRenderer";
import { InputGrabber } from "utils/inputGrabber";

const MAP_SIZE = 512; // 256;

const gl = (document.getElementById('game-canvas') as HTMLCanvasElement).getContext('webgl') as WebGLRenderingContext;

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.disable(gl.DEPTH_TEST);

const cave = generateCave(1338, .7);
const caveTextures = drawCave(gl, cave, MAP_SIZE);
const screenBuffer = new FrameBufferTexture(gl, 64, 64, 'nearest');

const keys: {[code:number]: boolean} = {};
document.onkeydown = k => keys[k.keyCode] = true;
document.onkeyup = k => delete keys[k.keyCode];

const startTime = (new Date).getTime();

let shipVel = {x:0,y:0};
let shipPos = {x:.5, y:.5};



const makeSmolBG = (): WebGLTexture => {
    const frameBuffer = new FrameBufferTexture(gl, 128, 128, 'linear');
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer.framebuffer);
    gl.viewport(0, 0, 128, 128);

    drawBuffer(gl, getShaders(gl).bufferCopyScale, caveTextures.bg);
    
    return frameBuffer.releaseTexture();
};

const smolBG = makeSmolBG();


const frame = () => {
    if (keys[37]) shipVel.x -= 2e-5;
    if (keys[38]) shipVel.y += 5e-5;
    if (keys[39]) shipVel.x += 2e-5;

    shipVel.y -= 2.5e-5;


    shipPos.x += shipVel.x;
    shipPos.y += shipVel.y;


    gl.bindFramebuffer(gl.FRAMEBUFFER, screenBuffer.framebuffer);
    gl.viewport(0, 0, 64, 64);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const t = ((new Date).getTime() - startTime) / 1000;


    drawBuffer(gl, getShaders(gl).drawBackground, null, shader => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, smolBG);
        gl.uniform1i(gl.getUniformLocation(shader, "u_tex"), 0);

        gl.uniform1f(gl.getUniformLocation(shader, "u_bgRes"), 128);
        gl.uniform1f(gl.getUniformLocation(shader, "u_screenRes"), 64);
        gl.uniform2f(gl.getUniformLocation(shader, "u_camera"), shipPos.x, shipPos.y);
        gl.uniform1f(gl.getUniformLocation(shader, "u_time"), (new Date).getTime() - startTime);
    });

    drawBuffer(gl, getShaders(gl).ship, null, shader => {
    });

    drawBuffer(gl, getShaders(gl).drawCave, null, shader => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, caveTextures.cave);
        gl.uniform1i(gl.getUniformLocation(shader, "u_tex"), 0);

        gl.uniform1f(gl.getUniformLocation(shader, "u_caveRes"), MAP_SIZE);
        gl.uniform1f(gl.getUniformLocation(shader, "u_screenRes"), 64);
        gl.uniform2f(gl.getUniformLocation(shader, "u_camera"), shipPos.x, shipPos.y);
        gl.uniform1f(gl.getUniformLocation(shader, "u_time"), t);
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    drawBuffer(gl, getShaders(gl).bufferCopy, screenBuffer.texture);

    requestAnimationFrame(frame);
};

frame();
