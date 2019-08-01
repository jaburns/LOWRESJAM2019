const gl = (document.getElementById('game-canvas') as HTMLCanvasElement).getContext('webgl') as WebGLRenderingContext;

gl.clearColor(0, 1, 0, 1);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
