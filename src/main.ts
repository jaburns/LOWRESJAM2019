import { drawBuffer } from "graphics/bufferRenderer";
import { getShaders } from "shaders";
import { FrameBufferTexture } from "graphics/frameBufferTexture";
import { generateCave } from "caveGenerator";
import { drawCave } from "caveRenderer";

const gl = (document.getElementById('game-canvas') as HTMLCanvasElement).getContext('webgl') as WebGLRenderingContext;

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

const { cave, bg } = drawCave(gl, generateCave(1338), 256);
const screenBuffer = new FrameBufferTexture(gl, 64, 64, 'nearest');

const startTime = (new Date).getTime();

const frame = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, screenBuffer.framebuffer);
    gl.viewport(0, 0, 64, 64);
    gl.clearColor(0, 0, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawBuffer(gl, getShaders(gl).drawFrame, null, shader => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cave);
        gl.uniform1i(gl.getUniformLocation(shader, "u_caveNormals"), 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, bg);
        gl.uniform1i(gl.getUniformLocation(shader, "u_bgNormals"), 1);

        gl.uniform2f(gl.getUniformLocation(shader, "u_bgRes"), 1024, 1024);
        gl.uniform2f(gl.getUniformLocation(shader, "u_caveRes"), 256, 256);
        gl.uniform2f(gl.getUniformLocation(shader, "u_screenRes"), 64, 64);
        gl.uniform2f(gl.getUniformLocation(shader, "u_camera"), 0.5, 0.5);
        gl.uniform1f(gl.getUniformLocation(shader, "u_time"), (new Date).getTime() - startTime);
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    drawBuffer(gl, getShaders(gl).bufferCopy, screenBuffer.texture);

    requestAnimationFrame(frame);
};

frame();
