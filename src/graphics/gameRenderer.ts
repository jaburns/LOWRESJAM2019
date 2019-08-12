import { GameState } from "gameplay/state";
import { Cave } from "caveGenerator";
import { drawCave, CaveTextures } from "graphics/caveRenderer";
import { FrameBufferTexture } from "./frameBufferTexture";
import { getShaders } from "shaders";
import { drawBuffer } from "./bufferRenderer";
import { loadTexture } from "./loadTexture";

const MAP_SIZE = 512;

type TexturePack = {[name: string]: WebGLTexture};

export class GameRenderer {
    private readonly gl: WebGLRenderingContext;
    private readonly caveTextures: CaveTextures;
    private readonly screenBuffer: FrameBufferTexture;
    private readonly backgroundTex: WebGLTexture;
    private texturePack: TexturePack | null = null;

    constructor(canvas: HTMLCanvasElement, cave: Cave, texturePaths: string[]) {
        const gl = canvas.getContext('webgl')!;
        this.gl = gl;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.DEPTH_TEST);

        this.caveTextures = drawCave(gl, cave, MAP_SIZE);
        this.screenBuffer = new FrameBufferTexture(gl, 64, 64, 'nearest');
        this.backgroundTex = this.makeBackgroundTex();

        this.loadTexturePackAsync(texturePaths);
    }

    private makeBackgroundTex(): WebGLTexture {
        const gl = this.gl;

        const frameBuffer = new FrameBufferTexture(gl, 128, 128, 'linear');
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer.framebuffer);
        gl.viewport(0, 0, 128, 128);

        drawBuffer(gl, getShaders(gl).bufferCopyScale, this.caveTextures.bg);
        
        return frameBuffer.releaseTexture();
    };

    private loadTexturePackAsync(paths: string[]) {
        Promise.all(
            paths.map(path => loadTexture(this.gl, path, 'nearest'))
        )
        .then(textures => {
            this.texturePack = {};

            for (let i = 0; i < paths.length; ++i) {
                this.texturePack[paths[i].substr(0, paths[i].indexOf('.'))] = textures[i];
            }
        });
    }

    draw(state: GameState, monotonicTime: number) {
        const gl = this.gl;

        if (this.texturePack === null) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            return;
        }

        const fireLevel = state.shipFiring ? .8 + .2*Math.random() : 0;
        const firePattern = state.shipFiring
            ? [ Math.random(), Math.random(), Math.random(), Math.random() ]
            : [ 0, 0, 0, 0 ];

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.screenBuffer.framebuffer);
        gl.viewport(0, 0, 64, 64);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        drawBuffer(gl, getShaders(gl).drawBackground, null, shader => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.backgroundTex);
            gl.uniform1i(gl.getUniformLocation(shader, "u_tex"), 0);

            gl.uniform1f(gl.getUniformLocation(shader, "u_bgRes"), 128);
            gl.uniform1f(gl.getUniformLocation(shader, "u_screenRes"), 64);
            gl.uniform2fv(gl.getUniformLocation(shader, "u_camera"), state.playerPos);
            gl.uniform1f(gl.getUniformLocation(shader, "u_time"), monotonicTime);
            gl.uniform1f(gl.getUniformLocation(shader, "u_fireLevel"), fireLevel);
        });

        drawBuffer(gl, getShaders(gl).ship, null, shader => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texturePack!['ship']);
            gl.uniform1i(gl.getUniformLocation(shader, "u_tex"), 0);
            gl.uniform1f(gl.getUniformLocation(shader, "u_angle"), state.playerRads);
            gl.uniform4fv(gl.getUniformLocation(shader, "u_fire"), firePattern);
        });

        drawBuffer(gl, getShaders(gl).drawCave, null, shader => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.caveTextures.cave);
            gl.uniform1i(gl.getUniformLocation(shader, "u_tex"), 0);

            gl.uniform1f(gl.getUniformLocation(shader, "u_caveRes"), MAP_SIZE);
            gl.uniform1f(gl.getUniformLocation(shader, "u_screenRes"), 64);
            gl.uniform2fv(gl.getUniformLocation(shader, "u_camera"), state.playerPos);
            gl.uniform1f(gl.getUniformLocation(shader, "u_time"), monotonicTime);
            gl.uniform1f(gl.getUniformLocation(shader, "u_fireLevel"), fireLevel);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        drawBuffer(gl, getShaders(gl).bufferCopy, this.screenBuffer.texture);
    }
}

