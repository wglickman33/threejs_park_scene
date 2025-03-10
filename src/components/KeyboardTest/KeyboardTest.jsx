import React, { useState, useEffect } from "react";
import "./KeyboardTest.css";

const KeyboardTest = () => {
  const [keys, setKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    e: false,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      console.log("Key down:", e.code);

      // Update key state based on key code
      switch (e.code) {
        case "KeyW":
          setKeys((prev) => ({ ...prev, w: true }));
          break;
        case "KeyA":
          setKeys((prev) => ({ ...prev, a: true }));
          break;
        case "KeyS":
          setKeys((prev) => ({ ...prev, s: true }));
          break;
        case "KeyD":
          setKeys((prev) => ({ ...prev, d: true }));
          break;
        case "Space":
          setKeys((prev) => ({ ...prev, space: true }));
          break;
        case "KeyE":
          setKeys((prev) => ({ ...prev, e: true }));
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      console.log("Key up:", e.code);

      // Update key state based on key code
      switch (e.code) {
        case "KeyW":
          setKeys((prev) => ({ ...prev, w: false }));
          break;
        case "KeyA":
          setKeys((prev) => ({ ...prev, a: false }));
          break;
        case "KeyS":
          setKeys((prev) => ({ ...prev, s: false }));
          break;
        case "KeyD":
          setKeys((prev) => ({ ...prev, d: false }));
          break;
        case "Space":
          setKeys((prev) => ({ ...prev, space: false }));
          break;
        case "KeyE":
          setKeys((prev) => ({ ...prev, e: false }));
          break;
        default:
          break;
      }
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className="keyboard-test">
      <h2>Keyboard Test</h2>
      <p>Press keys to see if they register correctly:</p>

      <div className="key-grid">
        <div className={`key ${keys.w ? "active" : ""}`}>W</div>
        <div className="key-row">
          <div className={`key ${keys.a ? "active" : ""}`}>A</div>
          <div className={`key ${keys.s ? "active" : ""}`}>S</div>
          <div className={`key ${keys.d ? "active" : ""}`}>D</div>
        </div>
        <div className={`key space ${keys.space ? "active" : ""}`}>SPACE</div>
        <div className={`key ${keys.e ? "active" : ""}`}>E</div>
      </div>

      <div className="key-status">
        <h3>Key Status:</h3>
        <ul>
          <li>W: {keys.w ? "Pressed" : "Released"}</li>
          <li>A: {keys.a ? "Pressed" : "Released"}</li>
          <li>S: {keys.s ? "Pressed" : "Released"}</li>
          <li>D: {keys.d ? "Pressed" : "Released"}</li>
          <li>Space: {keys.space ? "Pressed" : "Released"}</li>
          <li>E: {keys.e ? "Pressed" : "Released"}</li>
        </ul>
      </div>
    </div>
  );
};

export default KeyboardTest;
