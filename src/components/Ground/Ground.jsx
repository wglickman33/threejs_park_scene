import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./Ground.css";

const Ground = ({ scene }) => {
  const groundRef = useRef(null);

  useEffect(() => {
    if (!scene) return;

    // Create a more detailed ground with mixed textures
    const createDetailedGround = () => {
      const groundSize = 200;
      const groundSegments = 128; // Increased segments for smoother terrain

      // Create a larger, more detailed ground plane
      const groundGeometry = new THREE.PlaneGeometry(
        groundSize,
        groundSize,
        groundSegments,
        groundSegments
      );

      // Generate smoother, more natural terrain
      const vertices = groundGeometry.attributes.position.array;

      // Create improved Perlin-like noise with multiple frequencies
      const createSmoothNoise = (x, z) => {
        // Multiple frequency noise for more natural terrain
        const scale1 = 0.015; // Large features
        const scale2 = 0.03; // Medium features
        const scale3 = 0.08; // Small details

        const nx1 = Math.sin(x * scale1) * Math.cos(z * scale1);
        const nz1 = Math.cos(x * scale1) * Math.sin(z * scale1);

        const nx2 = Math.sin(x * scale2) * Math.cos(z * scale2) * 0.5;
        const nz2 = Math.cos(x * scale2) * Math.sin(z * scale2) * 0.5;

        const nx3 = Math.sin(x * scale3) * Math.cos(z * scale3) * 0.25;
        const nz3 = Math.cos(x * scale3) * Math.sin(z * scale3) * 0.25;

        // Combine frequencies with different weights
        return (nx1 + nz1) * 0.6 + (nx2 + nz2) * 0.3 + (nx3 + nz3) * 0.1;
      };

      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];

        // Create a smooth falloff at edges
        const distFromCenter = Math.sqrt(x * x + z * z);
        const edgeFalloff = Math.max(
          0,
          1 - Math.pow(distFromCenter / (groundSize * 0.45), 4)
        );

        // Calculate path influence
        const distFromPath = Math.min(
          Math.abs(x), // Main path along z-axis
          Math.abs(z) // Main path along x-axis
        );

        // Also check diagonal paths
        const distFromDiagonal1 = Math.abs(x - z) * 0.7071; // 45° diagonal
        const distFromDiagonal2 = Math.abs(x + z) * 0.7071; // 135° diagonal
        const pathDist = Math.min(
          distFromPath,
          Math.min(distFromDiagonal1, distFromDiagonal2)
        );

        // Smoother path transition
        const pathInfluence = Math.min(1, pathDist / 8);

        // Generate base height
        let height = createSmoothNoise(x, z) * 3; // Amplify the effect

        // Apply constraints
        height *= edgeFalloff * pathInfluence;

        // Additional terrain features - hills in specific locations
        const addHill = (hillX, hillZ, hillHeight, hillRadius) => {
          const distFromHill = Math.sqrt(
            Math.pow(x - hillX, 2) + Math.pow(z - hillZ, 2)
          );
          const hillInfluence = Math.max(0, 1 - distFromHill / hillRadius);
          return hillHeight * Math.pow(hillInfluence, 2);
        };

        // Add some gentle hills in specific locations
        height += addHill(-20, 15, 3, 10);
        height += addHill(25, -25, 2.5, 12);
        height += addHill(-30, -20, 2, 8);
        height += addHill(18, 22, 2.8, 9);

        // Ensure water areas are flat or depressed
        const waterAreas = [
          { x: -25, z: -20, radius: 8, depth: -0.3 },
          { x: 25, z: 25, radius: 10, depth: -0.4 },
          { x: 0, z: 0, radius: 3, depth: -0.5 },
        ];

        for (const area of waterAreas) {
          const distFromWater = Math.sqrt(
            Math.pow(x - area.x, 2) + Math.pow(z - area.z, 2)
          );
          const waterInfluence = Math.max(0, 1 - distFromWater / area.radius);

          // Create a smooth depression for water areas
          if (waterInfluence > 0) {
            const depressionFactor = Math.pow(waterInfluence, 2);
            height =
              height * (1 - depressionFactor) + area.depth * depressionFactor;
          }
        }

        vertices[i + 1] = height;
      }

      // Update the geometry after modifying vertices
      groundGeometry.attributes.position.needsUpdate = true;
      groundGeometry.computeVertexNormals();

      // Load textures for the ground
      const textureLoader = new THREE.TextureLoader();

      // Grass texture - with error handling
      let grassTexture;
      try {
        grassTexture = textureLoader.load(
          "https://threejs.org/examples/textures/terrain/grasslight-big.jpg",
          // Success callback
          function (texture) {
            console.log("Ground texture loaded successfully");
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(30, 30); // Increased repeat for less obvious tiling

            // Try to set encoding if supported
            try {
              texture.encoding = THREE.sRGBEncoding;
            } catch (e) {
              console.warn(
                "sRGBEncoding not supported in this Three.js version"
              );
            }

            // Update material after texture is loaded
            if (groundRef.current && groundRef.current.material) {
              groundRef.current.material.needsUpdate = true;
            }
          },
          // Progress callback
          undefined,
          // Error callback
          function (err) {
            console.error("Error loading ground texture:", err);
          }
        );
      } catch (e) {
        console.error("Failed to load ground texture:", e);
        // Fallback to a solid color if texture loading fails
        grassTexture = null;
      }

      // Create a material with improved properties
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: grassTexture ? 0xffffff : 0x4f7942, // Use white with texture or forest green without
        map: grassTexture,
        roughness: 0.9,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });

      // Create the ground mesh
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
      ground.position.y = -0.5; // Lower it slightly below zero
      ground.receiveShadow = true;

      return {
        mesh: ground,
        geometry: groundGeometry,
        material: groundMaterial,
      };
    };

    // Create ground and add to scene
    const ground = createDetailedGround();
    groundRef.current = ground;
    scene.add(ground.mesh);

    // Add ground details - optimized for better performance and aesthetics
    const addGroundDetails = () => {
      const details = new THREE.Group();

      // Add scattered rocks with more natural placement
      const rockPositions = [
        { x: 12, z: 8, scale: 0.6, rotation: 1.2 },
        { x: -15, z: 3, scale: 0.5, rotation: 0.4 },
        { x: 8, z: -12, scale: 0.8, rotation: 2.1 },
        { x: -22, z: 14, scale: 0.7, rotation: 0.8 },
        { x: 18, z: -8, scale: 0.6, rotation: 1.5 },
        { x: -10, z: -18, scale: 0.9, rotation: 0.3 },
      ];

      // Improved rock material
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.9,
        metalness: 0.05,
      });

      rockPositions.forEach((pos) => {
        // Create more natural rock geometry
        const rockGeometry = new THREE.DodecahedronGeometry(0.8, 0);

        // Distort the rock for more natural appearance
        const positions = rockGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const y = positions.getY(i);
          const z = positions.getZ(i);

          // Add random variation to vertices
          positions.setX(i, x + (Math.random() - 0.5) * 0.2);
          positions.setY(i, y + (Math.random() - 0.5) * 0.2);
          positions.setZ(i, z + (Math.random() - 0.5) * 0.2);
        }

        rockGeometry.computeVertexNormals();

        const rock = new THREE.Mesh(rockGeometry, rockMaterial);

        // Position and scale the rock
        rock.position.set(pos.x, 0.35, pos.z);
        rock.scale.set(pos.scale, pos.scale * 0.7, pos.scale);
        rock.rotation.set(
          Math.random() * Math.PI,
          pos.rotation,
          Math.random() * Math.PI
        );
        rock.castShadow = true;
        rock.receiveShadow = true;

        details.add(rock);
      });

      // Add ground patches (grass variation, flowers, etc.)
      const addGroundPatches = () => {
        // Create distinct types of ground patches
        const patchTypes = [
          // Dense grass patches
          {
            count: 20,
            geometry: new THREE.CircleGeometry(2, 8),
            material: new THREE.MeshStandardMaterial({
              color: 0x55aa44,
              roughness: 0.8,
              side: THREE.DoubleSide,
            }),
            heightOffset: 0.02,
            scaleRange: [1, 2],
          },
          // Flower patches
          {
            count: 15,
            geometry: new THREE.CircleGeometry(1.5, 8),
            material: new THREE.MeshStandardMaterial({
              color: 0x88aa55,
              roughness: 0.8,
              side: THREE.DoubleSide,
            }),
            heightOffset: 0.04,
            scaleRange: [0.8, 1.5],
          },
          // Dirt patches
          {
            count: 12,
            geometry: new THREE.CircleGeometry(1.8, 8),
            material: new THREE.MeshStandardMaterial({
              color: 0x9b7653,
              roughness: 1.0,
              side: THREE.DoubleSide,
            }),
            heightOffset: 0.01,
            scaleRange: [0.7, 1.8],
          },
        ];

        // Create all patch types
        patchTypes.forEach((patchType) => {
          for (let i = 0; i < patchType.count; i++) {
            const patch = new THREE.Mesh(
              patchType.geometry,
              patchType.material
            );
            patch.rotation.x = -Math.PI / 2; // Make horizontal

            // Avoid placing patches in water areas or on paths
            let validPosition = false;
            let x, z;
            let attempts = 0;

            while (!validPosition && attempts < 20) {
              x = (Math.random() - 0.5) * 80;
              z = (Math.random() - 0.5) * 80;

              // Check if near water
              const nearWater = [
                { x: -25, z: -20, radius: 10 },
                { x: 25, z: 25, radius: 12 },
                { x: 0, z: 0, radius: 5 },
              ].some((water) => {
                const dist = Math.sqrt(
                  Math.pow(x - water.x, 2) + Math.pow(z - water.z, 2)
                );
                return dist < water.radius;
              });

              // Check if near path
              const nearPath =
                Math.min(
                  Math.abs(x),
                  Math.abs(z),
                  Math.abs(x - z) * 0.7071,
                  Math.abs(x + z) * 0.7071
                ) < 5;

              validPosition = !nearWater && !nearPath;
              attempts++;
            }

            if (validPosition) {
              const scale =
                patchType.scaleRange[0] +
                Math.random() *
                  (patchType.scaleRange[1] - patchType.scaleRange[0]);

              patch.position.set(x, patchType.heightOffset, z);
              patch.scale.set(scale, scale, scale);
              patch.receiveShadow = true;

              details.add(patch);
            }
          }
        });
      };

      addGroundPatches();

      return details;
    };

    // Add details to the scene
    const groundDetails = addGroundDetails();
    scene.add(groundDetails);

    // Cleanup function
    return () => {
      scene.remove(ground.mesh);
      ground.geometry.dispose();
      ground.material.dispose();

      scene.remove(groundDetails);
      groundDetails.traverse((obj) => {
        if (obj.isMesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });
    };
  }, [scene]);

  return null;
};

export default Ground;
