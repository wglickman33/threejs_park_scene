export const distance = (point1, point2) => {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) +
      Math.pow(point2.y - point1.y, 2) +
      Math.pow(point2.z - point1.z, 2)
    );
  };
  
  export const degToRad = (degrees) => {
    return degrees * (Math.PI / 180);
  };
  
  export const radToDeg = (radians) => {
    return radians * (180 / Math.PI);
  };
  
  export const disposeObject = (object) => {
    if (!object) return;
    
    if (object.geometry) {
      object.geometry.dispose();
    }
    
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => {
          disposeMaterial(material);
        });
      } else {
        disposeMaterial(object.material);
      }
    }
    
    if (object.parent) {
      object.parent.remove(object);
    }
    
    if (object.children) {
      while (object.children.length > 0) {
        disposeObject(object.children[0]);
      }
    }
  };
  
  const disposeMaterial = (material) => {
    if (!material) return;
    
    for (const key of Object.keys(material)) {
      const value = material[key];
      if (value && typeof value === 'object' && 'isTexture' in value) {
        value.dispose();
      }
    }
    
    material.dispose();
  };

  export const randomPosition = (
    minX = -10,
    maxX = 10,
    minZ = -10,
    maxZ = 10,
    avoidPositions = [],
    minDistance = 2
  ) => {
    let validPosition = false;
    let x, z;
    
    let attempts = 0;
    
    while (!validPosition && attempts < 50) {
      attempts++;
      
      x = Math.random() * (maxX - minX) + minX;
      z = Math.random() * (maxZ - minZ) + minZ;
      
      validPosition = true;
      
      for (const pos of avoidPositions) {
        const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(z - pos.z, 2));
        if (distance < minDistance) {
          validPosition = false;
          break;
        }
      }
    }
    
    return { x, z };
  };