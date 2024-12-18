
window.onload = () => {

    //Setup
    let canvas = document.getElementById("c");  
    let gl = WebGLUtils.setupWebGL(canvas);

    gl.viewport( 0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    let program = initShaders(gl, "vertex-shader", "fragment-shader");    
    gl.useProgram(program);   
    
    let vertices = [ vec2(0, 0), vec2(1, 0), vec2(1, 1) ];

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT); 
        gl.drawArrays(gl.POINTS, 0, vertices.length);
    }

    //Click-event
    canvas.addEventListener("click", (e) => {
        let bb = canvas.getBoundingClientRect();
        let xOffset = e.clientX - bb.left;
        let yOffset = e.clientY - bb.top;
        let x = (-(canvas.width/2) + xOffset)/(canvas.width/2);
        let y = (-(canvas.height/2) + yOffset)/(canvas.height/2);

        vertices.push(vec2(x, -y));
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);  

        render();
    })

    
    //Draw Vertices
    let vBuffer = gl.createBuffer();   
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);   
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);    

    let vPosition = gl.getAttribLocation(program, "a_Position");     
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);   
    gl.enableVertexAttribArray(vPosition);

    render();
}