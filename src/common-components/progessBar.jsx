import React, { useEffect, useRef } from "react";
export default function ProgressBar({ progressBar, progressMessage }) {
  const progressContainerRef = useRef(null);

  // This useEffect ensures that the progress bar displays correctly
  useEffect(() => {
    if (progressContainerRef.current) {
      // Get the actual progress bar element (the inner colored part)
      const progressElement =
        progressContainerRef.current.querySelector(".progress-bar");

      if (progressElement) {
        // Set a custom property to ensure width is correctly applied
        progressElement.style.setProperty("--progress-width", progressBar);

        // Force a reflow to ensure the browser recalculates and applies the width
        void progressElement.offsetWidth;
      }

      // Add data-progress attribute to the span for the completion icon
      const progressSpan = progressContainerRef.current.querySelector(
        ".d-flex.just-space span"
      );
      if (progressSpan) {
        progressSpan.setAttribute("data-progress", progressBar);
      }
    }
  }, [progressBar]); // Re-run when progressBar changes

  return (
    <div className="progress-bar" ref={progressContainerRef}>
      <div className="d-flex just-space">
        <span>
          {progressBar} - {progressMessage}
        </span>
      </div>
      <div className="progress">
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow="70"
          aria-valuemin="0"
          aria-valuemax="100"
          style={{ width: progressBar }}
        ></div>
      </div>
    </div>
  );
}
