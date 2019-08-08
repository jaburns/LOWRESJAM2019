import { Cave } from 'caveGenerator';
import flatten = require('lodash/flatten');
import { getShaders } from 'shaders';
import { drawBuffer } from 'graphics/bufferRenderer';
import { GaussianBlur } from 'graphics/gaussianBlur';
import { FrameBufferTexture } from 'graphics/frameBufferTexture';
import { mat4, vec3 } from 'gl-matrix';
import { Const } from 'utils/lang';

const ROCK_NORMAL_MAP_SIZE = 1024;
const SURFACE_INFO_BUFFER_SIZE = 1024;

const m4x = mat4.create();

type SurfaceInfoBuffers = {
    readonly depth: WebGLTexture,
    readonly normal: WebGLTexture,
};

export type CaveTextures = {
    readonly cave: WebGLTexture,
    readonly bg: WebGLTexture,
};

const getFlatVerts = (cave: Const<Cave>): number[] =>
    flatten(flatten(cave.edges).map(x => [x[0], x[1]]));

const getFlatIndices = (cave: Const<Cave>): number[] => {
    let baseCount = 0;
    let result: number[] = [];

    cave.triangles.forEach((tris, index) => {
        result = result.concat(tris.map(x => x + baseCount));
        baseCount += cave.edges[index].length;
    });

    result.reverse();

    return result;
};

const drawRockTexture = (gl: WebGLRenderingContext): WebGLTexture => {
    const rockNormalsBuffer = new FrameBufferTexture(gl, ROCK_NORMAL_MAP_SIZE, ROCK_NORMAL_MAP_SIZE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, rockNormalsBuffer.framebuffer);
    gl.viewport(0, 0, ROCK_NORMAL_MAP_SIZE, ROCK_NORMAL_MAP_SIZE);

    drawBuffer(gl, getShaders(gl).drawRockTexture, null, shader => {
        gl.uniform2f(gl.getUniformLocation(shader, "u_resolution"), ROCK_NORMAL_MAP_SIZE, ROCK_NORMAL_MAP_SIZE);
    });

    return rockNormalsBuffer.releaseTexture();
};

const buildSurfaceInfoBuffers = (
    gl: WebGLRenderingContext, size: number, vertexBuffer: WebGLBuffer,
    indexBuffer: WebGLBuffer, indexBufferLen: number
): SurfaceInfoBuffers => {
    const gaussBlur0 = new GaussianBlur(gl, size, size);
    const gaussBlur1 = new GaussianBlur(gl, size, size);
    const frameBufferTex = new FrameBufferTexture(gl, size, size);
    const flatWhiteShader = getShaders(gl).flatWhite;

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferTex.framebuffer);
    gl.viewport(0, 0, size, size);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(flatWhiteShader);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    const posLoc = gl.getAttribLocation(flatWhiteShader, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indexBufferLen, gl.UNSIGNED_SHORT, 0);

    gaussBlur0.run(frameBufferTex.texture, 30);

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferTex.framebuffer);
    gl.viewport(0, 0, size, size);

    drawBuffer(gl, getShaders(gl).normals, gaussBlur0.resultTexture, shader => {
        gl.uniform2f(gl.getUniformLocation(shader, "u_resolution"), size, size);
    });

    gaussBlur1.run(frameBufferTex.texture, 2);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const depth = gaussBlur0.releaseTexture();
    const normal = gaussBlur1.releaseTexture();

    return { depth, normal };
};

export const drawCave = (gl: WebGLRenderingContext, cave: Const<Cave>, size: number): CaveTextures => {
    const resultBuffer = new FrameBufferTexture(gl, size, size, 'nearest');

    const vertexBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(getFlatVerts(cave)), gl.STATIC_DRAW);

    const indexBufferData = getFlatIndices(cave);
    const indexBufferLen = indexBufferData.length;

    const indexBuffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBufferData), gl.STATIC_DRAW);

    const surfaceInfoBuffers = buildSurfaceInfoBuffers(gl, SURFACE_INFO_BUFFER_SIZE, vertexBuffer, indexBuffer, indexBufferLen);
    const normalsBuffer = drawRockTexture(gl);

    gl.bindFramebuffer(gl.FRAMEBUFFER, resultBuffer.framebuffer);
    gl.viewport(0, 0, size, size);
    gl.clearColor(0, 1, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const shader = getShaders(gl).drawCaveMap;
    gl.useProgram(shader);

    mat4.identity(m4x);
    mat4.perspective(m4x, Math.PI / 2, 1, .01, 100);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader, "u_perspective"), false, m4x);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, surfaceInfoBuffers.depth);
    gl.uniform1i(gl.getUniformLocation(shader, "u_depth"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, surfaceInfoBuffers.normal);
    gl.uniform1i(gl.getUniformLocation(shader, "u_normal"), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, normalsBuffer);
    gl.uniform1i(gl.getUniformLocation(shader, "u_normalRocks"), 2);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    const posLoc = gl.getAttribLocation(shader, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indexBufferLen, gl.UNSIGNED_SHORT, 0);

    gl.deleteBuffer(vertexBuffer);
    gl.deleteBuffer(indexBuffer);
    gl.deleteTexture(surfaceInfoBuffers.depth);
    gl.deleteTexture(surfaceInfoBuffers.normal);

    return {
        cave: resultBuffer.releaseTexture(),
        bg: normalsBuffer,
    };
};
