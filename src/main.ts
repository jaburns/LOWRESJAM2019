import { BufferRenderer } from "graphics/bufferRenderer";
import { getShaders } from "shaders";
import { FrameBufferTexture } from "graphics/frameBufferTexture";

const gl = (document.getElementById('game-canvas') as HTMLCanvasElement).getContext('webgl') as WebGLRenderingContext;

gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

const buffer = new FrameBufferTexture(gl, 64, 64, 'nearest');
gl.bindFramebuffer(gl.FRAMEBUFFER, buffer.framebuffer);
gl.viewport(0, 0, 64, 64);

const noiseRenderer = new BufferRenderer(gl, getShaders(gl).drawNoise);
noiseRenderer.draw(null);

gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

const screenRenderer = new BufferRenderer(gl, getShaders(gl).bufferCopy);
screenRenderer.draw(buffer.texture);

buffer.release();
noiseRenderer.release();
screenRenderer.release();
