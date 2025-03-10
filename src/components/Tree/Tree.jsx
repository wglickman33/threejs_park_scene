import { useEffect } from "react";
import * as THREE from "three";
import "./Tree.css";

const Tree = ({ scene, x = 0, z = 0, type = "pine" }) => {
  useEffect(() => {
    if (!scene) return;

    // Helper function to get ground height at position
    const getGroundHeight = (x, z) => {
      // Cast a ray from above to find the ground height
      const raycaster = new THREE.Raycaster();
      raycaster.set(new THREE.Vector3(x, 10, z), new THREE.Vector3(0, -1, 0));

      // Find intersections with objects that could be ground
      const intersects = raycaster.intersectObjects(scene.children, true);

      // Filter for actual ground objects (avoiding trees, benches, etc.)
      for (let i = 0; i < intersects.length; i++) {
        // Simple heuristic: consider objects near y=0 as ground
        if (Math.abs(intersects[i].point.y) < 5) {
          return intersects[i].point.y;
        }
      }

      return 0; // Default if nothing found
    };

    // Create different tree types with improved visuals
    const createTree = () => {
      const treeGroup = new THREE.Group();

      // Randomize tree type if not specified
      const treeType =
        type === "random"
          ? ["pine", "oak", "birch", "palm"][Math.floor(Math.random() * 4)]
          : type;

      if (treeType === "pine") {
        // Pine tree (conical) with improved visuals

        // More natural trunk with bark texture
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
        const trunkCanvas = document.createElement("canvas");
        trunkCanvas.width = 64;
        trunkCanvas.height = 128;
        const ctx = trunkCanvas.getContext("2d");

        // Base brown color
        ctx.fillStyle = "#8b4513";
        ctx.fillRect(0, 0, 64, 128);

        // Add bark texture
        ctx.fillStyle = "#5d2906";
        for (let i = 0; i < 20; i++) {
          const y = Math.random() * 128;
          const h = 2 + Math.random() * 10;
          const w = 2 + Math.random() * 4;
          ctx.fillRect(Math.random() * 64, y, w, h);
        }

        const trunkTexture = new THREE.CanvasTexture(trunkCanvas);
        trunkTexture.wrapS = THREE.RepeatWrapping;
        trunkTexture.wrapT = THREE.RepeatWrapping;
        trunkTexture.repeat.set(2, 4);

        const trunkMaterial = new THREE.MeshStandardMaterial({
          map: trunkTexture,
          roughness: 0.9,
          metalness: 0.0,
          bumpMap: trunkTexture,
          bumpScale: 0.2,
        });

        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        // More detailed pine foliage
        const createPineNeedles = () => {
          // Instead of simple cones, create more complex foliage
          const pineGroup = new THREE.Group();

          // Base material with better color
          const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d4c1e,
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide,
          });

          // Create 3-5 layers of foliage
          const layers = 3 + Math.floor(Math.random() * 2);

          for (let i = 0; i < layers; i++) {
            const layerHeight = 1.2;
            const coneHeight = 1.8;
            const scaleFactor = 1 - i * 0.2;

            // Main cone for each layer
            const coneGeometry = new THREE.ConeGeometry(
              1.2 * scaleFactor,
              coneHeight,
              8
            );

            const cone = new THREE.Mesh(coneGeometry, foliageMaterial);
            cone.position.y = 3 + i * layerHeight;
            cone.castShadow = true;
            pineGroup.add(cone);

            // Add some small cones sticking out for more detail
            const detailCount = 5 + Math.floor(Math.random() * 5);
            for (let j = 0; j < detailCount; j++) {
              const angle = (j / detailCount) * Math.PI * 2;
              const detailSize = 0.3 * scaleFactor;

              const detailCone = new THREE.ConeGeometry(
                detailSize,
                detailSize * 3,
                5
              );

              const detail = new THREE.Mesh(detailCone, foliageMaterial);

              // Position at edge of main cone, pointing slightly outward
              const radius = 1.0 * scaleFactor;
              detail.position.set(
                Math.cos(angle) * radius,
                3 + i * layerHeight + (Math.random() - 0.5) * 0.5,
                Math.sin(angle) * radius
              );

              // Rotate to point outward
              detail.rotation.z = Math.cos(angle) * 0.6;
              detail.rotation.x = Math.sin(angle) * 0.6;

              detail.castShadow = true;
              pineGroup.add(detail);
            }
          }

          return pineGroup;
        };

        treeGroup.add(createPineNeedles());
      } else if (treeType === "oak") {
        // Oak tree with more detailed structure

        // Improved trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 2.5, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
          color: 0x6b4423,
          roughness: 0.9,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });

        // Distort trunk geometry slightly for more natural look
        const trunkPositions = trunkGeometry.attributes.position;
        for (let i = 0; i < trunkPositions.count; i++) {
          const theta = Math.atan2(
            trunkPositions.getZ(i),
            trunkPositions.getX(i)
          );

          // Add subtle bulges and indentations
          const bulge = Math.sin(theta * 3) * 0.05;

          const x = trunkPositions.getX(i);
          const z = trunkPositions.getZ(i);
          const radius = Math.sqrt(x * x + z * z);

          if (radius > 0) {
            const newRadius = radius * (1 + bulge);
            trunkPositions.setX(i, (x / radius) * newRadius);
            trunkPositions.setZ(i, (z / radius) * newRadius);
          }
        }

        trunkGeometry.computeVertexNormals();

        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.25;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        // Add branches with more natural variation
        const createBranches = () => {
          const branchGroup = new THREE.Group();
          const branchCount = 3 + Math.floor(Math.random() * 4);

          for (let i = 0; i < branchCount; i++) {
            // Create branch geometry
            const length = 1.2 + Math.random() * 0.8;
            const branchGeometry = new THREE.CylinderGeometry(
              0.1,
              0.15,
              length,
              5
            );

            // Transform the geometry to bend upward
            const positions = branchGeometry.attributes.position;
            for (let j = 0; j < positions.count; j++) {
              const y = positions.getY(j);
              // Add upward curve based on position along branch
              const normalizedY = (y + length / 2) / length;
              const bend = 0.2 * Math.sin(normalizedY * Math.PI);
              positions.setY(j, y + bend);
            }

            branchGeometry.computeVertexNormals();

            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);

            // Position branch along trunk
            const height = 1.0 + Math.random() * 1.5;
            const angle = i * ((Math.PI * 2) / branchCount);
            const tilt = Math.PI / 4 + Math.random() * 0.2; // ~45 degrees up

            branch.position.set(
              Math.cos(angle) * 0.4,
              height,
              Math.sin(angle) * 0.4
            );

            branch.rotation.z = Math.cos(angle) * tilt;
            branch.rotation.x = Math.sin(angle) * tilt;

            branch.castShadow = true;
            branchGroup.add(branch);
          }

          return branchGroup;
        };

        treeGroup.add(createBranches());

        // Foliage - create a more natural canopy
        const createOakCanopy = () => {
          const canopyGroup = new THREE.Group();

          // Nicer leaf material with variation
          const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x406020,
            roughness: 0.8,
            metalness: 0.0,
          });

          // Helper for leaf cluster
          const createLeafCluster = (x, y, z, size) => {
            const cluster = new THREE.Group();

            // Create multiple overlapping spheres for natural look
            const sphereCount = 3 + Math.floor(Math.random() * 3);

            for (let i = 0; i < sphereCount; i++) {
              // Random offset within the cluster
              const offsetX = (Math.random() - 0.5) * size * 0.8;
              const offsetY = (Math.random() - 0.5) * size * 0.6;
              const offsetZ = (Math.random() - 0.5) * size * 0.8;

              // Random size for this part of the cluster
              const partSize = (0.6 + Math.random() * 0.4) * size;

              const foliageGeometry = new THREE.SphereGeometry(partSize, 8, 8);
              const part = new THREE.Mesh(foliageGeometry, foliageMaterial);

              part.position.set(x + offsetX, y + offsetY, z + offsetZ);
              part.castShadow = true;

              cluster.add(part);
            }

            return cluster;
          };

          // Create main canopy structure with multiple clusters
          const canopyCenter = new THREE.Vector3(0, 3.5, 0);

          // Main central cluster
          canopyGroup.add(
            createLeafCluster(
              canopyCenter.x,
              canopyCenter.y,
              canopyCenter.z,
              1.4
            )
          );

          // Surrounding clusters
          const clusterCount = 6 + Math.floor(Math.random() * 4);

          for (let i = 0; i < clusterCount; i++) {
            const angle = (i / clusterCount) * Math.PI * 2;
            const radius = 1.0 + Math.random() * 0.5;

            canopyGroup.add(
              createLeafCluster(
                canopyCenter.x + Math.cos(angle) * radius,
                canopyCenter.y + (Math.random() - 0.3) * 0.8,
                canopyCenter.z + Math.sin(angle) * radius,
                1.0 + Math.random() * 0.4
              )
            );
          }

          return canopyGroup;
        };

        treeGroup.add(createOakCanopy());
      } else if (treeType === "birch") {
        // Birch tree (tall, thin with white trunk)

        // Improved birch trunk with better texture
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.25, 6, 8);

        // Create detailed birch bark texture
        const trunkCanvas = document.createElement("canvas");
        trunkCanvas.width = 128;
        trunkCanvas.height = 512;
        const ctx = trunkCanvas.getContext("2d");

        // Background white
        ctx.fillStyle = "#F5F5F5";
        ctx.fillRect(0, 0, 128, 512);

        // Add horizontal dark streaks
        ctx.fillStyle = "#333333";
        for (let i = 0; i < 20; i++) {
          const y = Math.random() * 512;
          const w = 2 + Math.random() * 10;
          const h = 2 + Math.random() * 5;
          ctx.fillRect(0, y, w, h);

          // Add some smaller marks
          const smallCount = 1 + Math.floor(Math.random() * 3);
          for (let j = 0; j < smallCount; j++) {
            ctx.fillRect(
              w + Math.random() * 20,
              y + (Math.random() - 0.5) * 10,
              Math.random() * 5,
              Math.random() * 3
            );
          }
        }

        // Add subtle vertical streaks
        ctx.fillStyle = "#CCCCCC";
        for (let i = 0; i < 10; i++) {
          const x = Math.random() * 128;
          ctx.fillRect(x, 0, 1, 512);
        }

        const trunkTexture = new THREE.CanvasTexture(trunkCanvas);
        trunkTexture.wrapS = THREE.RepeatWrapping;
        trunkTexture.wrapT = THREE.RepeatWrapping;
        trunkTexture.repeat.set(1, 1);

        const trunkMaterial = new THREE.MeshStandardMaterial({
          map: trunkTexture,
          roughness: 0.7,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });

        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 3;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        // Create improved birch foliage
        const createBirchFoliage = () => {
          const foliageGroup = new THREE.Group();

          // Lighter, more delicate foliage
          const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x99cc66,
            roughness: 0.8,
            metalness: 0.0,
            transparent: true,
            opacity: 0.9,
          });

          // Create multiple airy foliage clusters
          const createLeafCluster = (x, y, z, size) => {
            const group = new THREE.Group();

            // Use flattened, smaller spheres for more delicate look
            const count = 4 + Math.floor(Math.random() * 4);

            for (let i = 0; i < count; i++) {
              const sphereGeometry = new THREE.SphereGeometry(size, 7, 7);

              // Flatten the sphere into a more leaf-like shape
              const positions = sphereGeometry.attributes.position;
              for (let j = 0; j < positions.count; j++) {
                positions.setY(j, positions.getY(j) * 0.7);
              }

              sphereGeometry.computeVertexNormals();

              const sphere = new THREE.Mesh(sphereGeometry, foliageMaterial);

              // Position with more spread along x and z
              sphere.position.set(
                x + (Math.random() - 0.5) * size * 2,
                y + (Math.random() - 0.5) * size,
                z + (Math.random() - 0.5) * size * 2
              );

              sphere.castShadow = true;
              group.add(sphere);
            }

            return group;
          };

          // Create leaf clusters at different heights
          const baseHeight = 5;
          const clusters = 4 + Math.floor(Math.random() * 3);

          for (let i = 0; i < clusters; i++) {
            const height = baseHeight + i * 0.6 + Math.random() * 0.4;
            const angle = (i / clusters) * Math.PI * 2;
            const radius = 0.6 + Math.random() * 0.4;

            foliageGroup.add(
              createLeafCluster(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius,
                0.5 + Math.random() * 0.3
              )
            );
          }

          return foliageGroup;
        };

        treeGroup.add(createBirchFoliage());
      } else if (treeType === "palm") {
        // Improved palm tree

        // Create better curved trunk with texture
        const createPalmTrunk = () => {
          // More natural curve using custom path
          const points = [];
          const height = 5;
          const segments = 12;
          const curve = 0.3;

          for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            // Add a gentle S-curve
            const x = curve * Math.sin(t * Math.PI);
            const y = height * t;
            points.push(new THREE.Vector2(x, y));
          }

          const trunkGeometry = new THREE.LatheGeometry(points, 8);

          // Create palm bark texture
          const trunkCanvas = document.createElement("canvas");
          trunkCanvas.width = 64;
          trunkCanvas.height = 256;
          const ctx = trunkCanvas.getContext("2d");

          // Base color
          ctx.fillStyle = "#8b5a2b";
          ctx.fillRect(0, 0, 64, 256);

          // Add bark texture - horizontal lines
          ctx.fillStyle = "#734222";
          const lineCount = 30;
          for (let i = 0; i < lineCount; i++) {
            const y = i * (256 / lineCount);
            ctx.fillRect(0, y, 64, 2 + Math.random() * 3);
          }

          // Add some rough spots
          ctx.fillStyle = "#613b1f";
          for (let i = 0; i < 20; i++) {
            const x = Math.random() * 64;
            const y = Math.random() * 256;
            const size = 3 + Math.random() * 5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }

          const trunkTexture = new THREE.CanvasTexture(trunkCanvas);
          trunkTexture.wrapS = THREE.RepeatWrapping;
          trunkTexture.wrapT = THREE.RepeatWrapping;
          trunkTexture.repeat.set(2, 4);

          const trunkMaterial = new THREE.MeshStandardMaterial({
            map: trunkTexture,
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide,
            bumpMap: trunkTexture,
            bumpScale: 0.2,
          });

          const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
          trunk.castShadow = true;
          trunk.receiveShadow = true;

          return trunk;
        };

        treeGroup.add(createPalmTrunk());

        // Improved palm fronds
        const createPalmFronds = () => {
          const frondGroup = new THREE.Group();

          const frondCount = 9 + Math.floor(Math.random() * 4);
          const frondMaterial = new THREE.MeshStandardMaterial({
            color: 0x78a83b,
            roughness: 0.8,
            metalness: 0.0,
            side: THREE.DoubleSide,
          });

          for (let i = 0; i < frondCount; i++) {
            const angle = (i / frondCount) * Math.PI * 2;
            const tiltAngle = Math.PI / 4 + Math.random() * 0.2;

            // Create a more detailed frond shape using custom geometry
            const frond = new THREE.Group();

            // Main stem of the frond
            const stemLength = 3 + Math.random();
            const stemGeometry = new THREE.CylinderGeometry(
              0.03,
              0.05,
              stemLength,
              5
            );
            const stem = new THREE.Mesh(stemGeometry, frondMaterial);

            // Position at the tip of the trunk
            stem.position.y = 5;

            // Rotate stem outward from center
            stem.rotation.z = Math.PI / 2 - tiltAngle;
            stem.rotation.y = angle;

            frond.add(stem);

            // Add detailed leaflets along the stem
            const leafletCount = 15;
            const leafletLength = 0.8 + Math.random() * 0.4;
            const leafletWidth = 0.06 + Math.random() * 0.04;

            for (let j = 0; j < leafletCount; j++) {
              // Skip first few segments close to trunk
              if (j < 3) continue;

              // Position along stem - staggered on each side
              const t = j / leafletCount;
              const segmentPos = t * stemLength * 0.9;

              // Create main leaflet shape
              const leafletGeometry = new THREE.PlaneGeometry(
                leafletLength,
                leafletWidth
              );

              // Taper leaflet to a point
              const positions = leafletGeometry.attributes.position;
              for (let k = 0; k < positions.count; k++) {
                const x = positions.getX(k);
                if (x > 0) {
                  // Taper end points
                  positions.setY(
                    k,
                    positions.getY(k) * (1 - (x / leafletLength) * 0.7)
                  );
                }
              }

              leafletGeometry.computeVertexNormals();

              // Left leaflet
              const leftLeaflet = new THREE.Mesh(
                leafletGeometry,
                frondMaterial
              );
              leftLeaflet.position.set(0, 0, -leafletWidth / 2);
              leftLeaflet.rotation.x = Math.PI / 2;
              leftLeaflet.rotation.y = -Math.PI / 3 - Math.random() * 0.2;

              // Right leaflet
              const rightLeaflet = new THREE.Mesh(
                leafletGeometry.clone(),
                frondMaterial
              );
              rightLeaflet.position.set(0, 0, leafletWidth / 2);
              rightLeaflet.rotation.x = Math.PI / 2;
              rightLeaflet.rotation.y = Math.PI / 3 + Math.random() * 0.2;

              // Group for this leaflet pair
              const leafPair = new THREE.Group();
              leafPair.add(leftLeaflet);
              leafPair.add(rightLeaflet);

              // Position along stem
              leafPair.position.set(segmentPos, 0, 0);

              // Each leaflet droops more the further from trunk
              leafPair.rotation.z = t * -0.4;

              // Add to frond
              stem.add(leafPair);
            }

            frond.castShadow = true;
            frondGroup.add(frond);
          }

          // Add coconuts for more detail
          const coconutCount = Math.floor(Math.random() * 5);
          const coconutMaterial = new THREE.MeshStandardMaterial({
            color: 0x5e4b3b,
            roughness: 0.8,
            metalness: 0.1,
          });

          for (let i = 0; i < coconutCount; i++) {
            const coconutGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const coconut = new THREE.Mesh(coconutGeometry, coconutMaterial);

            const angle = Math.random() * Math.PI * 2;
            const radius = 0.2 + Math.random() * 0.1;

            coconut.position.set(
              Math.cos(angle) * radius,
              5 - 0.2,
              Math.sin(angle) * radius
            );

            coconut.castShadow = true;
            frondGroup.add(coconut);
          }

          return frondGroup;
        };

        treeGroup.add(createPalmFronds());
      }

      // Add a small amount of random rotation and scale variation
      treeGroup.rotation.y = Math.random() * Math.PI * 2;

      const scaleVariation = 0.8 + Math.random() * 0.4;
      treeGroup.scale.set(scaleVariation, scaleVariation, scaleVariation);

      return treeGroup;
    };

    // Attempt to get ground height for better placement
    const groundY = getGroundHeight(x, z);

    const tree = createTree();

    // Position the tree at the specified coordinates, adjusted for ground height
    tree.position.set(x, groundY, z);

    scene.add(tree);

    // Cleanup function
    return () => {
      scene.remove(tree);
      tree.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
    };
  }, [scene, x, z, type]);

  return null;
};

export default Tree;
