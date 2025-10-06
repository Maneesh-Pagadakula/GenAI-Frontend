import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
//import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import successIcon from "../../assets/images/success-close.svg";
import "../dashboard/jira-progress-bar.css";
import { JiraTokenService } from "./jira-token-data";

function JiraAnalysisDropdown({ onClose, onSuccess }) {
  const emailRef = useRef(localStorage.getItem("Email"));
  const backend_baseURL = useMemo(
    () => process.env.REACT_APP_BACKEND_BASE_URL,
    []
  );

  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);

  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEpic, setSelectedEpic] = useState("");

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingEpics, setLoadingEpics] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [error, setError] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [analysis, setAnalysis] = useState("");

  // Auth check
  useEffect(() => {
    if (!JiraTokenService.hasValidToken()) {
      setError("Jira access token not found or expired. Please reconnect to Jira.");
      setShowErrorToast(true);
      return;
    }
    axios.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${JiraTokenService.getToken()}`;
  }, []);

  const handleApiError = useCallback(
    (err) => {
      console.error("API Error:", err);
      if (err.response && [401, 403].includes(err.response.status)) {
        setError("Jira authorization expired. Please reconnect to Jira.");
        setShowErrorToast(true);
        JiraTokenService.clearToken();
        if (onClose) setTimeout(onClose, 3000);
      } else {
        setError(err.message || "An error occurred with the Jira API");
        setShowErrorToast(true);
      }
    },
    [onClose]
  );

  const fetchWorkspaces = useCallback(async () => {
    setLoadingWorkspaces(true);
    try {
      const res = await axios.get(
        `${backend_baseURL}/jira/workspaces?EmailId=${emailRef.current}`,
        { withCredentials: true }
      );
      setWorkspaces(res.data?.workspaces || []);
      setError("");
      setShowErrorToast(false);
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoadingWorkspaces(false);
    }
  }, [backend_baseURL, handleApiError]);

  const fetchProjects = useCallback(async () => {
    if (!selectedWorkspace) return;
    setLoadingProjects(true);
    try {
      const res = await axios.get(
        `${backend_baseURL}/jira/projects?EmailId=${emailRef.current}&cloud_id=${selectedWorkspace}`,
        { withCredentials: true }
      );
      setProjects(res.data?.projects || []);
      setError("");
      setShowErrorToast(false);
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoadingProjects(false);
    }
  }, [backend_baseURL, selectedWorkspace, handleApiError]);

  const fetchEpics = useCallback(async () => {
    if (!selectedProject) return;
    setLoadingEpics(true);
    try {
      const res = await axios.get(
        `${backend_baseURL}/jira/epics?EmailId=${emailRef.current}&project_id=${selectedProject}&cloud_id=${selectedWorkspace}`,
        { withCredentials: true }
      );
      setEpics(res.data?.epics || []);
      setError("");
      setShowErrorToast(false);
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoadingEpics(false);
    }
  }, [backend_baseURL, selectedProject, selectedWorkspace, handleApiError]);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { fetchEpics(); }, [fetchEpics]);

  const handleWorkspaceChange = (e) => {
    const val = e.target.value;
    setSelectedWorkspace(val);
    setSelectedProject("");
    setSelectedEpic("");
    setProjects([]);
    setEpics([]);
    setAnalysis("");
  };

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    setSelectedEpic("");
    setEpics([]);
    setAnalysis("");
  };

  const handleEpicChange = (e) => {
    setSelectedEpic(e.target.value);
    setAnalysis("");
  };

  const analyze = async () => {
    if (!selectedWorkspace || !selectedProject || !selectedEpic) {
      setError("Please select Workspace, Project, and Epic.");
      setShowErrorToast(true);
      return;
    }
    setLoadingAnalysis(true);
    setError("");
    setShowErrorToast(false);
    try {
      const url = `${backend_baseURL}/testcase-analysis/analyze?EmailId=${encodeURIComponent(
        emailRef.current || ""
      )}&issue_key=${encodeURIComponent(selectedEpic)}&cloud_id=${encodeURIComponent(
        selectedWorkspace
      )}`;
      const res = await axios.get(url, { withCredentials: true });
      if (res.status === 200 && res.data?.analysis) {
        if (onSuccess) {
          onSuccess(res.data.analysis);
        }
      } else {
        setError("No analysis returned");
        setShowErrorToast(true);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Request failed");
      setShowErrorToast(true);
    } finally {
      setLoadingAnalysis(false);
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
              <h6 className="cust-modal-title">Jira Test Case Analysis</h6>
            </div>
            <div className="no-border">
              <div className="form-group">
                <label>Workspace</label>
                {loadingWorkspaces ? (
                  <p>Loading</p>
                ) : (
                  <select
                    className="form-select"
                    value={selectedWorkspace}
                    onChange={handleWorkspaceChange}
                  >
                    <option value="">Select Workspace</option>
                    {workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedWorkspace && (
                <div className="form-group">
                  <label>Project</label>
                  {loadingProjects ? (
                    <p>Loading Projects...</p>
                  ) : (
                    <select
                      className="form-select"
                      value={selectedProject}
                      onChange={handleProjectChange}
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {selectedProject && (
                <div className="form-group">
                  <label>Epic</label>
                  {loadingEpics ? (
                    <p>Loading Epics...</p>
                  ) : (
                    <select
                      className="form-select"
                      value={selectedEpic}
                      onChange={handleEpicChange}
                    >
                      <option value="">Select Epic</option>
                      {epics.map((epic) => (
                        <option key={epic.id} value={epic.key}>
                          {epic.summary} ({epic.key})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="text-right py-2 d-flex justify-content-between align-items-center">
                <div>
                  <button className="btn btn-secondary me-2" onClick={onClose} disabled={loadingAnalysis}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={analyze} disabled={loadingAnalysis}>
                    {loadingAnalysis ? <span>Analyzing</span> : "Analyze"}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JiraAnalysisDropdown;
