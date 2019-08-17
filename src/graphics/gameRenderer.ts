import { GameState, getLightsForGameState, Light, GameSceneState } from "gameplay/state";
import { Cave } from "caveGenerator";
import { drawCave, CaveTextures } from "graphics/caveRenderer";
import { FrameBufferTexture } from "./frameBufferTexture";
import { getShaders } from "shaders";
import { drawBuffer } from "./bufferRenderer";
import { loadTexture } from "./loadTexture";
import { vec2 } from "gl-matrix";
import { magic } from "gameplay/magic";

const MAP_SIZE = 512;
const BG_SIZE = 512;

const START_FADE = 50;
export const END_FADE = 80;

type TexturePack = {[name: string]: WebGLTexture};

const getSpriteLookupForShipAngle = (angle: number): vec2 => {
    const result = vec2.create();
    const aa = Math.abs(angle);

    if      (aa <    3.14159 / 8) result[0] = 0;
    else if (aa < 3.*3.14159 / 8) result[0] = 1;
    else if (aa < 5.*3.14159 / 8) result[0] = 2;
    else if (aa < 7.*3.14159 / 8) result[0] = 3;
    else result[0] = 4;

    result[1] = angle > 0 ? 1 : 0;

    return result;
};

const bindLightInfo = (gl: WebGLRenderingContext, shader: WebGLShader, cameraPos: vec2, allLights: Light[]) => {
    for (let i = 0; i < 16; ++i) {
        if (i < allLights.length) {
            gl.uniform4fv(gl.getUniformLocation(shader, "u_lightInfo" + i), [
                allLights[i].pos[0],
                allLights[i].pos[1],
                allLights[i].depth,
                allLights[i].brightness + allLights[i].colorIndex,
            ]);
        } else {
            gl.uniform4fv(gl.getUniformLocation(shader, "u_lightInfo" + i), [0, 0, 0, 0]);
        }
    }
};

const drawSprite = (gl: WebGLRenderingContext, texturePack: TexturePack, masterBrightness: number, lookup: vec2, cameraPos: vec2, lights: Light[], pos: vec2) => {
    drawBuffer(gl, getShaders(gl).sprite, null, shader => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texturePack['ship']);
        gl.uniform1i(gl.getUniformLocation(shader, "u_tex"), 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texturePack['normals']);
        gl.uniform1i(gl.getUniformLocation(shader, "u_normMap"), 1);

        gl.uniform2fv(gl.getUniformLocation(shader, "u_spriteLookup"), lookup);
        gl.uniform4fv(gl.getUniformLocation(shader, "u_fire"), [-1,-1,-1,-1]);
        gl.uniform2fv(gl.getUniformLocation(shader, "u_cameraPos"), cameraPos);
        gl.uniform2fv(gl.getUniformLocation(shader, "u_spritePos"), pos);

        gl.uniform1f(gl.getUniformLocation(shader, "u_masterBrightness"), masterBrightness);

        gl.uniform1f(gl.getUniformLocation(shader, "u_baseLightDistance"), magic.caveSurfaceDepth);
        bindLightInfo(gl, shader, cameraPos, lights);
    });
}

export class GameRenderer {
    private readonly gl: WebGLRenderingContext;
    private readonly caveTextures: CaveTextures;
    private readonly screenBuffer: FrameBufferTexture;
    private readonly backgroundTex: WebGLTexture;
    private texturePack: TexturePack | null = null;

    constructor(gl: WebGLRenderingContext, cave: Cave, texturePaths: string[]) {
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

    draw(state: GameSceneState) {
        const gl = this.gl;

        if (this.texturePack === null) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            return;
        }

        const fireLevel = state.shipFiring ? state.rolls[0] : 0;
        const firePattern = state.shipFiring
            ? state.rolls.slice(1, 5)
            : [ 0, 0, 0, 0 ];

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.screenBuffer.framebuffer);
        gl.viewport(0, 0, 64, 64);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const cameraShakeVal = 0.5*Math.cos(Math.PI*state.cameraShakeT)*Math.exp(-0.15*state.cameraShakeT);
        const cameraPos = vec2.clone(state.cameraPos);
        cameraPos[0] += state.cameraShake[0] * cameraShakeVal;
        cameraPos[1] += state.cameraShake[1] * cameraShakeVal;

        const lights = getLightsForGameState(state);
        lights.sort((a, b) => vec2.sqrDist(a.pos, cameraPos) - vec2.sqrDist(b.pos, cameraPos));

        let startingFade = state.time / START_FADE;
        if (startingFade > 1) startingFade = 1;
        let endingFade = state.wonTime > 0 ? 1 - (state.time - state.wonTime) / END_FADE : 1;
        if (endingFade < 0) endingFade = 0;
        const masterBrightness = startingFade * endingFade;

        drawBuffer(gl, getShaders(gl).drawCave, null, shader => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.backgroundTex);
            gl.uniform1i(gl.getUniformLocation(shader, "u_tex"), 0);

            gl.uniform1f(gl.getUniformLocation(shader, "u_texRes"), 128);
            gl.uniform1f(gl.getUniformLocation(shader, "u_uvScale"), .3);
            gl.uniform2fv(gl.getUniformLocation(shader, "u_cameraPos"), cameraPos);
            gl.uniform1f(gl.getUniformLocation(shader, "u_parallax"), magic.bgParallax);
            gl.uniform1f(gl.getUniformLocation(shader, "u_fire"), fireLevel);
            gl.uniform1f(gl.getUniformLocation(shader, "u_distScale"), 1);

            gl.uniform2fv(gl.getUniformLocation(shader, "u_lightPos"), state.playerPos);
            gl.uniform1f(gl.getUniformLocation(shader, "u_surfaceDepth"), magic.bgSurfaceDepth);
            gl.uniform1f(gl.getUniformLocation(shader, "u_brightness"), magic.bgBrightness);

            gl.uniform1f(gl.getUniformLocation(shader, "u_masterBrightness"), masterBrightness);

            gl.uniform1f(gl.getUniformLocation(shader, "u_baseLightDistance"), magic.bgSurfaceDepth);
            gl.uniform1f(gl.getUniformLocation(shader, "u_brightnessMultiplier"), magic.bgBrightness);
            bindLightInfo(gl, shader, state.cameraPos, lights);
        });

        drawSprite(gl, this.texturePack!, masterBrightness, vec2.fromValues(state.dudes.length > 0 ? 0 : 1,3), state.cameraPos, lights, state.cave.placements.door);
        drawSprite(gl, this.texturePack!, masterBrightness, vec2.fromValues(2,3), state.cameraPos, lights, vec2.fromValues(state.cave.placements.door[0], state.cave.placements.door[1] - 8/256));

        if (state.wonTime < 0) {
            drawBuffer(gl, getShaders(gl).sprite, null, shader => {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, this.texturePack!['ship']);
                gl.uniform1i(gl.getUniformLocation(shader, "u_tex"), 0);

                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, this.texturePack!['normals']);
                gl.uniform1i(gl.getUniformLocation(shader, "u_normMap"), 1);

                gl.uniform2fv(gl.getUniformLocation(shader, "u_spriteLookup"), getSpriteLookupForShipAngle(state.playerRads));
                gl.uniform4fv(gl.getUniformLocation(shader, "u_fire"), firePattern);
                gl.uniform2fv(gl.getUniformLocation(shader, "u_cameraPos"), cameraPos);
                gl.uniform2fv(gl.getUniformLocation(shader, "u_spritePos"), state.playerPos);

                gl.uniform1f(gl.getUniformLocation(shader, "u_masterBrightness"), masterBrightness);

                gl.uniform1f(gl.getUniformLocation(shader, "u_baseLightDistance"), magic.caveSurfaceDepth);
                bindLightInfo(gl, shader, state.cameraPos, lights);
            });
        }

        drawBuffer(gl, getShaders(gl).drawCave, null, shader => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.caveTextures.cave);
            gl.uniform1i(gl.getUniformLocation(shader, "u_tex"), 0);

            gl.uniform1f(gl.getUniformLocation(shader, "u_texRes"), MAP_SIZE);
            gl.uniform1f(gl.getUniformLocation(shader, "u_uvScale"), 1);
            gl.uniform2fv(gl.getUniformLocation(shader, "u_cameraPos"), cameraPos);
            gl.uniform1f(gl.getUniformLocation(shader, "u_parallax"), 1);
            gl.uniform1f(gl.getUniformLocation(shader, "u_fire"), fireLevel);
            gl.uniform1f(gl.getUniformLocation(shader, "u_distScale"), 4);

            gl.uniform1f(gl.getUniformLocation(shader, "u_masterBrightness"), masterBrightness);

            gl.uniform1f(gl.getUniformLocation(shader, "u_baseLightDistance"), magic.caveSurfaceDepth);
            gl.uniform1f(gl.getUniformLocation(shader, "u_brightnessMultiplier"), 1);
            bindLightInfo(gl, shader, state.cameraPos, lights);
        });

        state.dudes.forEach(dude => {
            drawSprite(gl, this.texturePack!, masterBrightness, vec2.fromValues(Math.floor(state.time/8)%6,2), state.cameraPos, lights, dude);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        drawBuffer(gl, getShaders(gl).bufferCopy, this.screenBuffer.texture);
    }
}

