
window.onload = () => {

    //Setup
    let canvas = document.getElementById("c");  
    let clearButton = document.getElementById("clear-button");
    let clearColorPicker = document.getElementById("clear-color-picker");
    let pointColorPicker = document.getElementById("point-color-picker");
    let gl = WebGLUtils.setupWebGL(canvas);

    gl.viewport( 0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    let program = initShaders(gl, "vertex-shader", "fragment-shader");    
    gl.useProgram(program);   
    
    let vertices = [ vec2(0, 0), vec2(1, 0), vec2(1, 1) ];
    let colors = [ vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0) ];

    //Functions
    function convertHexToRGB(hex) {
        let rHex = "0x" + hex.substring(1,3);
        let gHex = "0x" + hex.substring(3,5);
        let bHex = "0x" + hex.substring(5,7);

        return [parseInt(rHex, 16)/255, parseInt(gHex, 16)/255, parseInt(bHex, 16)/255, 1];
    }

    let vBuffer = gl.createBuffer();    
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);   
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);   

    let vPosition = gl.getAttribLocation(program, "a_Position");     
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);   
    gl.enableVertexAttribArray(vPosition);

    let cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    let aColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColor);

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);   
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        gl.drawArrays(gl.POINTS, 0, vertices.length);
    }

    function clear() {
        vertices = [];
        colors = [];
        gl.clearColor(...convertHexToRGB(clearColorPicker.value));
        render();
    }

    //Events
    canvas.addEventListener("click", (e) => {
        let bb = canvas.getBoundingClientRect();
        let xOffset = e.clientX - bb.left;
        let yOffset = e.clientY - bb.top;
        let x = (-(canvas.width/2) + xOffset)/(canvas.width/2);
        let y = (-(canvas.height/2) + yOffset)/(canvas.height/2);

        vertices.push(vec2(x, -y));  
        colors.push(vec4(...convertHexToRGB(pointColorPicker.value)));

        render();
    });
    clearButton.addEventListener("click", clear)

    render();
}