//foreach_shader import * as $ from './$.glsl';
import * as bufferCopy from './bufferCopy.glsl';//_generated
import * as drawNoise from './drawNoise.glsl';//_generated

type ShaderCollection = {
    //foreach_shader readonly $: WebGLShader,
    readonly bufferCopy: WebGLShader,//_generated
    readonly drawNoise: WebGLShader,//_generated
};

const buildCollection = (gl: WebGLRenderingContext): ShaderCollection => ({
    //foreach_shader $: compileShader(gl, '$', $.default),
    bufferCopy: compileShader(gl, 'bufferCopy', bufferCopy.default),//_generated
    drawNoise: compileShader(gl, 'drawNoise', drawNoise.default),//_generated
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
        document.body.innerHTML = errorHTML('vertex', name, vertLog as string);
        console.log(body);
        throw new Error('Error compiling shader: ' + name);
    }

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
    gl.shaderSource(fragShader, '#define FRAGMENT\n' + body + '\n');
    gl.compileShader(fragShader);

    const fragLog = gl.getShaderInfoLog(fragShader);
    if (fragLog === null || fragLog.length > 0) {
        document.body.innerHTML = errorHTML('fragment', name, fragLog as string);
        throw new Error('Error compiling shader: ' + name);
    }

    const prog = gl.createProgram() as WebGLProgram;
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);

    return prog;
};
