function getRotationMatrix(angle) {
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);

    return [
        cos, -sin, 0.0, 0.0,
        sin,  cos, 0.0, 0.0,
        0.0,  0.0, 1.0, 0.0,
        0.0,  0.0, 0.0, 1.0
    ];
}

window.onload = () => {
    let canvas = document.getElementById("c");  
    let gl = WebGLUtils.setupWebGL(canvas);

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    let program = initShaders(gl, "vertex-shader", "fragment-shader");    
    gl.useProgram(program);   
    
    let vertices = [ vec2(-0.5, 0), vec2(0, 0.5), vec2(0, -0.5), vec2(0.5, 0) ];   

    let vBuffer = gl.createBuffer();   
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);   
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);    

    let vPosition = gl.getAttribLocation(program, "a_Position");     
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);   
    gl.enableVertexAttribArray(vPosition);

    let u_RotationMatrix = gl.getUniformLocation(program, "u_RotationMatrix");

    let angle = 0;

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        let rotationMatrix = getRotationMatrix(angle);
        gl.uniformMatrix4fv(u_RotationMatrix, false, rotationMatrix);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length);
    
        angle += 0.05;
    
        requestAnimationFrame(render);
    }

    render();
}