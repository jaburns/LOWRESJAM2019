import { FrameBufferTexture } from "./frameBufferTexture";
import { BufferRenderer } from "./bufferRenderer";
import { getShaders } from 'shaders';

export class GaussianBlur {
    private readonly gl: WebGLRenderingContext;
    private readonly width: number;
    private readonly height: number;

    private readonly bufferRenderer: BufferRenderer;
    private readonly frameTex0: FrameBufferTexture;
    private readonly frameTex1: FrameBufferTexture;

    constructor(gl: WebGLRenderingContext, width: number, height: number) {
        this.gl = gl;
        this.width = width;
        this.height = height;
        this.bufferRenderer = new BufferRenderer(gl, getShaders(gl).gaussianBlur);
        this.frameTex0 = new FrameBufferTexture(gl, width, height);
        this.frameTex1 = new FrameBufferTexture(gl, width, height);
    }

    run(texture: WebGLTexture, iterations: number) {
        const gl = this.gl;

        if (iterations < 1) iterations = 1;

        for (let i = 0; i < iterations; ++i) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameTex0.framebuffer);
            if (i === 0) gl.viewport(0, 0, this.width, this.height);

            this.bufferRenderer.draw(i === 0 ? texture : this.frameTex1.texture, (gl, shader) => {
                gl.uniform2f(gl.getUniformLocation(shader, "u_resolution"), this.width, this.height);
                gl.uniform2f(gl.getUniformLocation(shader, "u_direction"), 1, 0);
            });

            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameTex1.framebuffer);

            this.bufferRenderer.draw(this.frameTex0.texture, (gl, shader) => {
                gl.uniform2f(gl.getUniformLocation(shader, "u_resolution"), this.width, this.height);
                gl.uniform2f(gl.getUniformLocation(shader, "u_direction"), 0, 1);
            });
        }
    }

    get resultTexture(): WebGLTexture {
        return this.frameTex1.texture;
    }

    release() {
        this.bufferRenderer.release();
        this.frameTex0.release();
        this.frameTex1.release();
    }

    releaseTexture(): WebGLTexture {
        this.bufferRenderer.release();
        this.frameTex0.release();
        return this.frameTex1.releaseTexture();
    }
}