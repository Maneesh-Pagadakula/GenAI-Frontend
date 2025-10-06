import React, { useMemo, useRef, useState } from "react";
import axios from "axios";
import StyledMarkdown from "./response-styling/styledMarkdown";
import successIcon from "../../assets/images/success-close.svg";

function TestCaseAnalysisModal({ onClose }) {
  const emailRef = useRef(localStorage.getItem("Email"));
  const backend_baseURL = useMemo(
    () => process.env.REACT_APP_BACKEND_BASE_URL,
    []
  );

  const [cloudId, setCloudId] = useState("");
  const [epicKey, setEpicKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const analyze = async () => {
    setLoading(true);
    setError("");
    setShowErrorToast(false);
    try {
      const url = `${backend_baseURL}/testcase-analysis/analyze?EmailId=${encodeURIComponent(
        emailRef.current || ""
      )}${epicKey ? `&epic_key=${encodeURIComponent(epicKey)}` : ""}${
        cloudId ? `&cloud_id=${encodeURIComponent(cloudId)}` : ""
      }`;
      const res = await axios.get(url, { withCredentials: true });
      if (res.status === 200 && res.data?.analysis) {
        setAnalysis(res.data.analysis);
      } else {
        setError("No analysis returned");
        setShowErrorToast(true);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Request failed");
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  };

  const download = async (type) => {
    try {
      const endpoint =
        type === "pdf"
          ? `${backend_baseURL}/testcase-analysis/download/pdf?EmailId=${encodeURIComponent(
              emailRef.current || ""
            )}`
          : `${backend_baseURL}/testcase-analysis/download/excel?EmailId=${encodeURIComponent(
              emailRef.current || ""
            )}`;
      const resp = await axios.get(endpoint, {
        responseType: "blob",
        withCredentials: true,
      });
      if (resp.status === 200) {
        const blob = new Blob([resp.data], {
          type:
            type === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          type === "pdf" ? "Test_Case_Analysis.pdf" : "Test_Case_Analysis.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Download failed");
      setShowErrorToast(true);
    }
  };

  return (
    <div>
      <div className="toaster-container" style={{ width: "100%" }}>
        {showErrorToast && (
          <div className="alert alert-danger dashboard-toster" style={{ justifyContent: "center" }}>
            <span className="vert-mdle">
              <strong>Error:</strong> {error}
            </span>
            <img
              className="close-icon-red"
              src={successIcon}
              alt="Close"
              onClick={() => setShowErrorToast(false)}
            />
          </div>
        )}
      </div>

      <div className="popup-backdrop"></div>
      <div className="cust-modal fileupload">
        <div className="cust-modal-dialog multi-select-dd-pop">
          <div className="cust-modal-content">
            <div className="cust-modal-header">
              <h6 className="cust-modal-title">Test Case Analysis</h6>
            </div>
            <div className="no-border">
              <div className="form-group">
                <label>Cloud ID (Workspace)</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Enter Cloud ID (optional if using sample)"
                  value={cloudId}
                  onChange={(e) => setCloudId(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Epic Key or User Story Key</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g., CCASS-17"
                  value={epicKey}
                  onChange={(e) => setEpicKey(e.target.value)}
                />
              </div>
              <div className="text-right py-2 d-flex justify-content-between align-items-center">
                <div>
                  <button className="btn btn-secondary me-2" onClick={onClose} disabled={loading}>
                    Close
                  </button>
                  <button className="btn btn-primary" onClick={analyze} disabled={loading}>
                    {loading ? <span>Analyzing</span> : "Analyze"}
                  </button>
                </div>
                {analysis && (
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary" onClick={() => download("pdf")}>Export as PDF</button>
                    <button className="btn btn-primary" onClick={() => download("excel")}>Export as Excel</button>
                  </div>
                )}
              </div>

              {analysis && (
                <div style={{ maxHeight: "60vh", overflow: "auto", borderTop: "1px solid #eee", paddingTop: 10 }}>
                  <StyledMarkdown content={analysis} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestCaseAnalysisModal;
