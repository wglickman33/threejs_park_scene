import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import "./Player.css";

const Player = ({ scene, camera, domElement, onControlsChange, playerRef }) => {
  const controlsRef = useRef(null);
  const velocityRef = useRef(new THREE.Vector3());
  const canJumpRef = useRef(true);
  const playerHeightRef = useRef(1.8);

  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });

  useEffect(() => {
    console.log("Player component mounted", { scene, camera, domElement });

    if (!scene || !camera || !domElement) {
      console.error("Missing required props", { scene, camera, domElement });
      return;
    }

    const controls = new PointerLockControls(camera, domElement);
    console.log("PointerLockControls created", controls);
    controlsRef.current = controls;
    camera.position.y = playerHeightRef.current;

    const onKeyDown = (event) => {
      console.log("Player key down:", event.code);

      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          keysRef.current.forward = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          keysRef.current.left = true;
          break;
        case "ArrowDown":
        case "KeyS":
          keysRef.current.backward = true;
          break;
        case "ArrowRight":
        case "KeyD":
          keysRef.current.right = true;
          break;
        case "Space":
          keysRef.current.jump = true;
          if (canJumpRef.current) {
            velocityRef.current.y = 6;
            canJumpRef.current = false;
          }
          break;
      }
    };

    const onKeyUp = (event) => {
      console.log("Player key up:", event.code);

      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          keysRef.current.forward = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          keysRef.current.left = false;
          break;
        case "ArrowDown":
        case "KeyS":
          keysRef.current.backward = false;
          break;
        case "ArrowRight":
        case "KeyD":
          keysRef.current.right = false;
          break;
        case "Space":
          keysRef.current.jump = false;
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    const onLockChange = () => {
      console.log("Lock change event", document.pointerLockElement);

      if (document.pointerLockElement === domElement) {
        console.log("Controls enabled");
        controls.enabled = true;
        if (onControlsChange) onControlsChange(true);
      } else {
        console.log("Controls disabled");
        controls.enabled = false;
        if (onControlsChange) onControlsChange(false);
      }
    };

    document.addEventListener("pointerlockchange", onLockChange);

    return () => {
      console.log("Player component unmounting");
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("pointerlockchange", onLockChange);
    };
  }, [scene, camera, domElement, onControlsChange]);

  React.useImperativeHandle(
    playerRef,
    () => ({
      lock: () => {
        console.log("Player: lock function called");
        if (controlsRef.current) {
          console.log("Locking pointer controls");
          controlsRef.current.lock();
        } else {
          console.error("Controls ref is not available");
        }
      },

      unlock: () => {
        console.log("Player: unlock function called");
        if (controlsRef.current) {
          controlsRef.current.unlock();
        }
      },

      update: (delta) => {
        if (!controlsRef.current || !controlsRef.current.enabled) return;

        const keys = keysRef.current;

        console.log("Player update - Keys:", {
          forward: keys.forward,
          backward: keys.backward,
          left: keys.left,
          right: keys.right,
          jump: keys.jump,
        });

        velocityRef.current.y -= 9.8 * delta;

        if (keys.forward || keys.backward || keys.left || keys.right) {
          console.log("Movement detected");

          const moveDirection = new THREE.Vector3(0, 0, 0);

          if (keys.forward || keys.backward) {
            const forwardVector = new THREE.Vector3(0, 0, -1);
            forwardVector.applyQuaternion(camera.quaternion);
            forwardVector.y = 0;
            forwardVector.normalize();

            if (keys.forward) {
              moveDirection.add(forwardVector.clone().multiplyScalar(1));
            }
            if (keys.backward) {
              moveDirection.add(forwardVector.clone().multiplyScalar(-1));
            }
          }

          if (keys.left || keys.right) {
            const rightVector = new THREE.Vector3(1, 0, 0);
            rightVector.applyQuaternion(camera.quaternion);
            rightVector.y = 0;
            rightVector.normalize();

            if (keys.right) {
              moveDirection.add(rightVector.clone().multiplyScalar(1));
            }
            if (keys.left) {
              moveDirection.add(rightVector.clone().multiplyScalar(-1));
            }
          }

          if (moveDirection.length() > 0) {
            moveDirection.normalize();
            const moveSpeed = 5.0 * delta;

            camera.position.addScaledVector(moveDirection, moveSpeed);
            console.log(
              "Applied movement:",
              moveDirection,
              "Position:",
              camera.position
            );
          }
        }

        camera.position.y += velocityRef.current.y * delta;

        if (camera.position.y < playerHeightRef.current) {
          velocityRef.current.y = 0;
          camera.position.y = playerHeightRef.current;
          canJumpRef.current = true;
        }
      },
    }),
    [camera]
  );

  return null;
};

export default Player;
