import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useUpload } from "./context/uploadContext";
import "../../common-components/globalStyles.css";
import successIcon from "../../assets/images/success-close.svg";
import "../dashboard/jira-progress-bar.css";
import { JiraTokenService } from "../../features/dashboard/jira-token-data";

function JiraDropdown({ createMode = "test-cases", onClose, onSuccess }) {
  const progressContainerRef = useRef(null);
  const { setUploadFlag } = useUpload();
  const [type, setType] = useState("Manual Test Cases");

  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [issues, setIssues] = useState([]); // Combined list of tasks, stories, and bugs

  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEpic, setSelectedEpic] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(""); // Single dropdown for issues

  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingEpics, setLoadingEpics] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false);

  const backend_baseURL = process.env.REACT_APP_BACKEND_BASE_URL;
  const [progress, setProgress] = useState(null); // Progress for loader
  const [progressMessage, setProgressMessage] = useState(""); // New State for messages

  const [epicInput, setEpicInput] = useState("");
  const [userStoryInput, setUserStoryInput] = useState("");

  const [error, setError] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);

  const [key, setKey] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [epicName, setEpicName] = useState("");
  const [userStoryName, setUserStoryName] = useState("");

  // Add token state management
  const [token, setToken] = useState({
    expiring: false,
    expiryTimer: null,
    key: "",
  });

  const isFeatureMode = String(createMode).toLowerCase() === "feature";
  const dialogTitle = isFeatureMode
    ? "Generate Feature Files & User Stories"
    : "Generate Test Cases";

  // This useEffect enhances the progress bar appearance and behavior
  useEffect(() => {
    if (progressContainerRef.current && progress !== null) {
      // Get the actual progress bar element
      const progressBarElement =
        progressContainerRef.current.querySelector(".jira-progress-bar");

      if (progressBarElement) {
        // Format progress value as percentage string
        const progressPercentage = `${progress}%`;

        // Set custom property to ensure width is correctly applied
        progressBarElement.style.setProperty(
          "--progress-width",
          progressPercentage
        );

        // Add data attribute for CSS selectors
        progressBarElement.setAttribute("data-progress", progress);

        // Force a reflow to ensure the browser recalculates and applies the width
        void progressBarElement.offsetWidth;
      }

      // Add completion indicator when at 100%
      const messageElement =
        progressContainerRef.current.querySelector(".progress-message");
      if (messageElement && progress) {
        const isComplete = progress >= 100;
        messageElement.setAttribute("data-complete", isComplete);
      }
    }
  }, [progress, progressMessage]); // Re-run when progress or message changes

  // Token validation and setup
  useEffect(() => {
    // Clean up function for timers
    return () => {
      if (token.expiryTimer) {
        clearTimeout(token.expiryTimer);
      }
    };
  }, [token.expiryTimer]);

  useEffect(() => {
    // Check token validity
    if (!JiraTokenService.hasValidToken()) {
      setError(
        "Jira access token not found or expired. Please reconnect to Jira."
      );
      setShowErrorToast(true);
      return;
    }

    // Set token in axios headers
    const accessToken = JiraTokenService.getToken();
    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

    // Check token expiry
    const tokenExpiry = localStorage.getItem("jira_token_expiry");
    if (tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry);
      const currentTime = new Date().getTime();
      const timeUntilExpiry = expiryTime - currentTime;

      // Show warning if token expires in less than 5 minutes
      const warningThreshold = 5 * 60 * 1000;
      if (timeUntilExpiry < warningThreshold && timeUntilExpiry > 0) {
        setToken((prev) => ({ ...prev, expiring: true }));

        // Set timer for warning
        const timer = setTimeout(() => {
          setError(
            "Your Jira session will expire soon. Please complete your work."
          );
          setShowErrorToast(true);
        }, Math.max(0, timeUntilExpiry - warningThreshold));

        setToken((prev) => ({ ...prev, expiryTimer: timer }));
      }
    }
  }, []);

  // Error handling utility
  const handleApiError = useCallback(
    (error) => {
      console.error("API Error:", error);

      // Check for auth errors
      if (error.response && [401, 403].includes(error.response.status)) {
        setError("Jira authorization expired. Please reconnect to Jira.");
        setShowErrorToast(true);
        JiraTokenService.clearToken();

        // Close dialog after delay
        if (typeof onClose === "function") {
          setTimeout(onClose, 3000);
        }
      } else {
        setError(error.message || "An error occurred with the Jira API");
        setShowErrorToast(true);
      }
    },
    [onClose]
  );

  // API request functions with useCallback
  const fetchWorkspacesCallback = useCallback(async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem("Email");
      const response = await axios.get(
        backend_baseURL + `/jira/workspaces?EmailId=${email}`,
        { withCredentials: true }
      );
      setWorkspaces(response.data?.workspaces || []);
      setError("");
      setShowErrorToast(false);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [backend_baseURL, handleApiError]);

  const fetchProjectsCallback = useCallback(async () => {
    if (!selectedWorkspace) return;
    setLoadingProjects(true);
    try {
      const email = localStorage.getItem("Email");
      const response = await axios.get(
        backend_baseURL +
          `/jira/projects?EmailId=${email}&cloud_id=${selectedWorkspace}`,
        { withCredentials: true }
      );
      setProjects(response.data?.projects || []);
      setError("");
      setShowErrorToast(false);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingProjects(false);
    }
  }, [backend_baseURL, selectedWorkspace, handleApiError]);

  const fetchEpicsCallback = useCallback(async () => {
    if (!selectedProject) return;
    setLoadingEpics(true);
    try {
      const email = localStorage.getItem("Email");
      const response = await axios.get(
        backend_baseURL +
          `/jira/epics?EmailId=${email}&project_id=${selectedProject}&cloud_id=${workspaceId}`,
        { withCredentials: true }
      );
      setEpics(response.data?.epics || []);
      setError("");
      setShowErrorToast(false);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingEpics(false);
    }
  }, [backend_baseURL, selectedProject, workspaceId, handleApiError]);

  const fetchIssuesCallback = useCallback(async () => {
    if (!selectedEpic || selectedEpic === "all") return;
    setLoadingIssues(true);
    try {
      const email = localStorage.getItem("Email");
      const response = await axios.get(
        backend_baseURL +
          `/jira/issues?EmailId=${email}&epic_key=${selectedEpic}&cloud_id=${workspaceId}`,
        { withCredentials: true }
      );
      const allIssues = response.data?.issues || [];
      setIssues(allIssues);
      setError("");
      setShowErrorToast(false);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoadingIssues(false);
    }
  }, [backend_baseURL, selectedEpic, workspaceId, handleApiError]);

  // useEffects with optimized dependencies
  useEffect(() => {
    fetchWorkspacesCallback();
  }, [fetchWorkspacesCallback]);

  useEffect(() => {
    fetchProjectsCallback();
  }, [fetchProjectsCallback]);

  useEffect(() => {
    fetchEpicsCallback();
  }, [fetchEpicsCallback]);

  useEffect(() => {
    fetchIssuesCallback();
  }, [fetchIssuesCallback]);

  const handleWorkspaceChange = (e) => {
    setWorkspaceId(e.target.value);
    setSelectedWorkspace(e.target.value);
    setSelectedProject("");
    setSelectedEpic("");
    setSelectedIssue("");
    setProjects([]);
    setEpics([]);
    setIssues([]);
  };

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    setSelectedEpic("");
    setSelectedIssue("");
    setEpics([]);
    setIssues([]);
  };

  const handleEpicChange = async (e) => {
    const selectedEpicKey = e.target.value;
    setSelectedEpic(selectedEpicKey);
    setEpicInput(selectedEpicKey);
    setSelectedIssue("");
    const epicObj = epics.find((epic) => epic.key === selectedEpicKey);
    setEpicName(epicObj?.summary || "");
  };

  const handleCreate = async () => {
    setLoadingResponse(true);
    setProgress(0);
    setError("");
    setShowErrorToast(false);
    setProgressMessage("");

    if (!selectedEpic) {
      setError("No epic or user stories selected.");
      setShowErrorToast(true);
      setLoadingResponse(false);
      return;
    }

    const email = localStorage.getItem("Email");

    let updatedRequestBody = {
      test_case_type: type,
      EmailId: email,
      epic: selectedEpic
        ? [epics.find((epic) => epic.key === selectedEpic)]
        : [],
      issues: selectedIssue
        ? [issues.find((issue) => issue.key === selectedIssue)]
        : [],
    };

    const endpointPath = isFeatureMode
      ? "/jira/generate"
      : "/jira/create/test-cases";
    const url = `${backend_baseURL}${endpointPath}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedRequestBody),
        credentials: "include",
      });

      if (!response.ok) {
        setError(`Request failed: ${response.status} - ${response.statusText}`);
        setShowErrorToast(true);
        setLoadingResponse(false);
        return;
      }

      if (!response.body) {
        setError("No response body found!");
        setShowErrorToast(true);
        setLoadingResponse(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let collectedData = ""; 
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const events = text.split("\n\n");

        events.forEach((event) => {
          if (event.startsWith("data:")) {
            const jsonData = JSON.parse(event.replace("data: ", "").trim());

            console.log("SSE Event Data:", jsonData);

            if (jsonData.progress) {
              setProgress(jsonData.progress);
            }

            if (jsonData.message) {
              console.log("Progress Message:", jsonData.message);
              setProgressMessage(jsonData.message);
            }

            if (
              jsonData.progress === 100 &&
              jsonData.message.startsWith("Error")
            ) {
              setLoadingResponse(false);
              setError(jsonData.message);
              setShowErrorToast(true);
              onSuccess(null, null, { error: jsonData.message });
              setEpicInput("");
              setUserStoryInput("");
              return;
            }
  if (jsonData.data) {
    collectedData += jsonData.data;
  }

            if (jsonData.progress === 100) {
              setLoadingResponse(false);
              setKey(jsonData.Key);
              const payload = jsonData.data || collectedData || "";
              const artifact = jsonData.artifact; // "features" or "user-stories" from backend
              const key = jsonData.key; // "story" or "epic" (helps header selection)

              // These come from your current selection state.
              // If your state names differ, map them accordingly:
              // e.g., selectedEpicKey / selectedIssueKey or epicLabel / storySummary, etc.
              onSuccess(payload, isFeatureMode ? "Features" : type, {
                epic: { epicInput: selectedEpic, epicName }, // <- your existing epic id/name
                userStory: { userStoryInput: selectedIssue, userStoryName }, // <- your existing story id/name
                key,
                artifact,
              });

              // onSuccess(jsonData.data, type, {
              //   epic: { epicName, epicInput },
              //   userStory: { userStoryName, userStoryInput },
              //   key: jsonData.Key,
              // });
              setEpicInput("");
              setUserStoryInput("");
            }
          }
        });
      }
    } catch (error) {
      console.error("Error generating test cases:", error);
      setError("Failed to generate test cases. Please try again.");
      setShowErrorToast(true);
      setLoadingResponse(false);
    }
  };

  return (
    <div>
      {/* TOASTER ALERTS PLACED PROPERLY BELOW THE CREATE NEW SECTION */}
      <div className="toaster-container" style={{ width: "100%" }}>
        {/* Failure Toaster */}
        {showErrorToast && (
          <div
            className="alert alert-danger dashboard-toster"
            style={{ justifyContent: "center" }}
          >
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
              <h6 className="cust-modal-title">{dialogTitle}</h6>
            </div>
            <div className="no-border">
              <div className="form-group">
                <label>Workspace</label>
                {loading ? (
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
                  <label>Epic (To generate user-stories)</label>
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

              {selectedEpic && (
                <div className="form-group">
                  <label>User Stories (To generate test-cases)</label>
                  {loadingIssues ? (
                    <p>Loading User Stories...</p>
                  ) : (
                    <select
                      className="form-select"
                      value={selectedIssue}
                      onChange={(e) => {
                        const selectedIssueKey = e.target.value;
                        setSelectedIssue(selectedIssueKey);
                        setUserStoryInput(selectedIssueKey);
                        const issueObj = issues.find(
                          (issue) => issue.key === selectedIssueKey
                        );
                        setUserStoryName(issueObj?.summary || "");
                      }}
                    >
                      <option value="">Select User Story</option>
                      {issues.map((issue) => (
                        <option key={issue.id} value={issue.key}>
                          {issue.summary} ({issue.key}) - {issue["issue-type"]}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="text-right py-2 py-2 d-flex justify-content-between align-items-center">
                <div>
                  <button
                    className="btn btn-secondary me-2"
                    onClick={onClose}
                    disabled={loadingResponse}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      console.log(selectedIssue);
                      setUploadFlag("Jira");
                      handleCreate();
                    }}
                    disabled={loadingResponse}
                  >
                    {loadingResponse ? <span>Loading</span> : "Create"}
                  </button>
                </div>
              </div>
              {(progressMessage || progress !== null) && (
                <div
                  className="progress-container"
                  ref={progressContainerRef}
                  style={{ textAlign: "right" }}
                >
                  {progressMessage && (
                    <span
                      className="progress-message"
                      style={{
                        fontWeight: "bold",
                        display: "block",
                        fontSize: "0.7rem",
                      }}
                    >
                      {progressMessage}{" "}
                      {progress !== null ? `(${progress}%)` : ""}
                    </span>
                  )}
                  {progress !== null && (
                    <div className="jira-progress-bar-container">
                      <div
                        className="jira-progress-bar"
                        style={{ width: `${progress}%` }}
                        data-progress={progress}
                      ></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JiraDropdown;
