export class BufferRenderer {
    private readonly gl: WebGLRenderingContext;
    private readonly vertexBuffer: WebGLBuffer;
    private readonly shader: WebGLProgram;

    constructor(gl: WebGLRenderingContext, shader: WebGLProgram) {
        this.gl = gl;
        this.shader = shader;

        this.vertexBuffer = gl.createBuffer() as WebGLBuffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1,1,-1,-1,1,-1,1,-1,1,1,-1,1 ]), gl.STATIC_DRAW);
    }

    draw(texture: WebGLTexture | null, onPreDraw?: (gl: WebGLRenderingContext, shader: WebGLProgram) => void) {
        const gl = this.gl;

        gl.useProgram(this.shader);

        if (texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            const loc_tex = gl.getUniformLocation(this.shader, 'u_tex');
            gl.uniform1i(loc_tex, 0);
        }

        if (onPreDraw) onPreDraw(gl, this.shader);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        const posLoc = gl.getAttribLocation(this.shader, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    release() {
        const gl = this.gl;

        gl.useProgram(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.deleteBuffer(this.vertexBuffer);
    }
}