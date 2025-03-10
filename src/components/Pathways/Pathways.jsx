import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Pathways = ({ scene }) => {
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

    // Create improved park pathways
    const createPaths = () => {
      const pathGroup = new THREE.Group();

      // Enhanced path materials for better appearance
      const createPathMaterials = () => {
        // Main path material with improved texture
        const pathCanvas = document.createElement("canvas");
        pathCanvas.width = 128;
        pathCanvas.height = 128;
        const ctx = pathCanvas.getContext("2d");

        // Base color
        ctx.fillStyle = "#ddd0bb";
        ctx.fillRect(0, 0, 128, 128);

        // Add gravel-like texture
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

        // Edge material with different texture
        const edgeCanvas = document.createElement("canvas");
        edgeCanvas.width = 128;
        edgeCanvas.height = 64;
        const edgeCtx = edgeCanvas.getContext("2d");

        // Base color for edge
        edgeCtx.fillStyle = "#c2b6a3";
        edgeCtx.fillRect(0, 0, 128, 64);

        // Add texture elements
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

      // Create a curved path using bezier curves for smoother natural look
      const createSmoothPath = (start, end, width, controlPoints = []) => {
        // If control points provided, create a curved path
        if (controlPoints.length > 0) {
          // Create a smooth curved path using a curve
          const curve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(start[0], 0, start[1]),
            new THREE.Vector3(controlPoints[0][0], 0, controlPoints[0][1]),
            new THREE.Vector3(controlPoints[1][0], 0, controlPoints[1][1]),
            new THREE.Vector3(end[0], 0, end[1])
          );

          // Sample points along the curve
          const points = curve.getPoints(30);
          const pathPoints = [];

          // Create width-adjusted points for the path
          for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            // Calculate direction and perpendicular
            const direction = new THREE.Vector3()
              .subVectors(next, current)
              .normalize();
            const perpendicular = new THREE.Vector3(
              -direction.z,
              0,
              direction.x
            );

            // Create the 4 corners of this path segment
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

            // Store segment
            pathPoints.push([v1, v2, v4, v3]); // Order for correct face orientation
          }

          // Create geometry from these points
          const pathGeometry = new THREE.BufferGeometry();
          const vertices = [];
          const indices = [];

          // Add all vertices
          for (let i = 0; i < pathPoints.length; i++) {
            const segment = pathPoints[i];
            for (let j = 0; j < segment.length; j++) {
              vertices.push(segment[j].x, segment[j].y, segment[j].z);
            }

            // Add faces (2 triangles per segment)
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

          // Set up the geometry
          const positionArray = new Float32Array(vertices);
          pathGeometry.setIndex(indices);
          pathGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positionArray, 3)
          );
          pathGeometry.computeVertexNormals();

          // Create the path mesh
          const path = new THREE.Mesh(pathGeometry, pathMaterial);
          path.receiveShadow = true;
          path.position.y = 0.01; // Slightly above ground
          pathGroup.add(path);

          // Add edge
          createPathEdges(curve, width, 0.2);

          return curve; // Return the curve for potential future use
        } else {
          // For straight paths, use the simple method
          const [startX, startZ] = start;
          const [endX, endZ] = end;

          // Calculate path properties
          const length = Math.sqrt(
            Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2)
          );

          const angle = Math.atan2(endZ - startZ, endX - startX);

          // Create path segment with improved geometry
          const pathGeometry = new THREE.PlaneGeometry(
            length,
            width,
            Math.max(1, Math.ceil(length / 2)), // Segment length based on path length
            1
          );

          const path = new THREE.Mesh(pathGeometry, pathMaterial);

          // Adjust vertices to follow terrain
          const positions = pathGeometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);

            // Transform to world space
            const worldX =
              (startX + endX) / 2 + Math.cos(angle) * x - Math.sin(angle) * z;
            const worldZ =
              (startZ + endZ) / 2 + Math.sin(angle) * x + Math.cos(angle) * z;

            // Get ground height at this position
            const groundY = getGroundHeight(worldX, worldZ);
            if (groundY !== 0) {
              // Adjust height slightly above ground
              positions.setY(i, groundY + 0.02);
            }
          }

          // Update geometry
          positions.needsUpdate = true;
          pathGeometry.computeVertexNormals();

          // Position and rotate
          path.position.set(
            (startX + endX) / 2, // midpoint X
            0.01, // slightly above ground
            (startZ + endZ) / 2 // midpoint Z
          );

          path.rotation.x = -Math.PI / 2; // flat horizontal
          path.rotation.z = -angle; // align with direction

          path.receiveShadow = true;
          pathGroup.add(path);

          // Add path edge details (left and right sides)
          const addPathEdges = () => {
            const edgeWidth = 0.2;

            // Create edges (left and right)
            const edgeGeometry = new THREE.PlaneGeometry(
              length,
              edgeWidth,
              Math.max(1, Math.ceil(length / 2)),
              1
            );

            // Left edge
            const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            leftEdge.position.set(
              (startX + endX) / 2,
              0.015, // slightly higher than path
              (startZ + endZ) / 2 - width / 2 - edgeWidth / 2
            );

            leftEdge.rotation.x = -Math.PI / 2;
            leftEdge.rotation.z = -angle;
            leftEdge.receiveShadow = true;

            // Right edge
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

          // Create a line for potential future use
          const line = new THREE.LineCurve3(
            new THREE.Vector3(startX, 0, startZ),
            new THREE.Vector3(endX, 0, endZ)
          );

          return line;
        }
      };

      // Create edge meshes for curved paths
      const createPathEdges = (curve, pathWidth, edgeWidth) => {
        // Sample points along the curve
        const points = curve.getPoints(30);

        // Create edge geometry for left and right sides
        for (let side = -1; side <= 1; side += 2) {
          // -1 for left, 1 for right
          const edgePoints = [];

          // Generate points for this edge
          for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            // Calculate direction and perpendicular
            const direction = new THREE.Vector3()
              .subVectors(next, current)
              .normalize();
            const perpendicular = new THREE.Vector3(
              -direction.z,
              0,
              direction.x
            );

            // Offset for this edge
            const offset = (pathWidth / 2 + edgeWidth / 2) * side;

            // Edge points
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

            // Order points for correct face orientation
            if (side < 0) {
              edgePoints.push([v1, v2, v4, v3]);
            } else {
              edgePoints.push([v2, v1, v3, v4]);
            }
          }

          // Create geometry from these points
          const edgeGeometry = new THREE.BufferGeometry();
          const vertices = [];
          const indices = [];

          // Add all vertices
          for (let i = 0; i < edgePoints.length; i++) {
            const segment = edgePoints[i];
            for (let j = 0; j < segment.length; j++) {
              vertices.push(segment[j].x, segment[j].y + 0.005, segment[j].z); // Slightly higher
            }

            // Add faces (2 triangles per segment)
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

          // Set up the geometry
          const positionArray = new Float32Array(vertices);
          edgeGeometry.setIndex(indices);
          edgeGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positionArray, 3)
          );
          edgeGeometry.computeVertexNormals();

          // Create the edge mesh
          const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
          edge.receiveShadow = true;
          pathGroup.add(edge);
        }
      };

      // Define path network with main paths and curves
      const mainPathSegments = [
        // Main paths with gentle curves
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

        // Secondary paths with more natural curves
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

        // Winding path branches
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

        // Additional natural-looking tertiary paths
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

        // Lake access paths
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

      // Create all path segments
      const pathCurves = mainPathSegments.map((segment) =>
        createSmoothPath(
          segment.start,
          segment.end,
          segment.width,
          segment.controlPoints
        )
      );

      // Add decorative elements along paths
      const addPathDecoration = () => {
        // Path lamps at key locations
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

          // Lamp post with improved design
          const createLampPost = () => {
            const lampGroup = new THREE.Group();

            // Post base
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

            // Main post
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

            // Lamp arm
            const armGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
            const arm = new THREE.Mesh(armGeometry, postMaterial);
            arm.position.y = lamp.height - 0.1;
            arm.rotation.z = Math.PI / 2;
            arm.position.x = 0.2;
            arm.castShadow = true;
            lampGroup.add(arm);

            // Lamp head
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

            // Lamp glass
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

            // Light source
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

        // Enhanced benches with better placement along paths
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

          // Create varied bench types
          const createBench = () => {
            const benchGroup = new THREE.Group();

            if (bench.type === "wooden") {
              // Enhanced wooden bench
              // Bench base
              const benchGeometry = new THREE.BoxGeometry(2, 0.1, 0.8);
              const woodMaterial = new THREE.MeshStandardMaterial({
                color: 0x8b4513,
                roughness: 0.9,
                metalness: 0.0,
              });

              // Create slats for more realistic appearance
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

              // Bench back
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

              // Bench legs
              const legGeometry = new THREE.BoxGeometry(0.12, 0.6, 0.6);
              const metalMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                roughness: 0.6,
                metalness: 0.8,
              });

              // Left leg (from sitting perspective)
              const leftLeg = new THREE.Mesh(legGeometry, metalMaterial);
              leftLeg.position.set(-0.8, 0.3, 0);
              leftLeg.castShadow = true;
              benchGroup.add(leftLeg);

              // Right leg
              const rightLeg = new THREE.Mesh(legGeometry, metalMaterial);
              rightLeg.position.set(0.8, 0.3, 0);
              rightLeg.castShadow = true;
              benchGroup.add(rightLeg);
            } else if (bench.type === "stone") {
              // Stone bench variation
              const stoneMaterial = new THREE.MeshStandardMaterial({
                color: 0x999999,
                roughness: 1.0,
                metalness: 0.1,
              });

              // Main stone slab
              const seatGeometry = new THREE.BoxGeometry(2.2, 0.2, 0.9);

              // Add some irregularity to the stone
              const positions = seatGeometry.attributes.position;
              for (let i = 0; i < positions.count; i++) {
                if (positions.getY(i) > 0) {
                  // Only modify top vertices
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

              // Stone supports
              const supportGeometry = new THREE.CylinderGeometry(
                0.3,
                0.4,
                0.5,
                8
              );

              // Left support
              const leftSupport = new THREE.Mesh(
                supportGeometry,
                stoneMaterial
              );
              leftSupport.position.set(-0.7, 0.25, 0);
              leftSupport.castShadow = true;
              benchGroup.add(leftSupport);

              // Right support
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

        // Add path border details (flowers, rocks, etc.)
        const createPathBorders = () => {
          const borderGroup = new THREE.Group();

          // Define border element types
          const borderTypes = [
            // Rocks
            {
              type: "rock",
              probability: 0.4,
              createMesh: (scale, position) => {
                const rockGeometry = new THREE.DodecahedronGeometry(
                  scale * 0.3,
                  1
                );

                // Distort geometry for natural look
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

                // Position the rock at ground level
                const y = getGroundHeight(position.x, position.z) || 0;
                rock.position.set(position.x, y + scale * 0.15, position.z);

                // Random rotation for more natural appearance
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

            // Flowers
            {
              type: "flower",
              probability: 0.3,
              createMesh: (scale, position) => {
                const flowerGroup = new THREE.Group();

                // Stem
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

                // Choose flower color based on position for visual variety
                let petalColor;
                const colorSeed = (position.x * 0.1 + position.z * 0.2) % 1.0;

                if (colorSeed < 0.25) {
                  petalColor = 0xffff99; // Yellow
                } else if (colorSeed < 0.5) {
                  petalColor = 0xffcccc; // Pink
                } else if (colorSeed < 0.75) {
                  petalColor = 0x9999ff; // Purple
                } else {
                  petalColor = 0xffffff; // White
                }

                const petalMaterial = new THREE.MeshStandardMaterial({
                  color: petalColor,
                  roughness: 0.7,
                  metalness: 0.0,
                  side: THREE.DoubleSide,
                });

                // Flower center
                const centerGeometry = new THREE.SphereGeometry(
                  0.08 * scale,
                  8,
                  8
                );
                const centerMaterial = new THREE.MeshStandardMaterial({
                  color: 0xffaa00, // Orange
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

                // Create petals
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
                  petal.rotation.x = Math.PI / 4; // Tilt petals outward

                  petal.castShadow = true;
                  flowerGroup.add(petal);
                }

                // Position the flower at ground level
                const y = getGroundHeight(position.x, position.z) || 0;
                flowerGroup.position.set(position.x, y, position.z);

                // Slight random rotation
                flowerGroup.rotation.y = Math.random() * Math.PI * 2;

                return flowerGroup;
              },
            },

            // Grass tufts
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

                // Create multiple grass blades
                const bladeCount = 5 + Math.floor(Math.random() * 5);

                for (let i = 0; i < bladeCount; i++) {
                  const height = (0.3 + Math.random() * 0.4) * scale;
                  const bladeGeometry = new THREE.PlaneGeometry(
                    0.1 * scale,
                    height
                  );

                  // Bend the grass blade gently
                  const positions = bladeGeometry.attributes.position;
                  for (let j = 0; j < positions.count; j++) {
                    const y = positions.getY(j);
                    if (y > 0) {
                      // Bend more at the top
                      const bendFactor = (y / height) * 0.2 * scale;
                      positions.setX(j, positions.getX(j) + bendFactor);
                    }
                  }

                  bladeGeometry.computeVertexNormals();

                  const blade = new THREE.Mesh(bladeGeometry, grassMaterial);

                  // Position within a small area
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

                // Position the grass tuft at ground level
                const y = getGroundHeight(position.x, position.z) || 0;
                grassGroup.position.set(position.x, y, position.z);

                return grassGroup;
              },
            },
          ];

          // Place border elements along paths
          const placeBorderElements = () => {
            // Generate positions along path edges
            mainPathSegments.forEach((segment) => {
              const [startX, startZ] = segment.start;
              const [endX, endZ] = segment.end;
              const width = segment.width;

              let curve;

              if (segment.controlPoints && segment.controlPoints.length > 0) {
                // For curved paths, use the bezier curve
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

                // Sample positions along the curve
                const points = curve.getPoints(
                  Math.ceil(curve.getLength() / 3)
                );

                // Place elements along both sides of the path
                for (let i = 1; i < points.length - 1; i += 2) {
                  // Skip some points for fewer elements
                  const point = points[i];

                  // Get direction at this point
                  const tangent = curve.getTangent(i / (points.length - 1));
                  const perpendicular = new THREE.Vector3(
                    -tangent.z,
                    0,
                    tangent.x
                  ).normalize();

                  // Offset to both sides
                  for (let side = -1; side <= 1; side += 2) {
                    // Skip some positions randomly
                    if (Math.random() > 0.4) continue;

                    const offset =
                      (width / 2 + 0.3 + Math.random() * 0.7) * side;
                    const pos = {
                      x: point.x + perpendicular.x * offset,
                      z: point.z + perpendicular.z * offset,
                    };

                    // Add some randomness to position
                    pos.x += (Math.random() - 0.5) * 0.3;
                    pos.z += (Math.random() - 0.5) * 0.3;

                    // Choose element type
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
                // For straight paths, use simple linear interpolation
                const length = Math.sqrt(
                  Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2)
                );
                const steps = Math.ceil(length / 3);

                for (let i = 1; i < steps; i += 2) {
                  const t = i / steps;
                  const x = startX + (endX - startX) * t;
                  const z = startZ + (endZ - startZ) * t;

                  // Direction of the path
                  const dx = endX - startX;
                  const dz = endZ - startZ;
                  const pathLength = Math.sqrt(dx * dx + dz * dz);
                  const dirX = dx / pathLength;
                  const dirZ = dz / pathLength;

                  // Perpendicular to path direction
                  const perpX = -dirZ;
                  const perpZ = dirX;

                  // Offset to both sides
                  for (let side = -1; side <= 1; side += 2) {
                    // Skip some positions randomly
                    if (Math.random() > 0.4) continue;

                    const offset =
                      (width / 2 + 0.3 + Math.random() * 0.7) * side;
                    const pos = {
                      x: x + perpX * offset,
                      z: z + perpZ * offset,
                    };

                    // Add some randomness to position
                    pos.x += (Math.random() - 0.5) * 0.3;
                    pos.z += (Math.random() - 0.5) * 0.3;

                    // Choose element type
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

        // Create and add border elements
        const pathBorders = createPathBorders();
        pathGroup.add(pathBorders);

        // Create and add trash bins
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
            // Get ground height
            const groundY = getGroundHeight(x, z) || 0;

            // Bin body
            const binGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.8, 12);
            const binMaterial = new THREE.MeshStandardMaterial({
              color: 0x2d572c, // Dark green
              roughness: 0.9,
              metalness: 0.2,
            });

            const bin = new THREE.Mesh(binGeometry, binMaterial);
            bin.position.set(x, groundY + 0.4, z);
            bin.castShadow = true;
            bin.receiveShadow = true;
            binGroup.add(bin);

            // Bin top rim
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

        // Add trash bins
        const trashBins = createTrashBins();
        pathGroup.add(trashBins);
      };

      // Add path decorations
      addPathDecoration();

      return pathGroup;
    };

    // Create and add paths to scene
    const pathways = createPaths();
    scene.add(pathways);

    // Cleanup function
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
