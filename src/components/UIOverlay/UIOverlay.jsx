import { useState, useEffect } from "react";
import "./UIOverlay.css";

const UIOverlay = ({
  controlsEnabled = false,
  interactionMessage = null,
  timeOfDay = 0.5,
  onStartClick,
  onTimeSpeedChange,
}) => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(1.0);

  useEffect(() => {
    // Hide instructions after some time
    if (controlsEnabled) {
      const timer = setTimeout(() => {
        setShowInstructions(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [controlsEnabled]);

  // Alternative direct method to request pointer lock
  const requestPointerLock = () => {
    console.log("Directly requesting pointer lock on document.body");
    const element = document.body;

    if (element.requestPointerLock) {
      element.requestPointerLock();
    } else {
      console.error("PointerLock API not supported");
    }

    // Also call the regular handler
    if (onStartClick) {
      onStartClick();
    }
  };

  const handleTimeSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value);
    setTimeSpeed(newSpeed);
    if (onTimeSpeedChange) onTimeSpeedChange(newSpeed);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // Format time of day as clock time
  const formatTimeOfDay = (time) => {
    const hours = Math.floor((time * 24) % 24);
    const minutes = Math.floor((time * 24 * 60) % 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  };

  return (
    <div className="ui-overlay">
      {!controlsEnabled && (
        <div className="start-screen">
          <h1>Interactive 3D Park</h1>
          <p>
            Experience a fully interactive 3D environment with day-night cycles
          </p>
          <button className="start-button" onClick={requestPointerLock}>
            Enter Park
          </button>
          <p className="instruction-note">
            (Note: Click and move your mouse to look around. Press ESC to
            release mouse control)
          </p>
          <button className="alternative-button" onClick={requestPointerLock}>
            Try Alternative Entry
          </button>
        </div>
      )}

      {controlsEnabled && showInstructions && (
        <div className="instructions">
          <p>
            Use <strong>WASD</strong> to move
          </p>
          <p>
            Press <strong>SPACE</strong> to jump
          </p>
          <p>
            Use <strong>E</strong> to interact with objects
          </p>
          <p>
            Press <strong>ESC</strong> to release mouse
          </p>
        </div>
      )}

      {controlsEnabled && interactionMessage && (
        <div className="interaction-message">{interactionMessage}</div>
      )}

      {controlsEnabled && (
        <div className="hud">
          <div className="time-display">Time: {formatTimeOfDay(timeOfDay)}</div>
          <div className="controls-toggle" onClick={toggleControls}>
            ⚙️ Settings
          </div>
        </div>
      )}

      {controlsEnabled && showControls && (
        <div className="controls-panel">
          <h3>Settings</h3>
          <div className="control-group">
            <label htmlFor="time-speed">Time Speed:</label>
            <input
              id="time-speed"
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={timeSpeed}
              onChange={handleTimeSpeedChange}
            />
            <span>{timeSpeed.toFixed(1)}x</span>
          </div>
          <button onClick={toggleControls}>Close</button>
        </div>
      )}

      {controlsEnabled && <div className="crosshair"></div>}
    </div>
  );
};

export default UIOverlay;
