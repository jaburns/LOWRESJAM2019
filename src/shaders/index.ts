//foreach_shader import * as $ from './$.glsl';
import * as bufferCopy from './bufferCopy.glsl';//_generated
import * as bufferCopyScale from './bufferCopyScale.glsl';//_generated
import * as drawCave from './drawCave.glsl';//_generated
import * as drawCaveMap from './drawCaveMap.glsl';//_generated
import * as drawRockTexture from './drawRockTexture.glsl';//_generated
import * as flatWhite from './flatWhite.glsl';//_generated
import * as gaussianBlur from './gaussianBlur.glsl';//_generated
import * as normals from './normals.glsl';//_generated
import * as ship from './ship.glsl';//_generated

type ShaderCollection = {
    //foreach_shader readonly $: WebGLShader,
    readonly bufferCopy: WebGLShader,//_generated
    readonly bufferCopyScale: WebGLShader,//_generated
    readonly drawCave: WebGLShader,//_generated
    readonly drawCaveMap: WebGLShader,//_generated
    readonly drawRockTexture: WebGLShader,//_generated
    readonly flatWhite: WebGLShader,//_generated
    readonly gaussianBlur: WebGLShader,//_generated
    readonly normals: WebGLShader,//_generated
    readonly ship: WebGLShader,//_generated
};

const buildCollection = (gl: WebGLRenderingContext): ShaderCollection => ({
    //foreach_shader $: compileShader(gl, '$', $.default),
    bufferCopy: compileShader(gl, 'bufferCopy', bufferCopy.default),//_generated
    bufferCopyScale: compileShader(gl, 'bufferCopyScale', bufferCopyScale.default),//_generated
    drawCave: compileShader(gl, 'drawCave', drawCave.default),//_generated
    drawCaveMap: compileShader(gl, 'drawCaveMap', drawCaveMap.default),//_generated
    drawRockTexture: compileShader(gl, 'drawRockTexture', drawRockTexture.default),//_generated
    flatWhite: compileShader(gl, 'flatWhite', flatWhite.default),//_generated
    gaussianBlur: compileShader(gl, 'gaussianBlur', gaussianBlur.default),//_generated
    normals: compileShader(gl, 'normals', normals.default),//_generated
    ship: compileShader(gl, 'ship', ship.default),//_generated
});

const compiledShaders: { [canvasId: string]: ShaderCollection } = {};

export const getShaders = (gl: WebGLRenderingContext): ShaderCollection => {
    if (! (gl.canvas.id in compiledShaders)) {
        compiledShaders[gl.canvas.id] = buildCollection(gl);
    }

    return compiledShaders[gl.canvas.id];
};

const errorHTML = (kind: 'vertex' | 'fragment', name: string, log: string): string => `
    <h1>Error in ${kind} shader in "${name}.glsl"</h1>
    <code>${log.replace(/\n/g, '<br/>')}</code>
`;

const compileShader = (gl: WebGLRenderingContext, name: string, body: string): WebGLProgram => {
    const vertShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
    gl.shaderSource(vertShader, '#define VERTEX\n' + body + '\n');
    gl.compileShader(vertShader);

    const vertLog = gl.getShaderInfoLog(vertShader);
    if (vertLog === null || vertLog.length > 0) {
        document.head!.parentNode!.removeChild(document.head!);
        document.body.innerHTML = errorHTML('vertex', name, vertLog as string);
        throw new Error('Error compiling shader: ' + name);
    }

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
    gl.shaderSource(fragShader, '#define FRAGMENT\n' + body + '\n');
    gl.compileShader(fragShader);

    const fragLog = gl.getShaderInfoLog(fragShader);
    if (fragLog === null || fragLog.length > 0) {
        document.head!.parentNode!.removeChild(document.head!);
        document.body.innerHTML = errorHTML('fragment', name, fragLog as string);
        throw new Error('Error compiling shader: ' + name);
    }

    const prog = gl.createProgram() as WebGLProgram;
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);

    return prog;
};
