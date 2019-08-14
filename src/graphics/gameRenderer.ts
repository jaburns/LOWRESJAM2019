import { GameState } from "gameplay/state";
import { Cave } from "caveGenerator";
import { drawCave, CaveTextures } from "graphics/caveRenderer";
import { FrameBufferTexture } from "./frameBufferTexture";
import { getShaders } from "shaders";
import { drawBuffer } from "./bufferRenderer";
import { loadTexture } from "./loadTexture";
import { vec2 } from "gl-matrix";

const MAP_SIZE = 512;
const BG_SIZE = 512;

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

        const frameBuffer = new FrameBufferTexture(gl, BG_SIZE, BG_SIZE, 'linear');
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer.framebuffer);
        gl.viewport(0, 0, BG_SIZE, BG_SIZE);

        drawBuffer(gl, getShaders(gl).bufferCopy, this.caveTextures.bg);
        
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

        const cameraShakeVal = Math.random();
        const cameraPos = vec2.clone(state.cameraPos);
        cameraPos[0] += state.cameraShake[0] * cameraShakeVal;
        cameraPos[1] += state.cameraShake[1] * cameraShakeVal;

        drawBuffer(gl, getShaders(gl).drawCave, null, shader => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.backgroundTex);
            gl.uniform1i(gl.getUniformLocation(shader, "u_tex"), 0);

            gl.uniform1f(gl.getUniformLocation(shader, "u_texRes"), 128);
            gl.uniform1f(gl.getUniformLocation(shader, "u_uvScale"), .3);
            gl.uniform1f(gl.getUniformLocation(shader, "u_screenRes"), 64);
            gl.uniform2fv(gl.getUniformLocation(shader, "u_cameraPos"), cameraPos);
            gl.uniform2fv(gl.getUniformLocation(shader, "u_lightPos"), state.playerPos);
            gl.uniform1f(gl.getUniformLocation(shader, "u_distScale"), 1);
            gl.uniform1f(gl.getUniformLocation(shader, "u_distScale2"), 4);
            gl.uniform1f(gl.getUniformLocation(shader, "u_surfaceDepth"), 0.05);
            gl.uniform1f(gl.getUniformLocation(shader, "u_brightness"), 0.1);
        });

        drawBuffer(gl, getShaders(gl).ship, null, shader => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texturePack!['ship']);
            gl.uniform1i(gl.getUniformLocation(shader, "u_tex"), 0);
            gl.uniform1f(gl.getUniformLocation(shader, "u_angle"), state.playerRads);
            gl.uniform4fv(gl.getUniformLocation(shader, "u_fire"), firePattern);
            gl.uniform2fv(gl.getUniformLocation(shader, "u_cameraPos"), cameraPos);
            gl.uniform2fv(gl.getUniformLocation(shader, "u_spritePos"), state.playerPos);
        });

        drawBuffer(gl, getShaders(gl).drawCave, null, shader => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.caveTextures.cave);
            gl.uniform1i(gl.getUniformLocation(shader, "u_tex"), 0);

            gl.uniform1f(gl.getUniformLocation(shader, "u_texRes"), MAP_SIZE);
            gl.uniform1f(gl.getUniformLocation(shader, "u_uvScale"), 1);
            gl.uniform1f(gl.getUniformLocation(shader, "u_screenRes"), 64);
            gl.uniform2fv(gl.getUniformLocation(shader, "u_cameraPos"), cameraPos);
            gl.uniform2fv(gl.getUniformLocation(shader, "u_lightPos"), state.playerPos);
            gl.uniform1f(gl.getUniformLocation(shader, "u_distScale"), 4);
            gl.uniform1f(gl.getUniformLocation(shader, "u_distScale2"), 1);
            gl.uniform1f(gl.getUniformLocation(shader, "u_surfaceDepth"), 0.05);
            gl.uniform1f(gl.getUniformLocation(shader, "u_brightness"), 0.1);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        drawBuffer(gl, getShaders(gl).bufferCopy, this.screenBuffer.texture);
    }
}

