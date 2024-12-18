
window.onload = () => {
    let canvas = document.getElementById("c");  
    let gl = WebGLUtils.setupWebGL(canvas);

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT); 

    let program = initShaders(gl, "vertex-shader", "fragment-shader");    
    gl.useProgram(program);   
    
    let vertices = [ vec2(0, 0), vec2(1, 0), vec2(1, 1) ];   
    
    let vBuffer = gl.createBuffer();   
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);   
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);    

    let vPosition = gl.getAttribLocation(program, "a_Position");     
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);   
    gl.enableVertexAttribArray(vPosition);

    gl.drawArrays(gl.POINTS, 0, vertices.length);
}