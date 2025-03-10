import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import "./SkyBox.css";

const SkyBox = ({ scene, timeOfDay = 0.5 }) => {
  const skyDomeRef = useRef(null);
  const cloudsRef = useRef([]);
  const starsRef = useRef(null);
  const sunMoonRef = useRef(null);

  useEffect(() => {
    if (!scene) return;

    // Enhanced sky colors for more realistic transitions
    const colors = {
      dawn: {
        top: new THREE.Color(0x8a6ca0), // More purple/pink hue
        bottom: new THREE.Color(0xffa585), // Warm orange
      },
      day: {
        top: new THREE.Color(0x4b8fe2), // Sky blue
        bottom: new THREE.Color(0xc6e1ff), // Light blue
      },
      sunset: {
        top: new THREE.Color(0x7d3c98), // Deep purple
        bottom: new THREE.Color(0xff7f50), // Coral orange
      },
      night: {
        top: new THREE.Color(0x0a0d30), // Deep blue
        bottom: new THREE.Color(0x1e2f50), // Midnight blue
      },
    };

    // Create an improved sky dome with better gradient
    const createSkyDome = () => {
      const skyGeometry = new THREE.SphereGeometry(300, 64, 32); // Larger and higher resolution

      // Invert the geometry so we see it from the inside
      skyGeometry.scale(-1, 1, 1);

      // Create material with improved gradient shader
      const uniforms = {
        topColor: { value: colors.day.top },
        bottomColor: { value: colors.day.bottom },
        offset: { value: 33 },
        exponent: { value: 0.6 },
        sunPosition: { value: new THREE.Vector3(0, 1, 0) },
      };

      const skyMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          uniform vec3 sunPosition;
          varying vec3 vWorldPosition;
          
          void main() {
            float h = normalize(vWorldPosition + offset).y;
            float sunInfluence = max(0.0, dot(normalize(vWorldPosition), normalize(sunPosition)));
            vec3 atmosphereColor = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));
            
            // Add subtle glow around sun direction
            vec3 sunsetGlow = vec3(1.0, 0.5, 0.2) * pow(sunInfluence, 8.0) * 0.5;
            
            gl_FragColor = vec4(atmosphereColor + sunsetGlow, 1.0);
          }
        `,
        side: THREE.BackSide,
      });

      const sky = new THREE.Mesh(skyGeometry, skyMaterial);
      return { mesh: sky, material: skyMaterial };
    };

    const skyData = createSkyDome();
    const skyDome = skyData.mesh;
    skyDomeRef.current = { mesh: skyDome, material: skyData.material };
    scene.add(skyDome);

    // Create a sun and moon system
    const createSunMoon = () => {
      const group = new THREE.Group();

      // Sun with glow effect
      const sunGeometry = new THREE.SphereGeometry(8, 32, 32);
      const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffddaa,
        transparent: true,
        opacity: 1.0,
      });
      const sun = new THREE.Mesh(sunGeometry, sunMaterial);

      // Sun glow (larger transparent sphere)
      const sunGlowGeometry = new THREE.SphereGeometry(12, 32, 32);
      const sunGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffeeaa,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide,
      });
      const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
      sun.add(sunGlow);

      // Moon with craters
      const moonGeometry = new THREE.SphereGeometry(6, 32, 32);
      const moonMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8e8ff,
        roughness: 0.9,
        metalness: 0.1,
        emissive: 0x444466,
        emissiveIntensity: 0.2,
      });
      const moon = new THREE.Mesh(moonGeometry, moonMaterial);

      // Add some craters to the moon
      const craterCount = 8;
      for (let i = 0; i < craterCount; i++) {
        const size = 0.5 + Math.random() * 1.5;
        const craterGeometry = new THREE.CircleGeometry(size, 12);
        const craterMaterial = new THREE.MeshBasicMaterial({
          color: 0xccccdd,
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
        });
        const crater = new THREE.Mesh(craterGeometry, craterMaterial);

        // Position on moon surface
        const phi = Math.random() * Math.PI * 2;
        const theta = (Math.random() * Math.PI) / 2; // Only on visible side

        crater.position.set(
          6.1 * Math.sin(theta) * Math.cos(phi),
          6.1 * Math.sin(theta) * Math.sin(phi),
          6.1 * Math.cos(theta)
        );

        crater.lookAt(0, 0, 0);
        moon.add(crater);
      }

      // Position sun and moon on opposite sides of the sky dome
      sun.position.set(0, 0, -250);
      moon.position.set(0, 0, 250);

      group.add(sun);
      group.add(moon);

      scene.add(group);

      return {
        group,
        sun,
        sunMaterial,
        sunGlow,
        sunGlowMaterial,
        moon,
        moonMaterial,
      };
    };

    const sunMoon = createSunMoon();
    sunMoonRef.current = sunMoon;

    // Create volumetric clouds with improved visual quality
    const addClouds = () => {
      const cloudPositions = [
        { x: -80, y: 50, z: -100, scale: 8 },
        { x: 50, y: 65, z: -110, scale: 12 },
        { x: -40, y: 55, z: -150, scale: 10 },
        { x: 100, y: 58, z: -80, scale: 7 },
        { x: 0, y: 70, z: -180, scale: 15 },
        { x: -120, y: 60, z: -60, scale: 9 },
        { x: 70, y: 52, z: -135, scale: 11 },
        { x: -60, y: 48, z: -70, scale: 6 },
        { x: 120, y: 62, z: -130, scale: 13 },
      ];

      const clouds = [];

      // Generate physically based cloud material with better lighting response
      const createCloudMaterial = () => {
        return new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8,
          roughness: 1.0,
          metalness: 0.0,
          clearcoat: 0.1, // Slight sheen for some clouds
          clearcoatRoughness: 0.8,
          transmission: 0.1, // Slight translucency
          side: THREE.DoubleSide,
        });
      };

      cloudPositions.forEach((pos) => {
        // Create a cloud group
        const cloudGroup = new THREE.Group();

        // Cloud material with variations for each cloud
        const cloudMaterial = createCloudMaterial();

        // Base color variations
        const hue = 0.6 + Math.random() * 0.1; // Slight blue-white variation
        const saturation = Math.random() * 0.05; // Very slight saturation
        const lightness = 0.95 + Math.random() * 0.05; // Very white but with slight variations

        cloudMaterial.color.setHSL(hue, saturation, lightness);

        // Create multiple overlapping spheres for each cloud with improved structure
        const puffCount = 12 + Math.floor(Math.random() * 15);

        // Define a primary cloud shape with layering
        const layers = 3 + Math.floor(Math.random() * 3);
        const puffsPerLayer = Math.ceil(puffCount / layers);

        for (let layer = 0; layer < layers; layer++) {
          const layerHeight = layer * 0.4 * pos.scale;
          const layerRadiusScale = 1.0 - layer * 0.15; // Smaller towards top

          for (let i = 0; i < puffsPerLayer; i++) {
            // Larger, central puffs and smaller ones around edges
            const isPrimary = layer === 0 && i < 3;
            const puffScale = isPrimary
              ? 0.7 + Math.random() * 0.3
              : 0.3 + Math.random() * 0.4;
            const puffSize = puffScale * pos.scale * layerRadiusScale;

            // Use different geometries for variety
            let puffGeometry;
            const geometryType = Math.floor(Math.random() * 3);
            if (geometryType === 0) {
              puffGeometry = new THREE.SphereGeometry(puffSize, 12, 12);
            } else if (geometryType === 1) {
              puffGeometry = new THREE.DodecahedronGeometry(puffSize, 0);
            } else {
              puffGeometry = new THREE.IcosahedronGeometry(puffSize, 0);
            }

            const puff = new THREE.Mesh(puffGeometry, cloudMaterial);

            // Position within cloud - more structured than purely random
            const angle = (i / puffsPerLayer) * Math.PI * 2 + Math.random();
            const layerRadius = pos.scale * 0.6 * layerRadiusScale;
            const distance = Math.random() * layerRadius;

            puff.position.set(
              Math.cos(angle) * distance,
              layerHeight + (Math.random() - 0.3) * pos.scale * 0.2,
              Math.sin(angle) * distance
            );

            cloudGroup.add(puff);
          }
        }

        cloudGroup.position.set(pos.x, pos.y, pos.z);

        // Random rotation for visual variety
        cloudGroup.rotation.y = Math.random() * Math.PI * 2;

        scene.add(cloudGroup);
        clouds.push({
          group: cloudGroup,
          speed: 0.2 + Math.random() * 0.8, // More varied speeds
          material: cloudMaterial,
          // Add some cloud-specific properties for animation
          oscillation: {
            speed: 0.1 + Math.random() * 0.2,
            amount: 0.2 + Math.random() * 0.3,
            phase: Math.random() * Math.PI * 2,
          },
        });
      });

      return clouds;
    };

    const clouds = addClouds();
    cloudsRef.current = clouds;

    // Add stars with improved visual quality
    const addStars = () => {
      const starsGroup = new THREE.Group();

      // Create main star field with point geometry
      const starsGeometry = new THREE.BufferGeometry();
      const starsCount = 3000;

      const positions = new Float32Array(starsCount * 3);
      const colors = new Float32Array(starsCount * 3);
      const sizes = new Float32Array(starsCount);

      for (let i = 0; i < starsCount; i++) {
        // Create random positions on the inside of a sphere with better distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = 280 + Math.random() * 10; // Larger radius than before

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] =
          radius *
            Math.sin(phi) *
            Math.sin(theta) *
            (0.5 + Math.random() * 0.5) +
          20; // More stars visible above horizon
        positions[i * 3 + 2] = radius * Math.cos(phi);

        // Enhanced star colors for more visual variety
        const colorType = Math.random();
        if (colorType < 0.6) {
          // White-ish
          const brightness = 0.8 + Math.random() * 0.2;
          colors[i * 3] = brightness;
          colors[i * 3 + 1] = brightness;
          colors[i * 3 + 2] = brightness;
        } else if (colorType < 0.8) {
          // Blue-ish
          const brightness = 0.7 + Math.random() * 0.3;
          colors[i * 3] = brightness * 0.7;
          colors[i * 3 + 1] = brightness * 0.8;
          colors[i * 3 + 2] = brightness;
        } else if (colorType < 0.95) {
          // Yellow-ish
          const brightness = 0.7 + Math.random() * 0.3;
          colors[i * 3] = brightness;
          colors[i * 3 + 1] = brightness;
          colors[i * 3 + 2] = brightness * 0.6;
        } else {
          // Slight reddish (for red giants)
          const brightness = 0.7 + Math.random() * 0.3;
          colors[i * 3] = brightness;
          colors[i * 3 + 1] = brightness * 0.5;
          colors[i * 3 + 2] = brightness * 0.5;
        }

        // More varied star sizes
        sizes[i] = 0.5 + Math.random() * (colorType > 0.98 ? 2.5 : 1.5); // Make red giants larger
      }

      starsGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      starsGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      // Create a custom star shader for better-looking stars
      const starsMaterial = new THREE.ShaderMaterial({
        uniforms: {
          pointTexture: { value: generateStarTexture() },
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D pointTexture;
          varying vec3 vColor;
          void main() {
            gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      // Create a texture for better-looking stars
      function generateStarTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");

        // Create a radial gradient
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
      }

      const stars = new THREE.Points(starsGeometry, starsMaterial);
      stars.renderOrder = -1; // Render behind everything else
      starsGroup.add(stars);

      // Add a few brighter stars with additional glow
      const createBrightStars = () => {
        const brightStarCount = 20;
        const brightStarsGroup = new THREE.Group();

        for (let i = 0; i < brightStarCount; i++) {
          // Create a star with glow
          const starGeometry = new THREE.PlaneGeometry(1.5, 1.5);
          const starMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            map: generateGlowTexture(),
          });

          const brightStar = new THREE.Mesh(starGeometry, starMaterial);

          // Position randomly on the sky sphere
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI * 0.6; // Mostly above horizon
          const radius = 275;

          brightStar.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            Math.abs(radius * Math.sin(phi) * Math.sin(theta)) + 20, // Always above horizon
            radius * Math.cos(phi)
          );

          // Make star face the camera
          brightStar.lookAt(0, 0, 0);

          // Random size
          const size = 1 + Math.random() * 2;
          brightStar.scale.set(size, size, size);

          brightStarsGroup.add(brightStar);
        }

        function generateGlowTexture() {
          const canvas = document.createElement("canvas");
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext("2d");

          // Create a radial gradient for glow
          const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
          gradient.addColorStop(0.1, "rgba(255, 255, 240, 0.8)");
          gradient.addColorStop(0.4, "rgba(255, 255, 240, 0.2)");
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 64, 64);

          // Add some simple cross glare
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(32, 0);
          ctx.lineTo(32, 64);
          ctx.moveTo(0, 32);
          ctx.lineTo(64, 32);
          ctx.stroke();

          const texture = new THREE.CanvasTexture(canvas);
          texture.needsUpdate = true;
          return texture;
        }

        return brightStarsGroup;
      };

      const brightStars = createBrightStars();
      starsGroup.add(brightStars);

      // Add star group to scene
      scene.add(starsGroup);

      return {
        group: starsGroup,
        points: stars,
        material: starsMaterial,
        brightStars: brightStars,
      };
    };

    const stars = addStars();
    starsRef.current = stars;

    // Update function for the sky - can be called from parent component
    const updateSky = (time) => {
      if (!skyDomeRef.current) return;

      // Set sky colors based on time of day
      // time should be between 0 (midnight) and 1 (next midnight)
      const material = skyDomeRef.current.material;

      let topColor, bottomColor;
      let skyExponent = material.uniforms.exponent.value;

      // Dawn: 0.2-0.3
      // Day: 0.3-0.7
      // Sunset: 0.7-0.8
      // Night: 0.8-0.2

      if (time > 0.2 && time < 0.3) {
        // Dawn transition - more gradual and natural
        const t = (time - 0.2) / 0.1;
        topColor = colors.night.top.clone().lerp(colors.dawn.top, t * 2);
        bottomColor = colors.night.bottom
          .clone()
          .lerp(colors.dawn.bottom, t * 2);
        if (t > 0.5) {
          topColor.lerp(colors.day.top, (t - 0.5) * 2);
          bottomColor.lerp(colors.day.bottom, (t - 0.5) * 2);
        }
        skyExponent = 0.6 + (1 - t) * 0.4; // Exponent affects gradient smoothness
      } else if (time >= 0.3 && time < 0.7) {
        // Daytime - slight variations based on time of day
        const t = (time - 0.3) / 0.4; // Normalized day progress
        const midday = 1.0 - Math.abs(t - 0.5) * 2; // Peak at 0.5 (noon)

        // Sky gets slightly deeper blue at noon
        topColor = colors.day.top.clone();
        bottomColor = colors.day.bottom.clone();

        // Make sky slightly more saturated at noon
        const hslTop = { h: 0, s: 0, l: 0 };
        const hslBottom = { h: 0, s: 0, l: 0 };

        topColor.getHSL(hslTop);
        bottomColor.getHSL(hslBottom);

        topColor.setHSL(hslTop.h, hslTop.s + midday * 0.1, hslTop.l);
        bottomColor.setHSL(
          hslBottom.h,
          hslBottom.s + midday * 0.05,
          hslBottom.l + midday * 0.05
        );

        skyExponent = 0.6;
      } else if (time >= 0.7 && time < 0.8) {
        // Sunset transition - more dramatic and colorful
        const t = (time - 0.7) / 0.1;
        topColor = colors.day.top.clone().lerp(colors.sunset.top, t);
        bottomColor = colors.day.bottom
          .clone()
          .lerp(colors.sunset.bottom, t * 1.5); // Faster transition at horizon
        skyExponent = 0.6 + t * 0.3; // Sharper gradient
      } else if (time >= 0.8 || time < 0.2) {
        // Night with gradual change - deeper at midnight
        let t;
        if (time >= 0.8) {
          t = (time - 0.8) / 0.2;
        } else {
          t = (0.2 - time) / 0.2;
        }

        // Middle of night is darkest
        const midnight = 1.0 - t;
        topColor = colors.sunset.top
          .clone()
          .lerp(colors.night.top, 0.2 + 0.8 * midnight);
        bottomColor = colors.sunset.bottom
          .clone()
          .lerp(colors.night.bottom, 0.3 + 0.7 * midnight);
        skyExponent = 0.9 - t * 0.2; // Soft gradient at night
      }

      material.uniforms.topColor.value = topColor;
      material.uniforms.bottomColor.value = bottomColor;
      material.uniforms.exponent.value = skyExponent;

      // Update sun/moon position
      if (sunMoonRef.current) {
        const angle = time * Math.PI * 2;

        // Position sun and moon
        const radius = 250;
        const elevation = Math.sin(angle);
        const azimuth = Math.cos(angle);

        sunMoonRef.current.group.rotation.y = angle + Math.PI; // Rotate the whole system

        // Update sun/moon visibility
        if (time > 0.25 && time < 0.75) {
          // Daytime - sun visible
          const sunIntensity =
            time > 0.3 && time < 0.7
              ? 1.0
              : time < 0.3
              ? (time - 0.25) * 20
              : (0.8 - time) * 20;

          sunMoonRef.current.sunMaterial.opacity = sunIntensity;
          sunMoonRef.current.sunGlowMaterial.opacity = sunIntensity * 0.3;

          // Sun color changes based on elevation
          if (time < 0.35 || time > 0.65) {
            // Sunrise/sunset - more orange
            sunMoonRef.current.sunMaterial.color.setHex(0xff9933);
            sunMoonRef.current.sunGlowMaterial.color.setHex(0xff7744);
          } else {
            // Daytime - more yellow/white
            sunMoonRef.current.sunMaterial.color.setHex(0xffffaa);
            sunMoonRef.current.sunGlowMaterial.color.setHex(0xffeeaa);
          }

          // Sun size changes based on time (larger at sunrise/sunset - optical illusion)
          const baseScale = 1.0;
          const extraScale = time < 0.35 || time > 0.65 ? 0.3 : 0;
          const sunScale = baseScale + extraScale;
          sunMoonRef.current.sun.scale.set(sunScale, sunScale, sunScale);

          // Hide moon during day
          sunMoonRef.current.moonMaterial.opacity = 0;
        } else {
          // Nighttime - moon visible
          const moonPhase = ((time + 0.5) % 1) * 28; // 0-28 moon phase
          const moonIntensity =
            time < 0.25 || time > 0.75
              ? 1.0
              : time < 0.25
              ? (0.25 - time) * 20
              : (time - 0.75) * 20;

          sunMoonRef.current.moonMaterial.opacity = moonIntensity;
          sunMoonRef.current.sunMaterial.opacity = 0;
          sunMoonRef.current.sunGlowMaterial.opacity = 0;
        }

        // Update sun position in shader for atmospheric scattering effect
        material.uniforms.sunPosition.value.set(
          Math.cos(angle) * 100,
          Math.sin(angle) * 100,
          0
        );
      }

      // Update clouds with more sophisticated animation
      cloudsRef.current.forEach((cloud, index) => {
        // Move clouds at different speeds
        cloud.group.position.x += cloud.speed * 0.01;

        // Gentle vertical oscillation for some clouds
        const oscillation = cloud.oscillation;
        cloud.group.position.y +=
          Math.sin(
            Date.now() * 0.0005 * oscillation.speed + oscillation.phase
          ) *
          oscillation.amount *
          0.01;

        // Wrap clouds around with better transition
        if (cloud.group.position.x > 150) {
          cloud.group.position.x = -150;
          // Slight variation when re-entering
          cloud.group.position.z =
            cloud.group.position.z + (Math.random() - 0.5) * 10;
        }

        // Cloud opacity and color based on time of day
        if (time > 0.75 || time < 0.25) {
          // Night - dimmer, bluer clouds
          cloud.material.opacity = 0.4;
          cloud.material.color.setHSL(0.6, 0.1, 0.5); // Bluish
        } else if ((time > 0.25 && time < 0.3) || (time > 0.7 && time < 0.75)) {
          // Dawn/dusk - pink/orange tinted clouds
          const isDawn = time < 0.3;
          const t = isDawn ? (time - 0.25) / 0.05 : (0.75 - time) / 0.05;

          cloud.material.opacity = 0.4 + t * 0.5;

          // Dawn/sunset colors
          if (isDawn) {
            cloud.material.color.setHSL(0.05, 0.3, 0.8); // Orange/pink for dawn
          } else {
            cloud.material.color.setHSL(0.05, 0.4, 0.7); // Deeper orange for sunset
          }
        } else {
          // Day - bright white clouds
          cloud.material.opacity = 0.9;
          cloud.material.color.setHSL(0.6, 0.02, 0.98); // Nearly white
        }
      });

      // Update stars visibility with smooth transitions
      if (starsRef.current) {
        const stars = starsRef.current;

        if (time > 0.75 || time < 0.25) {
          // Night - fully visible stars
          stars.material.opacity = 1.0;

          // Make stars twinkle slightly
          stars.material.size = Math.sin(Date.now() * 0.0005) * 0.1 + 1.0;

          // Brighter stars are fully visible
          stars.brightStars.children.forEach((star) => {
            star.material.opacity = 0.9;
            // Random slight scale changes for twinkle effect
            const twinkle =
              Math.sin(Date.now() * 0.001 + star.position.x) * 0.1 + 1.0;
            star.scale.set(
              star.userData.baseScale * twinkle,
              star.userData.baseScale * twinkle,
              1
            );
          });
        } else if ((time > 0.25 && time < 0.3) || (time > 0.7 && time < 0.75)) {
          // Dawn/dusk - fading stars
          let t;
          if (time > 0.25 && time < 0.3) {
            t = 1 - (time - 0.25) / 0.05; // Fade out at dawn
          } else {
            t = (time - 0.7) / 0.05; // Fade in at dusk
          }

          stars.material.opacity = t;

          // Fade brighter stars too
          stars.brightStars.children.forEach((star) => {
            star.material.opacity = t * 0.9;
          });
        } else {
          // Day - invisible stars
          stars.material.opacity = 0;

          // Hide brighter stars too
          stars.brightStars.children.forEach((star) => {
            star.material.opacity = 0;
          });
        }
      }
    };

    // Initial update
    updateSky(timeOfDay);

    // Cleanup function
    return () => {
      scene.remove(skyDomeRef.current.mesh);
      skyDomeRef.current.material.dispose();

      // Clean up sun/moon
      if (sunMoonRef.current) {
        scene.remove(sunMoonRef.current.group);
        sunMoonRef.current.sun.geometry.dispose();
        sunMoonRef.current.sun.material.dispose();
        sunMoonRef.current.sunGlow.geometry.dispose();
        sunMoonRef.current.sunGlow.material.dispose();
        sunMoonRef.current.moon.geometry.dispose();
        sunMoonRef.current.moon.material.dispose();

        // Clean up moon craters
        sunMoonRef.current.moon.children.forEach((crater) => {
          crater.geometry.dispose();
          crater.material.dispose();
        });
      }

      // Clean up clouds
      cloudsRef.current.forEach((cloud) => {
        scene.remove(cloud.group);
        cloud.group.traverse((child) => {
          if (child.isMesh) {
            child.geometry.dispose();
          }
        });
        cloud.material.dispose();
      });

      // Clean up stars
      if (starsRef.current) {
        scene.remove(starsRef.current.group);
        starsRef.current.points.geometry.dispose();
        starsRef.current.material.dispose();

        // Clean up bright stars
        starsRef.current.brightStars.children.forEach((star) => {
          star.geometry.dispose();
          star.material.dispose();
          if (star.material.map) {
            star.material.map.dispose();
          }
        });
      }
    };
  }, [scene, timeOfDay]);

  // Expose update method for parent component to call
  const update = (time) => {
    if (skyDomeRef.current) {
      updateSky(time);
    }
  };

  // Expose the update function to parent component
  React.useImperativeHandle(React.useRef(), () => ({ update }));

  return null;
};

export default SkyBox;
