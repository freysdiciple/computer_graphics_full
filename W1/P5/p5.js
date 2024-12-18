

function getCircle(numOfPoints, radius) {

    let vertices = [vec2(0, 0)];

    for (let i = 0; i <= numOfPoints; i++) {
        let angle = i * 2 * Math.PI / numOfPoints;
        let x = 0 + radius * Math.cos(angle);
        let y = 0 + radius * Math.sin(angle);
        vertices.push(vec2(x, y));
    }

    return vertices;
}

window.onload = () => {
    let canvas = document.getElementById("c");  
    let gl = WebGLUtils.setupWebGL(canvas);

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    let program = initShaders(gl, "vertex-shader", "fragment-shader");    
    gl.useProgram(program);   
    
    let radius = 0.2;
    let vertices = getCircle(100, radius);   

    let vBuffer = gl.createBuffer();   
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);   
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);    

    let vPosition = gl.getAttribLocation(program, "a_Position");     
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);   
    gl.enableVertexAttribArray(vPosition);

    let u_Offset = gl.getUniformLocation(program, "u_Offset");

    //Added some physics for fun :)
    let offset = 0;
    let acceleration = -0.2;
    let velocity = 0;

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.uniform1f(u_Offset, offset);
    
        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);
        
        //Added some physics for fun :)
        if (offset < -1 + radius) {
            velocity *= -1;
            offset = -1 + radius;
        }

        velocity += acceleration * 0.1;
        offset += velocity * 0.1;

        requestAnimationFrame(render);
    }

    render();
}