import React, { useEffect } from "react";
import * as THREE from "three";
import "./Parkour.css";

const Parkour = ({ scene }) => {
  useEffect(() => {
    if (!scene) return;

    // Helper function to get the ground height at a specific position
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

    // Create a more visually appealing parkour course with various obstacles
    const parkourGroup = new THREE.Group();

    // Enhanced materials with better textures and properties
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
        roughness: 0.8,
        metalness: 0.1,
        bumpMap: texture,
        bumpScale: 0.05,
      });
    };

    const woodMaterial = createWoodMaterial();

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

    const metalMaterial = createMetalMaterial();

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
        color: 0xa0a0a0,
        roughness: 0.8,
        metalness: 0.05,
        bumpMap: texture,
        bumpScale: 0.05,
      });
    };

    const stoneMaterial = createStoneMaterial();

    // Create a more interesting starting platform with beveled edges
    const createPlatform = (width, depth, height, x, y, z, material) => {
      const platformGroup = new THREE.Group();

      // Create main platform with beveled edges using shape geometry
      const shape = new THREE.Shape();
      const bevel = 0.1;

      shape.moveTo(-width / 2 + bevel, -depth / 2);
      shape.lineTo(width / 2 - bevel, -depth / 2);
      shape.quadraticCurveTo(
        width / 2,
        -depth / 2,
        width / 2,
        -depth / 2 + bevel
      );
      shape.lineTo(width / 2, depth / 2 - bevel);
      shape.quadraticCurveTo(
        width / 2,
        depth / 2,
        width / 2 - bevel,
        depth / 2
      );
      shape.lineTo(-width / 2 + bevel, depth / 2);
      shape.quadraticCurveTo(
        -width / 2,
        depth / 2,
        -width / 2,
        depth / 2 - bevel
      );
      shape.lineTo(-width / 2, -depth / 2 + bevel);
      shape.quadraticCurveTo(
        -width / 2,
        -depth / 2,
        -width / 2 + bevel,
        -depth / 2
      );

      const extrudeSettings = {
        steps: 1,
        depth: height,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelOffset: 0,
        bevelSegments: 3,
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      // Rotate and position correctly
      geometry.rotateX(Math.PI / 2);
      geometry.translate(0, height / 2, 0);

      const platform = new THREE.Mesh(geometry, material);
      platform.castShadow = true;
      platform.receiveShadow = true;
      platform.position.set(x, y, z);

      platformGroup.add(platform);

      // Add subtle decorative elements to top surface
      const addDecorations = () => {
        // Add subtle border along the edge
        const borderWidth = 0.1;
        const borderGeometry = new THREE.BoxGeometry(
          width - 0.1,
          borderWidth,
          borderWidth
        );
        const borderMaterial = new THREE.MeshStandardMaterial({
          color: material.color.clone().multiplyScalar(0.9),
          roughness: material.roughness,
          metalness: material.metalness,
        });

        // Top border
        const topBorder = new THREE.Mesh(borderGeometry, borderMaterial);
        topBorder.position.set(
          0,
          y + height / 2 + borderWidth / 2,
          depth / 2 - borderWidth / 2
        );
        topBorder.castShadow = true;
        platformGroup.add(topBorder);

        // Bottom border
        const bottomBorder = new THREE.Mesh(borderGeometry, borderMaterial);
        bottomBorder.position.set(
          0,
          y + height / 2 + borderWidth / 2,
          -depth / 2 + borderWidth / 2
        );
        bottomBorder.castShadow = true;
        platformGroup.add(bottomBorder);

        // Left border
        const leftBorderGeo = new THREE.BoxGeometry(
          borderWidth,
          borderWidth,
          depth - 0.1
        );
        const leftBorder = new THREE.Mesh(leftBorderGeo, borderMaterial);
        leftBorder.position.set(
          -width / 2 + borderWidth / 2,
          y + height / 2 + borderWidth / 2,
          0
        );
        leftBorder.castShadow = true;
        platformGroup.add(leftBorder);

        // Right border
        const rightBorder = new THREE.Mesh(leftBorderGeo, borderMaterial);
        rightBorder.position.set(
          width / 2 - borderWidth / 2,
          y + height / 2 + borderWidth / 2,
          0
        );
        rightBorder.castShadow = true;
        platformGroup.add(rightBorder);
      };

      addDecorations();

      return platformGroup;
    };

    // Starting platform with better texture and surface details
    const groundHeight = getGroundHeight(15, 15);
    const startPlatform = createPlatform(
      3,
      3,
      0.5,
      15,
      groundHeight,
      15,
      stoneMaterial
    );
    parkourGroup.add(startPlatform);

    // Create a nicer looking sign
    const createSign = () => {
      const signGroup = new THREE.Group();

      // Post with better geometry and texture
      const postGeometry = new THREE.CylinderGeometry(0.1, 0.12, 2, 8);
      const post = new THREE.Mesh(postGeometry, woodMaterial);
      post.position.set(15, groundHeight + 1.25, 15.8);
      post.castShadow = true;
      signGroup.add(post);

      // Sign board with nicer edges
      const boardGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.1);
      boardGeometry.translate(0, 0.4, 0);
      const board = new THREE.Mesh(boardGeometry, woodMaterial);
      board.position.set(15, groundHeight + 2, 15.8);
      board.castShadow = true;
      signGroup.add(board);

      // Add text to the sign
      const createTextTexture = (text) => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");

        // Background slightly darker than the sign
        ctx.fillStyle = "#6b3003";
        ctx.fillRect(0, 0, 256, 128);

        // Text
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";

        // Multi-line text
        const lines = text.split("\n");
        const lineHeight = 30;
        const startY = 64 - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, i) => {
          ctx.fillText(line, 128, startY + i * lineHeight);
        });

        return new THREE.CanvasTexture(canvas);
      };

      const textTexture = createTextTexture("PARKOUR\nCOURSE");
      const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
      });

      const textPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.7),
        textMaterial
      );
      textPlane.position.set(15, groundHeight + 2, 15.85);
      signGroup.add(textPlane);

      // Add decorative elements to sign
      const cornerSize = 0.1;
      const cornerGeo = new THREE.BoxGeometry(cornerSize, cornerSize, 0.15);
      const cornerMaterial = new THREE.MeshStandardMaterial({
        color: 0x5c2800,
        roughness: 0.8,
        metalness: 0.3,
      });

      // Add corners
      [-0.7, 0.7].forEach((x) => {
        [-0.35, 0.35].forEach((y) => {
          const corner = new THREE.Mesh(cornerGeo, cornerMaterial);
          corner.position.set(15 + x, groundHeight + 2 + y, 15.85);
          signGroup.add(corner);
        });
      });

      return signGroup;
    };

    const sign = createSign();
    parkourGroup.add(sign);

    // First jump - stepping stones with more natural shapes
    const createSteppingStone = (x, y, z, size = 1.2) => {
      // Create a more natural stone shape using multiple geometries
      const stoneGroup = new THREE.Group();

      // Base stone - slightly irregular shape
      const baseGeometry = new THREE.CylinderGeometry(
        size / 2,
        (size / 2) * 1.1,
        0.3,
        6
      );
      // Deform slightly for more natural look
      const positions = baseGeometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(positions, i);

        // Only modify vertices on the sides for an irregular shape
        if (vertex.y > -0.1 && vertex.y < 0.1) {
          const angle = Math.atan2(vertex.z, vertex.x);
          const radius = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
          const newRadius = radius * (1 + Math.sin(angle * 3) * 0.1);

          vertex.x = Math.cos(angle) * newRadius;
          vertex.z = Math.sin(angle) * newRadius;
        }

        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }

      baseGeometry.computeVertexNormals();

      const stone = new THREE.Mesh(baseGeometry, stoneMaterial);
      stone.castShadow = true;
      stone.receiveShadow = true;
      stoneGroup.add(stone);

      // Add some small details/cracks to the top
      const detailCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < detailCount; i++) {
        const detailSize = 0.1 + Math.random() * 0.15;
        const detailGeometry = new THREE.BoxGeometry(
          detailSize,
          0.05,
          detailSize
        );

        const detailMaterial = new THREE.MeshStandardMaterial({
          color: stoneMaterial.color.clone().multiplyScalar(0.9),
          roughness: 1.0,
          metalness: 0.0,
        });

        const detail = new THREE.Mesh(detailGeometry, detailMaterial);

        // Position on top of stone
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (size / 2 - detailSize);
        detail.position.set(
          Math.cos(angle) * distance,
          0.15 + 0.025,
          Math.sin(angle) * distance
        );

        detail.rotation.y = Math.random() * Math.PI;

        stoneGroup.add(detail);
      }

      // Position the stone
      stoneGroup.position.set(x, y, z);

      // Apply a slight random rotation
      stoneGroup.rotation.y = Math.random() * Math.PI * 2;

      return stoneGroup;
    };

    // Create a series of stepping stones with more natural placement
    const steppingStonePositions = [
      { x: 17, y: groundHeight + 0.15, z: 15 },
      { x: 19, y: groundHeight + 0.15, z: 16 },
      { x: 20.5, y: groundHeight + 0.15, z: 14 },
      { x: 22, y: groundHeight + 0.15, z: 12 },
      { x: 20, y: groundHeight + 0.15, z: 10 },
    ];

    steppingStonePositions.forEach((pos, index) => {
      // Vary the size slightly for more natural look
      const size = 1.1 + Math.random() * 0.3;
      const stone = createSteppingStone(pos.x, pos.y, pos.z, size);
      parkourGroup.add(stone);
    });

    // Create a more natural looking balance beam with wood grain texture
    const createBalanceBeam = (x, y, z, length, width = 0.3, height = 0.3) => {
      const beamGroup = new THREE.Group();

      // Main beam with subtle curve and wood grain
      const points = [];
      const segments = 10;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        // Add subtle curve to beam
        const yOffset = Math.sin(t * Math.PI) * 0.1;
        points.push(new THREE.Vector3(t * length - length / 2, yOffset, 0));
      }

      const beamGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const beamCurve = new THREE.CatmullRomCurve3(points);
      const extrudedBeamGeometry = new THREE.TubeGeometry(
        beamCurve,
        segments,
        width / 2,
        8,
        false
      );

      const beam = new THREE.Mesh(extrudedBeamGeometry, woodMaterial);
      beam.castShadow = true;
      beam.receiveShadow = true;
      beamGroup.add(beam);

      // Add subtle supports at each end
      [-1, 1].forEach((end) => {
        const supportGeometry = new THREE.CylinderGeometry(0.1, 0.15, y, 6);
        const support = new THREE.Mesh(supportGeometry, woodMaterial);
        support.position.set((end * length) / 2, -y / 2, 0);
        support.castShadow = true;
        support.receiveShadow = true;
        beamGroup.add(support);

        // Add support base
        const baseGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.1, 6);
        const base = new THREE.Mesh(baseGeometry, stoneMaterial);
        base.position.set((end * length) / 2, -y + 0.05, 0);
        base.receiveShadow = true;
        beamGroup.add(base);
      });

      beamGroup.position.set(x, y, z);

      return beamGroup;
    };

    const balanceBeam = createBalanceBeam(17, groundHeight + 0.15, 8, 6);
    parkourGroup.add(balanceBeam);

    // Platform after beam
    const midPlatformHeight = groundHeight + 0.25;
    const midPlatform = createPlatform(
      2,
      2,
      0.5,
      14,
      midPlatformHeight,
      8,
      stoneMaterial
    );
    parkourGroup.add(midPlatform);

    // Create a more visually interesting climbing wall
    const createClimbingWall = () => {
      const wallGroup = new THREE.Group();

      // Wall base with texture
      const wallGeometry = new THREE.BoxGeometry(3, 4, 0.5);
      const wall = new THREE.Mesh(wallGeometry, stoneMaterial);
      wall.position.set(14, groundHeight + 2, 5);
      wall.receiveShadow = true;
      wall.castShadow = true;
      wallGroup.add(wall);

      // Create climbing grips with more varied shapes and colors
      const createClimbingGrips = () => {
        const gripTypes = [
          // Small round holds
          {
            geometry: new THREE.SphereGeometry(0.15, 10, 10),
            color: 0xff5733,
            frequency: 0.4,
          },
          // Edge holds
          {
            geometry: new THREE.BoxGeometry(0.25, 0.07, 0.1),
            color: 0x33ff57,
            frequency: 0.3,
          },
          // Pinch holds
          {
            geometry: new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8),
            color: 0x3357ff,
            frequency: 0.3,
          },
        ];

        // Grid-like placement with some randomness
        const rows = 6;
        const cols = 5;

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            // Skip some positions
            if (Math.random() > 0.7) continue;

            // Choose grip type
            let gripType;
            const rand = Math.random();
            let accumProb = 0;

            for (const type of gripTypes) {
              accumProb += type.frequency;
              if (rand < accumProb) {
                gripType = type;
                break;
              }
            }

            // Create grip
            const gripMaterial = new THREE.MeshStandardMaterial({
              color: gripType.color,
              roughness: 0.8,
              metalness: 0.1,
            });

            const grip = new THREE.Mesh(gripType.geometry, gripMaterial);

            // Position on wall with slight randomness
            const x = 14 + (-1.2 + col * 0.6) + (Math.random() - 0.5) * 0.3;
            const y =
              groundHeight + (0.5 + row * 0.6) + (Math.random() - 0.5) * 0.2;
            const z = 5.26;

            grip.position.set(x, y, z);

            // Random rotation
            if (
              gripType.geometry.type === "BoxGeometry" ||
              gripType.geometry.type === "CylinderGeometry"
            ) {
              grip.rotation.z = Math.random() * Math.PI;
            }

            grip.castShadow = true;
            wallGroup.add(grip);
          }
        }
      };

      createClimbingGrips();

      // Add some decorative elements to the wall
      const addWallFeatures = () => {
        // Top coping
        const copingGeometry = new THREE.BoxGeometry(3.2, 0.2, 0.7);
        const coping = new THREE.Mesh(copingGeometry, stoneMaterial);
        coping.position.set(14, groundHeight + 4.1, 5);
        coping.castShadow = true;
        wallGroup.add(coping);

        // Side supports
        [-1.6, 1.6].forEach((xOffset) => {
          const supportGeometry = new THREE.BoxGeometry(0.2, 4, 0.7);
          const support = new THREE.Mesh(supportGeometry, stoneMaterial);
          support.position.set(14 + xOffset, groundHeight + 2, 5);
          support.castShadow = true;
          wallGroup.add(support);
        });
      };

      addWallFeatures();

      return wallGroup;
    };

    const climbingWall = createClimbingWall();
    parkourGroup.add(climbingWall);

    // Platform after climbing wall
    const endPlatformHeight = groundHeight + 4.25;
    const endPlatform = createPlatform(
      3,
      3,
      0.5,
      14,
      endPlatformHeight,
      3,
      stoneMaterial
    );
    parkourGroup.add(endPlatform);

    // Create a more visually appealing zipline
    const createZipline = () => {
      const ziplineGroup = new THREE.Group();

      // Zipline cable with proper curve and thickness
      const cablePoints = [];
      const cableSegments = 20;

      for (let i = 0; i <= cableSegments; i++) {
        const t = i / cableSegments;
        // Catenary curve for realistic hanging cable
        const catenary = Math.cosh(t * 4 - 2) / Math.cosh(2) - 0.5;

        cablePoints.push(
          new THREE.Vector3(
            14.5 - t * 29.5, // x from 14.5 to -15
            endPlatformHeight - t * 4 + catenary * 0.3, // y dropping with catenary sag
            3 + t * 12 // z from 3 to 15
          )
        );
      }

      const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
      const cableGeometry = new THREE.TubeGeometry(
        cableCurve,
        30,
        0.05,
        8,
        false
      );
      const cableMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.3,
        metalness: 0.9,
      });

      const cable = new THREE.Mesh(cableGeometry, cableMaterial);
      cable.castShadow = true;
      ziplineGroup.add(cable);

      // Starting pole with more detail
      const createPole = (x, y, z, height, isStart) => {
        const poleGroup = new THREE.Group();

        // Main pole
        const poleGeometry = new THREE.CylinderGeometry(0.2, 0.25, height, 8);
        const pole = new THREE.Mesh(poleGeometry, metalMaterial);
        pole.position.set(x, y + height / 2, z);
        pole.castShadow = true;
        poleGroup.add(pole);

        // Base
        const baseGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.2, 8);
        const base = new THREE.Mesh(baseGeometry, metalMaterial);
        base.position.set(x, y + 0.1, z);
        base.castShadow = true;
        poleGroup.add(base);

        // Top attachment
        const topGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.3);
        const top = new THREE.Mesh(topGeometry, metalMaterial);
        top.position.set(x, y + height, z);
        top.castShadow = true;
        poleGroup.add(top);

        // Only add hook to starting pole
        if (isStart) {
          // Add hook attachment at top
          const hookGeometry = new THREE.TorusGeometry(
            0.15,
            0.03,
            16,
            16,
            Math.PI
          );
          const hook = new THREE.Mesh(hookGeometry, metalMaterial);
          hook.position.set(x, y + height - 0.3, z);
          hook.rotation.x = Math.PI;
          hook.castShadow = true;
          poleGroup.add(hook);
        }

        return poleGroup;
      };

      // Starting pole (taller)
      const startPole = createPole(14, endPlatformHeight, 3, 2, true);
      ziplineGroup.add(startPole);

      // Ending pole (shorter)
      const endPole = createPole(15, groundHeight, 15, 1, false);
      ziplineGroup.add(endPole);

      // Handle for zipline that's more visually interesting
      const createHandle = () => {
        const handleGroup = new THREE.Group();

        // Main handle ring
        const handleGeometry = new THREE.TorusGeometry(0.2, 0.03, 16, 32);
        const handle = new THREE.Mesh(handleGeometry, metalMaterial);
        handle.rotation.x = Math.PI / 2;
        handle.castShadow = true;
        handleGroup.add(handle);

        // Add grip wrap to handle
        const gripMaterial = new THREE.MeshStandardMaterial({
          color: 0x222222,
          roughness: 1.0,
          metalness: 0.0,
        });

        // Grip wrapping - cylinder segments around part of the handle
        const wrapCount = 8;
        const wrapFraction = 0.75; // How much of the handle to wrap

        for (let i = 0; i < wrapCount; i++) {
          const angle = (i / wrapCount) * Math.PI * 2 * wrapFraction;
          const wrapGeometry = new THREE.CylinderGeometry(
            0.035,
            0.035,
            0.04,
            6
          );
          const wrap = new THREE.Mesh(wrapGeometry, gripMaterial);

          const radius = 0.2; // Same as handle radius
          wrap.position.set(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
          );

          wrap.rotation.x = Math.PI / 2;
          wrap.rotation.y = angle;

          handleGroup.add(wrap);
        }

        // Attach the handle to the cable with a connector
        const connectorGeometry = new THREE.CylinderGeometry(
          0.05,
          0.05,
          0.3,
          8
        );
        const connector = new THREE.Mesh(connectorGeometry, metalMaterial);
        connector.position.y = 0.15;
        connector.castShadow = true;
        handleGroup.add(connector);

        // Small roller on top of connector
        const rollerGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.08, 16);
        const roller = new THREE.Mesh(rollerGeometry, metalMaterial);
        roller.position.y = 0.3;
        roller.rotation.x = Math.PI / 2;
        roller.castShadow = true;
        handleGroup.add(roller);

        // Position the handle on the cable
        handleGroup.position.set(14, endPlatformHeight - 0.3, 3.1);

        return handleGroup;
      };

      const handle = createHandle();
      ziplineGroup.add(handle);

      return ziplineGroup;
    };

    const zipline = createZipline();
    parkourGroup.add(zipline);

    // Additional fun parkour elements

    // Create a swing rope to add variety
    const createSwingRope = () => {
      const swingGroup = new THREE.Group();

      // Create rope
      const ropeLength = 4;
      const ropePoints = [];
      const ropeSegments = 10;

      // Create a slightly curved rope path
      for (let i = 0; i <= ropeSegments; i++) {
        const t = i / ropeSegments;
        // Add slight curve to rope
        const xOffset = Math.sin(t * Math.PI) * 0.1;
        ropePoints.push(new THREE.Vector3(xOffset, -t * ropeLength, 0));
      }

      const ropeCurve = new THREE.CatmullRomCurve3(ropePoints);
      const ropeGeometry = new THREE.TubeGeometry(
        ropeCurve,
        20,
        0.05,
        8,
        false
      );

      // Rope material with texture
      const ropeCanvas = document.createElement("canvas");
      ropeCanvas.width = 64;
      ropeCanvas.height = 64;
      const ropeCtx = ropeCanvas.getContext("2d");

      // Base color
      ropeCtx.fillStyle = "#8b7d6b";
      ropeCtx.fillRect(0, 0, 64, 64);

      // Add rope fiber texture
      ropeCtx.strokeStyle = "#736658";
      for (let i = 0; i < 20; i++) {
        ropeCtx.beginPath();
        ropeCtx.moveTo(0, i * 3);
        ropeCtx.lineTo(64, i * 3);
        ropeCtx.stroke();
      }

      const ropeTexture = new THREE.CanvasTexture(ropeCanvas);
      ropeTexture.wrapS = THREE.RepeatWrapping;
      ropeTexture.wrapT = THREE.RepeatWrapping;
      ropeTexture.repeat.set(1, 10);

      const ropeMaterial = new THREE.MeshStandardMaterial({
        map: ropeTexture,
        roughness: 1.0,
        metalness: 0.0,
      });

      const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
      rope.castShadow = true;
      swingGroup.add(rope);

      // Add knots along the rope for grip
      const knotCount = 5;
      for (let i = 1; i <= knotCount; i++) {
        const knotGeometry = new THREE.TorusGeometry(0.08, 0.03, 8, 16);
        const knot = new THREE.Mesh(knotGeometry, ropeMaterial);

        // Position along rope
        const t = i / (knotCount + 1);
        const point = ropeCurve.getPointAt(t);
        const tangent = ropeCurve.getTangentAt(t);

        knot.position.copy(point);

        // Orient perpendicular to rope
        const up = new THREE.Vector3(0, 1, 0);
        const axis = new THREE.Vector3().crossVectors(up, tangent).normalize();
        const radians = Math.acos(up.dot(tangent));
        knot.setRotationFromAxisAngle(axis, radians);

        knot.castShadow = true;
        swingGroup.add(knot);
      }

      // Create handle at the bottom
      const handleGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
      const handle = new THREE.Mesh(handleGeometry, woodMaterial);
      handle.position.y = -ropeLength;
      handle.rotation.x = Math.PI / 2;
      handle.castShadow = true;
      swingGroup.add(handle);

      // Add attachment at top
      const attachGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8);
      const attachment = new THREE.Mesh(attachGeometry, metalMaterial);
      attachment.position.y = 0;
      attachment.castShadow = true;
      swingGroup.add(attachment);

      // Position the swing
      swingGroup.position.set(10, midPlatformHeight + 4, 8);

      return swingGroup;
    };

    const swingRope = createSwingRope();
    parkourGroup.add(swingRope);

    // Add parkour course to the scene
    scene.add(parkourGroup);

    // Cleanup function
    return () => {
      scene.remove(parkourGroup);
      parkourGroup.traverse((object) => {
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
  }, [scene]);

  return null;
};

export default Parkour;
