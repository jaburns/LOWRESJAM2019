import { BufferRenderer } from "graphics/bufferRenderer";
import { getShaders } from "shaders";
import { FrameBufferTexture } from "graphics/frameBufferTexture";
import { generateCave } from "caveGenerator";
import { drawCave } from "caveRenderer";

const gl = (document.getElementById('game-canvas') as HTMLCanvasElement).getContext('webgl') as WebGLRenderingContext;

gl.clearColor(0, 0, 0, 1);

const caveTexture = drawCave(gl, generateCave(1338), 1024);

const screenBuffer = new FrameBufferTexture(gl, 64, 64, 'nearest');
const bufferCopyRenderer = new BufferRenderer(gl, getShaders(gl).bufferCopy);

const frame = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, screenBuffer.framebuffer);
    gl.viewport(0, 0, 64, 64);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    bufferCopyRenderer.draw(caveTexture);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    bufferCopyRenderer.draw(screenBuffer.texture);

//  requestAnimationFrame(frame);
};

frame();
