import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import "./LightSetup.css";

const LightSetup = ({ scene }) => {
  const lightsRef = useRef({
    ambientLight: null,
    sunLight: null,
    hemiLight: null,
    parkLights: [],
  });

  useEffect(() => {
    if (!scene) return;

    const lights = lightsRef.current;

    // Add ambient light with improved color for more natural illumination
    const ambientLight = new THREE.AmbientLight(0xfbf2e5, 0.4); // Warmer ambient light
    scene.add(ambientLight);
    lights.ambientLight = ambientLight;

    // Enhanced directional light (sun) with better shadow quality
    const sunLight = new THREE.DirectionalLight(0xffffeb, 0.8); // Slightly yellow-tinted sunlight
    sunLight.position.set(-10, 20, 10);
    sunLight.castShadow = true;

    // Configure shadow properties for better quality and performance
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 80; // Increased far plane to cover more of the scene
    sunLight.shadow.camera.left = -25;
    sunLight.shadow.camera.right = 25;
    sunLight.shadow.camera.top = 25;
    sunLight.shadow.camera.bottom = -25;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02; // Helps reduce shadow acne

    scene.add(sunLight);
    lights.sunLight = sunLight;

    // Add hemisphere light for more natural outdoor lighting with ground color reflection
    const hemiLight = new THREE.HemisphereLight(0x90c0ff, 0x385320, 0.4); // Sky blue to green ground
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
    lights.hemiLight = hemiLight;

    // Add some point lights for additional atmosphere and detail
    const createParkLight = (
      x,
      z,
      intensity = 0.8,
      color = 0xffcc88,
      height = 2.5
    ) => {
      // Create an enhanced light with better falloff
      const light = new THREE.PointLight(color, intensity, 10);
      light.position.set(x, height, z);
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 12;

      // Add decay for more realistic light falloff
      light.decay = 2;

      // Create a small lamp post to show where the light is coming from
      const lampGroup = new THREE.Group();

      // Create post base
      const baseGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.15, 8);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.6,
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.075;
      base.castShadow = true;
      lampGroup.add(base);

      // Create post
      const poleGeometry = new THREE.CylinderGeometry(
        0.05,
        0.05,
        height - 0.15,
        8
      );
      const poleMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.5,
      });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.y = height / 2;
      pole.castShadow = true;
      lampGroup.add(pole);

      // Create a more detailed lamp head
      const headGeometry = new THREE.SphereGeometry(
        0.2,
        16,
        16,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      );
      const headMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.7,
        metalness: 0.6,
        side: THREE.DoubleSide,
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = height;
      head.rotation.x = Math.PI;
      head.castShadow = true;
      lampGroup.add(head);

      // Create lamp glass with emissive material for a glow effect
      const lampGeometry = new THREE.SphereGeometry(
        0.18,
        16,
        16,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2.2
      );
      const lampMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9,
      });
      const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
      lamp.position.y = height - 0.01; // Slightly lower than the top of the post
      lamp.rotation.x = Math.PI;
      lampGroup.add(lamp);

      // Position the entire lamp group
      lampGroup.position.set(x, 0, z);

      // Add light to the lamp
      lampGroup.add(light);

      scene.add(lampGroup);

      return { light, lampGroup };
    };

    // Add a few park lights with varied heights and intensities for more natural look
    const parkLight1 = createParkLight(3, -3, 0.85, 0xffe3c2, 2.7); // Warm light
    const parkLight2 = createParkLight(-5, 0, 0.7, 0xffdeb0, 2.4); // Slightly dimmer
    const parkLight3 = createParkLight(10, 8, 0.9, 0xfff0cc, 3.0); // Brighter, taller
    const parkLight4 = createParkLight(-12, -7, 0.65, 0xffd9a0, 2.2); // Dimmer, shorter

    lights.parkLights = [parkLight1, parkLight2, parkLight3, parkLight4];

    // Cleanup function
    return () => {
      scene.remove(ambientLight);
      scene.remove(sunLight);
      scene.remove(hemiLight);

      lights.parkLights.forEach((parkLight) => {
        scene.remove(parkLight.lampGroup);
        parkLight.lampGroup.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry.dispose();
            obj.material.dispose();
          }
        });
      });
    };
  }, [scene]);

  // Method to update lights for day/night cycle
  const updateDayNightCycle = (time) => {
    const lights = lightsRef.current;
    if (!lights.sunLight || !lights.ambientLight || !lights.hemiLight) return;

    // Determine if it's day, night, or transition period
    const isDaytime = time > 0.25 && time < 0.75;
    const isSunrise = time > 0.2 && time < 0.3;
    const isSunset = time > 0.7 && time < 0.8;

    // Calculate sun position based on time (0-1)
    const sunAngle = time * Math.PI * 2;
    const sunElevation = Math.sin(sunAngle);
    const sunAzimuth = Math.cos(sunAngle);

    // Update sun position
    lights.sunLight.position.set(
      sunAzimuth * 100,
      Math.max(0.1, sunElevation) * 100, // Keep slightly above horizon
      -50
    );

    // Update sun color based on time of day
    if (isSunrise) {
      // Dawn colors - warm orange
      lights.sunLight.color.setHex(0xffa54f);
      lights.sunLight.intensity = 0.6;
      lights.ambientLight.color.setHex(0xffeedd);
      lights.ambientLight.intensity = 0.3;
      lights.hemiLight.intensity = 0.4;
    } else if (isSunset) {
      // Sunset colors - deep orange/red
      lights.sunLight.color.setHex(0xff7a22);
      lights.sunLight.intensity = 0.6;
      lights.ambientLight.color.setHex(0xffddcc);
      lights.ambientLight.intensity = 0.3;
      lights.hemiLight.intensity = 0.3;
    } else if (isDaytime) {
      // Daytime - bright white/yellow
      lights.sunLight.color.setHex(0xffffeb);
      lights.sunLight.intensity = 0.8;
      lights.ambientLight.color.setHex(0xfbf2e5);
      lights.ambientLight.intensity = 0.4;
      lights.hemiLight.intensity = 0.4;
    } else {
      // Night time - dim blue
      lights.sunLight.color.setHex(0x334466);
      lights.sunLight.intensity = 0.1;
      lights.ambientLight.color.setHex(0x223344);
      lights.ambientLight.intensity = 0.15;
      lights.hemiLight.intensity = 0.1;
    }

    // Update park lights based on time
    lights.parkLights.forEach((parkLight) => {
      // Make park lights brighter at night, dimmer during day
      if (isDaytime) {
        parkLight.light.intensity = 0.1; // Almost off during day
      } else if (isSunrise || isSunset) {
        parkLight.light.intensity = 0.5; // Medium intensity during transitions
      } else {
        // Full brightness at night
        parkLight.light.intensity = 0.9;
      }
    });
  };

  // Expose methods and properties to parent component
  React.useImperativeHandle(React.useRef(), () => ({
    updateDayNightCycle,
    lights: lightsRef.current,
  }));

  return null;
};

export default LightSetup;
