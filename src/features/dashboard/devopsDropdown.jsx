import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
// import "../../common-components/globalStyles.css";
import "../../../src/styles/main.css";

import successIcon from "../../assets/images/success-close.svg";
import { DevOpsTokenService } from "../../utils/devopsTokenService";
import { useUpload } from "./context/uploadContext";
import "../../styles/jira-progress-bar.css";

function DevOpsDropdown({ onClose, onSuccess }) {
  // Add ref for progress bar
  const progressContainerRef = useRef(null);

  // Context
  const { setUploadFlag } = useUpload();

  // API Configuration
  const backend_baseURL = process.env.REACT_APP_BACKEND_BASE_URL;

  // Main state groups
  const [selections, setSelections] = useState({
    organization: "",
    project: "",
    itemType: "",
    workItem: "",
    wiki: "",
  });

  const [data, setData] = useState({
    organizations: [],
    projects: [],
    workItems: [],
    wikis: [],
  });

  const [loading, setLoading] = useState({
    organizations: false,
    projects: false,
    workItems: false,
    wikis: false,
    response: false,
  });

  const [progress, setProgress] = useState({
    value: null,
    message: "",
  });

  const [notification, setNotification] = useState({
    error: "",
    showToast: false,
  });

  const [token, setToken] = useState({
    expiring: false,
    expiryTimer: null,
    key: "",
  });

  // Input values for form submission
  const [formInputs, setFormInputs] = useState({
    project: "",
    workItem: "",
    wiki: "",
  });

  // This useEffect enhances the progress bar appearance and behavior
  useEffect(() => {
    if (progressContainerRef.current && progress.value !== null) {
      // Get the actual progress bar element
      const progressBarElement =
        progressContainerRef.current.querySelector(".jira-progress-bar");

      if (progressBarElement) {
        // Format progress value as percentage string
        const progressPercentage = `${progress.value}%`;

        // Set custom property to ensure width is correctly applied
        progressBarElement.style.setProperty(
          "--progress-width",
          progressPercentage,
        );

        // Add data attribute for CSS selectors
        progressBarElement.setAttribute("data-progress", progress.value);

        // Force a reflow to ensure the browser recalculates and applies the width
        void progressBarElement.offsetWidth;
      }

      // Add completion indicator when at 100%
      const messageElement =
        progressContainerRef.current.querySelector(".progress-message");
      if (messageElement && progress.value) {
        const isComplete = progress.value >= 100;
        messageElement.setAttribute("data-complete", isComplete);
      }
    }
  }, [progress.value, progress.message]); // Re-run when progress or message changes

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
    if (!DevOpsTokenService.hasValidToken()) {
      showError(
        "DevOps access token not found or expired. Please reconnect to DevOps.",
      );
      return;
    }

    // Set token in axios headers
    const accessToken = DevOpsTokenService.getToken();
    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

    // Check token expiry
    const tokenExpiry = localStorage.getItem("devops_token_expiry");
    if (tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry);
      const currentTime = new Date().getTime();
      const timeUntilExpiry = expiryTime - currentTime;

      // Show warning if token expires in less than 5 minutes
      const warningThreshold = 5 * 60 * 1000;
      if (timeUntilExpiry < warningThreshold && timeUntilExpiry > 0) {
        setToken((prev) => ({ ...prev, expiring: true }));

        // Set timer for warning
        const timer = setTimeout(
          () => {
            showError(
              "Your DevOps session will expire soon. Please complete your work.",
            );
          },
          Math.max(0, timeUntilExpiry - warningThreshold),
        );

        setToken((prev) => ({ ...prev, expiryTimer: timer }));
      }
    }
  }, []);

  // Error handling utility
  const showError = useCallback((message) => {
    setNotification({
      error: message,
      showToast: true,
    });
  }, []);

  const handleApiError = useCallback(
    (error) => {
      console.error("API Error:", error);

      // Check for auth errors
      if (error.response && [401, 403].includes(error.response.status)) {
        showError("DevOps authorization expired. Please reconnect to DevOps.");
        DevOpsTokenService.clearToken();

        // Close dialog after delay
        if (typeof onClose === "function") {
          setTimeout(onClose, 3000);
        }
      } else {
        showError(error.message || "An error occurred with the DevOps API");
      }
    },
    [onClose, showError],
  );

  // API requests
  const fetchOrganizations = useCallback(async () => {
    setLoading((prev) => ({ ...prev, organizations: true }));

    try {
      const response = await axios.get(
        `${backend_baseURL}/azure-devops/organizations`,
        { withCredentials: true },
      );

      setData((prev) => ({
        ...prev,
        organizations: response.data?.value || [],
      }));
      setNotification({ error: "", showToast: false });
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading((prev) => ({ ...prev, organizations: false }));
    }
  }, [backend_baseURL, handleApiError]);

  const fetchProjects = useCallback(
    async (organizationId) => {
      if (!organizationId) return;

      setLoading((prev) => ({ ...prev, projects: true }));

      try {
        const selectedOrg = data.organizations.find(
          (org) => org.accountId === organizationId,
        );

        if (!selectedOrg) {
          showError("Selected organization not found");
          setLoading((prev) => ({ ...prev, projects: false }));
          return;
        }

        const response = await axios.get(
          `${backend_baseURL}/azure-devops/organizations/${selectedOrg.accountName}/projects`,
          { withCredentials: true },
        );

        setData((prev) => ({ ...prev, projects: response.data?.value || [] }));
        setNotification({ error: "", showToast: false });
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading((prev) => ({ ...prev, projects: false }));
      }
    },
    [backend_baseURL, data.organizations, handleApiError, showError],
  );

  const fetchWorkItems = useCallback(
    async (projectId, itemType) => {
      if (!projectId || itemType !== "workItem") return;

      setLoading((prev) => ({ ...prev, workItems: true }));

      try {
        const selectedOrg = data.organizations.find(
          (org) => org.accountId === selections.organization,
        );

        const selectedProj = data.projects.find(
          (proj) => proj.id === projectId,
        );

        if (!selectedOrg || !selectedProj) {
          showError("Organization or project info not found");
          setLoading((prev) => ({ ...prev, workItems: false }));
          return;
        }

        const response = await axios.get(
          `${backend_baseURL}/azure-devops/organizations/${selectedOrg.accountName}/projects/${selectedProj.name}/linked-work-items`,
          { withCredentials: true },
        );

        // The API returns work items in 'work_items' array
        const workItemsArray = response.data?.work_items || [];
        setData((prev) => ({ ...prev, workItems: workItemsArray }));
        setNotification({ error: "", showToast: false });
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading((prev) => ({ ...prev, workItems: false }));
      }
    },
    [
      backend_baseURL,
      data.organizations,
      data.projects,
      handleApiError,
      selections.organization,
      showError,
    ],
  );

  const fetchWikis = useCallback(
    async (projectId, itemType) => {
      if (!projectId || itemType !== "wikis") return;

      setLoading((prev) => ({ ...prev, wikis: true }));

      try {
        const selectedOrg = data.organizations.find(
          (org) => org.accountId === selections.organization,
        );

        const selectedProj = data.projects.find(
          (proj) => proj.id === projectId,
        );

        if (!selectedOrg || !selectedProj) {
          showError("Organization or project info not found");
          setLoading((prev) => ({ ...prev, wikis: false }));
          return;
        }

        const response = await axios.get(
          `${backend_baseURL}/azure-devops/organizations/${selectedOrg.accountName}/projects/${selectedProj.name}/wikis`,
          { withCredentials: true },
        );

        // The API returns wikis in 'wikis' array
        const wikisArray = response.data?.wikis || [];
        setData((prev) => ({ ...prev, wikis: wikisArray }));
        setNotification({ error: "", showToast: false });
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading((prev) => ({ ...prev, wikis: false }));
      }
    },
    [
      backend_baseURL,
      data.organizations,
      data.projects,
      handleApiError,
      selections.organization,
      showError,
    ],
  );

  // Initial data loading
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Fetch projects when organization changes
  useEffect(() => {
    fetchProjects(selections.organization);
  }, [fetchProjects, selections.organization]);

  // Fetch work items or wikis based on selection
  useEffect(() => {
    fetchWorkItems(selections.project, selections.itemType);
    fetchWikis(selections.project, selections.itemType);
  }, [fetchWorkItems, fetchWikis, selections.project, selections.itemType]);

  // Event handlers
  const handleSelectionChange = (field, value) => {
    // Reset dependent fields
    const updates = { [field]: value };

    // Cascade reset of dependent fields
    if (field === "organization") {
      updates.project = "";
      updates.itemType = "";
      updates.workItem = "";
      updates.wiki = "";

      // Update form inputs
      setFormInputs({
        project: "",
        workItem: "",
        wiki: "",
      });
    } else if (field === "project") {
      updates.itemType = "";
      updates.workItem = "";
      updates.wiki = "";

      // Update project input
      setFormInputs((prev) => ({
        ...prev,
        project: value,
        workItem: "",
        wiki: "",
      }));
    } else if (field === "itemType") {
      updates.workItem = "";
      updates.wiki = "";
    } else if (field === "workItem") {
      setFormInputs((prev) => ({
        ...prev,
        workItem: value,
      }));
    } else if (field === "wiki") {
      setFormInputs((prev) => ({
        ...prev,
        wiki: value,
      }));
    }

    setSelections((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleCreate = async () => {
    setLoading((prev) => ({ ...prev, response: true }));
    setProgress({ value: 0, message: "" });
    setNotification({ error: "", showToast: false });

    if (!selections.project) {
      showError("No project selected.");
      setLoading((prev) => ({ ...prev, response: false }));
      return;
    }

    // Get the selected project to access its process_type
    const selectedProject = data.projects.find(
      (proj) => proj.id === selections.project,
    );

    if (!selectedProject) {
      showError("Selected project not found");
      setLoading((prev) => ({ ...prev, response: false }));
      return;
    }

    const selectedWorkItem = data.workItems.find(
      (item) => item.id == selections.workItem,
    );

    const selectedWikiItem = data.wikis.find(
      (wiki) => wiki.wiki_id == selections.wiki,
    );

    try {
      // Use the process_type from selected project as project_type
      const email = localStorage.getItem("Email");
      let url = `${backend_baseURL}/devops/create/test-cases?EmailId=${email}&project_type=${selectedProject.process_type}`;
      // Add appropriate query parameters based on selection
      if (selections.itemType === "workItem" && selectedWorkItem) {
        url += `&work_item_content=${encodeURIComponent(
          JSON.stringify(selectedWorkItem),
        )}`;
      } else if (selections.itemType === "wikis" && selectedWikiItem) {
        url += `&wiki_content=${encodeURIComponent(
          JSON.stringify(selectedWikiItem),
        )}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        showError(
          `Request failed: ${response.status} - ${response.statusText}`,
        );
        setLoading((prev) => ({ ...prev, response: false }));
        return;
      }

      if (!response.body) {
        showError("No response body found!");
        setLoading((prev) => ({ ...prev, response: false }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const events = text.split("\n\n");

        events.forEach((event) => {
          if (event.startsWith("data:")) {
            const jsonData = JSON.parse(event.replace("data: ", "").trim());

            if (jsonData.progress) {
              setProgress((prev) => ({ ...prev, value: jsonData.progress }));
            }

            if (jsonData.message) {
              setProgress((prev) => ({ ...prev, message: jsonData.message }));
            }

            if (
              jsonData.progress === 100 &&
              jsonData.message.startsWith("Error")
            ) {
              setLoading((prev) => ({ ...prev, response: false }));
              showError(jsonData.message);
              onSuccess(null, null, { error: jsonData.message });
              setFormInputs({ project: "", workItem: "", wiki: "" });
              return;
            }

            if (jsonData.progress === 100) {
              setLoading((prev) => ({ ...prev, response: false }));
              setToken((prev) => ({ ...prev, key: jsonData.Key }));

              // Debug: Log the complete response to see what data is available
              console.log("Complete DevOps response data:", jsonData);
              console.log("Coverage data from DevOps:", jsonData.coverage);

              // Create result object
              const resultData = {
                projectInput: formInputs.project,
                key: jsonData.Key,
                coverage: jsonData.coverage || null, // Pass coverage data if available
              };

              if (selections.itemType === "workItem") {
                resultData.workItemInput = formInputs.workItem;
              } else if (selections.itemType === "wikis") {
                resultData.wikiInput = formInputs.wiki;
              }

              onSuccess(jsonData.data, "Manual Test Cases", resultData);
              setFormInputs({ project: "", workItem: "", wiki: "" });
            }
          }
        });
      }
    } catch (error) {
      handleApiError(error);
      setLoading((prev) => ({ ...prev, response: false }));
    }
  };

  // UI rendering
  return (
    <div>
      {/* Toast notification */}
      <div className="toaster-container" style={{ width: "100%" }}>
        {notification.showToast && (
          <div
            className="alert alert-danger dashboard-toster"
            style={{ justifyContent: "center" }}
          >
            <span className="vert-mdle">
              <strong>Error:</strong> {notification.error}
            </span>
            <img
              className="close-icon-red"
              src={successIcon}
              alt="Close"
              onClick={() =>
                setNotification((prev) => ({ ...prev, showToast: false }))
              }
            />
          </div>
        )}
      </div>

      {/* Modal */}
      <div className="popup-backdrop"></div>
      <div className="cust-modal fileupload">
        <div className="cust-modal-dialog multi-select-dd-pop">
          <div className="cust-modal-content">
            <div className="cust-modal-header">
              <h6 className="cust-modal-title">Create DevOps Test Cases</h6>
            </div>
            <div className="no-border">
              {/* Organization select */}
              <div className="form-group">
                <label>Organization</label>
                {loading.organizations ? (
                  <p>Loading</p>
                ) : (
                  <select
                    className="form-select"
                    value={selections.organization}
                    onChange={(e) =>
                      handleSelectionChange("organization", e.target.value)
                    }
                  >
                    <option value="">Select Organization</option>
                    {data.organizations.map((org) => (
                      <option key={org.accountId} value={org.accountId}>
                        {org.accountName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Project select */}
              {selections.organization && (
                <div className="form-group">
                  <label>Project</label>
                  {loading.projects ? (
                    <p>Loading Projects...</p>
                  ) : (
                    <select
                      className="form-select"
                      value={selections.project}
                      onChange={(e) =>
                        handleSelectionChange("project", e.target.value)
                      }
                    >
                      <option value="">Select Project</option>
                      {data.projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Item Type select */}
              {selections.project && (
                <div className="form-group">
                  <label>Select Item Type</label>
                  <select
                    className="form-select"
                    value={selections.itemType}
                    onChange={(e) =>
                      handleSelectionChange("itemType", e.target.value)
                    }
                  >
                    <option value="">Select Item Type</option>
                    <option value="workItem">Work Item</option>
                    <option value="wikis">Wikis</option>
                  </select>
                </div>
              )}

              {/* Work Item select */}
              {selections.itemType === "workItem" && (
                <div className="form-group">
                  <label>Work Item</label>
                  {loading.workItems ? (
                    <p>Loading Work Items...</p>
                  ) : (
                    <select
                      className="form-select"
                      value={selections.workItem}
                      onChange={(e) =>
                        handleSelectionChange("workItem", e.target.value)
                      }
                    >
                      <option value="">Select Work Item</option>
                      {data.workItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title} ({item.type})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Wiki select */}
              {selections.itemType === "wikis" && (
                <div className="form-group">
                  <label>Wiki</label>
                  {loading.wikis ? (
                    <p>Loading Wikis...</p>
                  ) : (
                    <select
                      className="form-select"
                      value={selections.wiki}
                      onChange={(e) =>
                        handleSelectionChange("wiki", e.target.value)
                      }
                    >
                      <option value="">Select Wiki</option>
                      {data.wikis.map((wiki) => (
                        <option key={wiki.wiki_id} value={wiki.wiki_id}>
                          {wiki.name} ({wiki.type})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="text-right py-2 py-2 d-flex justify-content-between align-items-center">
                <div>
                  <button
                    className="btn btn-secondary me-2"
                    onClick={onClose}
                    disabled={loading.response}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setUploadFlag("DevOps");
                      handleCreate();
                    }}
                    disabled={
                      loading.response ||
                      !selections.project ||
                      !selections.itemType ||
                      (selections.itemType === "workItem" &&
                        !selections.workItem) ||
                      (selections.itemType === "wikis" && !selections.wiki)
                    }
                  >
                    {loading.response ? <span>Loading</span> : "Create"}
                  </button>
                </div>
              </div>

              {/* Progress indicator */}
              {(progress.message || progress.value !== null) && (
                <div
                  className="progress-container"
                  ref={progressContainerRef}
                  style={{ textAlign: "right" }}
                >
                  {progress.message && (
                    <span
                      className="progress-message"
                      style={{
                        fontWeight: "bold",
                        display: "block",
                        fontSize: "0.7rem",
                      }}
                    >
                      {progress.message}{" "}
                      {progress.value !== null ? `(${progress.value}%)` : ""}
                    </span>
                  )}
                  {progress.value !== null && (
                    <div className="jira-progress-bar-container">
                      <div
                        className="jira-progress-bar"
                        style={{ width: `${progress.value}%` }}
                        data-progress={progress.value}
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

export default DevOpsDropdown;
