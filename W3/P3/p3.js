
window.onload = () => {
    let canvas = document.getElementById("c");  
    let gl = WebGLUtils.setupWebGL(canvas);

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT); 

    let program = initShaders(gl, "vertex-shader", "fragment-shader");    
    gl.useProgram(program);   
    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) { console.log('Warning: Unable to use an extension'); }
    
    var vertices = [ 
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 1.0, 1.0),
        vec3(1.0, 1.0, 1.0),
        vec3(1.0, 0.0, 1.0),
        vec3(0.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(1.0, 1.0, 0.0),
        vec3(1.0, 0.0, 0.0),   
    ];     

    var wire_indices = new Uint32Array([
        0, 1, 1, 2, 2, 3, 3, 0, 
        2, 3, 3, 7, 7, 6, 6, 2, 
        0, 3, 3, 7, 7, 4, 4, 0, 
        1, 2, 2, 6, 6, 5, 5, 1,
        4, 5, 5, 6, 6, 7, 7, 4, 
        0, 1, 1, 5, 5, 4, 4, 0 
    ])

    var indices = new Uint32Array([ 
        1, 0, 3, 3, 2, 1,
        2, 3, 7, 7, 6, 2,
        3, 0, 4, 4, 7, 3,
        6, 5, 1, 1, 2, 6,
        4, 5, 6, 6, 7, 4,
        5, 4, 0, 0, 1, 5 
    ]);

    let perspectiveMatrix = perspective(45, 1, 1, 20);

    let u_P = gl.getUniformLocation(program, "u_P");
    let u_V = gl.getUniformLocation(program, "u_V");
    let u_M = gl.getUniformLocation(program, "u_M");

    gl.uniformMatrix4fv(u_P, false, flatten(perspectiveMatrix));

    var iBuffer = gl.createBuffer();   
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);   
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(wire_indices), gl.STATIC_DRAW);  

    var vBuffer = gl.createBuffer();   
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);   
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);   

    var vPosition = gl.getAttribLocation(program, "a_Position");   
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);  
    gl.enableVertexAttribArray(vPosition);

    let translationMatrices = [
        translate(-0.5, -0.5, 0), 
        translate(-3.5, -0.5, 0),  
        translate(2.5, -0.5, 0)   
    ];
    let lookAtMatrices = [
        lookAt(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0)),
        lookAt(vec3(5, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0)),
        lookAt(vec3(5, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0))
    ]
    let rotationMatrices = [
        rotate(0, vec3(1, 0, 0)), 
        rotate(-5, vec3(0, 1, 0)), 
        mult(mult(rotate(30, vec3(1, 0, 0)), rotate(-31, vec3(0, 1, 0))), rotate(-5, vec3(0, 0, 1)))
    ]

    for (let i = 0; i < 3; i++) {
        let translationMatrix = translationMatrices[i];
        let lookAtMatrix = lookAtMatrices[i];
        let transformMatrix = mult(translationMatrix, rotationMatrices[i]);

        gl.uniformMatrix4fv(u_V, false, flatten(lookAtMatrix));
        gl.uniformMatrix4fv(u_M, false, flatten(transformMatrix));

        gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);
    }
}