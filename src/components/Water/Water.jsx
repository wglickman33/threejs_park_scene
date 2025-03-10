import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Water as ThreeWater } from "three/examples/jsm/objects/Water.js";
import "./Water.css";

const Water = ({
  scene,
  width = 20,
  height = 20,
  position = { x: 0, y: 0, z: 0 },
  depth = 0.3,
  waterType = "lake", // "lake", "pond", "stream", or "fountain"
}) => {
  const waterRef = useRef(null);

  useEffect(() => {
    if (!scene) return;

    // Create water basin first (the depression/hole for the water)
    const basinGeometry = new THREE.PlaneGeometry(
      width + 0.8,
      height + 0.8,
      16,
      16
    );

    // Create more natural basin with variable depth - but with fixed seed to avoid layout changes
    const vertices = basinGeometry.attributes.position.array;

    // Use position as a deterministic seed for randomness
    const positionSeed = position.x * 1000 + position.z;
    const pseudoRandom = (idx) => {
      // Simple deterministic random function based on position and index
      return (Math.sin(positionSeed * idx * 0.1) * 0.5 + 0.5) * 0.4 + 0.8;
    };

    for (let i = 0; i < vertices.length; i += 3) {
      // Distance from center
      const x = vertices[i];
      const z = vertices[i + 2];
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const normalizedDistance =
        distanceFromCenter / (Math.min(width, height) / 2);

      // Deeper in the middle, gradually shallower toward edges
      // Use deterministic variation instead of random
      const depthFactor = Math.pow(1 - normalizedDistance, 2);
      const idx = i / 3; // Vertex index
      vertices[i + 1] = -depth * depthFactor * pseudoRandom(idx);
    }

    basinGeometry.computeVertexNormals();

    // Basin material with more realistic underwater appearance
    const basinMaterial = new THREE.MeshStandardMaterial({
      color: getWaterBaseColor(waterType),
      roughness: 0.4,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });

    const basin = new THREE.Mesh(basinGeometry, basinMaterial);
    basin.rotation.x = -Math.PI / 2;
    basin.position.set(position.x, position.y - depth / 2, position.z);
    basin.receiveShadow = true;
    scene.add(basin);

    // Create water surface with improved aesthetics
    const waterGeometry = new THREE.PlaneGeometry(width, height, 32, 32);

    // Configure water type-specific properties
    const waterConfig = getWaterConfig(waterType);

    // Enhanced water with better textures
    const water = new ThreeWater(waterGeometry, {
      textureWidth: 1024,
      textureHeight: 1024,
      waterNormals: new THREE.TextureLoader().load(
        "https://threejs.org/examples/textures/waternormals.jpg",
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(
            waterConfig.textureRepeat,
            waterConfig.textureRepeat
          );
        }
      ),
      sunDirection: new THREE.Vector3(0.3, 1.0, 0.5),
      sunColor: 0xffffff,
      waterColor: waterConfig.color,
      distortionScale: waterConfig.distortion,
      fog: scene.fog !== undefined,
      alpha: waterConfig.transparency,
    });

    // Position and rotate water
    water.rotation.x = -Math.PI / 2;
    water.position.set(position.x, position.y + 0.05, position.z);
    scene.add(water);

    // Create shores/banks with more natural blending
    const shore = createNaturalShore();
    scene.add(shore);

    // Add underwater details
    const underwaterDetails = createUnderwaterDetails();
    scene.add(underwaterDetails);

    // Add water plants and decorative elements
    const waterPlants = createWaterPlants();
    scene.add(waterPlants);

    // Add caustics light effect for underwater light patterns
    const causticsLight = createCausticsEffect();
    if (causticsLight) scene.add(causticsLight);

    // Add water ripples/particles for fountains or streams
    let waterParticles = null;
    if (waterType === "fountain" || waterType === "stream") {
      waterParticles = createWaterParticles();
      scene.add(waterParticles);
    }

    // Store all water elements for animation and cleanup
    waterRef.current = {
      water,
      basin,
      shore,
      waterPlants,
      underwaterDetails,
      causticsLight,
      waterParticles,
      lastRippleTime: 0,
    };

    // Helper function to get water color based on type
    function getWaterBaseColor(type) {
      switch (type) {
        case "lake":
          return 0x1a456b; // Deep blue
        case "pond":
          return 0x2a5e3a; // Slightly green-blue
        case "stream":
          return 0x2b7698; // Clear blue
        case "fountain":
          return 0x4587b3; // Light blue
        default:
          return 0x1a456b;
      }
    }

    // Helper function to get water configuration based on type
    function getWaterConfig(type) {
      switch (type) {
        case "lake":
          return {
            color: 0x001e2e,
            distortion: 0.6, // Reduced distortion for smoother lake surface
            transparency: 0.8,
            textureRepeat: 6, // Larger texture repeat for subtler pattern
            waveSpeed: 15000, // Much slower wave speed for lakes
          };
        case "pond":
          return {
            color: 0x003e2e,
            distortion: 0.8, // Reduced distortion
            transparency: 0.75,
            textureRepeat: 4,
            waveSpeed: 12000, // Slower waves for ponds
          };
        case "stream":
          return {
            color: 0x004a7f,
            distortion: 1.2, // Still some movement for streams
            transparency: 0.85,
            textureRepeat: 3,
            waveSpeed: 8000,
          };
        case "fountain":
          return {
            color: 0x0078a8,
            distortion: 1.5,
            transparency: 0.9,
            textureRepeat: 2,
            waveSpeed: 6000,
          };
        default:
          return {
            color: 0x001e2e,
            distortion: 0.6,
            transparency: 0.8,
            textureRepeat: 6,
            waveSpeed: 15000,
          };
      }
    }

    // Create natural-looking shore/bank
    function createNaturalShore() {
      const shoreGroup = new THREE.Group();

      // Main shore ring
      const shoreGeometry = new THREE.RingGeometry(
        Math.min(width, height) / 2,
        Math.min(width, height) / 2 + 1.5,
        32,
        3
      );

      // Add some natural variation to shore vertices using deterministic approach
      const shoreVertices = shoreGeometry.attributes.position.array;

      // Use a stable seed based on position for deterministic randomness
      const shoreSeed = position.x * 2000 + position.z;
      const pseudoRandomShore = (idx, factor = 1) => {
        // Stable variation based on position and index
        return (Math.sin(shoreSeed + idx * 0.37) * 0.5 + 0.5) * factor;
      };

      for (let i = 0; i < shoreVertices.length; i += 3) {
        // Add deterministic variation to x and z
        const variationScale = 0.15;
        const idx = i / 3;
        shoreVertices[i] += (pseudoRandomShore(idx) - 0.5) * variationScale;
        shoreVertices[i + 2] +=
          (pseudoRandomShore(idx + 100) - 0.5) * variationScale;

        // Vary the y slightly for a more natural look - but deterministically
        shoreVertices[i + 1] = pseudoRandomShore(idx + 200, 0.05);
      }

      shoreGeometry.computeVertexNormals();

      // Shore material with texture blend
      const shoreMaterial = new THREE.MeshStandardMaterial({
        color: 0xd2b48c, // Sandy base color
        roughness: 1.0,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });

      const shore = new THREE.Mesh(shoreGeometry, shoreMaterial);
      shore.rotation.x = -Math.PI / 2;
      shore.position.set(position.x, position.y + 0.02, position.z);
      shore.receiveShadow = true;
      shoreGroup.add(shore);

      // Add some scattered rocks around the shore - with fixed layout
      const rockSeed = position.x * 3000 + position.z;
      const pseudoRandomRock = (idx, min = 0, max = 1) => {
        // Deterministic random function based on position and index
        const val = Math.sin(rockSeed + idx * 0.73) * 0.5 + 0.5;
        return min + val * (max - min);
      };

      // Fixed rock count based on position
      const rockCount = Math.floor(pseudoRandomRock(1, 8, 20));

      for (let i = 0; i < rockCount; i++) {
        const angle = pseudoRandomRock(i + 10) * Math.PI * 2;
        const radius =
          Math.min(width, height) / 2 + (pseudoRandomRock(i + 20) * 1.2 - 0.2);

        const rockX = Math.cos(angle) * radius;
        const rockZ = Math.sin(angle) * radius;

        // Create small rock with deterministic size
        const rockSize = 0.1 + pseudoRandomRock(i + 30) * 0.25;
        const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);

        // Deform rock slightly for more natural look - but deterministically
        const rockVertices = rockGeometry.attributes.position.array;
        for (let j = 0; j < rockVertices.length; j += 3) {
          const vertexIdx = i * 100 + j / 3;
          rockVertices[j] *= 0.8 + pseudoRandomRock(vertexIdx + 40) * 0.4;
          rockVertices[j + 1] *= 0.8 + pseudoRandomRock(vertexIdx + 50) * 0.4;
          rockVertices[j + 2] *= 0.8 + pseudoRandomRock(vertexIdx + 60) * 0.4;
        }

        rockGeometry.computeVertexNormals();

        // Rock material - vary the color slightly
        const grayValue = 0.4 + Math.random() * 0.4;
        const rockMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(grayValue, grayValue, grayValue),
          roughness: 0.9,
          metalness: 0.1,
        });

        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(
          position.x + rockX,
          position.y + rockSize * 0.3,
          position.z + rockZ
        );

        // Random rotation
        rock.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );

        rock.castShadow = true;
        rock.receiveShadow = true;

        shoreGroup.add(rock);
      }

      return shoreGroup;
    }

    // Create underwater details like pebbles and sand texture - with deterministic placement
    function createUnderwaterDetails() {
      const detailsGroup = new THREE.Group();

      // Use stable seed for underwater details
      const detailsSeed = position.x * 4000 + position.z;
      const pseudoRandomDetail = (idx, min = 0, max = 1) => {
        // Deterministic random function for underwater details
        const val = Math.sin(detailsSeed + idx * 1.23) * 0.5 + 0.5;
        return min + val * (max - min);
      };

      // Add pebbles/rocks at the bottom
      const pebbleCount = Math.floor((width * height) / 10);

      for (let i = 0; i < pebbleCount; i++) {
        // Position within the water area, more toward the center - deterministically
        const pebbleX = (pseudoRandomDetail(i + 10) - 0.5) * width * 0.8;
        const pebbleZ = (pseudoRandomDetail(i + 20) - 0.5) * height * 0.8;

        // Distance from center affects likelihood of pebble placement
        const distFromCenter = Math.sqrt(pebbleX * pebbleX + pebbleZ * pebbleZ);
        const normalizedDist = distFromCenter / (Math.min(width, height) / 2);

        // More pebbles toward the edges, fewer in the center
        if (pseudoRandomDetail(i + 30) < normalizedDist * 0.7) {
          const pebbleSize = 0.05 + pseudoRandomDetail(i + 40) * 0.1;
          const pebbleGeometry = new THREE.DodecahedronGeometry(pebbleSize, 0);

          // Flatten the pebble slightly
          const pebbleVertices = pebbleGeometry.attributes.position.array;
          for (let j = 0; j < pebbleVertices.length; j += 3) {
            pebbleVertices[j + 1] *= 0.5;
          }

          pebbleGeometry.computeVertexNormals();

          // Vary the color slightly for natural look
          const colorVal = 0.2 + Math.random() * 0.2;
          const pebbleMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colorVal, colorVal, colorVal),
            roughness: 0.9,
            metalness: 0.05,
          });

          const pebble = new THREE.Mesh(pebbleGeometry, pebbleMaterial);

          // Calculate y position based on the basin depth at this point
          const distanceFromCenter = Math.sqrt(
            pebbleX * pebbleX + pebbleZ * pebbleZ
          );
          const normalizedDistance =
            distanceFromCenter / (Math.min(width, height) / 2);
          const depthAtPoint = depth * Math.pow(1 - normalizedDistance, 2);

          pebble.position.set(
            position.x + pebbleX,
            position.y - depthAtPoint + pebbleSize * 0.5,
            position.z + pebbleZ
          );

          // Random rotation but keep it flat-ish
          pebble.rotation.set(
            Math.random() * 0.3,
            Math.random() * Math.PI * 2,
            Math.random() * 0.3
          );

          pebble.castShadow = true;
          pebble.receiveShadow = true;

          detailsGroup.add(pebble);
        }
      }

      return detailsGroup;
    }

    // Create water plants with more diversity and natural positioning - but deterministic layout
    function createWaterPlants() {
      const plantGroup = new THREE.Group();

      // Use stable seed for plants
      const plantSeed = position.x * 5000 + position.z;
      const pseudoRandomPlant = (idx, min = 0, max = 1) => {
        // Deterministic random function for plants
        const val = Math.sin(plantSeed + idx * 0.96) * 0.5 + 0.5;
        return min + val * (max - min);
      };

      // Base number of plants scaled to water size
      const baseCount = Math.min(
        Math.max(10, Math.floor(width * height * 0.15)),
        30
      );
      const plantCount = waterType === "pond" ? baseCount * 1.5 : baseCount;

      // Plant types
      const plantTypes = ["reed", "lily", "cattail", "grass"];

      for (let i = 0; i < plantCount; i++) {
        // Choose plant position - mostly near edges for natural look - deterministically
        let plantX, plantZ, plantType;

        if (pseudoRandomPlant(i + 10) < 0.7) {
          // Edge plants
          const angle = pseudoRandomPlant(i + 20) * Math.PI * 2;
          const radiusScale = 0.7 + pseudoRandomPlant(i + 30) * 0.25; // 0.7-0.95 of max radius
          plantX = Math.cos(angle) * (width / 2) * radiusScale;
          plantZ = Math.sin(angle) * (height / 2) * radiusScale;

          // Edge plants are usually reeds or cattails - deterministic choice
          plantType = pseudoRandomPlant(i + 40) < 0.7 ? "reed" : "cattail";
        } else {
          // Some plants in the middle - like water lilies
          plantX = (pseudoRandomPlant(i + 50) - 0.5) * width * 0.6;
          plantZ = (pseudoRandomPlant(i + 60) - 0.5) * height * 0.6;

          // Middle plants are usually lilies or grass - deterministic choice
          plantType = pseudoRandomPlant(i + 70) < 0.6 ? "lily" : "grass";
        }

        // Create the plant based on type
        let plant;

        switch (plantType) {
          case "reed":
            plant = createReedPlant();
            break;
          case "lily":
            plant = createLilyPad();
            break;
          case "cattail":
            plant = createCattail();
            break;
          case "grass":
            plant = createWaterGrass();
            break;
          default:
            plant = createReedPlant();
        }

        // Calculate depth at this point for proper y positioning
        const distanceFromCenter = Math.sqrt(plantX * plantX + plantZ * plantZ);
        const normalizedDistance =
          distanceFromCenter / (Math.min(width, height) / 2);
        const depthAtPoint = depth * Math.pow(1 - normalizedDistance, 2);

        // Position the plant
        plant.position.set(
          position.x + plantX,
          plantType === "lily"
            ? position.y + 0.05
            : position.y - depthAtPoint + 0.1,
          position.z + plantZ
        );

        // Add slight random rotation
        plant.rotation.y = Math.random() * Math.PI * 2;

        plantGroup.add(plant);
      }

      // Helper function to create a reed plant
      function createReedPlant() {
        const reedGroup = new THREE.Group();

        const reedHeight = 0.6 + Math.random() * 1.2;
        const reedGeometry = new THREE.CylinderGeometry(
          0.02,
          0.01,
          reedHeight,
          5
        );
        const reedMaterial = new THREE.MeshStandardMaterial({
          color: 0x006633,
          roughness: 0.9,
          metalness: 0.0,
        });

        const reed = new THREE.Mesh(reedGeometry, reedMaterial);
        reed.position.y = reedHeight / 2;
        reed.rotation.set(
          Math.random() * 0.2 - 0.1,
          0,
          Math.random() * 0.2 - 0.1
        );

        reed.castShadow = true;
        reedGroup.add(reed);

        // Add leaf to some reeds
        if (Math.random() > 0.3) {
          const leafGeometry = new THREE.ConeGeometry(0.06, 0.3, 4);
          const leafMaterial = new THREE.MeshStandardMaterial({
            color: 0x008844,
            roughness: 0.8,
            metalness: 0.0,
          });

          const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
          leaf.position.set(0, reedHeight * 0.7, 0);
          leaf.rotation.x = Math.PI / 2;
          leaf.rotation.z = Math.random() * Math.PI;
          leaf.castShadow = true;

          reed.add(leaf);
        }

        return reedGroup;
      }

      // Helper function to create a lily pad
      function createLilyPad() {
        const lilyGroup = new THREE.Group();

        // Create the lily pad
        const padRadius = 0.2 + Math.random() * 0.2;
        const padGeometry = new THREE.CircleGeometry(padRadius, 12);

        // Add some natural variation to the pad shape
        const padVertices = padGeometry.attributes.position.array;
        for (let i = 0; i < padVertices.length; i += 3) {
          if (i > 9) {
            // Don't modify center vertex
            const dist = Math.sqrt(
              padVertices[i] * padVertices[i] +
                padVertices[i + 2] * padVertices[i + 2]
            );
            if (dist > 0) {
              const angle = Math.atan2(padVertices[i + 2], padVertices[i]);
              const newDist = dist * (0.9 + Math.random() * 0.2);
              padVertices[i] = Math.cos(angle) * newDist;
              padVertices[i + 2] = Math.sin(angle) * newDist;
            }
          }
        }

        padGeometry.computeVertexNormals();

        const padMaterial = new THREE.MeshStandardMaterial({
          color: 0x006622,
          roughness: 0.8,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });

        const lilyPad = new THREE.Mesh(padGeometry, padMaterial);
        lilyPad.rotation.x = -Math.PI / 2;
        lilyPad.castShadow = true;
        lilyPad.receiveShadow = true;
        lilyGroup.add(lilyPad);

        // Add a flower to some lily pads
        if (Math.random() > 0.6) {
          const flowerGeometry = new THREE.ConeGeometry(0.05, 0.1, 8);
          const flowerMaterial = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? 0xffffff : 0xffc0cb, // White or pink
            roughness: 0.9,
            metalness: 0.0,
          });

          const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
          flower.position.set(padRadius * 0.3, 0.05, padRadius * 0.3);
          flower.castShadow = true;

          lilyGroup.add(flower);
        }

        return lilyGroup;
      }

      // Helper function to create a cattail
      function createCattail() {
        const cattailGroup = new THREE.Group();

        const stemHeight = 1.2 + Math.random() * 0.8;
        const stemGeometry = new THREE.CylinderGeometry(
          0.02,
          0.01,
          stemHeight,
          5
        );
        const stemMaterial = new THREE.MeshStandardMaterial({
          color: 0x5a9e40,
          roughness: 0.9,
          metalness: 0.0,
        });

        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = stemHeight / 2;

        // Add a subtle curve to the stem
        stem.rotation.set(
          Math.random() * 0.2 - 0.1,
          0,
          Math.random() * 0.2 - 0.1
        );

        stem.castShadow = true;
        cattailGroup.add(stem);

        // Add the characteristic cattail top
        const topHeight = 0.25 + Math.random() * 0.15;
        const topGeometry = new THREE.CylinderGeometry(
          0.04,
          0.04,
          topHeight,
          8
        );
        const topMaterial = new THREE.MeshStandardMaterial({
          color: 0x553311,
          roughness: 1.0,
          metalness: 0.0,
        });

        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(0, stemHeight * 0.8, 0);
        top.castShadow = true;

        stem.add(top);

        return cattailGroup;
      }

      // Helper function to create water grass
      function createWaterGrass() {
        const grassGroup = new THREE.Group();

        const bladeCount = 3 + Math.floor(Math.random() * 4);

        for (let i = 0; i < bladeCount; i++) {
          const bladeHeight = 0.3 + Math.random() * 0.4;
          const bladeGeometry = new THREE.PlaneGeometry(0.04, bladeHeight);
          const bladeMaterial = new THREE.MeshStandardMaterial({
            color: 0x4e9e29,
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide,
          });

          const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);

          // Position around center with slight randomness
          const angle = (i / bladeCount) * Math.PI * 2;
          const distance = 0.02 + Math.random() * 0.03;
          const x = Math.cos(angle) * distance;
          const z = Math.sin(angle) * distance;

          blade.position.set(x, bladeHeight / 2, z);

          // Rotate outward slightly
          blade.rotation.y = angle;
          blade.rotation.x = Math.random() * 0.2 - 0.1;

          blade.castShadow = true;
          grassGroup.add(blade);
        }

        return grassGroup;
      }

      return plantGroup;
    }

    // Create caustics light effect (underwater light patterns)
    function createCausticsEffect() {
      // Simple implementation with a spotlight to simulate caustics
      const causticsLight = new THREE.SpotLight(0xaaccff, 1.5);
      causticsLight.position.set(position.x, position.y + 5, position.z);
      causticsLight.target.position.set(
        position.x,
        position.y - depth,
        position.z
      );
      causticsLight.angle = 0.5;
      causticsLight.penumbra = 0.5;
      causticsLight.decay = 1.5;
      causticsLight.distance = 10;
      causticsLight.castShadow = false;

      // Add the target to the scene
      scene.add(causticsLight.target);

      return causticsLight;
    }

    // Create water particles system for fountains or streams
    function createWaterParticles() {
      if (waterType !== "fountain" && waterType !== "stream") return null;

      // Simple implementation of water particles
      const particleGroup = new THREE.Group();

      // For a fountain, add a central water jet
      if (waterType === "fountain") {
        const jetGeometry = new THREE.CylinderGeometry(0.1, 0.2, 0.8, 8);
        const jetMaterial = new THREE.MeshStandardMaterial({
          color: 0x88bbee,
          transparent: true,
          opacity: 0.7,
          roughness: 0.1,
          metalness: 0.3,
        });

        const jet = new THREE.Mesh(jetGeometry, jetMaterial);
        jet.position.set(0, 0.4, 0);
        particleGroup.add(jet);
      }

      return particleGroup;
    }

    // Cleanup function
    return () => {
      if (waterRef.current) {
        const {
          water,
          basin,
          shore,
          waterPlants,
          underwaterDetails,
          causticsLight,
          waterParticles,
        } = waterRef.current;

        // Remove and dispose water
        if (water) {
          scene.remove(water);
          water.geometry.dispose();
          water.material.dispose();
        }

        // Remove and dispose basin
        if (basin) {
          scene.remove(basin);
          basin.geometry.dispose();
          basin.material.dispose();
        }

        // Remove and dispose shore group
        if (shore) {
          scene.remove(shore);
          shore.traverse((obj) => {
            if (obj.isMesh) {
              obj.geometry.dispose();
              obj.material.dispose();
            }
          });
        }

        // Remove and dispose water plants
        if (waterPlants) {
          scene.remove(waterPlants);
          waterPlants.traverse((obj) => {
            if (obj.isMesh) {
              obj.geometry.dispose();
              obj.material.dispose();
            }
          });
        }

        // Remove and dispose underwater details
        if (underwaterDetails) {
          scene.remove(underwaterDetails);
          underwaterDetails.traverse((obj) => {
            if (obj.isMesh) {
              obj.geometry.dispose();
              obj.material.dispose();
            }
          });
        }

        // Remove caustics light
        if (causticsLight) {
          scene.remove(causticsLight);
          scene.remove(causticsLight.target);
        }

        // Remove and dispose water particles
        if (waterParticles) {
          scene.remove(waterParticles);
          waterParticles.traverse((obj) => {
            if (obj.isMesh) {
              obj.geometry.dispose();
              obj.material.dispose();
            }
          });
        }
      }
    };
  }, [scene, width, height, position, depth, waterType]);

  // Animation update function - exposed to parent component
  const update = (time, timeOfDay) => {
    if (waterRef.current) {
      const { water, waterPlants, causticsLight, waterParticles } =
        waterRef.current;

      if (water) {
        // Use much slower wave speed for smoother animation
        // The waveSpeed is now part of the water configuration (per water type)
        const waterConfig = getWaterConfig(waterType);
        water.material.uniforms["time"].value = time / waterConfig.waveSpeed;

        // Update water color based on time of day if provided - with gentler transitions
        if (timeOfDay !== undefined) {
          const isDaytime = timeOfDay > 0.25 && timeOfDay < 0.75;
          const isSunset = timeOfDay > 0.7 && timeOfDay < 0.8;
          const isSunrise = timeOfDay > 0.2 && timeOfDay < 0.3;

          let waterHue, waterSaturation, waterLightness;

          if (isSunrise) {
            // Dawn - pinkish reflection
            waterHue = 0.6; // Blue-purple
            waterSaturation = 0.4; // Less saturated for calmer look
            waterLightness = 0.3;
          } else if (isSunset) {
            // Sunset - orange reflection
            waterHue = 0.05; // Orange-ish
            waterSaturation = 0.5; // Less saturated
            waterLightness = 0.3;
          } else if (isDaytime) {
            // Day - bright blue
            waterHue = 0.58; // Sky blue
            waterSaturation = 0.5; // Less saturated for calmer look
            waterLightness = 0.25;
          } else {
            // Night - deep blue
            waterHue = 0.65; // Deep blue
            waterSaturation = 0.6; // Less saturated
            waterLightness = 0.15;
          }

          // Apply color to water - with smoother transition
          const waterColor = new THREE.Color();
          waterColor.setHSL(waterHue, waterSaturation, waterLightness);

          // Smoothly interpolate the current color toward the target color
          const currentColor = water.material.uniforms["waterColor"].value;
          const lerpFactor = 0.005; // Very slow transition

          currentColor.r += (waterColor.r - currentColor.r) * lerpFactor;
          currentColor.g += (waterColor.g - currentColor.g) * lerpFactor;
          currentColor.b += (waterColor.b - currentColor.b) * lerpFactor;
        }
      }

      // Animate caustics light for underwater effect - with much gentler animation
      if (causticsLight) {
        // Very subtle intensity changes
        const intensity = 1 + Math.sin(time * 0.0002) * 0.15;
        causticsLight.intensity = intensity;

        // Much slower movement of the caustics pattern
        const angle = time * 0.0001; // 5x slower
        const radius = 0.3; // Smaller radius of movement
        causticsLight.target.position.x = position.x + Math.cos(angle) * radius;
        causticsLight.target.position.z = position.z + Math.sin(angle) * radius;
      }

      // Animate water plants with very gentle swaying motion
      if (waterPlants) {
        waterPlants.traverse((obj) => {
          if (obj.isMesh && obj !== waterRef.current.shore) {
            // Apply much subtler swaying motion
            const swayAmount = 0.01; // Reduced by 2/3
            const uniqueOffset =
              (obj.position.x * 10 + obj.position.z * 10) % (2 * Math.PI);
            const swaySpeed = 0.0003; // 3x slower

            obj.rotation.x =
              Math.sin(time * swaySpeed + uniqueOffset) * swayAmount;
            obj.rotation.z =
              Math.cos(time * swaySpeed * 0.7 + uniqueOffset) * swayAmount;
          }
        });
      }

      // Animate water particles for fountains or streams - much slower for lake
      if (
        waterParticles &&
        (waterType === "fountain" || waterType === "stream")
      ) {
        // Create occasional new ripples - much less frequently
        const now = time;
        const rippleInterval = waterType === "fountain" ? 2000 : 4000; // Much longer intervals

        if (now - waterRef.current.lastRippleTime > rippleInterval) {
          // Create a new ripple
          waterRef.current.lastRippleTime = now;

          // For fountains, create ripples at center
          if (waterType === "fountain") {
            createWaterRipple(
              0,
              0,
              0.1 + pseudoRandomDetail(now * 0.0001, 0, 0.1)
            );
          }
          // For streams, create ripples along a line
          else if (waterType === "stream") {
            const streamX =
              (pseudoRandomDetail(now * 0.0001 + 10) - 0.5) * width * 0.7;
            const streamZ =
              (pseudoRandomDetail(now * 0.0001 + 20) - 0.5) * height * 0.7;
            createWaterRipple(
              streamX,
              streamZ,
              0.05 + pseudoRandomDetail(now * 0.0001 + 30, 0, 0.05)
            );
          }
        }

        // Animate existing ripples - much slower expansion
        waterParticles.traverse((obj) => {
          if (obj.userData && obj.userData.isRipple) {
            // Expand ripple much more slowly
            obj.scale.x += 0.005; // 4x slower
            obj.scale.z += 0.005; // 4x slower

            // Fade out ripple more slowly
            if (obj.material) {
              obj.material.opacity -= 0.003; // 3x slower fade

              // Remove completely faded ripples
              if (obj.material.opacity <= 0) {
                waterParticles.remove(obj);
                obj.geometry.dispose();
                obj.material.dispose();
              }
            }
          }
        });
      }
    }

    // Helper function to create water ripples
    function createWaterRipple(offsetX, offsetZ, size) {
      if (!waterRef.current || !waterRef.current.waterParticles) return;

      const rippleGeometry = new THREE.RingGeometry(size, size * 1.2, 16);
      const rippleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });

      const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
      ripple.rotation.x = -Math.PI / 2;
      ripple.position.set(
        position.x + offsetX,
        position.y + 0.01,
        position.z + offsetZ
      );

      // Mark as ripple for animation
      ripple.userData = { isRipple: true };

      waterRef.current.waterParticles.add(ripple);
    }
  };

  // Expose update function to parent component
  React.useImperativeHandle(
    React.useRef(),
    () => ({
      update,
    }),
    [waterType]
  );

  return null;
};

export default Water;
