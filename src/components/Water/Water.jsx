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
  waterType = "lake",
}) => {
  const waterRef = useRef(null);

  useEffect(() => {
    if (!scene) return;

    const basinGeometry = new THREE.PlaneGeometry(
      width + 0.8,
      height + 0.8,
      16,
      16
    );

    const vertices = basinGeometry.attributes.position.array;

    const positionSeed = position.x * 1000 + position.z;
    const pseudoRandom = (idx) => {
      return (Math.sin(positionSeed * idx * 0.1) * 0.5 + 0.5) * 0.4 + 0.8;
    };

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const normalizedDistance =
        distanceFromCenter / (Math.min(width, height) / 2);

      const depthFactor = Math.pow(1 - normalizedDistance, 2);
      const idx = i / 3; // Vertex index
      vertices[i + 1] = -depth * depthFactor * pseudoRandom(idx);
    }

    basinGeometry.computeVertexNormals();

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

    const waterGeometry = new THREE.PlaneGeometry(width, height, 32, 32);

    const waterConfig = getWaterConfig(waterType);

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

    water.rotation.x = -Math.PI / 2;
    water.position.set(position.x, position.y + 0.05, position.z);
    scene.add(water);

    const shore = createNaturalShore();
    scene.add(shore);

    const underwaterDetails = createUnderwaterDetails();
    scene.add(underwaterDetails);

    const waterPlants = createWaterPlants();
    scene.add(waterPlants);

    const causticsLight = createCausticsEffect();
    if (causticsLight) scene.add(causticsLight);

    let waterParticles = null;
    if (waterType === "fountain" || waterType === "stream") {
      waterParticles = createWaterParticles();
      scene.add(waterParticles);
    }

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

    function getWaterBaseColor(type) {
      switch (type) {
        case "lake":
          return 0x1a456b;
        case "pond":
          return 0x2a5e3a;
        case "stream":
          return 0x2b7698;
        case "fountain":
          return 0x4587b3;
        default:
          return 0x1a456b;
      }
    }

    function getWaterConfig(type) {
      switch (type) {
        case "lake":
          return {
            color: 0x001e2e,
            distortion: 0.6,
            transparency: 0.8,
            textureRepeat: 6,
            waveSpeed: 15000,
          };
        case "pond":
          return {
            color: 0x003e2e,
            distortion: 0.8,
            transparency: 0.75,
            textureRepeat: 4,
            waveSpeed: 12000,
          };
        case "stream":
          return {
            color: 0x004a7f,
            distortion: 1.2,
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

    function createNaturalShore() {
      const shoreGroup = new THREE.Group();

      const shoreGeometry = new THREE.RingGeometry(
        Math.min(width, height) / 2,
        Math.min(width, height) / 2 + 1.5,
        32,
        3
      );

      const shoreVertices = shoreGeometry.attributes.position.array;

      const shoreSeed = position.x * 2000 + position.z;
      const pseudoRandomShore = (idx, factor = 1) => {
        return (Math.sin(shoreSeed + idx * 0.37) * 0.5 + 0.5) * factor;
      };

      for (let i = 0; i < shoreVertices.length; i += 3) {
        const variationScale = 0.15;
        const idx = i / 3;
        shoreVertices[i] += (pseudoRandomShore(idx) - 0.5) * variationScale;
        shoreVertices[i + 2] +=
          (pseudoRandomShore(idx + 100) - 0.5) * variationScale;

        shoreVertices[i + 1] = pseudoRandomShore(idx + 200, 0.05);
      }

      shoreGeometry.computeVertexNormals();

      const shoreMaterial = new THREE.MeshStandardMaterial({
        color: 0xd2b48c,
        roughness: 1.0,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });

      const shore = new THREE.Mesh(shoreGeometry, shoreMaterial);
      shore.rotation.x = -Math.PI / 2;
      shore.position.set(position.x, position.y + 0.02, position.z);
      shore.receiveShadow = true;
      shoreGroup.add(shore);

      const rockSeed = position.x * 3000 + position.z;
      const pseudoRandomRock = (idx, min = 0, max = 1) => {
        const val = Math.sin(rockSeed + idx * 0.73) * 0.5 + 0.5;
        return min + val * (max - min);
      };

      const rockCount = Math.floor(pseudoRandomRock(1, 8, 20));

      for (let i = 0; i < rockCount; i++) {
        const angle = pseudoRandomRock(i + 10) * Math.PI * 2;
        const radius =
          Math.min(width, height) / 2 + (pseudoRandomRock(i + 20) * 1.2 - 0.2);

        const rockX = Math.cos(angle) * radius;
        const rockZ = Math.sin(angle) * radius;

        const rockSize = 0.1 + pseudoRandomRock(i + 30) * 0.25;
        const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);

        const rockVertices = rockGeometry.attributes.position.array;
        for (let j = 0; j < rockVertices.length; j += 3) {
          const vertexIdx = i * 100 + j / 3;
          rockVertices[j] *= 0.8 + pseudoRandomRock(vertexIdx + 40) * 0.4;
          rockVertices[j + 1] *= 0.8 + pseudoRandomRock(vertexIdx + 50) * 0.4;
          rockVertices[j + 2] *= 0.8 + pseudoRandomRock(vertexIdx + 60) * 0.4;
        }

        rockGeometry.computeVertexNormals();

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

    function createUnderwaterDetails() {
      const detailsGroup = new THREE.Group();

      const detailsSeed = position.x * 4000 + position.z;
      const pseudoRandomDetail = (idx, min = 0, max = 1) => {
        const val = Math.sin(detailsSeed + idx * 1.23) * 0.5 + 0.5;
        return min + val * (max - min);
      };

      const pebbleCount = Math.floor((width * height) / 10);

      for (let i = 0; i < pebbleCount; i++) {
        const pebbleX = (pseudoRandomDetail(i + 10) - 0.5) * width * 0.8;
        const pebbleZ = (pseudoRandomDetail(i + 20) - 0.5) * height * 0.8;

        const distFromCenter = Math.sqrt(pebbleX * pebbleX + pebbleZ * pebbleZ);
        const normalizedDist = distFromCenter / (Math.min(width, height) / 2);

        if (pseudoRandomDetail(i + 30) < normalizedDist * 0.7) {
          const pebbleSize = 0.05 + pseudoRandomDetail(i + 40) * 0.1;
          const pebbleGeometry = new THREE.DodecahedronGeometry(pebbleSize, 0);

          const pebbleVertices = pebbleGeometry.attributes.position.array;
          for (let j = 0; j < pebbleVertices.length; j += 3) {
            pebbleVertices[j + 1] *= 0.5;
          }

          pebbleGeometry.computeVertexNormals();

          const colorVal = 0.2 + Math.random() * 0.2;
          const pebbleMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colorVal, colorVal, colorVal),
            roughness: 0.9,
            metalness: 0.05,
          });

          const pebble = new THREE.Mesh(pebbleGeometry, pebbleMaterial);

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

    function createWaterPlants() {
      const plantGroup = new THREE.Group();

      const plantSeed = position.x * 5000 + position.z;
      const pseudoRandomPlant = (idx, min = 0, max = 1) => {
        const val = Math.sin(plantSeed + idx * 0.96) * 0.5 + 0.5;
        return min + val * (max - min);
      };

      const baseCount = Math.min(
        Math.max(10, Math.floor(width * height * 0.15)),
        30
      );
      const plantCount = waterType === "pond" ? baseCount * 1.5 : baseCount;

      const plantTypes = ["reed", "lily", "cattail", "grass"];

      for (let i = 0; i < plantCount; i++) {
        let plantX, plantZ, plantType;

        if (pseudoRandomPlant(i + 10) < 0.7) {
          const angle = pseudoRandomPlant(i + 20) * Math.PI * 2;
          const radiusScale = 0.7 + pseudoRandomPlant(i + 30) * 0.25;
          plantX = Math.cos(angle) * (width / 2) * radiusScale;
          plantZ = Math.sin(angle) * (height / 2) * radiusScale;

          plantType = pseudoRandomPlant(i + 40) < 0.7 ? "reed" : "cattail";
        } else {
          plantX = (pseudoRandomPlant(i + 50) - 0.5) * width * 0.6;
          plantZ = (pseudoRandomPlant(i + 60) - 0.5) * height * 0.6;

          plantType = pseudoRandomPlant(i + 70) < 0.6 ? "lily" : "grass";
        }

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

        const distanceFromCenter = Math.sqrt(plantX * plantX + plantZ * plantZ);
        const normalizedDistance =
          distanceFromCenter / (Math.min(width, height) / 2);
        const depthAtPoint = depth * Math.pow(1 - normalizedDistance, 2);

        plant.position.set(
          position.x + plantX,
          plantType === "lily"
            ? position.y + 0.05
            : position.y - depthAtPoint + 0.1,
          position.z + plantZ
        );

        plant.rotation.y = Math.random() * Math.PI * 2;

        plantGroup.add(plant);
      }

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

      function createLilyPad() {
        const lilyGroup = new THREE.Group();

        const padRadius = 0.2 + Math.random() * 0.2;
        const padGeometry = new THREE.CircleGeometry(padRadius, 12);

        const padVertices = padGeometry.attributes.position.array;
        for (let i = 0; i < padVertices.length; i += 3) {
          if (i > 9) {
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

        if (Math.random() > 0.6) {
          const flowerGeometry = new THREE.ConeGeometry(0.05, 0.1, 8);
          const flowerMaterial = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? 0xffffff : 0xffc0cb,
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

        stem.rotation.set(
          Math.random() * 0.2 - 0.1,
          0,
          Math.random() * 0.2 - 0.1
        );

        stem.castShadow = true;
        cattailGroup.add(stem);

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

          const angle = (i / bladeCount) * Math.PI * 2;
          const distance = 0.02 + Math.random() * 0.03;
          const x = Math.cos(angle) * distance;
          const z = Math.sin(angle) * distance;

          blade.position.set(x, bladeHeight / 2, z);

          blade.rotation.y = angle;
          blade.rotation.x = Math.random() * 0.2 - 0.1;

          blade.castShadow = true;
          grassGroup.add(blade);
        }

        return grassGroup;
      }

      return plantGroup;
    }

    function createCausticsEffect() {
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

      scene.add(causticsLight.target);

      return causticsLight;
    }

    function createWaterParticles() {
      if (waterType !== "fountain" && waterType !== "stream") return null;

      const particleGroup = new THREE.Group();

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

        if (water) {
          scene.remove(water);
          water.geometry.dispose();
          water.material.dispose();
        }

        if (basin) {
          scene.remove(basin);
          basin.geometry.dispose();
          basin.material.dispose();
        }

        if (shore) {
          scene.remove(shore);
          shore.traverse((obj) => {
            if (obj.isMesh) {
              obj.geometry.dispose();
              obj.material.dispose();
            }
          });
        }

        if (waterPlants) {
          scene.remove(waterPlants);
          waterPlants.traverse((obj) => {
            if (obj.isMesh) {
              obj.geometry.dispose();
              obj.material.dispose();
            }
          });
        }

        if (underwaterDetails) {
          scene.remove(underwaterDetails);
          underwaterDetails.traverse((obj) => {
            if (obj.isMesh) {
              obj.geometry.dispose();
              obj.material.dispose();
            }
          });
        }

        if (causticsLight) {
          scene.remove(causticsLight);
          scene.remove(causticsLight.target);
        }

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

  const update = (time, timeOfDay) => {
    if (waterRef.current) {
      const { water, waterPlants, causticsLight, waterParticles } =
        waterRef.current;

      if (water) {
        const waterConfig = getWaterConfig(waterType);
        water.material.uniforms["time"].value = time / waterConfig.waveSpeed;

        if (timeOfDay !== undefined) {
          const isDaytime = timeOfDay > 0.25 && timeOfDay < 0.75;
          const isSunset = timeOfDay > 0.7 && timeOfDay < 0.8;
          const isSunrise = timeOfDay > 0.2 && timeOfDay < 0.3;

          let waterHue, waterSaturation, waterLightness;

          if (isSunrise) {
            waterHue = 0.6;
            waterSaturation = 0.4;
            waterLightness = 0.3;
          } else if (isSunset) {
            waterHue = 0.05;
            waterSaturation = 0.5;
            waterLightness = 0.3;
          } else if (isDaytime) {
            waterHue = 0.58;
            waterSaturation = 0.5;
            waterLightness = 0.25;
          } else {
            waterHue = 0.65;
            waterSaturation = 0.6;
            waterLightness = 0.15;
          }

          const waterColor = new THREE.Color();
          waterColor.setHSL(waterHue, waterSaturation, waterLightness);

          const currentColor = water.material.uniforms["waterColor"].value;
          const lerpFactor = 0.005;

          currentColor.r += (waterColor.r - currentColor.r) * lerpFactor;
          currentColor.g += (waterColor.g - currentColor.g) * lerpFactor;
          currentColor.b += (waterColor.b - currentColor.b) * lerpFactor;
        }
      }

      if (causticsLight) {
        const intensity = 1 + Math.sin(time * 0.0002) * 0.15;
        causticsLight.intensity = intensity;

        const angle = time * 0.0001;
        const radius = 0.3;
        causticsLight.target.position.x = position.x + Math.cos(angle) * radius;
        causticsLight.target.position.z = position.z + Math.sin(angle) * radius;
      }

      if (waterPlants) {
        waterPlants.traverse((obj) => {
          if (obj.isMesh && obj !== waterRef.current.shore) {
            const swayAmount = 0.01;
            const uniqueOffset =
              (obj.position.x * 10 + obj.position.z * 10) % (2 * Math.PI);
            const swaySpeed = 0.0003;

            obj.rotation.x =
              Math.sin(time * swaySpeed + uniqueOffset) * swayAmount;
            obj.rotation.z =
              Math.cos(time * swaySpeed * 0.7 + uniqueOffset) * swayAmount;
          }
        });
      }

      if (
        waterParticles &&
        (waterType === "fountain" || waterType === "stream")
      ) {
        const now = time;
        const rippleInterval = waterType === "fountain" ? 2000 : 4000;

        if (now - waterRef.current.lastRippleTime > rippleInterval) {
          waterRef.current.lastRippleTime = now;

          if (waterType === "fountain") {
            createWaterRipple(
              0,
              0,
              0.1 + pseudoRandomDetail(now * 0.0001, 0, 0.1)
            );
          } else if (waterType === "stream") {
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

        waterParticles.traverse((obj) => {
          if (obj.userData && obj.userData.isRipple) {
            obj.scale.x += 0.005;
            obj.scale.z += 0.005;

            if (obj.material) {
              obj.material.opacity -= 0.003;

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

      ripple.userData = { isRipple: true };

      waterRef.current.waterParticles.add(ripple);
    }
  };

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
