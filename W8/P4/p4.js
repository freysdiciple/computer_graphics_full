function getShadowMatrix(lightPos) {
    const d = -(lightPos[1] + 1.01); 
    const Mp = mat4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 1 / d, 0, 0
    );

    const Tlight = translate(-lightPos[0], -lightPos[1], -lightPos[2]);
    const TlightInv = translate(lightPos[0], lightPos[1], lightPos[2]);

    return mult(TlightInv, mult(Mp, Tlight));
}


window.onload = () => {
    let canvas = document.getElementById("c");  
    let gl = WebGLUtils.setupWebGL(canvas, { alpha: false });

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
    gl.enable(gl.DEPTH_TEST);

    let program = initShaders(gl, "vertex-shader", "fragment-shader");    
    gl.useProgram(program);   
    
    var vertices = [ 
        vec3(-2, -1, -1), 
        vec3(2, -1, -1), 
        vec3(2, -1, -5),
        vec3(-2, -1, -5)
    ];

    var texCoords = [
        vec2(0.0, 0.0),   
        vec2(1.0, 0.0),  
        vec2(1.0, 1.0), 
        vec2(0.0, 1.0)
    ];

    const texture0 = gl.createTexture();
    const groundImage = new Image();
    groundImage.crossOrigin = 'anonymous';
    groundImage.onload = () => {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, groundImage);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        render();
    };
    groundImage.src = "../xamp23.png"; 

    const texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    let perspectiveMatrix = perspective(90, 1, 0.1, 40);
    let u_P = gl.getUniformLocation(program, "u_P");
    gl.uniformMatrix4fv(u_P, false, flatten(perspectiveMatrix));

    vertices.push(
        vec3(0.25, -0.5, -1.25), 
        vec3(0.75, -0.5, -1.25),
        vec3(0.75, -0.5, -1.75), 
        vec3(0.25, -0.5, -1.75),
        vec3(-1, -1, -2.5), 
        vec3(-1, 0, -2.5),
        vec3(-1, 0, -3.0), 
        vec3(-1, -1, -3.0)
    );

    texCoords.push(
        vec2(0.0, 0.0), 
        vec2(1.0, 0.0), 
        vec2(1.0, 1.0), 
        vec2(0.0, 1.0),
        vec2(0.0, 0.0), 
        vec2(1.0, 0.0), 
        vec2(1.0, 1.0), 
        vec2(0.0, 1.0)
    );

    var vBuffer = gl.createBuffer();   
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);   
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);   
    var vPosition = gl.getAttribLocation(program, "a_Position");   
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);  
    gl.enableVertexAttribArray(vPosition);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);
    var vTexCoord = gl.getAttribLocation(program, "a_TexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    const u_texMap = gl.getUniformLocation(program, "texMap");
    const u_Visiblity = gl.getUniformLocation(program, "visibility");
    const u_Transparency = gl.getUniformLocation(program, "transparency");


    const lightCenter = vec3(0, 2, -2);
    const lightRadius = 2;

    const render = () => {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        const time = Date.now() * 0.001;
        const lightPos = vec3(
            lightCenter[0] + lightRadius * Math.cos(time),
            lightCenter[1],
            lightCenter[2] + lightRadius * Math.sin(time)
        );
    
        gl.depthFunc(gl.LESS);
        gl.uniform1f(u_Visiblity, 1.0);  
        gl.uniform1f(u_Transparency, 1.0);  
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(u_texMap, 0); 
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); 
    
        gl.uniform1f(u_Visiblity, 0.0);  
        gl.uniform1f(u_Transparency, 0.5);  
        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(u_texMap, 1); 
    
        gl.enable(gl.BLEND);  
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);  
    
        gl.depthFunc(gl.GREATER);
    
        const shadowMatrix = getShadowMatrix(lightPos);
        gl.uniformMatrix4fv(u_P, false, flatten(mult(perspectiveMatrix, shadowMatrix)));
        
        gl.drawArrays(gl.TRIANGLE_FAN, 4, 4); 
        gl.drawArrays(gl.TRIANGLE_FAN, 8, 4); 
    
        gl.disable(gl.BLEND);
        gl.uniform1f(u_Visiblity, 1.0);  
        gl.uniform1f(u_Transparency, 1.0);
        gl.depthFunc(gl.LESS);
        gl.uniformMatrix4fv(u_P, false, flatten(perspectiveMatrix)); 
        gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);  
        gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);  
    
        requestAnimationFrame(render); 
    };
     
};
