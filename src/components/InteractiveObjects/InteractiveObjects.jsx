import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import "./InteractiveObjects.css";

const InteractiveObjects = ({ scene }) => {
  const objectsRef = useRef([]);

  useEffect(() => {
    if (!scene) {
      console.error("Scene is not provided to InteractiveObjects");
      return;
    }

    if (!(scene instanceof THREE.Scene)) {
      console.error("Invalid scene object passed to InteractiveObjects");
      return;
    }

    console.log("Creating interactive objects");

    const interactiveObjects = [];

    const createFountain = (x, z) => {
      const fountainGroup = new THREE.Group();

      const baseGeometry = new THREE.CylinderGeometry(1.2, 1.5, 0.5, 16);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.7,
        metalness: 0.2,
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.25;
      base.receiveShadow = true;
      base.castShadow = true;

      const basinGeometry = new THREE.CylinderGeometry(
        1,
        1.2,
        0.4,
        16,
        1,
        true
      );
      const basinMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.6,
        metalness: 0.3,
        side: THREE.DoubleSide,
      });
      const basin = new THREE.Mesh(basinGeometry, basinMaterial);
      basin.position.y = 0.7;
      basin.receiveShadow = true;
      basin.castShadow = true;

      const columnGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
      const columnMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.5,
        metalness: 0.4,
      });
      const column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.y = 1.2;
      column.receiveShadow = true;
      column.castShadow = true;

      fountainGroup.add(base);
      fountainGroup.add(basin);
      fountainGroup.add(column);

      const particleCount = 300;
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.8;
        const height = Math.random() * 1.5 + 1.0;

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = height;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }

      particlesGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );

      const particlesMaterial = new THREE.PointsMaterial({
        color: 0x3399ff,
        size: 0.05,
        transparent: true,
        opacity: 0.8,
      });

      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      fountainGroup.add(particles);

      fountainGroup.position.set(x, 0, z);

      scene.add(fountainGroup);

      const fountain = {
        type: "fountain",
        group: fountainGroup,
        particles: particles,
        geometry: particlesGeometry,
        positions: positions,
        particleCount: particleCount,
        active: true,
        interact: function () {
          this.active = !this.active;
          this.particles.visible = this.active;
          return `Fountain ${this.active ? "activated" : "deactivated"}`;
        },
        update: function (delta) {
          if (!this.active) return;

          const positions = this.positions;
          const particleCount = this.particleCount;

          for (let i = 0; i < particleCount; i++) {
            positions[i * 3 + 1] -= 2 * delta;

            if (positions[i * 3 + 1] < 0.8) {
              const angle = Math.random() * Math.PI * 2;
              const radius = Math.random() * 0.2;

              positions[i * 3] = Math.cos(angle) * radius;
              positions[i * 3 + 1] = 1.7;
              positions[i * 3 + 2] = Math.sin(angle) * radius;

              positions[i * 3 + 1] += Math.random() * 0.5;
            }
          }

          this.geometry.attributes.position.needsUpdate = true;
        },
      };

      interactiveObjects.push(fountain);
      return fountain;
    };

    const fountain1 = createFountain(8, 8);
    const fountain2 = createFountain(-6, -6);

    objectsRef.current = interactiveObjects;

    return () => {
      interactiveObjects.forEach((obj) => {
        if (obj.group) {
          scene.remove(obj.group);

          obj.group.traverse((child) => {
            if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
              if (child.geometry) child.geometry.dispose();
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach((mat) => mat.dispose());
                } else {
                  child.material.dispose();
                }
              }
            }
          });
        }
      });
    };
  }, [scene]);

  const update = (delta) => {
    objectsRef.current.forEach((obj) => {
      if (obj.update) {
        obj.update(delta);
      }
    });
  };

  const findNearestObject = (position, maxDistance = 3) => {
    let nearest = null;
    let nearestDistance = maxDistance;

    objectsRef.current.forEach((obj) => {
      if (obj.group) {
        const distance = position.distanceTo(obj.group.position);
        if (distance < nearestDistance) {
          nearest = obj;
          nearestDistance = distance;
        }
      }
    });

    return nearest;
  };

  React.useImperativeHandle(React.useRef(), () => ({
    update,
    findNearestObject,
    objects: objectsRef.current,
  }));

  return null;
};

export default InteractiveObjects;
