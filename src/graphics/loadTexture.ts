export const loadTexture = (
    gl: WebGLRenderingContext, 
    url: string,
    filter: 'linear'|'nearest' = 'linear', 
    wrapMode: 'clamp'|'repeat' = 'repeat'
): Promise<WebGLTexture> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const texture = gl.createTexture();

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            const filterFlag = filter === 'linear' ? gl.LINEAR : gl.NEAREST;
            const wrapFlag = wrapMode === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE;

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterFlag);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterFlag); 
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapFlag);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapFlag);

            resolve(texture as WebGLTexture);
        };
        image.src = url;
    });
