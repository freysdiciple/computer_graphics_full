window.onload = () => {
    let canvas = document.getElementById("c");  
    let gl = WebGLUtils.setupWebGL(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
    gl.enable(gl.DEPTH_TEST);

    let program = initShaders(gl, "vertex-shader", "fragment-shader");    
    gl.useProgram(program);   
    
    // Vertex positions for the rectangle
    var vertices = [ 
        vec3(-4, -1, -1), 
        vec3(4, -1, -1), 
        vec3(4, -1, -21),
        vec3(-4, -1, -21)
    ];

    // Texture coordinates
    var texCoords = [
        vec2(-1.5, 0.0),
        vec2(2.5, 0.0),
        vec2(2.5, 10.0),
        vec2(-1.5, 10.0)
    ];

    // Checkerboard texture generation
    let texSize = 64, numRows = numCols = 8;
    let myTexels = new Uint8Array(4 * texSize * texSize); 
    for (var i = 0; i < texSize; ++i) {    
        for (var j = 0; j < texSize; ++j) {      
            var patchx = Math.floor(i / (texSize / numRows));       
            var patchy = Math.floor(j / (texSize / numCols));       
            var c = (patchx % 2 !== patchy % 2 ? 255 : 0);       
            var idx = 4 * (i * texSize + j);       
            myTexels[idx] = myTexels[idx + 1] = myTexels[idx + 2] = c;       
            myTexels[idx + 3] = 255;     
        }
    }

    // Set up the texture
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);

    // Default Texture Parameters
    setTextureParameters(gl, "REPEAT", "NEAREST");

    let perspectiveMatrix = perspective(90, 1, 0.1, 40);
    let u_P = gl.getUniformLocation(program, "u_P");
    gl.uniformMatrix4fv(u_P, false, flatten(perspectiveMatrix)); 

    // Set up vertex buffer
    var vBuffer = gl.createBuffer();   
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);   
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);   
    var vPosition = gl.getAttribLocation(program, "a_Position");   
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);  
    gl.enableVertexAttribArray(vPosition);

    // Set up texture coordinate buffer
    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);
    var vTexCoord = gl.getAttribLocation(program, "a_TexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    // Use texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

    // Draw the rectangle using TRIANGLE_FAN
    drawScene();

    // Event Listeners for Controls
    document.getElementById("wrapMode").onchange = function(e) {
        setTextureParameters(gl, e.target.value, document.getElementById("filterMode").value);
        drawScene();
    };

    document.getElementById("filterMode").onchange = function(e) {
        setTextureParameters(gl, document.getElementById("wrapMode").value, e.target.value);
        drawScene();
    };

    function setTextureParameters(gl, wrapMode, filterMode) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[wrapMode]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[wrapMode]);

        // Set minification and magnification filters
        if (filterMode.includes("MIPMAP")) {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[filterMode]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[filterMode]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[filterMode]);
        }
    }

    function drawScene() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
};
