import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import "./DayNightCycle.css";

const DayNightCycle = ({ scene }) => {
  const timeSpeedRef = useRef(1.0);
  const timeOfDayRef = useRef(0.3);
  const elementsRef = useRef({
    sun: null,
    moon: null,
    sunLight: null,
    ambientLight: null,
    stars: null,
  });

  useEffect(() => {
    if (!scene) return;

    const elements = elementsRef.current;

    // Sky colors
    const dayTopColor = new THREE.Color(0x77bbff);
    const dayBottomColor = new THREE.Color(0xbbddff);
    const nightTopColor = new THREE.Color(0x000022);
    const nightBottomColor = new THREE.Color(0x002244);
    const sunsetTopColor = new THREE.Color(0xff8844);
    const sunsetBottomColor = new THREE.Color(0xffbb99);

    const currentTopColor = new THREE.Color(dayTopColor);
    const currentBottomColor = new THREE.Color(dayBottomColor);

    const sunGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.8,
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 10, -100);
    scene.add(sun);
    elements.sun = sun;

    const moonGeometry = new THREE.SphereGeometry(1.0, 16, 16);
    const moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xddddff,
      transparent: true,
      opacity: 0.8,
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(0, -10, 100);
    scene.add(moon);
    elements.moon = moon;

    const sunLight = new THREE.DirectionalLight(0xffffee, 1);
    sunLight.position.copy(sun.position);
    sunLight.castShadow = true;

    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.bias = -0.0003;

    scene.add(sunLight);
    elements.sunLight = sunLight;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    elements.ambientLight = ambientLight;

    const starsCount = 500;
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    const starColors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 80 + Math.random() * 20;

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const brightness = 0.7 + Math.random() * 0.3;
      starColors[i * 3] = brightness;
      starColors[i * 3 + 1] = brightness;
      starColors[i * 3 + 2] = brightness + Math.random() * 0.3;
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );
    starsGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(starColors, 3)
    );

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    elements.stars = stars;

    return () => {
      scene.remove(sun);
      scene.remove(moon);
      scene.remove(sunLight);
      scene.remove(ambientLight);
      scene.remove(stars);

      sunGeometry.dispose();
      sunMaterial.dispose();
      moonGeometry.dispose();
      moonMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
    };
  }, [scene]);

  const update = (delta) => {
    if (!scene) return { timeOfDay: timeOfDayRef.current };

    const elements = elementsRef.current;
    if (
      !elements.sun ||
      !elements.moon ||
      !elements.sunLight ||
      !elements.ambientLight ||
      !elements.stars
    ) {
      return { timeOfDay: timeOfDayRef.current };
    }

    timeOfDayRef.current += delta * 0.05 * timeSpeedRef.current;
    if (timeOfDayRef.current >= 1) timeOfDayRef.current -= 1;

    const timeOfDay = timeOfDayRef.current;

    const angle = timeOfDay * Math.PI * 2;
    const radius = 100;

    elements.sun.position.x = Math.cos(angle) * radius;
    elements.sun.position.y = Math.sin(angle) * radius;

    elements.moon.position.x = Math.cos(angle + Math.PI) * radius;
    elements.moon.position.y = Math.sin(angle + Math.PI) * radius;

    elements.sunLight.position.copy(elements.sun.position);
    elements.sunLight.position.normalize();

    const isDaytime = timeOfDay > 0.25 && timeOfDay < 0.75;
    const isSunrise = timeOfDay > 0.2 && timeOfDay < 0.3;
    const isSunset = timeOfDay > 0.7 && timeOfDay < 0.8;

    if (isDaytime) {
      elements.sunLight.intensity = 1;
      elements.ambientLight.intensity = 0.4;
    } else {
      const nightFactor = Math.min(
        Math.abs(timeOfDay - 0) / 0.2,
        Math.abs(timeOfDay - 1) / 0.2
      );
      elements.sunLight.intensity = 0.1 + nightFactor * 0.4;
      elements.ambientLight.intensity = 0.1 + nightFactor * 0.1;
    }

    elements.stars.material.opacity = isDaytime ? 0 : 0.7;

    return {
      timeOfDay,
      isDaytime,
      isSunrise,
      isSunset,
    };
  };

  const setTimeSpeed = (speed) => {
    timeSpeedRef.current = speed;
  };

  const setTimeOfDay = (time) => {
    timeOfDayRef.current = time;
  };

  React.useImperativeHandle(React.useRef(), () => ({
    update,
    setTimeSpeed,
    setTimeOfDay,
    elements: elementsRef.current,
  }));

  return null;
};

export default DayNightCycle;
