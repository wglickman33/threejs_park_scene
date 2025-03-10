import { useEffect } from "react";
import * as THREE from "three";
import "./Tree.css";

const Tree = ({ scene, x = 0, z = 0, type = "pine" }) => {
  useEffect(() => {
    if (!scene) return;

    const getGroundHeight = (x, z) => {
      const raycaster = new THREE.Raycaster();
      raycaster.set(new THREE.Vector3(x, 10, z), new THREE.Vector3(0, -1, 0));

      const intersects = raycaster.intersectObjects(scene.children, true);

      for (let i = 0; i < intersects.length; i++) {
        if (Math.abs(intersects[i].point.y) < 5) {
          return intersects[i].point.y;
        }
      }

      return 0;
    };

    const createTree = () => {
      const treeGroup = new THREE.Group();

      const treeType =
        type === "random"
          ? ["pine", "oak", "birch", "palm"][Math.floor(Math.random() * 4)]
          : type;

      if (treeType === "pine") {
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
        const trunkCanvas = document.createElement("canvas");
        trunkCanvas.width = 64;
        trunkCanvas.height = 128;
        const ctx = trunkCanvas.getContext("2d");

        ctx.fillStyle = "#8b4513";
        ctx.fillRect(0, 0, 64, 128);

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

        const createPineNeedles = () => {
          const pineGroup = new THREE.Group();

          const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d4c1e,
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide,
          });

          const layers = 3 + Math.floor(Math.random() * 2);

          for (let i = 0; i < layers; i++) {
            const layerHeight = 1.2;
            const coneHeight = 1.8;
            const scaleFactor = 1 - i * 0.2;

            const coneGeometry = new THREE.ConeGeometry(
              1.2 * scaleFactor,
              coneHeight,
              8
            );

            const cone = new THREE.Mesh(coneGeometry, foliageMaterial);
            cone.position.y = 3 + i * layerHeight;
            cone.castShadow = true;
            pineGroup.add(cone);

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

              const radius = 1.0 * scaleFactor;
              detail.position.set(
                Math.cos(angle) * radius,
                3 + i * layerHeight + (Math.random() - 0.5) * 0.5,
                Math.sin(angle) * radius
              );

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
        const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 2.5, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
          color: 0x6b4423,
          roughness: 0.9,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });

        const trunkPositions = trunkGeometry.attributes.position;
        for (let i = 0; i < trunkPositions.count; i++) {
          const theta = Math.atan2(
            trunkPositions.getZ(i),
            trunkPositions.getX(i)
          );

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

        const createBranches = () => {
          const branchGroup = new THREE.Group();
          const branchCount = 3 + Math.floor(Math.random() * 4);

          for (let i = 0; i < branchCount; i++) {
            const length = 1.2 + Math.random() * 0.8;
            const branchGeometry = new THREE.CylinderGeometry(
              0.1,
              0.15,
              length,
              5
            );

            const positions = branchGeometry.attributes.position;
            for (let j = 0; j < positions.count; j++) {
              const y = positions.getY(j);
              const normalizedY = (y + length / 2) / length;
              const bend = 0.2 * Math.sin(normalizedY * Math.PI);
              positions.setY(j, y + bend);
            }

            branchGeometry.computeVertexNormals();

            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);

            const height = 1.0 + Math.random() * 1.5;
            const angle = i * ((Math.PI * 2) / branchCount);
            const tilt = Math.PI / 4 + Math.random() * 0.2;

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

        const createOakCanopy = () => {
          const canopyGroup = new THREE.Group();

          const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x406020,
            roughness: 0.8,
            metalness: 0.0,
          });

          const createLeafCluster = (x, y, z, size) => {
            const cluster = new THREE.Group();

            const sphereCount = 3 + Math.floor(Math.random() * 3);

            for (let i = 0; i < sphereCount; i++) {
              const offsetX = (Math.random() - 0.5) * size * 0.8;
              const offsetY = (Math.random() - 0.5) * size * 0.6;
              const offsetZ = (Math.random() - 0.5) * size * 0.8;

              const partSize = (0.6 + Math.random() * 0.4) * size;

              const foliageGeometry = new THREE.SphereGeometry(partSize, 8, 8);
              const part = new THREE.Mesh(foliageGeometry, foliageMaterial);

              part.position.set(x + offsetX, y + offsetY, z + offsetZ);
              part.castShadow = true;

              cluster.add(part);
            }

            return cluster;
          };

          const canopyCenter = new THREE.Vector3(0, 3.5, 0);

          canopyGroup.add(
            createLeafCluster(
              canopyCenter.x,
              canopyCenter.y,
              canopyCenter.z,
              1.4
            )
          );

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
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.25, 6, 8);

        const trunkCanvas = document.createElement("canvas");
        trunkCanvas.width = 128;
        trunkCanvas.height = 512;
        const ctx = trunkCanvas.getContext("2d");

        ctx.fillStyle = "#F5F5F5";
        ctx.fillRect(0, 0, 128, 512);

        ctx.fillStyle = "#333333";
        for (let i = 0; i < 20; i++) {
          const y = Math.random() * 512;
          const w = 2 + Math.random() * 10;
          const h = 2 + Math.random() * 5;
          ctx.fillRect(0, y, w, h);

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

        const createBirchFoliage = () => {
          const foliageGroup = new THREE.Group();

          const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x99cc66,
            roughness: 0.8,
            metalness: 0.0,
            transparent: true,
            opacity: 0.9,
          });

          const createLeafCluster = (x, y, z, size) => {
            const group = new THREE.Group();

            const count = 4 + Math.floor(Math.random() * 4);

            for (let i = 0; i < count; i++) {
              const sphereGeometry = new THREE.SphereGeometry(size, 7, 7);

              const positions = sphereGeometry.attributes.position;
              for (let j = 0; j < positions.count; j++) {
                positions.setY(j, positions.getY(j) * 0.7);
              }

              sphereGeometry.computeVertexNormals();

              const sphere = new THREE.Mesh(sphereGeometry, foliageMaterial);

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
        const createPalmTrunk = () => {
          const points = [];
          const height = 5;
          const segments = 12;
          const curve = 0.3;

          for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = curve * Math.sin(t * Math.PI);
            const y = height * t;
            points.push(new THREE.Vector2(x, y));
          }

          const trunkGeometry = new THREE.LatheGeometry(points, 8);

          const trunkCanvas = document.createElement("canvas");
          trunkCanvas.width = 64;
          trunkCanvas.height = 256;
          const ctx = trunkCanvas.getContext("2d");

          ctx.fillStyle = "#8b5a2b";
          ctx.fillRect(0, 0, 64, 256);

          ctx.fillStyle = "#734222";
          const lineCount = 30;
          for (let i = 0; i < lineCount; i++) {
            const y = i * (256 / lineCount);
            ctx.fillRect(0, y, 64, 2 + Math.random() * 3);
          }

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

            const frond = new THREE.Group();

            const stemLength = 3 + Math.random();
            const stemGeometry = new THREE.CylinderGeometry(
              0.03,
              0.05,
              stemLength,
              5
            );
            const stem = new THREE.Mesh(stemGeometry, frondMaterial);

            stem.position.y = 5;

            stem.rotation.z = Math.PI / 2 - tiltAngle;
            stem.rotation.y = angle;

            frond.add(stem);

            const leafletCount = 15;
            const leafletLength = 0.8 + Math.random() * 0.4;
            const leafletWidth = 0.06 + Math.random() * 0.04;

            for (let j = 0; j < leafletCount; j++) {
              if (j < 3) continue;

              const t = j / leafletCount;
              const segmentPos = t * stemLength * 0.9;

              const leafletGeometry = new THREE.PlaneGeometry(
                leafletLength,
                leafletWidth
              );

              const positions = leafletGeometry.attributes.position;
              for (let k = 0; k < positions.count; k++) {
                const x = positions.getX(k);
                if (x > 0) {
                  positions.setY(
                    k,
                    positions.getY(k) * (1 - (x / leafletLength) * 0.7)
                  );
                }
              }

              leafletGeometry.computeVertexNormals();

              const leftLeaflet = new THREE.Mesh(
                leafletGeometry,
                frondMaterial
              );
              leftLeaflet.position.set(0, 0, -leafletWidth / 2);
              leftLeaflet.rotation.x = Math.PI / 2;
              leftLeaflet.rotation.y = -Math.PI / 3 - Math.random() * 0.2;

              const rightLeaflet = new THREE.Mesh(
                leafletGeometry.clone(),
                frondMaterial
              );
              rightLeaflet.position.set(0, 0, leafletWidth / 2);
              rightLeaflet.rotation.x = Math.PI / 2;
              rightLeaflet.rotation.y = Math.PI / 3 + Math.random() * 0.2;

              const leafPair = new THREE.Group();
              leafPair.add(leftLeaflet);
              leafPair.add(rightLeaflet);

              leafPair.position.set(segmentPos, 0, 0);

              leafPair.rotation.z = t * -0.4;

              stem.add(leafPair);
            }

            frond.castShadow = true;
            frondGroup.add(frond);
          }

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

      treeGroup.rotation.y = Math.random() * Math.PI * 2;

      const scaleVariation = 0.8 + Math.random() * 0.4;
      treeGroup.scale.set(scaleVariation, scaleVariation, scaleVariation);

      return treeGroup;
    };

    const groundY = getGroundHeight(x, z);

    const tree = createTree();

    tree.position.set(x, groundY, z);

    scene.add(tree);

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
