function calculateBoundingBox(vertices) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
  
    for (let i = 0; i < vertices.length; i += 4) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];
  
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
  
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
  
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
    }
  
    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;
  
    return { width, height, depth };
  }
  
  async function insertObjFromURL(gl, objectUrl, indexCount) {
    //Exchange current object with the uploaded one
    try {
        const newObjectData = await readOBJFile(objectUrl, 1, true);
  
        const boundingBox = calculateBoundingBox(flatten(newObjectData.vertices))
        gl.uniformMatrix4fv(gl.u_Model, false, flatten(translate(0, -boundingBox.height / 2, 0)));
  
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(newObjectData.vertices), gl.STATIC_DRAW);
  
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(newObjectData.indices), gl.STATIC_DRAW);
  
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(newObjectData.normals), gl.STATIC_DRAW);
  
        indexCount.value = newObjectData.indices.length;
  
    } catch (error) {
        console.error('Error loading OBJ file: ' + error);
    }
  }