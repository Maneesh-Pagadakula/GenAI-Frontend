import React, { useState } from "react";
import "./RequirementsList.css";

const RequirementsList = ({
  coverageData,
  extractedRequirements = [],
  onRegenerateForMissed,
  isVisible = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible || !coverageData?.detailed_analysis) return null;

  const {
    detailed_analysis,
    coverage_percentage,
    covered_requirements,
    total_requirements,
  } = coverageData;
  const missedRequirements = detailed_analysis.filter((item) => !item.covered);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleRegenerateForMissed = () => {
    if (onRegenerateForMissed && missedRequirements.length > 0) {
      const missedText = missedRequirements
        .map((req) => req.requirement)
        .join("\n");
      onRegenerateForMissed(missedText);
    }
  };

  return (
    <div className="requirements-list-container">
      <div className="requirements-header" onClick={toggleExpanded}>
        <div className="requirements-title">
          <h3>Requirements Coverage Details</h3>
          <span className="requirements-summary">
            {covered_requirements}/{total_requirements} Requirements Covered (
            {coverage_percentage}%)
          </span>
        </div>
        <div className="requirements-actions">
          {missedRequirements.length > 0 && (
            <button
              className="regenerate-missed-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRegenerateForMissed();
              }}
              title="Generate test cases for missed requirements"
            >
              Cover Missed ({missedRequirements.length})
            </button>
          )}
          <button className={`expand-btn ${isExpanded ? "expanded" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="requirements-content">
          <div className="requirements-stats">
            <div className="stat-card covered">
              <div className="stat-number">{covered_requirements}</div>
              <div className="stat-label">Covered</div>
            </div>
            <div className="stat-card missed">
              <div className="stat-number">{missedRequirements.length}</div>
              <div className="stat-label">Missed</div>
            </div>
            <div className="stat-card total">
              <div className="stat-number">{total_requirements}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>

          {missedRequirements.length > 0 && (
            <div className="missed-requirements-section">
              <h4 className="section-title missed-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Missed Requirements ({missedRequirements.length})
              </h4>
              <div className="requirements-grid">
                {missedRequirements.map((item, index) => (
                  <div key={index} className="requirement-item missed">
                    <div className="requirement-status">
                      <span className="status-indicator missed"></span>
                      <span className="status-text">Not Covered</span>
                    </div>
                    <div className="requirement-text">{item.requirement}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="covered-requirements-section">
            <h4 className="section-title covered-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Covered Requirements ({covered_requirements})
            </h4>
            <div className="requirements-grid">
              {detailed_analysis
                .filter((item) => item.covered)
                .map((item, index) => (
                  <div key={index} className="requirement-item covered">
                    <div className="requirement-status">
                      <span className="status-indicator covered"></span>
                      <span className="status-text">Covered</span>
                    </div>
                    <div className="requirement-text">{item.requirement}</div>
                    {item.covering_test_cases &&
                      item.covering_test_cases.length > 0 && (
                        <div className="covering-test-cases">
                          <span className="covering-label">Covered by:</span>
                          <div className="test-case-tags">
                            {item.covering_test_cases.map((tcId, tcIndex) => (
                              <span key={tcIndex} className="test-case-tag">
                                {tcId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementsList;
