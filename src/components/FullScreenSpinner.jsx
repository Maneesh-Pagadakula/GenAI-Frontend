import React from "react";
import "./FullScreenSpinner.css";


const FullScreenSpinner = ({
  isVisible,
  message = "Processing...",
  progress = null,
  title = "Processing",
  subtitle = null,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fullscreen-spinner-overlay">
      <div className="fullscreen-spinner-container">
        <div className="spinner-animation">
          <div className="hourglass-spinner">
            <div className="hourglass-top"></div>
            <div className="hourglass-bottom"></div>
          </div>
        </div>
        <div className="spinner-content">
          <h3 className="spinner-title">{title}</h3>
          {subtitle && <p className="spinner-subtitle">{subtitle}</p>}
          <p className="spinner-message">{message}</p>
          {progress !== null && (
            <div className="progress-container">
              <div className="progress-bar-container">
                <div
                  className="jprogress-bar"
                  style={{ width: `${progress}%` }}
                  data-progress={progress}
                ></div>
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullScreenSpinner;
