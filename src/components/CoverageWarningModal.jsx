import React from "react";
import "./CoverageWarningModal.css";

const CoverageWarningModal = ({
  isOpen,
  onClose,
  onProceed,
  coverageData,
  worthinessCheck,
  warningMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="coverage-modal-overlay">
      <div className="coverage-modal">
        <div className="coverage-modal-header">
          <div className="coverage-warning-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3>Incomplete Requirement Coverage</h3>
        </div>

        <div className="coverage-modal-content">
          <div className="coverage-status-summary">
            <div
              className={`coverage-badge ${coverageData?.coverage_percentage >= 100 ? "complete" : "incomplete"}`}
            >
              <span>{coverageData?.coverage_percentage}% Complete</span>
            </div>
            <p className="coverage-summary">
              {coverageData?.coverage_percentage >= 100
                ? `All ${coverageData?.total_requirements} requirements are covered by existing test cases.`
                : `${coverageData?.covered_requirements} of ${coverageData?.total_requirements} requirements are covered. ${coverageData?.total_requirements - coverageData?.covered_requirements} requirements still need coverage.`}
            </p>
          </div>

          <div className="warning-message">
            <h4>Analysis:</h4>
            <p>{worthinessCheck?.reason}</p>
            {worthinessCheck?.suggestion && (
              <div className="suggestion">
                <strong>Suggestion:</strong> {worthinessCheck.suggestion}
              </div>
            )}
          </div>

          <div className="coverage-actions">
            <p className="action-prompt">
              {coverageData?.coverage_percentage >= 100
                ? "Would you still like to proceed with adding more test cases?"
                : "Would you like to proceed with your request or focus on covering the missing requirements first?"}
            </p>
            <div className="action-buttons">
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={onProceed}>
                Yes, Add Anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverageWarningModal;
