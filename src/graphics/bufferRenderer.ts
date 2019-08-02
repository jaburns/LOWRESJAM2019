let vertexBuffer: WebGLBuffer | null = null;

export const drawBuffer = (
    gl: WebGLRenderingContext, shader: WebGLProgram, texture: WebGLTexture | null, 
    onPreDraw?: (shader: WebGLProgram) => void
): void => {
    gl.useProgram(shader);

    if (vertexBuffer === null) {
        vertexBuffer = gl.createBuffer() as WebGLBuffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1,1,-1,-1,1,-1,1,-1,1,1,-1,1 ]), gl.STATIC_DRAW);
    }

    if (texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const loc_tex = gl.getUniformLocation(shader, 'u_tex');
        gl.uniform1i(loc_tex, 0);
    }

    if (onPreDraw) onPreDraw(shader);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    const posLoc = gl.getAttribLocation(shader, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}