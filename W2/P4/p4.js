function getCircle(numOfPoints, radius, centerX, centerY) {

    let vertices = [];
    let getPointFromAngle = (index, radius) => {
        let angle = index * 2 * Math.PI / numOfPoints;
        return vec2(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
    }

    for (let i = 0; i < numOfPoints; i++) {
        vertices.push(vec2(centerX, centerY), getPointFromAngle(i, radius), getPointFromAngle(i+1, radius));
    }

    return vertices;
}

window.onload = () => {

    //Setup
    let canvas = document.getElementById("c");  
    let clearButton = document.getElementById("clear-button");

    let pointModeButton = document.getElementById("point-mode-button");
    let triangleModeButton = document.getElementById("triangle-mode-button");
    let circleModeButton = document.getElementById("circle-mode-button");

    let clearColorPicker = document.getElementById("clear-color-picker");
    let pointColorPicker = document.getElementById("point-color-picker");

    let gl = WebGLUtils.setupWebGL(canvas);

    gl.viewport( 0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    let program = initShaders(gl, "vertex-shader", "fragment-shader");    
    gl.useProgram(program);   
    
    let vertices = [];
    let colors = [];
    let drawingMode = "points";
    let clickCount = 0;
    let circleSize = 100;

    //Define shader logic
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

    //Functions
    function clear() {
        vertices = [];
        colors = [];
        clickCount = 0;
        gl.clearColor(...convertHexToRGB(clearColorPicker.value));
        render();
    }
    function convertHexToRGB(hex) {
        let rHex = "0x" + hex.substring(1,3);
        let gHex = "0x" + hex.substring(3,5);
        let bHex = "0x" + hex.substring(5,7);

        return [parseInt(rHex, 16)/255, parseInt(gHex, 16)/255, parseInt(bHex, 16)/255, 1];
    }
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);   
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        gl.drawArrays(gl.TRIANGLES, 0, vertices.length);
    }

    //Events
    canvas.addEventListener("click", (e) => {
        let bb = canvas.getBoundingClientRect();
        let xOffset = e.clientX - bb.left;
        let yOffset = e.clientY - bb.top;

        let pointSize = 0.01;
        let x = (-(canvas.width/2) + xOffset)/(canvas.width/2);
        let y = -(-(canvas.height/2) + yOffset)/(canvas.height/2);
        clickCount++;

        if(clickCount > 2 && drawingMode === "triangles") {
            let pointVertices = vertices.splice(vertices.length - 12, 12);
            let pointColors = colors.splice(colors.length - 12, 12);

            let p1 = pointVertices[0];
            let p2 = pointVertices[6];
            let c1 = pointColors[0];
            let c2 = pointColors[6];

            vertices.push(vec2(p1[0] + pointSize, p1[1] - pointSize), vec2(p2[0] + pointSize, p2[1] - pointSize), vec2(x, y));
            colors.push(c1, c2, vec4(...convertHexToRGB(pointColorPicker.value)));
            clickCount = 0;

        } else if(clickCount > 1 && drawingMode === "circles") {
            let pointVertices = vertices.splice(vertices.length - 6, 6);
            let pointColors = colors.splice(colors.length - 6, 6);

            let centerPoint = pointVertices[0];
            let centerColor = pointColors[0];

            let distance = Math.sqrt(Math.pow(centerPoint[0] + pointSize - x, 2) + Math.pow(centerPoint[1] - pointSize - y, 2));
            let circlePoints = getCircle(circleSize, distance, centerPoint[0] + pointSize, centerPoint[1] - pointSize);

            for(let i=0; i<circlePoints.length; i++) {
                vertices.push(circlePoints[i]);
                if (i % 3 === 0) colors.push(centerColor);
                else colors.push(vec4(...convertHexToRGB(pointColorPicker.value)));
            }
            clickCount = 0;
        } else {
            vertices.push(
                vec2(x - pointSize, y + pointSize), 
                vec2(x - pointSize, y - pointSize), 
                vec2(x + pointSize, y - pointSize), 
                vec2(x - pointSize, y + pointSize), 
                vec2(x + pointSize, y + pointSize),
                vec2(x + pointSize, y - pointSize)
            );  
            for(let i = 0; i < 6; i++) colors.push(vec4(...convertHexToRGB(pointColorPicker.value)));
        }

        render();
    });
    clearButton.addEventListener("click", clear);
    pointModeButton.addEventListener("click", () => {
        pointModeButton.style.border = "2px solid red";
        triangleModeButton.style.border = "none";
        circleModeButton.style.border = "none";
        clickCount = 0;
        drawingMode = "points";
    })
    triangleModeButton.addEventListener("click", () => {
        pointModeButton.style.border = "none";
        triangleModeButton.style.border = "2px solid red";
        circleModeButton.style.border = "none";
        clickCount = 0;
        drawingMode = "triangles";
    })
    circleModeButton.addEventListener("click", () => {
        pointModeButton.style.border = "none";
        triangleModeButton.style.border = "none";
        circleModeButton.style.border = "2px solid red";
        clickCount = 0;
        drawingMode = "circles";
    })

    render();
}
