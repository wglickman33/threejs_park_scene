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
  
  /**
   * Convert radians to degrees
   * @param {number} radians - Angle in radians
   * @returns {number} - Angle in degrees
   */
  export const radToDeg = (radians) => {
    return radians * (180 / Math.PI);
  };
  
  /**
   * Dispose of Three.js objects properly to prevent memory leaks
   * @param {Object} object - The Three.js object to dispose
   */
  export const disposeObject = (object) => {
    if (!object) return;
    
    // Dispose of geometries
    if (object.geometry) {
      object.geometry.dispose();
    }
    
    // Dispose of materials
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => {
          disposeMaterial(material);
        });
      } else {
        disposeMaterial(object.material);
      }
    }
    
    // Remove from parent
    if (object.parent) {
      object.parent.remove(object);
    }
    
    // Recursively dispose of children
    if (object.children) {
      while (object.children.length > 0) {
        disposeObject(object.children[0]);
      }
    }
  };
  
  /**
   * Helper function to dispose of material properties
   * @param {Object} material - The Three.js material to dispose
   */
  const disposeMaterial = (material) => {
    if (!material) return;
    
    // Dispose of textures
    for (const key of Object.keys(material)) {
      const value = material[key];
      if (value && typeof value === 'object' && 'isTexture' in value) {
        value.dispose();
      }
    }
    
    // Dispose of the material itself
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
    
    // Try up to 50 times to find a valid position
    let attempts = 0;
    
    while (!validPosition && attempts < 50) {
      attempts++;
      
      // Generate random position
      x = Math.random() * (maxX - minX) + minX;
      z = Math.random() * (maxZ - minZ) + minZ;
      
      // Check if it's far enough away from positions to avoid
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