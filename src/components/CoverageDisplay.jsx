import React from "react";
import "./CoverageDisplay.css";

const CoverageDisplay = ({ coverageData, showDetails = false }) => {
  if (!coverageData) return null;

  const { coverage_percentage, covered_requirements, total_requirements } =
    coverageData;

  const getStatusColor = (percentage) => {
    if (percentage >= 100) return "#10B981"; // Green
    if (percentage >= 80) return "#F59E0B"; // Yellow
    if (percentage >= 60) return "#F97316"; // Orange
    return "#EF4444"; // Red
  };

  const getStatusText = (percentage) => {
    if (percentage >= 100) return "Complete";
    if (percentage >= 80) return "Good";
    if (percentage >= 60) return "Fair";
    return "Needs Work";
  };

  return (
    <div className="coverage-display">
      <div className="coverage-header">
        <h3>Requirement Coverage</h3>
        <span
          className={`coverage-status ${getStatusText(coverage_percentage).toLowerCase()}`}
        >
          {getStatusText(coverage_percentage)}
        </span>
      </div>

      <div className="coverage-metrics">
        <div className="coverage-circle">
          <svg
            width="80"
            height="80"
            viewBox="0 0 36 36"
            className="circular-chart"
          >
            <path
              className="circle-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="circle"
              strokeDasharray={`${coverage_percentage}, 100`}
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              style={{ stroke: getStatusColor(coverage_percentage) }}
            />
          </svg>
          <div className="percentage-text">
            <span className="percentage-number">{coverage_percentage}</span>
            <span className="percentage-symbol">%</span>
          </div>
        </div>

        <div className="coverage-details">
          <div className="coverage-stat">
            <span className="stat-label">Requirements Covered</span>
            <span className="stat-value">
              {covered_requirements} / {total_requirements}
            </span>
          </div>

          {showDetails && (
            <div className="coverage-breakdown">
              <div className="breakdown-item covered">
                <div
                  className="breakdown-bar"
                  style={{
                    width: `${(covered_requirements / total_requirements) * 100}%`,
                  }}
                ></div>
                <span>{covered_requirements} Covered</span>
              </div>
              <div className="breakdown-item uncovered">
                <div
                  className="breakdown-bar"
                  style={{
                    width: `${((total_requirements - covered_requirements) / total_requirements) * 100}%`,
                  }}
                ></div>
                <span>
                  {total_requirements - covered_requirements} Remaining
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoverageDisplay;
