import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Parkour from "../Parkour/Parkour";
import Ground from "../Ground/Ground";
import Tree from "../Tree/Tree";
import Bench from "../Bench/Bench";
import LightSetup from "../LightSetup/LightSetup";
import DayNightCycle from "../DayNightCycle/DayNightCycle";
import InteractiveObjects from "../InteractiveObjects/InteractiveObjects";
import Wildlife from "../Wildlife/Wildlife";
import Water from "../Water/Water";
import "./ParkScene.css";

const ParkScene = () => {
  const mountRef = useRef(null);
  const [message, setMessage] = useState(null);
  const timeOfDayRef = useRef(0.3);
  const [timeInfo, setTimeInfo] = useState("12:00");
  const [autoRotate, setAutoRotate] = useState(true);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const orbitControlsRef = useRef(null);
  const animationRef = useRef(null);
  const dayNightCycleRef = useRef(null);
  const lightsRef = useRef(null);
  const wildlifeRef = useRef(null);
  const fogRef = useRef(null);

  const waterFeaturesRef = useRef([]);

  const clockRef = useRef(new THREE.Clock());
  const timeSpeedRef = useRef(0.05);

  const treePositions = useMemo(() => {
    const fixedTrees = [
      { x: -15, z: -15, type: "pine" },
      { x: -25, z: 8, type: "oak" },
      { x: 18, z: -12, type: "birch" },
      { x: -8, z: 20, type: "oak" },
      { x: -5, z: -5, type: "pine" },
      { x: 12, z: 15, type: "birch" },
      { x: -18, z: 5, type: "oak" },
      { x: 6, z: -3, type: "pine" },
      { x: -12, z: -18, type: "birch" },
      { x: 10, z: 8, type: "oak" },
      { x: -30, z: -30, type: "pine" },
      { x: 30, z: 30, type: "oak" },
      { x: -30, z: 30, type: "birch" },
      { x: 30, z: -30, type: "pine" },
      { x: 0, z: 30, type: "palm" },
      { x: 0, z: -30, type: "palm" },
      { x: 30, z: 0, type: "palm" },
      { x: -30, z: 0, type: "palm" },
    ];

    const createTreeCluster = (centerX, centerZ, radius, count, mainType) => {
      const cluster = [];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.cos(centerX + centerZ);
        const dist = (0.3 + Math.random() * 0.7) * radius;

        const x = centerX + Math.cos(angle) * dist;
        const z = centerZ + Math.sin(angle) * dist;

        const type =
          Math.random() < 0.8
            ? mainType
            : ["pine", "oak", "birch"][Math.floor(Math.random() * 3)];

        cluster.push({ x, z, type });
      }
      return cluster;
    };

    const clusters = [
      createTreeCluster(-20, 15, 5, 8, "oak"),
      createTreeCluster(22, -20, 7, 10, "pine"),
      createTreeCluster(-15, -25, 6, 7, "birch"),
      createTreeCluster(25, 18, 8, 9, "oak"),
      createTreeCluster(5, 22, 4, 6, "pine"),
    ];

    const clusterTrees = clusters.flat();

    const scatteredTrees = Array.from({ length: 20 }).map((_, i) => {
      const angle = (i / 20) * Math.PI * 2;
      const distance = 15 + (i % 10) * 4;
      const offset = Math.sin(i * 7.5) * 5;

      const x = Math.cos(angle) * distance + offset;
      const z = Math.sin(angle) * distance + offset;

      const type = ["pine", "oak", "birch", "pine", "oak", "random"][i % 6];

      return { x, z, type };
    });

    return [...fixedTrees, ...clusterTrees, ...scatteredTrees];
  }, []);

  const benchPositions = useMemo(() => {
    return [
      { x: 8, z: 3, rotation: Math.PI * 0.25, type: "wooden" },
      { x: -8, z: 3, rotation: -Math.PI * 0.25, type: "stone" },
      { x: 3, z: 8, rotation: Math.PI * 0.75, type: "wooden" },
      { x: 3, z: -8, rotation: -Math.PI * 0.75, type: "stone" },
      { x: 15, z: 0, rotation: Math.PI * 0.5, type: "wooden" },
      { x: -15, z: 0, rotation: -Math.PI * 0.5, type: "stone" },
      { x: 0, z: 15, rotation: 0, type: "wooden" },
      { x: 0, z: -15, rotation: Math.PI, type: "stone" },
      { x: -22, z: -18, rotation: Math.PI * 0.25, type: "stone" },
      { x: 22, z: 22, rotation: -Math.PI * 0.75, type: "wooden" },
      { x: 18, z: 18, rotation: Math.PI * 0.25, type: "wooden" },
      { x: -18, z: -18, rotation: -Math.PI * 0.75, type: "stone" },
      { x: -18, z: 18, rotation: Math.PI * 0.75, type: "wooden" },
      { x: 18, z: -18, rotation: -Math.PI * 0.25, type: "stone" },
    ];
  }, []);

  useEffect(() => {
    console.log("🔧 Setting up improved park scene...");
    const container = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const fog = new THREE.FogExp2(0x87ceeb, 0.0025);
    scene.fog = fog;
    fogRef.current = fog;

    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(30, 40, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const basicGroundGeometry = new THREE.PlaneGeometry(200, 200);
    const basicGroundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a8c40,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const basicGround = new THREE.Mesh(
      basicGroundGeometry,
      basicGroundMaterial
    );
    basicGround.rotation.x = -Math.PI / 2;
    basicGround.position.y = 0;
    basicGround.receiveShadow = true;
    scene.add(basicGround);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffee, 1.0);
    sunLight.position.set(10, 20, 10);
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

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    try {
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
    } catch (e) {
      console.warn("Advanced renderer settings not supported", e);
    }

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controls.target.set(0, 0, 0);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.3;
    controls.update();
    orbitControlsRef.current = controls;

    const onKeyDown = (event) => {
      if (event.code === "KeyT") {
        timeSpeedRef.current = timeSpeedRef.current === 0.05 ? 0.5 : 0.05;
        setMessage(
          `Time speed: ${timeSpeedRef.current === 0.05 ? "Normal" : "Fast"}`
        );
        setTimeout(() => setMessage(null), 2000);
      } else if (event.code === "Space") {
        setAutoRotate((prev) => !prev);
        if (orbitControlsRef.current) {
          orbitControlsRef.current.autoRotate =
            !orbitControlsRef.current.autoRotate;
        }
        setMessage(`Camera rotation: ${!autoRotate ? "ON" : "OFF"}`);
        setTimeout(() => setMessage(null), 2000);

        event.preventDefault();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    const animate = (time) => {
      const delta = Math.min(0.1, clockRef.current.getDelta());

      timeOfDayRef.current =
        (timeOfDayRef.current + delta * timeSpeedRef.current) % 1;

      const hours = Math.floor(timeOfDayRef.current * 24);
      const minutes = Math.floor((timeOfDayRef.current * 24 * 60) % 60);
      const timeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;

      if (time % 500 < 16) {
        setTimeInfo(timeString);
      }

      if (orbitControlsRef.current) {
        orbitControlsRef.current.update();
      }

      updateDayNightCycle(timeOfDayRef.current);

      if (waterFeaturesRef.current && waterFeaturesRef.current.length > 0) {
        waterFeaturesRef.current.forEach((waterFeature) => {
          if (waterFeature && waterFeature.update) {
            waterFeature.update(time, timeOfDayRef.current);
          }
        });
      }

      if (wildlifeRef.current) {
        try {
          wildlifeRef.current.update(delta);
        } catch (error) {
          console.warn("Error updating wildlife:", error);
        }
      }

      rendererRef.current.render(scene, camera);

      animationRef.current = requestAnimationFrame(animate);
    };

    const updateDayNightCycle = (timeOfDay) => {
      if (lightsRef.current) {
        lightsRef.current.updateDayNightCycle(timeOfDay);
      } else {
        updateBasicLights(timeOfDay);
      }

      updateFog(timeOfDay);

      updateSkyColor(timeOfDay);
    };

    const updateBasicLights = (timeOfDay) => {
      const isDaytime = timeOfDay > 0.25 && timeOfDay < 0.75;
      const isSunrise = timeOfDay > 0.2 && timeOfDay < 0.3;
      const isSunset = timeOfDay > 0.7 && timeOfDay < 0.8;

      if (isDaytime) {
        ambientLight.intensity = 0.5;
        sunLight.intensity = 1.0;
      } else {
        ambientLight.intensity = 0.2;
        sunLight.intensity = 0.1;
      }

      const angle = timeOfDay * Math.PI * 2;
      const sunX = Math.cos(angle) * 100;
      const sunY = Math.sin(angle) * 100;
      const sunZ = Math.cos(angle) * 50;

      sunLight.position.set(sunX, Math.max(0, sunY), sunZ);
    };

    const updateFog = (timeOfDay) => {
      if (!fogRef.current) return;

      const isDaytime = timeOfDay > 0.25 && timeOfDay < 0.75;
      const isSunrise = timeOfDay > 0.2 && timeOfDay < 0.3;
      const isSunset = timeOfDay > 0.7 && timeOfDay < 0.8;

      if (isSunrise) {
        fogRef.current.color.setHex(0xffa366);
        fogRef.current.density = 0.003;
      } else if (isSunset) {
        fogRef.current.color.setHex(0xff7733);
        fogRef.current.density = 0.0035;
      } else if (isDaytime) {
        fogRef.current.color.setHex(0x87ceeb);
        fogRef.current.density = 0.0025;
      } else {
        fogRef.current.color.setHex(0x001133);
        fogRef.current.density = 0.004;
      }
    };

    const updateSkyColor = (timeOfDay) => {
      const isDaytime = timeOfDay > 0.25 && timeOfDay < 0.75;
      const isSunrise = timeOfDay > 0.2 && timeOfDay < 0.3;
      const isSunset = timeOfDay > 0.7 && timeOfDay < 0.8;

      if (isSunrise) {
        scene.background.setHex(0xffa366);
      } else if (isSunset) {
        scene.background.setHex(0xff7733);
      } else if (isDaytime) {
        scene.background.setHex(0x87ceeb);
      } else {
        scene.background.setHex(0x001133);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      console.log("🧹 Cleaning up improved park scene...");
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);

      cancelAnimationFrame(animationRef.current);

      scene.remove(ambientLight);
      scene.remove(sunLight);
      scene.remove(basicGround);
      basicGroundGeometry.dispose();
      basicGroundMaterial.dispose();

      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate]);

  useEffect(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  return (
    <div className="park-scene">
      <div className="scene-container" ref={mountRef} />

      {sceneRef.current && (
        <>
          <Ground scene={sceneRef.current} />
          <LightSetup
            scene={sceneRef.current}
            ref={(ref) => (lightsRef.current = ref)}
          />
          <Parkour scene={sceneRef.current} />

          <Ground scene={sceneRef.current} />

          {treePositions.map((pos, i) => (
            <Tree
              key={`tree-${i}`}
              scene={sceneRef.current}
              x={pos.x}
              z={pos.z}
              type={pos.type}
            />
          ))}

          <Water
            scene={sceneRef.current}
            width={15}
            height={15}
            position={{ x: -25, y: 0.02, z: -20 }}
            depth={0.4}
            waterType="lake"
            ref={(ref) => {
              if (ref) {
                waterFeaturesRef.current[0] = ref;
              }
            }}
          />

          <Water
            scene={sceneRef.current}
            width={20}
            height={10}
            position={{ x: 25, y: 0.02, z: 25 }}
            depth={0.3}
            waterType="lake"
            ref={(ref) => {
              if (ref) {
                waterFeaturesRef.current[1] = ref;
              }
            }}
          />

          <Water
            scene={sceneRef.current}
            width={6}
            height={6}
            position={{ x: 0, y: 0.02, z: 0 }}
            depth={0.5}
            waterType="lake"
            ref={(ref) => {
              if (ref) {
                waterFeaturesRef.current[2] = ref;
              }
            }}
          />

          {treePositions.map((pos, i) => (
            <Tree
              key={`tree-${i}`}
              scene={sceneRef.current}
              x={pos.x}
              z={pos.z}
              type={pos.type}
            />
          ))}

          {benchPositions.map((pos, i) => (
            <Bench
              key={`bench-${i}`}
              scene={sceneRef.current}
              x={pos.x}
              z={pos.z}
              rotation={pos.rotation}
              type={pos.type}
            />
          ))}

          <InteractiveObjects scene={sceneRef.current} />

          <Wildlife
            scene={sceneRef.current}
            ref={(ref) => (wildlifeRef.current = ref)}
          />
        </>
      )}

      <div className="stadium-view-info">
        <div className="time-display">
          <div
            className="time-icon"
            style={{
              backgroundColor:
                timeOfDayRef.current > 0.25 && timeOfDayRef.current < 0.75
                  ? "#ffcc33"
                  : "#3366cc",
            }}
          ></div>
          <div className="time-text">{timeInfo}</div>
        </div>
        <div className="controls-info">
          <div className="control-item">
            <span className="key">SPACE</span>
            <span className="desc">Rotation: {autoRotate ? "ON" : "OFF"}</span>
          </div>
          <div className="control-item">
            <span className="key">T</span>
            <span className="desc">
              Time Speed: {timeSpeedRef.current > 0.1 ? "Fast" : "Normal"}
            </span>
          </div>
          <div className="control-item">
            <span className="key">Mouse</span>
            <span className="desc">Orbit & Zoom</span>
          </div>
        </div>
      </div>

      {message && <div className="stadium-message">{message}</div>}
    </div>
  );
};

export default ParkScene;
