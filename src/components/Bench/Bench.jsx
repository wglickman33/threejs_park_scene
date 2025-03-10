import { useEffect } from "react";
import * as THREE from "three";
import "./Bench.css";

const Bench = ({ scene, x = 0, z = 0, rotation = 0, type = "wooden" }) => {
  useEffect(() => {
    if (!scene) return;

    // Helper function to get ground height at position
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

    // Create enhanced materials with better textures
    const createWoodMaterial = () => {
      // Create canvas for wood grain texture
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      // Base wood color
      ctx.fillStyle = "#8b4513";
      ctx.fillRect(0, 0, 256, 256);

      // Add wood grain texture
      ctx.strokeStyle = "#73390d";
      ctx.lineWidth = 1;

      for (let i = 0; i < 80; i++) {
        const x = Math.random() * 256;
        const y = 0;
        const amplitude = 5 + Math.random() * 5;
        const frequency = 0.01 + Math.random() * 0.02;
        const lineWidth = 1 + Math.random() * 2;

        ctx.beginPath();
        ctx.lineWidth = lineWidth;

        for (let yPos = 0; yPos < 256; yPos++) {
          const xOffset = Math.sin(yPos * frequency) * amplitude;
          ctx.lineTo(x + xOffset, yPos);
        }

        ctx.stroke();
      }

      // Add some knots
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = 3 + Math.random() * 8;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, "#5d2906");
        gradient.addColorStop(0.7, "#73390d");
        gradient.addColorStop(1, "#8b4513");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      return new THREE.MeshStandardMaterial({
        map: texture,
        color: 0x8b4513,
        roughness: 0.9,
        metalness: 0.0,
        bumpMap: texture,
        bumpScale: 0.05,
      });
    };

    const createMetalMaterial = () => {
      // Create canvas for metal texture
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      // Base metal color
      ctx.fillStyle = "#777777";
      ctx.fillRect(0, 0, 256, 256);

      // Add subtle brushed metal effect
      ctx.strokeStyle = "#999999";
      ctx.lineWidth = 1;

      // Horizontal brushed effect
      for (let i = 0; i < 150; i++) {
        const y = Math.random() * 256;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.globalAlpha = 0.1 + Math.random() * 0.1;
        ctx.stroke();
      }

      // Add some wear marks and dents
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = 2 + Math.random() * 5;

        ctx.fillStyle = `rgba(100, 100, 100, ${Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);

      return new THREE.MeshStandardMaterial({
        map: texture,
        color: 0x777777,
        roughness: 0.3,
        metalness: 0.8,
        bumpMap: texture,
        bumpScale: 0.02,
      });
    };

    const createStoneMaterial = () => {
      // Create canvas for stone texture
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      // Base stone color
      ctx.fillStyle = "#999999";
      ctx.fillRect(0, 0, 256, 256);

      // Add stone texture
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = 1 + Math.random() * 3;
        const brightness = Math.random() * 50 - 25;

        ctx.fillStyle = `rgb(${150 + brightness}, ${150 + brightness}, ${
          150 + brightness
        })`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add some cracks
      ctx.strokeStyle = "#777777";
      for (let i = 0; i < 10; i++) {
        const x1 = Math.random() * 256;
        const y1 = Math.random() * 256;
        const x2 = x1 + (Math.random() - 0.5) * 30;
        const y2 = y1 + (Math.random() - 0.5) * 30;
        const x3 = x2 + (Math.random() - 0.5) * 30;
        const y3 = y2 + (Math.random() - 0.5) * 30;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 0.5 + Math.random();
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      return new THREE.MeshStandardMaterial({
        map: texture,
        color: 0x999999,
        roughness: 0.8,
        metalness: 0.05,
        bumpMap: texture,
        bumpScale: 0.05,
      });
    };

    // Get materials
    const woodMaterial = createWoodMaterial();
    const metalMaterial = createMetalMaterial();
    const stoneMaterial = createStoneMaterial();

    // Create a more natural looking bench
    const createBench = () => {
      const benchGroup = new THREE.Group();

      if (type === "wooden") {
        // Traditional wooden bench with slats

        // Create main bench frame from curved/tubular shapes
        const createBenchFrame = () => {
          const frameGroup = new THREE.Group();

          // Create armrests
          [-0.9, 0.9].forEach((xPos) => {
            // Armrest curve
            const armPoints = [];
            armPoints.push(new THREE.Vector3(xPos, 0.5, 0.25));
            armPoints.push(new THREE.Vector3(xPos, 0.65, 0.1));
            armPoints.push(new THREE.Vector3(xPos, 0.7, -0.1));
            armPoints.push(new THREE.Vector3(xPos, 0.6, -0.25));

            const armCurve = new THREE.CatmullRomCurve3(armPoints);
            const armGeometry = new THREE.TubeGeometry(
              armCurve,
              20,
              0.06,
              8,
              false
            );
            const arm = new THREE.Mesh(armGeometry, woodMaterial);
            arm.castShadow = true;
            frameGroup.add(arm);

            // Vertical supports
            [0.25, -0.25].forEach((zPos) => {
              const supportGeometry = new THREE.CylinderGeometry(
                0.05,
                0.06,
                0.5,
                8
              );
              const support = new THREE.Mesh(supportGeometry, woodMaterial);
              support.position.set(xPos, 0.25, zPos);
              support.castShadow = true;
              frameGroup.add(support);
            });
          });

          // Create backrest frame
          const backPoints = [];
          for (let i = 0; i <= 8; i++) {
            const t = i / 8;
            backPoints.push(
              new THREE.Vector3(
                (t * 2 - 1) * 0.9, // x from -0.9 to 0.9
                0.6 + Math.sin(t * Math.PI) * 0.4, // curved top
                -0.25
              )
            );
          }

          const backCurve = new THREE.CatmullRomCurve3(backPoints);
          const backGeometry = new THREE.TubeGeometry(
            backCurve,
            20,
            0.05,
            8,
            false
          );
          const backFrame = new THREE.Mesh(backGeometry, woodMaterial);
          backFrame.castShadow = true;
          frameGroup.add(backFrame);

          return frameGroup;
        };

        const benchFrame = createBenchFrame();
        benchGroup.add(benchFrame);

        // Seat slats
        const createSeats = () => {
          const seatGroup = new THREE.Group();

          // Create 5 slats for the seat
          const slatCount = 5;
          for (let i = 0; i < slatCount; i++) {
            const t = i / (slatCount - 1);
            const zPos = -0.25 + t * 0.5; // From -0.25 to 0.25

            // Each slat is slightly curved for comfort
            const slatPoints = [];
            for (let j = 0; j <= 8; j++) {
              const u = j / 8;
              slatPoints.push(
                new THREE.Vector3(
                  (u * 2 - 1) * 0.9, // x from -0.9 to 0.9
                  0.5 - Math.sin(u * Math.PI) * 0.02, // slight dip in the middle
                  zPos
                )
              );
            }

            const slatCurve = new THREE.CatmullRomCurve3(slatPoints);
            const slatGeometry = new THREE.TubeGeometry(
              slatCurve,
              10,
              0.04,
              8,
              false
            );
            const slat = new THREE.Mesh(slatGeometry, woodMaterial);
            slat.castShadow = true;
            slat.receiveShadow = true;
            seatGroup.add(slat);
          }

          // Create 3 slats for the backrest
          for (let i = 0; i < 3; i++) {
            const height = 0.7 + i * 0.2; // Different heights on backrest

            const backSlatGeometry = new THREE.BoxGeometry(1.8, 0.08, 0.03);
            // Round the corners slightly
            const backSlat = new THREE.Mesh(backSlatGeometry, woodMaterial);
            backSlat.position.set(0, height, -0.25);
            backSlat.castShadow = true;
            backSlat.receiveShadow = true;
            seatGroup.add(backSlat);
          }

          return seatGroup;
        };

        const benchSeats = createSeats();
        benchGroup.add(benchSeats);

        // Bench legs
        const createLegs = () => {
          const legsGroup = new THREE.Group();

          // Create legs with metal supports
          [-0.7, 0.7].forEach((xPos) => {
            // Main leg - slightly tapered
            const legGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.5, 8);
            const leg = new THREE.Mesh(legGeometry, metalMaterial);
            leg.position.set(xPos, 0.25, 0);
            leg.castShadow = true;
            legsGroup.add(leg);

            // Add foot plates
            const footGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.03, 8);
            const foot = new THREE.Mesh(footGeometry, metalMaterial);
            foot.position.set(xPos, 0.015, 0);
            foot.receiveShadow = true;
            legsGroup.add(foot);
          });

          return legsGroup;
        };

        const benchLegs = createLegs();
        benchGroup.add(benchLegs);
      } else if (type === "stone") {
        // Stone bench with modern design

        // Create main stone slab with curved top
        const createStoneSlab = () => {
          // Create a custom shape for the stone slab with rounded edges
          const shape = new THREE.Shape();
          const width = 2.0;
          const depth = 0.7;
          const radius = 0.1; // Corner radius

          // Define the shape with rounded corners
          shape.moveTo(-width / 2 + radius, -depth / 2);
          shape.lineTo(width / 2 - radius, -depth / 2);
          shape.quadraticCurveTo(
            width / 2,
            -depth / 2,
            width / 2,
            -depth / 2 + radius
          );
          shape.lineTo(width / 2, depth / 2 - radius);
          shape.quadraticCurveTo(
            width / 2,
            depth / 2,
            width / 2 - radius,
            depth / 2
          );
          shape.lineTo(-width / 2 + radius, depth / 2);
          shape.quadraticCurveTo(
            -width / 2,
            depth / 2,
            -width / 2,
            depth / 2 - radius
          );
          shape.lineTo(-width / 2, -depth / 2 + radius);
          shape.quadraticCurveTo(
            -width / 2,
            -depth / 2,
            -width / 2 + radius,
            -depth / 2
          );

          // Extrude the shape
          const extrudeSettings = {
            steps: 1,
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelOffset: 0,
            bevelSegments: 3,
          };

          const seatGeometry = new THREE.ExtrudeGeometry(
            shape,
            extrudeSettings
          );

          // Position correctly for a seat
          seatGeometry.rotateX(Math.PI / 2);

          // Add a subtle curve to the top for comfort
          const positions = seatGeometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(positions, i);

            // Only curve the top surface
            if (Math.abs(vertex.y - 0.15) < 0.05) {
              // Apply subtle curve based on x position
              const xFactor = 1 - Math.pow(vertex.x / (width / 2), 2);
              vertex.y -= xFactor * 0.03;
            }

            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
          }

          seatGeometry.computeVertexNormals();

          const seat = new THREE.Mesh(seatGeometry, stoneMaterial);
          seat.position.y = 0.5;
          seat.castShadow = true;
          seat.receiveShadow = true;

          return seat;
        };

        const stoneSeat = createStoneSlab();
        benchGroup.add(stoneSeat);

        // Create stone supports
        const createSupports = () => {
          const supportsGroup = new THREE.Group();

          // Create two curved stone supports
          [-0.5, 0.5].forEach((xPos) => {
            // Create slightly irregular shape for natural look
            const supportShape = new THREE.Shape();

            // Define control points for a roughly trapezoidal shape
            const points = [
              { x: -0.2, y: 0 },
              { x: 0.2, y: 0 },
              { x: 0.15, y: 0.5 },
              { x: -0.15, y: 0.5 },
            ];

            // Add some irregularity to points
            for (let i = 0; i < points.length; i++) {
              points[i].x += (Math.random() - 0.5) * 0.03;
              points[i].y += (Math.random() - 0.5) * 0.03;
            }

            // Create the shape with smooth connections
            supportShape.moveTo(points[0].x, points[0].y);
            supportShape.lineTo(points[1].x, points[1].y);
            supportShape.bezierCurveTo(
              points[1].x,
              points[1].y + 0.1,
              points[2].x,
              points[2].y - 0.1,
              points[2].x,
              points[2].y
            );
            supportShape.lineTo(points[3].x, points[3].y);
            supportShape.bezierCurveTo(
              points[3].x,
              points[3].y - 0.1,
              points[0].x,
              points[0].y + 0.1,
              points[0].x,
              points[0].y
            );

            // Extrude the shape
            const extrudeSettings = {
              steps: 1,
              depth: 0.4,
              bevelEnabled: true,
              bevelThickness: 0.02,
              bevelSize: 0.02,
              bevelOffset: 0,
              bevelSegments: 3,
            };

            const supportGeometry = new THREE.ExtrudeGeometry(
              supportShape,
              extrudeSettings
            );

            // Add surface details for natural stone look
            const positions = supportGeometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
              const vertex = new THREE.Vector3();
              vertex.fromBufferAttribute(positions, i);

              // Add small random displacements to surface
              vertex.x += (Math.random() - 0.5) * 0.01;
              vertex.y += (Math.random() - 0.5) * 0.01;
              vertex.z += (Math.random() - 0.5) * 0.01;

              positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }

            supportGeometry.computeVertexNormals();

            const support = new THREE.Mesh(supportGeometry, stoneMaterial);
            support.position.set(xPos, 0, 0);
            support.rotation.y = Math.PI / 2;
            support.castShadow = true;
            support.receiveShadow = true;

            supportsGroup.add(support);
          });

          // Add a base platform
          const baseGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.6);
          const base = new THREE.Mesh(baseGeometry, stoneMaterial);
          base.position.y = 0.05;
          base.receiveShadow = true;
          supportsGroup.add(base);

          return supportsGroup;
        };

        const stoneSupports = createSupports();
        benchGroup.add(stoneSupports);

        // Add some decorative elements
        const createDecorations = () => {
          const decorGroup = new THREE.Group();

          // Add subtle engravings to the stone
          // (Would need custom texturing, simplified here)

          // Add some small stone chips/details on the base
          for (let i = 0; i < 8; i++) {
            const size = 0.02 + Math.random() * 0.04;
            const detailGeometry = new THREE.DodecahedronGeometry(size, 0);

            // Distort the geometry slightly
            const positions = detailGeometry.attributes.position;
            for (let j = 0; j < positions.count; j++) {
              const vertex = new THREE.Vector3();
              vertex.fromBufferAttribute(positions, j);

              vertex.x += (Math.random() - 0.5) * 0.01;
              vertex.y += (Math.random() - 0.5) * 0.01;
              vertex.z += (Math.random() - 0.5) * 0.01;

              positions.setXYZ(j, vertex.x, vertex.y, vertex.z);
            }

            detailGeometry.computeVertexNormals();

            const detail = new THREE.Mesh(detailGeometry, stoneMaterial);

            // Position randomly around the base
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.7 + Math.random() * 0.1;
            detail.position.set(
              Math.cos(angle) * radius,
              0.05 + size / 2,
              Math.sin(angle) * radius
            );

            decorGroup.add(detail);
          }

          return decorGroup;
        };

        const decorations = createDecorations();
        benchGroup.add(decorations);
      }

      return benchGroup;
    };

    const bench = createBench();

    // Get ground height at bench position
    const groundY = getGroundHeight(x, z);

    // Position and rotate the bench
    bench.position.set(x, groundY, z);
    bench.rotation.y = rotation;

    // Adjust position to sit flush with ground
    bench.position.y = groundY;

    // Add subtle randomization to make each bench unique
    if (type === "wooden") {
      // Slightly different wood tone for each bench
      bench.traverse((child) => {
        if (
          child.isMesh &&
          child.material.color &&
          child.material.color.isColor
        ) {
          // Add subtle color variation
          const hueShift = (Math.random() - 0.5) * 0.05;
          const satShift = (Math.random() - 0.5) * 0.1;
          const hsl = { h: 0, s: 0, l: 0 };
          child.material.color.getHSL(hsl);
          child.material.color.setHSL(
            hsl.h + hueShift,
            hsl.s + satShift,
            hsl.l
          );
        }
      });

      // Slight random rotation to avoid perfect alignment
      bench.rotation.y += (Math.random() - 0.5) * 0.05;
    } else if (type === "stone") {
      // Subtle tilt for stone benches
      bench.rotation.x += (Math.random() - 0.5) * 0.02;
      bench.rotation.z += (Math.random() - 0.5) * 0.02;

      // Vary the stone color slightly
      bench.traverse((child) => {
        if (
          child.isMesh &&
          child.material.color &&
          child.material.color.isColor
        ) {
          // Add subtle gray tone variation
          const val = (Math.random() - 0.5) * 0.08;
          child.material.color.r += val;
          child.material.color.g += val;
          child.material.color.b += val;
        }
      });
    }

    // Add the bench to the scene
    scene.add(bench);

    // Return cleanup function
    return () => {
      scene.remove(bench);
      bench.traverse((object) => {
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
  }, [scene, x, z, rotation, type]);

  return null;
};

export default Bench;
