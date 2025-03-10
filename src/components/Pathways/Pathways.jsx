import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Pathways = ({ scene }) => {
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

    const createPaths = () => {
      const pathGroup = new THREE.Group();

      const createPathMaterials = () => {
        const pathCanvas = document.createElement("canvas");
        pathCanvas.width = 128;
        pathCanvas.height = 128;
        const ctx = pathCanvas.getContext("2d");

        ctx.fillStyle = "#ddd0bb";
        ctx.fillRect(0, 0, 128, 128);

        for (let i = 0; i < 300; i++) {
          const x = Math.random() * 128;
          const y = Math.random() * 128;
          const size = 0.5 + Math.random() * 1.5;

          ctx.fillStyle = `rgba(${180 + Math.random() * 40}, ${
            160 + Math.random() * 40
          }, ${140 + Math.random() * 40}, 0.5)`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }

        const pathTexture = new THREE.CanvasTexture(pathCanvas);
        pathTexture.wrapS = pathTexture.wrapT = THREE.RepeatWrapping;
        pathTexture.repeat.set(5, 5);

        const pathMaterial = new THREE.MeshStandardMaterial({
          map: pathTexture,
          color: 0xddd0bb,
          roughness: 0.9,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });

        const edgeCanvas = document.createElement("canvas");
        edgeCanvas.width = 128;
        edgeCanvas.height = 64;
        const edgeCtx = edgeCanvas.getContext("2d");

        edgeCtx.fillStyle = "#c2b6a3";
        edgeCtx.fillRect(0, 0, 128, 64);

        for (let i = 0; i < 100; i++) {
          const x = Math.random() * 128;
          const y = Math.random() * 64;

          edgeCtx.fillStyle = `rgba(${160 + Math.random() * 30}, ${
            140 + Math.random() * 30
          }, ${120 + Math.random() * 30}, 0.6)`;
          edgeCtx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 2);
        }

        const edgeTexture = new THREE.CanvasTexture(edgeCanvas);
        edgeTexture.wrapS = edgeTexture.wrapT = THREE.RepeatWrapping;
        edgeTexture.repeat.set(10, 1);

        const edgeMaterial = new THREE.MeshStandardMaterial({
          map: edgeTexture,
          color: 0xc2b6a3,
          roughness: 0.9,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });

        return { pathMaterial, edgeMaterial };
      };

      const { pathMaterial, edgeMaterial } = createPathMaterials();

      const createSmoothPath = (start, end, width, controlPoints = []) => {
        if (controlPoints.length > 0) {
          const curve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(start[0], 0, start[1]),
            new THREE.Vector3(controlPoints[0][0], 0, controlPoints[0][1]),
            new THREE.Vector3(controlPoints[1][0], 0, controlPoints[1][1]),
            new THREE.Vector3(end[0], 0, end[1])
          );

          const points = curve.getPoints(30);
          const pathPoints = [];

          for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            const direction = new THREE.Vector3()
              .subVectors(next, current)
              .normalize();
            const perpendicular = new THREE.Vector3(
              -direction.z,
              0,
              direction.x
            );

            const halfWidth = width / 2;
            const v1 = new THREE.Vector3().addVectors(
              current,
              perpendicular.clone().multiplyScalar(halfWidth)
            );
            const v2 = new THREE.Vector3().subVectors(
              current,
              perpendicular.clone().multiplyScalar(halfWidth)
            );
            const v3 = new THREE.Vector3().addVectors(
              next,
              perpendicular.clone().multiplyScalar(halfWidth)
            );
            const v4 = new THREE.Vector3().subVectors(
              next,
              perpendicular.clone().multiplyScalar(halfWidth)
            );

            pathPoints.push([v1, v2, v4, v3]);
          }

          const pathGeometry = new THREE.BufferGeometry();
          const vertices = [];
          const indices = [];

          for (let i = 0; i < pathPoints.length; i++) {
            const segment = pathPoints[i];
            for (let j = 0; j < segment.length; j++) {
              vertices.push(segment[j].x, segment[j].y, segment[j].z);
            }

            const baseIndex = i * 4;
            indices.push(
              baseIndex,
              baseIndex + 1,
              baseIndex + 2,
              baseIndex,
              baseIndex + 2,
              baseIndex + 3
            );
          }

          const positionArray = new Float32Array(vertices);
          pathGeometry.setIndex(indices);
          pathGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positionArray, 3)
          );
          pathGeometry.computeVertexNormals();

          const path = new THREE.Mesh(pathGeometry, pathMaterial);
          path.receiveShadow = true;
          path.position.y = 0.01;
          pathGroup.add(path);

          createPathEdges(curve, width, 0.2);

          return curve;
        } else {
          const [startX, startZ] = start;
          const [endX, endZ] = end;

          const length = Math.sqrt(
            Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2)
          );

          const angle = Math.atan2(endZ - startZ, endX - startX);

          const pathGeometry = new THREE.PlaneGeometry(
            length,
            width,
            Math.max(1, Math.ceil(length / 2)),
            1
          );

          const path = new THREE.Mesh(pathGeometry, pathMaterial);

          const positions = pathGeometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            const worldX =
              (startX + endX) / 2 + Math.cos(angle) * x - Math.sin(angle) * z;
            const worldZ =
              (startZ + endZ) / 2 + Math.sin(angle) * x + Math.cos(angle) * z;

            const groundY = getGroundHeight(worldX, worldZ);
            if (groundY !== 0) {
              positions.setY(i, groundY + 0.02);
            }
          }

          positions.needsUpdate = true;
          pathGeometry.computeVertexNormals();

          path.position.set((startX + endX) / 2, 0.01, (startZ + endZ) / 2);

          path.rotation.x = -Math.PI / 2;
          path.rotation.z = -angle;

          path.receiveShadow = true;
          pathGroup.add(path);

          const addPathEdges = () => {
            const edgeWidth = 0.2;

            const edgeGeometry = new THREE.PlaneGeometry(
              length,
              edgeWidth,
              Math.max(1, Math.ceil(length / 2)),
              1
            );

            const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            leftEdge.position.set(
              (startX + endX) / 2,
              0.015,
              (startZ + endZ) / 2 - width / 2 - edgeWidth / 2
            );

            leftEdge.rotation.x = -Math.PI / 2;
            leftEdge.rotation.z = -angle;
            leftEdge.receiveShadow = true;

            const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            rightEdge.position.set(
              (startX + endX) / 2,
              0.015,
              (startZ + endZ) / 2 + width / 2 + edgeWidth / 2
            );

            rightEdge.rotation.x = -Math.PI / 2;
            rightEdge.rotation.z = -angle;
            rightEdge.receiveShadow = true;

            pathGroup.add(leftEdge);
            pathGroup.add(rightEdge);
          };

          addPathEdges();

          const line = new THREE.LineCurve3(
            new THREE.Vector3(startX, 0, startZ),
            new THREE.Vector3(endX, 0, endZ)
          );

          return line;
        }
      };

      const createPathEdges = (curve, pathWidth, edgeWidth) => {
        const points = curve.getPoints(30);

        for (let side = -1; side <= 1; side += 2) {
          const edgePoints = [];

          for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            const direction = new THREE.Vector3()
              .subVectors(next, current)
              .normalize();
            const perpendicular = new THREE.Vector3(
              -direction.z,
              0,
              direction.x
            );

            const offset = (pathWidth / 2 + edgeWidth / 2) * side;

            const v1 = new THREE.Vector3().addVectors(
              current,
              perpendicular.clone().multiplyScalar(offset)
            );
            const v2 = new THREE.Vector3().addVectors(
              current,
              perpendicular.clone().multiplyScalar(offset + edgeWidth * side)
            );
            const v3 = new THREE.Vector3().addVectors(
              next,
              perpendicular.clone().multiplyScalar(offset)
            );
            const v4 = new THREE.Vector3().addVectors(
              next,
              perpendicular.clone().multiplyScalar(offset + edgeWidth * side)
            );

            if (side < 0) {
              edgePoints.push([v1, v2, v4, v3]);
            } else {
              edgePoints.push([v2, v1, v3, v4]);
            }
          }

          const edgeGeometry = new THREE.BufferGeometry();
          const vertices = [];
          const indices = [];

          for (let i = 0; i < edgePoints.length; i++) {
            const segment = edgePoints[i];
            for (let j = 0; j < segment.length; j++) {
              vertices.push(segment[j].x, segment[j].y + 0.005, segment[j].z); // Slightly higher
            }

            const baseIndex = i * 4;
            indices.push(
              baseIndex,
              baseIndex + 1,
              baseIndex + 2,
              baseIndex,
              baseIndex + 2,
              baseIndex + 3
            );
          }

          const positionArray = new Float32Array(vertices);
          edgeGeometry.setIndex(indices);
          edgeGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positionArray, 3)
          );
          edgeGeometry.computeVertexNormals();

          const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
          edge.receiveShadow = true;
          pathGroup.add(edge);
        }
      };

      const mainPathSegments = [
        {
          start: [-40, 0],
          end: [40, 0],
          width: 2.5,
          controlPoints: [
            [-15, -3],
            [15, 3],
          ],
        },
        {
          start: [0, -40],
          end: [0, 40],
          width: 2.5,
          controlPoints: [
            [3, -15],
            [-3, 15],
          ],
        },
        {
          start: [-20, -20],
          end: [20, 20],
          width: 1.8,
          controlPoints: [
            [-5, -5],
            [5, 5],
          ],
        },
        {
          start: [-20, 20],
          end: [20, -20],
          width: 1.8,
          controlPoints: [
            [-5, 5],
            [5, -5],
          ],
        },
        {
          start: [0, 0],
          end: [15, 15],
          width: 1.5,
          controlPoints: [
            [5, 2],
            [10, 10],
          ],
        },
        {
          start: [0, 0],
          end: [-15, 15],
          width: 1.5,
          controlPoints: [
            [-5, 2],
            [-10, 10],
          ],
        },
        {
          start: [0, 0],
          end: [15, -15],
          width: 1.5,
          controlPoints: [
            [5, -2],
            [10, -10],
          ],
        },
        {
          start: [0, 0],
          end: [-15, -15],
          width: 1.5,
          controlPoints: [
            [-5, -2],
            [-10, -10],
          ],
        },
        {
          start: [15, 15],
          end: [25, 10],
          width: 1.2,
          controlPoints: [
            [18, 15],
            [22, 12],
          ],
        },
        {
          start: [-15, 15],
          end: [-25, 10],
          width: 1.2,
          controlPoints: [
            [-18, 15],
            [-22, 12],
          ],
        },
        {
          start: [15, -15],
          end: [25, -10],
          width: 1.2,
          controlPoints: [
            [18, -15],
            [22, -12],
          ],
        },
        {
          start: [-15, -15],
          end: [-25, -10],
          width: 1.2,
          controlPoints: [
            [-18, -15],
            [-22, -12],
          ],
        },
        {
          start: [-15, -15],
          end: [-25, -20],
          width: 1.0,
          controlPoints: [
            [-18, -16],
            [-23, -18],
          ],
        },
        {
          start: [15, 15],
          end: [25, 25],
          width: 1.0,
          controlPoints: [
            [18, 18],
            [22, 23],
          ],
        },
      ];

      const pathCurves = mainPathSegments.map((segment) =>
        createSmoothPath(
          segment.start,
          segment.end,
          segment.width,
          segment.controlPoints
        )
      );

      const addPathDecoration = () => {
        const lampPositions = [
          { pos: [-20, -20], height: 3.0 },
          { pos: [20, 20], height: 3.0 },
          { pos: [-20, 20], height: 3.0 },
          { pos: [20, -20], height: 3.0 },
          { pos: [15, 15], height: 2.5 },
          { pos: [-15, 15], height: 2.5 },
          { pos: [15, -15], height: 2.5 },
          { pos: [-15, -15], height: 2.5 },
          { pos: [25, 10], height: 2.5 },
          { pos: [-25, 10], height: 2.5 },
          { pos: [25, -10], height: 2.5 },
          { pos: [-25, -10], height: 2.5 },
          { pos: [30, 0], height: 3.0 },
          { pos: [-30, 0], height: 3.0 },
          { pos: [0, 30], height: 3.0 },
          { pos: [0, -30], height: 3.0 },
        ];

        lampPositions.forEach((lamp) => {
          const [x, z] = lamp.pos;
          const groundY = getGroundHeight(x, z) || 0;

          const createLampPost = () => {
            const lampGroup = new THREE.Group();

            const baseGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 8);
            const baseMaterial = new THREE.MeshStandardMaterial({
              color: 0x555555,
              roughness: 0.7,
              metalness: 0.6,
            });

            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = 0.15;
            base.castShadow = true;
            lampGroup.add(base);

            const postGeometry = new THREE.CylinderGeometry(
              0.08,
              0.1,
              lamp.height - 0.3,
              8
            );
            const postMaterial = new THREE.MeshStandardMaterial({
              color: 0x333333,
              roughness: 0.8,
              metalness: 0.5,
            });

            const post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.y = lamp.height / 2;
            post.castShadow = true;
            lampGroup.add(post);

            const armGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
            const arm = new THREE.Mesh(armGeometry, postMaterial);
            arm.position.y = lamp.height - 0.1;
            arm.rotation.z = Math.PI / 2;
            arm.position.x = 0.2;
            arm.castShadow = true;
            lampGroup.add(arm);

            const headGeometry = new THREE.ConeGeometry(0.15, 0.25, 8, 1, true);
            const headMaterial = new THREE.MeshStandardMaterial({
              color: 0x444444,
              roughness: 0.7,
              metalness: 0.6,
              side: THREE.DoubleSide,
            });

            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.set(0.4, lamp.height - 0.1, 0);
            head.rotation.z = -Math.PI / 2;
            head.castShadow = true;
            lampGroup.add(head);

            const glassGeometry = new THREE.SphereGeometry(
              0.12,
              12,
              12,
              0,
              Math.PI * 2,
              0,
              Math.PI / 2
            );
            const glassMaterial = new THREE.MeshBasicMaterial({
              color: 0xffeecc,
              transparent: true,
              opacity: 0.8,
            });

            const glass = new THREE.Mesh(glassGeometry, glassMaterial);
            glass.position.set(0.4, lamp.height - 0.22, 0);
            glass.rotation.x = Math.PI;
            lampGroup.add(glass);

            const light = new THREE.PointLight(0xffeecc, 1, 10);
            light.position.set(0.4, lamp.height - 0.25, 0);
            light.castShadow = true;
            light.shadow.mapSize.width = 256;
            light.shadow.mapSize.height = 256;
            light.shadow.camera.near = 0.1;
            light.shadow.camera.far = 10;

            lampGroup.add(light);

            return lampGroup;
          };

          const lampPost = createLampPost();
          lampPost.position.set(x, groundY, z);
          lampPost.rotation.y = Math.random() * Math.PI * 2;

          pathGroup.add(lampPost);
        });

        const benchPositions = [
          { pos: [10, 0], rot: 0, type: "wooden" },
          { pos: [-10, 0], rot: Math.PI, type: "stone" },
          { pos: [0, 10], rot: Math.PI / 2, type: "wooden" },
          { pos: [0, -10], rot: -Math.PI / 2, type: "stone" },
          { pos: [20, 20], rot: Math.PI / 4, type: "wooden" },
          { pos: [-20, -20], rot: (-Math.PI * 3) / 4, type: "stone" },
        ];

        benchPositions.forEach((bench) => {
          const [x, z] = bench.pos;
          const groundY = getGroundHeight(x, z) || 0;

          const createBench = () => {
            const benchGroup = new THREE.Group();

            if (bench.type === "wooden") {
              const benchGeometry = new THREE.BoxGeometry(2, 0.1, 0.8);
              const woodMaterial = new THREE.MeshStandardMaterial({
                color: 0x8b4513,
                roughness: 0.9,
                metalness: 0.0,
              });

              const slatCount = 5;
              const slatWidth = 1.9 / slatCount;
              const gap = 0.05;

              for (let i = 0; i < slatCount; i++) {
                const slat = new THREE.Mesh(
                  new THREE.BoxGeometry(slatWidth - gap, 0.08, 0.8),
                  woodMaterial
                );

                slat.position.set(
                  -0.95 + i * slatWidth + slatWidth / 2,
                  0.6,
                  0
                );

                slat.castShadow = true;
                slat.receiveShadow = true;
                benchGroup.add(slat);
              }

              for (let i = 0; i < 3; i++) {
                const backSlat = new THREE.Mesh(
                  new THREE.BoxGeometry(1.9, 0.12, 0.08),
                  woodMaterial
                );

                backSlat.position.set(0, 1.0 + i * 0.25, -0.35);

                backSlat.castShadow = true;
                backSlat.receiveShadow = true;
                benchGroup.add(backSlat);
              }

              const legGeometry = new THREE.BoxGeometry(0.12, 0.6, 0.6);
              const metalMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                roughness: 0.6,
                metalness: 0.8,
              });

              const leftLeg = new THREE.Mesh(legGeometry, metalMaterial);
              leftLeg.position.set(-0.8, 0.3, 0);
              leftLeg.castShadow = true;
              benchGroup.add(leftLeg);

              const rightLeg = new THREE.Mesh(legGeometry, metalMaterial);
              rightLeg.position.set(0.8, 0.3, 0);
              rightLeg.castShadow = true;
              benchGroup.add(rightLeg);
            } else if (bench.type === "stone") {
              const stoneMaterial = new THREE.MeshStandardMaterial({
                color: 0x999999,
                roughness: 1.0,
                metalness: 0.1,
              });

              const seatGeometry = new THREE.BoxGeometry(2.2, 0.2, 0.9);

              const positions = seatGeometry.attributes.position;
              for (let i = 0; i < positions.count; i++) {
                if (positions.getY(i) > 0) {
                  positions.setY(
                    i,
                    positions.getY(i) + (Math.random() - 0.5) * 0.05
                  );
                  positions.setX(
                    i,
                    positions.getX(i) + (Math.random() - 0.5) * 0.03
                  );
                  positions.setZ(
                    i,
                    positions.getZ(i) + (Math.random() - 0.5) * 0.03
                  );
                }
              }

              seatGeometry.computeVertexNormals();

              const seat = new THREE.Mesh(seatGeometry, stoneMaterial);
              seat.position.y = 0.55;
              seat.castShadow = true;
              seat.receiveShadow = true;
              benchGroup.add(seat);

              const supportGeometry = new THREE.CylinderGeometry(
                0.3,
                0.4,
                0.5,
                8
              );

              const leftSupport = new THREE.Mesh(
                supportGeometry,
                stoneMaterial
              );
              leftSupport.position.set(-0.7, 0.25, 0);
              leftSupport.castShadow = true;
              benchGroup.add(leftSupport);

              const rightSupport = new THREE.Mesh(
                supportGeometry,
                stoneMaterial
              );
              rightSupport.position.set(0.7, 0.25, 0);
              rightSupport.castShadow = true;
              benchGroup.add(rightSupport);
            }

            return benchGroup;
          };

          const bench = createBench();
          bench.position.set(x, groundY, z);
          bench.rotation.y = bench.rot;

          pathGroup.add(bench);
        });

        const createPathBorders = () => {
          const borderGroup = new THREE.Group();

          const borderTypes = [
            {
              type: "rock",
              probability: 0.4,
              createMesh: (scale, position) => {
                const rockGeometry = new THREE.DodecahedronGeometry(
                  scale * 0.3,
                  1
                );

                const positions = rockGeometry.attributes.position;
                for (let i = 0; i < positions.count; i++) {
                  positions.setX(
                    i,
                    positions.getX(i) + (Math.random() - 0.5) * 0.1 * scale
                  );
                  positions.setY(
                    i,
                    positions.getY(i) + (Math.random() - 0.5) * 0.1 * scale
                  );
                  positions.setZ(
                    i,
                    positions.getZ(i) + (Math.random() - 0.5) * 0.1 * scale
                  );
                }

                rockGeometry.computeVertexNormals();

                const rockMaterial = new THREE.MeshStandardMaterial({
                  color: 0x888888,
                  roughness: 0.9,
                  metalness: 0.1,
                });

                const rock = new THREE.Mesh(rockGeometry, rockMaterial);

                const y = getGroundHeight(position.x, position.z) || 0;
                rock.position.set(position.x, y + scale * 0.15, position.z);

                rock.rotation.set(
                  Math.random() * Math.PI * 2,
                  Math.random() * Math.PI * 2,
                  Math.random() * Math.PI * 2
                );

                rock.scale.set(scale, scale * 0.7, scale);
                rock.castShadow = true;
                rock.receiveShadow = true;

                return rock;
              },
            },

            {
              type: "flower",
              probability: 0.3,
              createMesh: (scale, position) => {
                const flowerGroup = new THREE.Group();

                const stemGeometry = new THREE.CylinderGeometry(
                  0.02,
                  0.02,
                  0.5 * scale,
                  5
                );
                const stemMaterial = new THREE.MeshStandardMaterial({
                  color: 0x336633,
                  roughness: 0.9,
                  metalness: 0.0,
                });

                const stem = new THREE.Mesh(stemGeometry, stemMaterial);
                stem.position.y = 0.25 * scale;
                stem.castShadow = true;
                flowerGroup.add(stem);

                let petalColor;
                const colorSeed = (position.x * 0.1 + position.z * 0.2) % 1.0;

                if (colorSeed < 0.25) {
                  petalColor = 0xffff99;
                } else if (colorSeed < 0.5) {
                  petalColor = 0xffcccc;
                } else if (colorSeed < 0.75) {
                  petalColor = 0x9999ff;
                } else {
                  petalColor = 0xffffff;
                }

                const petalMaterial = new THREE.MeshStandardMaterial({
                  color: petalColor,
                  roughness: 0.7,
                  metalness: 0.0,
                  side: THREE.DoubleSide,
                });

                const centerGeometry = new THREE.SphereGeometry(
                  0.08 * scale,
                  8,
                  8
                );
                const centerMaterial = new THREE.MeshStandardMaterial({
                  color: 0xffaa00,
                  roughness: 0.8,
                  metalness: 0.0,
                });

                const flowerCenter = new THREE.Mesh(
                  centerGeometry,
                  centerMaterial
                );
                flowerCenter.position.y = 0.5 * scale;
                flowerCenter.castShadow = true;
                flowerGroup.add(flowerCenter);

                const petalCount = 5 + Math.floor(Math.random() * 3);

                for (let i = 0; i < petalCount; i++) {
                  const angle = (i / petalCount) * Math.PI * 2;
                  const petalGeometry = new THREE.PlaneGeometry(
                    0.15 * scale,
                    0.15 * scale
                  );

                  const petal = new THREE.Mesh(petalGeometry, petalMaterial);

                  petal.position.set(
                    Math.cos(angle) * 0.1 * scale,
                    0.5 * scale,
                    Math.sin(angle) * 0.1 * scale
                  );

                  petal.rotation.y = angle;
                  petal.rotation.x = Math.PI / 4;

                  petal.castShadow = true;
                  flowerGroup.add(petal);
                }

                const y = getGroundHeight(position.x, position.z) || 0;
                flowerGroup.position.set(position.x, y, position.z);

                flowerGroup.rotation.y = Math.random() * Math.PI * 2;

                return flowerGroup;
              },
            },

            {
              type: "grass",
              probability: 0.3,
              createMesh: (scale, position) => {
                const grassGroup = new THREE.Group();

                const grassMaterial = new THREE.MeshStandardMaterial({
                  color: 0x55aa44,
                  roughness: 0.8,
                  metalness: 0.0,
                  side: THREE.DoubleSide,
                });

                const bladeCount = 5 + Math.floor(Math.random() * 5);

                for (let i = 0; i < bladeCount; i++) {
                  const height = (0.3 + Math.random() * 0.4) * scale;
                  const bladeGeometry = new THREE.PlaneGeometry(
                    0.1 * scale,
                    height
                  );

                  const positions = bladeGeometry.attributes.position;
                  for (let j = 0; j < positions.count; j++) {
                    const y = positions.getY(j);
                    if (y > 0) {
                      const bendFactor = (y / height) * 0.2 * scale;
                      positions.setX(j, positions.getX(j) + bendFactor);
                    }
                  }

                  bladeGeometry.computeVertexNormals();

                  const blade = new THREE.Mesh(bladeGeometry, grassMaterial);

                  const angle = Math.random() * Math.PI * 2;
                  const radius = Math.random() * 0.1 * scale;

                  blade.position.set(
                    Math.cos(angle) * radius,
                    height / 2,
                    Math.sin(angle) * radius
                  );

                  blade.rotation.y = Math.random() * Math.PI * 2;
                  blade.castShadow = true;
                  grassGroup.add(blade);
                }

                const y = getGroundHeight(position.x, position.z) || 0;
                grassGroup.position.set(position.x, y, position.z);

                return grassGroup;
              },
            },
          ];

          const placeBorderElements = () => {
            mainPathSegments.forEach((segment) => {
              const [startX, startZ] = segment.start;
              const [endX, endZ] = segment.end;
              const width = segment.width;

              let curve;

              if (segment.controlPoints && segment.controlPoints.length > 0) {
                curve = new THREE.CubicBezierCurve3(
                  new THREE.Vector3(startX, 0, startZ),
                  new THREE.Vector3(
                    segment.controlPoints[0][0],
                    0,
                    segment.controlPoints[0][1]
                  ),
                  new THREE.Vector3(
                    segment.controlPoints[1][0],
                    0,
                    segment.controlPoints[1][1]
                  ),
                  new THREE.Vector3(endX, 0, endZ)
                );

                const points = curve.getPoints(
                  Math.ceil(curve.getLength() / 3)
                );

                for (let i = 1; i < points.length - 1; i += 2) {
                  const point = points[i];

                  const tangent = curve.getTangent(i / (points.length - 1));
                  const perpendicular = new THREE.Vector3(
                    -tangent.z,
                    0,
                    tangent.x
                  ).normalize();

                  for (let side = -1; side <= 1; side += 2) {
                    if (Math.random() > 0.4) continue;

                    const offset =
                      (width / 2 + 0.3 + Math.random() * 0.7) * side;
                    const pos = {
                      x: point.x + perpendicular.x * offset,
                      z: point.z + perpendicular.z * offset,
                    };

                    pos.x += (Math.random() - 0.5) * 0.3;
                    pos.z += (Math.random() - 0.5) * 0.3;

                    let chosenType = null;
                    let cumProb = 0;
                    const rand = Math.random();

                    for (const borderType of borderTypes) {
                      cumProb += borderType.probability;
                      if (rand < cumProb) {
                        chosenType = borderType;
                        break;
                      }
                    }

                    if (chosenType) {
                      const scale = 0.8 + Math.random() * 0.4;
                      const element = chosenType.createMesh(scale, pos);
                      borderGroup.add(element);
                    }
                  }
                }
              } else {
                const length = Math.sqrt(
                  Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2)
                );
                const steps = Math.ceil(length / 3);

                for (let i = 1; i < steps; i += 2) {
                  const t = i / steps;
                  const x = startX + (endX - startX) * t;
                  const z = startZ + (endZ - startZ) * t;

                  const dx = endX - startX;
                  const dz = endZ - startZ;
                  const pathLength = Math.sqrt(dx * dx + dz * dz);
                  const dirX = dx / pathLength;
                  const dirZ = dz / pathLength;

                  const perpX = -dirZ;
                  const perpZ = dirX;

                  for (let side = -1; side <= 1; side += 2) {
                    if (Math.random() > 0.4) continue;

                    const offset =
                      (width / 2 + 0.3 + Math.random() * 0.7) * side;
                    const pos = {
                      x: x + perpX * offset,
                      z: z + perpZ * offset,
                    };

                    pos.x += (Math.random() - 0.5) * 0.3;
                    pos.z += (Math.random() - 0.5) * 0.3;

                    let chosenType = null;
                    let cumProb = 0;
                    const rand = Math.random();

                    for (const borderType of borderTypes) {
                      cumProb += borderType.probability;
                      if (rand < cumProb) {
                        chosenType = borderType;
                        break;
                      }
                    }

                    if (chosenType) {
                      const scale = 0.8 + Math.random() * 0.4;
                      const element = chosenType.createMesh(scale, pos);
                      borderGroup.add(element);
                    }
                  }
                }
              }
            });
          };

          placeBorderElements();

          return borderGroup;
        };

        const pathBorders = createPathBorders();
        pathGroup.add(pathBorders);

        const createTrashBins = () => {
          const binGroup = new THREE.Group();

          const binPositions = [
            [5, 5],
            [-5, 5],
            [5, -5],
            [-5, -5],
            [15, 0],
            [-15, 0],
            [0, 15],
            [0, -15],
          ];

          binPositions.forEach(([x, z]) => {
            const groundY = getGroundHeight(x, z) || 0;

            const binGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.8, 12);
            const binMaterial = new THREE.MeshStandardMaterial({
              color: 0x2d572c,
              roughness: 0.9,
              metalness: 0.2,
            });

            const bin = new THREE.Mesh(binGeometry, binMaterial);
            bin.position.set(x, groundY + 0.4, z);
            bin.castShadow = true;
            bin.receiveShadow = true;
            binGroup.add(bin);

            const rimGeometry = new THREE.TorusGeometry(0.3, 0.03, 8, 24);
            const metalMaterial = new THREE.MeshStandardMaterial({
              color: 0x444444,
              roughness: 0.6,
              metalness: 0.8,
            });

            const rim = new THREE.Mesh(rimGeometry, metalMaterial);
            rim.position.set(x, groundY + 0.8, z);
            rim.rotation.x = Math.PI / 2;
            rim.castShadow = true;
            binGroup.add(rim);
          });

          return binGroup;
        };

        const trashBins = createTrashBins();
        pathGroup.add(trashBins);
      };

      addPathDecoration();

      return pathGroup;
    };

    const pathways = createPaths();
    scene.add(pathways);

    return () => {
      scene.remove(pathways);

      pathways.traverse((obj) => {
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
        if (obj.isLight) {
          scene.remove(obj);
        }
      });
    };
  }, [scene]);

  return null;
};

export default Pathways;
