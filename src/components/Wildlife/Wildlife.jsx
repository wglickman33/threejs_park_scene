import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Wildlife = ({ scene }) => {
  const wildlifeRef = useRef([]);

  useEffect(() => {
    if (!scene) return;

    const wildlife = [];

    // Create birds that fly around
    const createBirds = () => {
      const birdGroup = new THREE.Group();
      const birdCount = 10 + Math.floor(Math.random() * 15);

      // Bird material
      const birdMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.8,
        metalness: 0.1,
      });

      // Create a flock of birds
      for (let i = 0; i < birdCount; i++) {
        // Simple bird shape (body + wings)
        const birdBody = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.ConeGeometry(0.05, 0.2, 4);
        bodyGeometry.rotateX(Math.PI / 2);
        const body = new THREE.Mesh(bodyGeometry, birdMaterial);

        // Wings
        const wingGeometry = new THREE.PlaneGeometry(0.3, 0.1);
        const leftWing = new THREE.Mesh(wingGeometry, birdMaterial);
        leftWing.position.set(-0.15, 0, 0);

        const rightWing = new THREE.Mesh(wingGeometry, birdMaterial);
        rightWing.position.set(0.15, 0, 0);

        birdBody.add(body);
        birdBody.add(leftWing);
        birdBody.add(rightWing);

        // Random starting position
        const altitude = 10 + Math.random() * 20;
        const radius = 20 + Math.random() * 30;
        const angle = Math.random() * Math.PI * 2;

        birdBody.position.set(
          Math.cos(angle) * radius,
          altitude,
          Math.sin(angle) * radius
        );

        // Random initial rotation
        birdBody.rotation.y = Math.random() * Math.PI * 2;

        // Store animation properties
        const birdData = {
          mesh: birdBody,
          speed: 0.1 + Math.random() * 0.2,
          altitude: altitude,
          radius: radius,
          angle: angle,
          wingSpeed: 0.2 + Math.random() * 0.3,
          wingPos: 0,
          wingDir: 1,
        };

        birdGroup.add(birdBody);
        wildlife.push(birdData);
      }

      scene.add(birdGroup);
      return { birds: wildlife, group: birdGroup };
    };

    // Create squirrels that move around trees
    const createSquirrels = () => {
      const squirrelGroup = new THREE.Group();
      const squirrelCount = 3 + Math.floor(Math.random() * 3);

      // Squirrel material
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xa65e2e, // Reddish brown
        roughness: 0.8,
        metalness: 0.1,
      });

      const tailMaterial = new THREE.MeshStandardMaterial({
        color: 0xdda278, // Lighter brown
        roughness: 0.9,
        metalness: 0.0,
      });

      // Create squirrels
      for (let i = 0; i < squirrelCount; i++) {
        // Find a tree position - would need to be passed in from parent component
        // For now, use random positions near trees
        const treePositions = [
          { x: -5, z: -5 },
          { x: -4, z: 5 },
          { x: 6, z: -3 },
          { x: 8, z: 7 },
          { x: -7, z: 2 },
          { x: 4, z: 4 },
        ];

        const treePos = treePositions[i % treePositions.length];

        // Simple squirrel shape
        const squirrelBody = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        bodyGeometry.scale(1, 0.8, 1.2);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 0.05, 0.15);

        // Tail (curved cylinder)
        const tailCurve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(0, 0, -0.15),
          new THREE.Vector3(0, 0.2, -0.3),
          new THREE.Vector3(0, 0.4, -0.2),
          new THREE.Vector3(0, 0.3, 0)
        );

        const tailGeometry = new THREE.TubeGeometry(
          tailCurve,
          8,
          0.04,
          8,
          false
        );
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);

        squirrelBody.add(body);
        squirrelBody.add(head);
        squirrelBody.add(tail);

        // Position near tree, slightly elevated
        const offsetX = (Math.random() - 0.5) * 2;
        const offsetZ = (Math.random() - 0.5) * 2;

        squirrelBody.position.set(
          treePos.x + offsetX,
          0.15, // Slightly above ground
          treePos.z + offsetZ
        );

        squirrelBody.rotation.y = Math.random() * Math.PI * 2;

        // Store animation data
        const squirrelData = {
          mesh: squirrelBody,
          type: "squirrel",
          speed: 0.02 + Math.random() * 0.01,
          homeTree: treePos,
          moveTarget: new THREE.Vector3(
            treePos.x + (Math.random() - 0.5) * 4,
            0.15,
            treePos.z + (Math.random() - 0.5) * 4
          ),
          state: "moving", // or 'paused'
          pauseTimer: 0,
          maxPause: 2 + Math.random() * 3,
        };

        squirrelGroup.add(squirrelBody);
        wildlife.push(squirrelData);
      }

      scene.add(squirrelGroup);
      return {
        squirrels: wildlife.slice(-squirrelCount),
        group: squirrelGroup,
      };
    };

    // Create butterflies that float around flowers
    const createButterflies = () => {
      const butterflyGroup = new THREE.Group();
      const butterflyCount = 8 + Math.floor(Math.random() * 7);

      // Create butterflies with different colors
      for (let i = 0; i < butterflyCount; i++) {
        // Wings geometry - simple planes
        const wingGeometry = new THREE.PlaneGeometry(0.15, 0.1);

        // Random wing color
        let wingColor;
        const colorChoice = Math.random();

        if (colorChoice < 0.25) {
          wingColor = 0xfff4b8; // Yellow
        } else if (colorChoice < 0.5) {
          wingColor = 0xffb8f4; // Pink
        } else if (colorChoice < 0.75) {
          wingColor = 0xb8c4ff; // Blue
        } else {
          wingColor = 0xffffff; // White
        }

        const wingMaterial = new THREE.MeshStandardMaterial({
          color: wingColor,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });

        // Create butterfly body
        const butterflyBody = new THREE.Group();

        // Body - thin cylinder
        const bodyGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8);
        bodyGeometry.rotateX(Math.PI / 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          roughness: 0.8,
        });

        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        butterflyBody.add(body);

        // Wings - left and right
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.075, 0, 0);
        butterflyBody.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.075, 0, 0);
        butterflyBody.add(rightWing);

        // Random position near ground level
        const posX = (Math.random() - 0.5) * 40;
        const posZ = (Math.random() - 0.5) * 40;
        const posY = 0.5 + Math.random() * 2;

        butterflyBody.position.set(posX, posY, posZ);
        butterflyBody.rotation.y = Math.random() * Math.PI * 2;

        // Store animation data
        const butterflyData = {
          mesh: butterflyBody,
          type: "butterfly",
          speed: 0.01 + Math.random() * 0.01,
          wingSpeed: 0.2 + Math.random() * 0.1,
          wingPos: 0,
          targetX: posX + (Math.random() - 0.5) * 5,
          targetY: 0.5 + Math.random() * 2,
          targetZ: posZ + (Math.random() - 0.5) * 5,
          leftWing: leftWing,
          rightWing: rightWing,
          changeTargetTime: 5 + Math.random() * 5,
          timer: 0,
        };

        butterflyGroup.add(butterflyBody);
        wildlife.push(butterflyData);
      }

      scene.add(butterflyGroup);
      return {
        butterflies: wildlife.slice(-butterflyCount),
        group: butterflyGroup,
      };
    };

    // Create all wildlife types
    const birds = createBirds();
    const squirrels = createSquirrels();
    const butterflies = createButterflies();

    // Save all wildlife for animation
    wildlifeRef.current = wildlife;

    // Cleanup function
    return () => {
      scene.remove(birds.group);
      scene.remove(squirrels.group);
      scene.remove(butterflies.group);

      wildlife.forEach((animal) => {
        animal.mesh.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
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
      });
    };
  }, [scene]);

  // Expose update method
  const update = (delta) => {
    const wildlife = wildlifeRef.current;

    wildlife.forEach((animal) => {
      if (animal.mesh) {
        // Update birds
        if (animal.wingSpeed) {
          // Bird or butterfly
          // Wing flapping animation
          animal.wingPos += animal.wingSpeed * delta;

          if (animal.type === "butterfly") {
            // Butterfly wing animation
            const wingRotation = Math.sin(animal.wingPos) * 0.5;
            animal.leftWing.rotation.y = wingRotation;
            animal.rightWing.rotation.y = -wingRotation;

            // Movement toward target
            animal.timer += delta;

            if (animal.timer > animal.changeTargetTime) {
              animal.targetX =
                animal.mesh.position.x + (Math.random() - 0.5) * 8;
              animal.targetY = 0.5 + Math.random() * 2;
              animal.targetZ =
                animal.mesh.position.z + (Math.random() - 0.5) * 8;
              animal.timer = 0;
            }

            // Move toward target
            const pos = animal.mesh.position;
            const dir = new THREE.Vector3(
              animal.targetX - pos.x,
              animal.targetY - pos.y,
              animal.targetZ - pos.z
            );

            dir.normalize();

            // Look in direction of movement
            if (dir.length() > 0.1) {
              animal.mesh.lookAt(animal.targetX, pos.y, animal.targetZ);
            }

            // Move
            animal.mesh.position.x += dir.x * animal.speed;
            animal.mesh.position.y += dir.y * animal.speed * 0.5;
            animal.mesh.position.z += dir.z * animal.speed;
          } else {
            // Bird animation - circular flight path
            animal.angle += animal.speed * delta;

            // Move in a circle with some altitude variation
            animal.mesh.position.x = Math.cos(animal.angle) * animal.radius;
            animal.mesh.position.y =
              animal.altitude + Math.sin(animal.angle * 2) * 2;
            animal.mesh.position.z = Math.sin(animal.angle) * animal.radius;

            // Face direction of movement
            const forward = new THREE.Vector3(
              -Math.sin(animal.angle),
              0,
              -Math.cos(animal.angle)
            );

            animal.mesh.lookAt(
              animal.mesh.position.x + forward.x,
              animal.mesh.position.y + forward.y,
              animal.mesh.position.z + forward.z
            );

            // Wing flapping
            if (animal.mesh.children[1] && animal.mesh.children[2]) {
              animal.mesh.children[1].rotation.z =
                Math.sin(animal.wingPos) * 0.3;
              animal.mesh.children[2].rotation.z =
                -Math.sin(animal.wingPos) * 0.3;
            }
          }
        }

        // Update squirrels
        if (animal.type === "squirrel") {
          if (animal.state === "moving") {
            // Move toward target
            const pos = animal.mesh.position;
            const target = animal.moveTarget;

            const dir = new THREE.Vector3(
              target.x - pos.x,
              target.y - pos.y,
              target.z - pos.z
            );

            const distance = dir.length();

            // If close to target, pause and then find new target
            if (distance < 0.2) {
              animal.state = "paused";
              animal.pauseTimer = 0;
            } else {
              dir.normalize();

              // Look in direction of movement
              animal.mesh.lookAt(target.x, pos.y, target.z);

              // Move
              animal.mesh.position.x += dir.x * animal.speed;
              animal.mesh.position.z += dir.z * animal.speed;
            }
          } else if (animal.state === "paused") {
            // In paused state, the squirrel waits for a moment before moving again
            animal.pauseTimer += delta;

            // Add small movements to simulate idle behavior
            // Gentle tail swishing
            if (animal.mesh.children[2]) {
              // Assuming child[2] is the tail
              animal.mesh.children[2].rotation.x =
                Math.sin(animal.pauseTimer * 2) * 0.1;
            }

            // After pause time, pick a new target and switch back to moving state
            if (animal.pauseTimer >= animal.maxPause) {
              // Pick a new random target within range of home tree
              animal.moveTarget.set(
                animal.homeTree.x + (Math.random() - 0.5) * 6, // Wider range
                0.15, // Keep at ground level
                animal.homeTree.z + (Math.random() - 0.5) * 6
              );

              // Occasionally move up a tree
              if (Math.random() < 0.3) {
                // Move up the tree
                animal.moveTarget.y = 0.5 + Math.random() * 2;
              }

              // Reset state back to moving
              animal.state = "moving";

              // Randomize the next pause duration
              animal.maxPause = 2 + Math.random() * 3;
            }
          }
        }
      }
    });
  };

  // Expose the update method to parent component
  React.useImperativeHandle(React.useRef(), () => ({
    update,
  }));

  return null;
};

export default Wildlife;
