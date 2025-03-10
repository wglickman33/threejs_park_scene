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
  const timeOfDayRef = useRef(0.3); // Store timeOfDay in a ref
  const [timeInfo, setTimeInfo] = useState("12:00");
  const [autoRotate, setAutoRotate] = useState(true);

  // Refs to store three.js objects
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const orbitControlsRef = useRef(null);
  const animationRef = useRef(null);
  const dayNightCycleRef = useRef(null);
  const lightsRef = useRef(null);
  const wildlifeRef = useRef(null);
  const fogRef = useRef(null);

  // Water features refs
  const waterFeaturesRef = useRef([]);

  // Time control
  const clockRef = useRef(new THREE.Clock());
  const timeSpeedRef = useRef(0.05); // Slower day/night cycle speed

  // Pre-calculate static tree positions using useMemo to prevent re-renders
  const treePositions = useMemo(() => {
    // Fixed tree positions for key landscape features
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

    // Create tree clusters for more natural grouping
    const createTreeCluster = (centerX, centerZ, radius, count, mainType) => {
      const cluster = [];
      for (let i = 0; i < count; i++) {
        // Use deterministic angle but random distance for natural look
        const angle = (i / count) * Math.PI * 2 + Math.cos(centerX + centerZ);
        const dist = (0.3 + Math.random() * 0.7) * radius;

        // Position within cluster
        const x = centerX + Math.cos(angle) * dist;
        const z = centerZ + Math.sin(angle) * dist;

        // Occasionally use a different tree type for variety
        const type =
          Math.random() < 0.8
            ? mainType
            : ["pine", "oak", "birch"][Math.floor(Math.random() * 3)];

        cluster.push({ x, z, type });
      }
      return cluster;
    };

    // Create several tree clusters
    const clusters = [
      createTreeCluster(-20, 15, 5, 8, "oak"),
      createTreeCluster(22, -20, 7, 10, "pine"),
      createTreeCluster(-15, -25, 6, 7, "birch"),
      createTreeCluster(25, 18, 8, 9, "oak"),
      createTreeCluster(5, 22, 4, 6, "pine"),
    ];

    // Flatten clusters into single array
    const clusterTrees = clusters.flat();

    // Additional scattered trees
    const scatteredTrees = Array.from({ length: 20 }).map((_, i) => {
      // Semi-random positions based on index
      const angle = (i / 20) * Math.PI * 2;
      const distance = 15 + (i % 10) * 4;
      const offset = Math.sin(i * 7.5) * 5;

      const x = Math.cos(angle) * distance + offset;
      const z = Math.sin(angle) * distance + offset;

      // Random tree type
      const type = ["pine", "oak", "birch", "pine", "oak", "random"][i % 6];

      return { x, z, type };
    });

    return [...fixedTrees, ...clusterTrees, ...scatteredTrees];
  }, []); // Empty dependency array means this only calculates once

  // Bench positions with improved placement
  const benchPositions = useMemo(() => {
    // Place benches strategically along paths and viewing areas
    return [
      // Central area benches
      { x: 8, z: 3, rotation: Math.PI * 0.25, type: "wooden" },
      { x: -8, z: 3, rotation: -Math.PI * 0.25, type: "stone" },
      { x: 3, z: 8, rotation: Math.PI * 0.75, type: "wooden" },
      { x: 3, z: -8, rotation: -Math.PI * 0.75, type: "stone" },

      // Path benches
      { x: 15, z: 0, rotation: Math.PI * 0.5, type: "wooden" },
      { x: -15, z: 0, rotation: -Math.PI * 0.5, type: "stone" },
      { x: 0, z: 15, rotation: 0, type: "wooden" },
      { x: 0, z: -15, rotation: Math.PI, type: "stone" },

      // Lake view benches
      { x: -22, z: -18, rotation: Math.PI * 0.25, type: "stone" }, // Pond view
      { x: 22, z: 22, rotation: -Math.PI * 0.75, type: "wooden" }, // Pond view

      // Additional benches at intersections
      { x: 18, z: 18, rotation: Math.PI * 0.25, type: "wooden" },
      { x: -18, z: -18, rotation: -Math.PI * 0.75, type: "stone" },
      { x: -18, z: 18, rotation: Math.PI * 0.75, type: "wooden" },
      { x: 18, z: -18, rotation: -Math.PI * 0.25, type: "stone" },
    ];
  }, []);

  useEffect(() => {
    console.log("🔧 Setting up improved park scene...");
    const container = mountRef.current;

    // Create scene with fog for depth
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background

    // Add fog for distance fade effect - adds depth to the scene
    const fog = new THREE.FogExp2(0x87ceeb, 0.0025);
    scene.fog = fog;
    fogRef.current = fog;

    sceneRef.current = scene;

    // Create perspective camera with better initial positioning
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Position camera at an angle for better initial view
    camera.position.set(30, 40, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create basic ground as placeholder until detailed ground loads
    const basicGroundGeometry = new THREE.PlaneGeometry(200, 200);
    const basicGroundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a8c40, // Rich green
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const basicGround = new THREE.Mesh(
      basicGroundGeometry,
      basicGroundMaterial
    );
    basicGround.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    basicGround.position.y = 0;
    basicGround.receiveShadow = true;
    scene.add(basicGround);

    // Add basic ambient light as placeholder until LightSetup loads
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Create sun directional light as placeholder
    const sunLight = new THREE.DirectionalLight(0xffffee, 1.0);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;

    // Configure shadow properties
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

    // Create renderer with improved visual quality
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Try to enable advanced rendering features if supported
    try {
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
    } catch (e) {
      console.warn("Advanced renderer settings not supported", e);
    }

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create orbit controls with improved settings
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Add smooth damping
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1; // Don't allow camera to go below ground
    controls.minDistance = 10; // Don't allow zooming too close
    controls.maxDistance = 200; // Don't allow zooming too far
    controls.target.set(0, 0, 0); // Look at park center
    controls.autoRotate = autoRotate; // Initial state matches component state
    controls.autoRotateSpeed = 0.2; // Slower rotation (degrees per second)
    controls.update();
    orbitControlsRef.current = controls;

    // Add key event listeners for time control and camera rotation
    const onKeyDown = (event) => {
      if (event.code === "KeyT") {
        // Toggle time speed
        timeSpeedRef.current = timeSpeedRef.current === 0.05 ? 0.5 : 0.05;
        setMessage(
          `Time speed: ${timeSpeedRef.current === 0.05 ? "Normal" : "Fast"}`
        );
        setTimeout(() => setMessage(null), 2000);
      } else if (event.code === "Space") {
        // Toggle auto-rotation
        setAutoRotate((prev) => !prev);
        if (orbitControlsRef.current) {
          orbitControlsRef.current.autoRotate =
            !orbitControlsRef.current.autoRotate;
        }
        setMessage(`Camera rotation: ${!autoRotate ? "ON" : "OFF"}`);
        setTimeout(() => setMessage(null), 2000);

        // Prevent default spacebar behavior (scrolling)
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    // Handle window resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    // Animation loop with improved visual effects
    const animate = (time) => {
      const delta = Math.min(0.1, clockRef.current.getDelta());

      // Update time of day for day/night cycle
      timeOfDayRef.current =
        (timeOfDayRef.current + delta * timeSpeedRef.current) % 1;

      // Format time for display
      const hours = Math.floor(timeOfDayRef.current * 24);
      const minutes = Math.floor((timeOfDayRef.current * 24 * 60) % 60);
      const timeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;

      // Update time info occasionally (not every frame)
      if (time % 500 < 16) {
        // Update roughly twice per second
        setTimeInfo(timeString);
      }

      // Update orbit controls
      if (orbitControlsRef.current) {
        orbitControlsRef.current.update();
      }

      // Update day/night cycle for all components
      updateDayNightCycle(timeOfDayRef.current);

      // Update water features animation
      if (waterFeaturesRef.current && waterFeaturesRef.current.length > 0) {
        waterFeaturesRef.current.forEach((waterFeature) => {
          if (waterFeature && waterFeature.update) {
            waterFeature.update(time, timeOfDayRef.current);
          }
        });
      }

      // Update wildlife animations
      if (wildlifeRef.current) {
        try {
          wildlifeRef.current.update(delta);
        } catch (error) {
          console.warn("Error updating wildlife:", error);
        }
      }

      // Render the scene
      rendererRef.current.render(scene, camera);

      // Continue animation loop
      animationRef.current = requestAnimationFrame(animate);
    };

    // Comprehensive day/night cycle update function
    const updateDayNightCycle = (timeOfDay) => {
      // Update light system through the LightSetup component if available
      if (lightsRef.current) {
        lightsRef.current.updateDayNightCycle(timeOfDay);
      } else {
        // Fallback for basic lights if LightSetup not yet initialized
        updateBasicLights(timeOfDay);
      }

      // Update fog color and density based on time of day
      updateFog(timeOfDay);

      // Update sky color based on time of day
      updateSkyColor(timeOfDay);
    };

    // Basic light update before LightSetup component is initialized
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

      // Calculate sun position
      const angle = timeOfDay * Math.PI * 2;
      const sunX = Math.cos(angle) * 100;
      const sunY = Math.sin(angle) * 100;
      const sunZ = Math.cos(angle) * 50;

      sunLight.position.set(sunX, Math.max(0, sunY), sunZ);
    };

    // Update fog based on time of day
    const updateFog = (timeOfDay) => {
      if (!fogRef.current) return;

      const isDaytime = timeOfDay > 0.25 && timeOfDay < 0.75;
      const isSunrise = timeOfDay > 0.2 && timeOfDay < 0.3;
      const isSunset = timeOfDay > 0.7 && timeOfDay < 0.8;

      if (isSunrise) {
        // Dawn fog - pinkish
        fogRef.current.color.setHex(0xffa366);
        fogRef.current.density = 0.003; // Thicker morning fog
      } else if (isSunset) {
        // Sunset fog - orange
        fogRef.current.color.setHex(0xff7733);
        fogRef.current.density = 0.0035;
      } else if (isDaytime) {
        // Day fog - light blue
        fogRef.current.color.setHex(0x87ceeb);
        fogRef.current.density = 0.0025;
      } else {
        // Night fog - deep blue
        fogRef.current.color.setHex(0x001133);
        fogRef.current.density = 0.004; // Thicker night fog
      }
    };

    // Update sky color based on time of day
    const updateSkyColor = (timeOfDay) => {
      const isDaytime = timeOfDay > 0.25 && timeOfDay < 0.75;
      const isSunrise = timeOfDay > 0.2 && timeOfDay < 0.3;
      const isSunset = timeOfDay > 0.7 && timeOfDay < 0.8;

      if (isSunrise) {
        // Dawn sky - pink/orange
        scene.background.setHex(0xffa366);
      } else if (isSunset) {
        // Sunset sky - deep orange
        scene.background.setHex(0xff7733);
      } else if (isDaytime) {
        // Day sky - blue
        scene.background.setHex(0x87ceeb);
      } else {
        // Night sky - deep blue
        scene.background.setHex(0x001133);
      }
    };

    // Start animation loop
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up improved park scene...");
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);

      cancelAnimationFrame(animationRef.current);

      // Cleanup basic elements
      scene.remove(ambientLight);
      scene.remove(sunLight);
      scene.remove(basicGround);
      basicGroundGeometry.dispose();
      basicGroundMaterial.dispose();

      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate]); // Only re-run if autoRotate changes

  // Update orbit controls when autoRotate state changes
  useEffect(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  return (
    <div className="park-scene">
      <div className="scene-container" ref={mountRef} />

      {/* Add component instances */}
      {sceneRef.current && (
        <>
          <Ground scene={sceneRef.current} />
          <LightSetup
            scene={sceneRef.current}
            ref={(ref) => (lightsRef.current = ref)}
          />
          <Parkour scene={sceneRef.current} />

          {/* Ground component should be rendered first so water sits on top properly */}
          <Ground scene={sceneRef.current} />

          {/* Trees - using pre-calculated positions - render before water */}
          {treePositions.map((pos, i) => (
            <Tree
              key={`tree-${i}`}
              scene={sceneRef.current}
              x={pos.x}
              z={pos.z}
              type={pos.type}
            />
          ))}

          {/* Water features - render after trees to prevent water from appearing under trees */}
          <Water
            scene={sceneRef.current}
            width={15}
            height={15}
            position={{ x: -25, y: 0.02, z: -20 }}
            depth={0.4}
            waterType="lake" // Changed to lake type for smoother water
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
            waterType="lake" // Changed to lake type for smoother water
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
            waterType="lake" // Changed to lake type for smoother water
            ref={(ref) => {
              if (ref) {
                waterFeaturesRef.current[2] = ref;
              }
            }}
          />

          {/* Trees - using pre-calculated positions */}
          {treePositions.map((pos, i) => (
            <Tree
              key={`tree-${i}`}
              scene={sceneRef.current}
              x={pos.x}
              z={pos.z}
              type={pos.type}
            />
          ))}

          {/* Benches - using pre-calculated positions */}
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

          {/* Interactive Objects */}
          <InteractiveObjects scene={sceneRef.current} />

          {/* Wildlife */}
          <Wildlife
            scene={sceneRef.current}
            ref={(ref) => (wildlifeRef.current = ref)}
          />
        </>
      )}

      {/* Time display overlay */}
      <div className="stadium-view-info">
        <div className="time-display">
          <div
            className="time-icon"
            style={{
              backgroundColor:
                timeOfDayRef.current > 0.25 && timeOfDayRef.current < 0.75
                  ? "#ffcc33" // Day
                  : "#3366cc", // Night
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
