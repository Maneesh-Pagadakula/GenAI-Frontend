import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { useUpload } from "./context/uploadContext";
import "../../common-components/globalStyles.css";
import successIcon from "../../assets/images/success-close.svg";
import "../dashboard/jira-progress-bar.css";
import { JiraTokenService } from "../../features/dashboard/jira-token-data";
import Select from "react-select";
import ReactDOM from "react-dom";

function JiraUploadDropdown({ onClose, onSuccess }) {
  const progressContainerRef = useRef(null);
  const emailRef = useRef(localStorage.getItem("Email"));
  const tokenExpiryRef = useRef(localStorage.getItem("jira_token_expiry"));
  const backend_baseURL = useMemo(
    () => process.env.REACT_APP_BACKEND_BASE_URL,
    []
  );
  const { setUploadFlag } = useUpload();

  const [type] = useState("Manual Test Cases");

  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [issues, setIssues] = useState([]);

  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEpic, setSelectedEpic] = useState("");
  const [selectedIssue, setSelectedIssue] = useState("");

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingEpics, setLoadingEpics] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false);

  const [progress, setProgress] = useState(null);
  const [progressMessage, setProgressMessage] = useState("");

  const [epicInput, setEpicInput] = useState("");
  const [userStoryInput, setUserStoryInput] = useState("");

  const [error, setError] = useState("");
  const [showErrorToast, setShowErrorToast] = useState(false);

  const [key, setKey] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [epicName, setEpicName] = useState("");
  const [userStoryName, setUserStoryName] = useState("");

  const [testCases, setTestCases] = useState([]);
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);

  const tokenTimerRef = useRef(null);

  // Progress UI updater
  useEffect(() => {
    if (!progressContainerRef.current || progress === null) return;
    const bar =
      progressContainerRef.current.querySelector(".jira-progress-bar");
    if (bar) {
      bar.style.setProperty("--progress-width", `${progress}%`);
      bar.setAttribute("data-progress", progress);
      void bar.offsetWidth;
    }
    const msg = progressContainerRef.current.querySelector(".progress-message");
    if (msg) msg.setAttribute("data-complete", progress >= 100);
  }, [progress]);

  // Token validation on mount
  useEffect(() => {
    if (!JiraTokenService.hasValidToken()) {
      setError(
        "Jira access token not found or expired. Please reconnect to Jira."
      );
      setShowErrorToast(true);
      return;
    }
    axios.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${JiraTokenService.getToken()}`;

    if (tokenExpiryRef.current) {
      const timeUntilExpiry = parseInt(tokenExpiryRef.current) - Date.now();
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        tokenTimerRef.current = setTimeout(() => {
          setError(
            "Your Jira session will expire soon. Please complete your work."
          );
          setShowErrorToast(true);
        }, Math.max(0, timeUntilExpiry - 5 * 60 * 1000));
      }
    }
    return () => clearTimeout(tokenTimerRef.current);
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

  const fetchWorkspaces = useCallback(() => {
    setLoadingWorkspaces(true);
    axios
      .get(`${backend_baseURL}/jira/workspaces?EmailId=${emailRef.current}`, {
        withCredentials: true,
      })
      .then((res) => setWorkspaces(res.data.workspaces || []))
      .catch(handleApiError)
      .finally(() => setLoadingWorkspaces(false));
  }, [backend_baseURL, handleApiError]);

  const fetchProjects = useCallback(() => {
    if (!selectedWorkspace) return;
    setLoadingProjects(true);
    axios
      .get(
        `${backend_baseURL}/jira/projects?EmailId=${emailRef.current}&cloud_id=${selectedWorkspace}`,
        { withCredentials: true }
      )
      .then((res) => setProjects(res.data.projects || []))
      .catch(handleApiError)
      .finally(() => setLoadingProjects(false));
  }, [backend_baseURL, selectedWorkspace, handleApiError]);

  const fetchEpics = useCallback(() => {
    if (!selectedProject) return;
    setLoadingEpics(true);
    axios
      .get(
        `${backend_baseURL}/jira/epics?EmailId=${emailRef.current}&project_id=${selectedProject}&cloud_id=${workspaceId}`,
        { withCredentials: true }
      )
      .then((res) => setEpics(res.data.epics || []))
      .catch(handleApiError)
      .finally(() => setLoadingEpics(false));
  }, [backend_baseURL, selectedProject, workspaceId, handleApiError]);

  const fetchIssues = useCallback(() => {
    if (!selectedEpic || selectedEpic === "all") return;
    setLoadingIssues(true);
    axios
      .get(
        `${backend_baseURL}/jira/issues?EmailId=${emailRef.current}&epic_key=${selectedEpic}&cloud_id=${workspaceId}`,
        { withCredentials: true }
      )
      .then((res) => setIssues(res.data.issues || []))
      .catch(handleApiError)
      .finally(() => setLoadingIssues(false));
  }, [backend_baseURL, selectedEpic, workspaceId, handleApiError]);

  const fetchTestCases = useCallback(() => {
    setLoadingTestCases(true);
    axios
      .get(`${backend_baseURL}/get-testcases?EmailId=${emailRef.current}`, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data && res.data.testcases) {
          // Convert the testcases object to an array of {id, title}
          const tcs = Object.entries(res.data.testcases).map(
            ([id, details]) => ({
              id,
              title: details.Title || "", // Use Title from your API format
            })
          );
          setTestCases(tcs);
        }
      })
      .catch(handleApiError)
      .finally(() => setLoadingTestCases(false));
  }, [backend_baseURL, handleApiError]);

  useEffect(fetchWorkspaces, [fetchWorkspaces]);
  useEffect(fetchProjects, [fetchProjects]);
  useEffect(fetchEpics, [fetchEpics]);
  useEffect(fetchIssues, [fetchIssues]);
  useEffect(() => {
    fetchTestCases();
  }, [fetchTestCases]);

  const toggleTestCaseSelection = (id) => {
    setSelectedTestCases((prev) =>
      prev.includes(id) ? prev.filter((tc) => tc !== id) : [...prev, id]
    );
  };

  const resetSelections = (level) => {
    if (level === "workspace") {
      setSelectedProject("");
      setSelectedEpic("");
      setSelectedIssue("");
      setProjects([]);
      setEpics([]);
      setIssues([]);
    }
    if (level === "project") {
      setSelectedEpic("");
      setSelectedIssue("");
      setEpics([]);
      setIssues([]);
    }
    if (level === "epic") {
      setSelectedIssue("");
    }
  };

  const handleWorkspaceChange = (e) => {
    const val = e.target.value;
    setWorkspaceId(val);
    setSelectedWorkspace(val);
    resetSelections("workspace");
  };

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    resetSelections("project");
  };

  const handleEpicChange = (e) => {
    const val = e.target.value;
    setSelectedEpic(val);
    setEpicInput(val);
    resetSelections("epic");
    const epicObj = epics.find((epic) => epic.key === val);
    setEpicName(epicObj?.summary || "");
  };

  const handleUpload = async () => {
    setLoadingResponse(true);
    setProgress(null);
    setError("");
    setShowErrorToast(false);
    setProgressMessage("");

    if (!selectedIssue) {
      setError("Please select a User Story.");
      setShowErrorToast(true);
      setLoadingResponse(false);
      return;
    }
    if (selectedTestCases.length === 0) {
      setError("Please select at least one test case to upload.");
      setShowErrorToast(true);
      setLoadingResponse(false);
      return;
    }

    const reqBody = {
      workspace_key: selectedWorkspace,
      project_key: selectedProject,
      parent_key: selectedIssue,
      testcase_ids: selectedTestCases,
    };

    try {
      const res = await axios.post(
        `${backend_baseURL}/jira/push-testcases?EmailId=${encodeURIComponent(
          emailRef.current
        )}`,
        reqBody,
        { withCredentials: true }
      );

      if (res.status === 200) {
        const successMsg = `Successfully uploaded ${res.data.total_pushed} test case(s).`;
        setProgressMessage(successMsg);
        setProgress(100);

        setTimeout(() => {
          setLoadingResponse(false);
          if (onSuccess) {
            onSuccess({ success: true, message: successMsg });
          }
          if (onClose) onClose();
        }, 1500);
      } else {
        const errMsg = `Unexpected response: ${
          res.statusText || "Unknown error"
        }`;
        setError(errMsg);
        setShowErrorToast(true);
        setLoadingResponse(false);
        if (onSuccess) {
          onSuccess({ success: false, message: errMsg });
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "An error occurred while uploading test cases.";
      setError(msg);
      setShowErrorToast(true);
      setLoadingResponse(false);
    }
  };

  return ReactDOM.createPortal( 
    <>
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
              <h6 className="cust-modal-title">Upload Test Cases to Jira</h6>
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
                        <option key={project.id} value={project.key}>
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
              {selectedIssue && (
                <div className="form-group">
                  <label>Test Cases</label>
                  {loadingTestCases ? (
                    <p>Loading Test Cases...</p>
                  ) : (
                    <Select
                      isMulti
                      options={testCases.map((tc) => ({
                        value: tc.id,
                        label: `${tc.id} - ${tc.title}`,
                      }))}
                      value={testCases
                        .filter((tc) => selectedTestCases.includes(tc.id))
                        .map((tc) => ({
                          value: tc.id,
                          label: `${tc.id} - ${tc.title}`,
                        }))}
                      onChange={(selectedOptions) => {
                        setSelectedTestCases(
                          selectedOptions
                            ? selectedOptions.map((opt) => opt.value)
                            : []
                        );
                      }}
                      placeholder="Select Test Cases..."
                    />
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
                      console.log(selectedIssue, selectedTestCases);
                      setUploadFlag("Jira");
                      handleUpload();
                    }}
                    disabled={loadingResponse}
                  >
                    {loadingResponse ? <span>Loading</span> : "Upload"}
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
  </>,
    document.body
  );
}

export default JiraUploadDropdown;
