import { useRef, useState, useEffect } from "react";
import "../../common-components/contentStyles.css";
// import "../../common-components/globalStyles.css";
import "../../../src/styles/main.css";

import mainLogo from "../../assets/images/Evoke_technologies_logo-new-cropped.svg";
import plusIcon from "../../assets/images/plus-icon.svg";
import downloadIcon from "../../assets/images/download-icon.svg";
import uploadIcon from "../../assets/images/upload-icon.svg";
import landingScreen from "../../assets/images/landing-screen-icon.svg";
import successIconTick from "../../assets/images/green-tick-icon.svg";
import tosterCheckIcon from "../../assets/images/toaster-check-icon.svg"; // To match LoginScreen
import successIcon from "../../assets/images/success-close.svg"; // To match LoginScreen
import menuIcon from "../../assets/images/menu-icons.svg";
import KnowledgeBaseUpload from "./knowledgeBaseUpload";
import axios from "axios";
import LeftPane from "./leftPane";
import CreateList from "./createList";
import ProfileComponent from "./profileComponent";
import ProgressBar from "../../common-components/progessBar";
import UploadPopup from "./uploadPopup";
import JiraDropdown from "./jiraDropdown";
import JiraUploadDropdown from "./jira-upload-dropdown";
// import DevOpsDropdown from "./devopsDropdown"; // You'll need to create this component
import DevOpsDropdown from "./devops-dropdown"; // You'll need to create this component
import zip from "../../assets/images/zip.svg";
// import excel from "../../assets/images/excel.svg";
import excel from "../../assets/images/Excel_Download.png";
// import pdf from "../../assets/images/pdf.svg";
import pdf from "../../assets/images/PDF_Download.png";
import robotChatIcon from "../../assets/images/robot-chat-icon.svg";
import { DevOpsTokenService } from "../../utils/devopsTokenService";
import ExcelHandler from "../../utils/ExcelHandler";
import ExcelUploadPopup from "./excelUploadPopup";
// import '../../styles/leftPane.css'
import MarkdownStyles from "./response-styling/markdownStyles";
import { JiraTokenService } from "./jira-token-data";
import ConversationalModal from "../conversational/ConversationalModal";
import FullScreenSpinner from "../../components/FullScreenSpinner";
import CoverageDisplay from "../../components/CoverageDisplay";
import CoverageWarningModal from "../../components/CoverageWarningModal";
import RequirementsList from "../../components/RequirementsList";
import JiraAnalysisDropdown from "./jira-analysis-dropdown";
import ListCards from "./ListCards";

function LandingPage(props) {

function LandingPage(props) {
  // NEW: automation/toggle state
  const [isAutomationGenerating, setIsAutomationGenerating] = useState(false);
  const [automation, setAutomation] = useState({ markdown: "", title: "" });
  const [viewTab, setViewTab] = useState("testcases"); // 'testcases' | 'automation'

  // Clears persisted Jira generation + resets UI
  const resetJiraGeneration = () => {
    // localStorage
    localStorage.removeItem("lastJiraTestCases");
    localStorage.removeItem("lastJiraAutomation");
    localStorage.removeItem("lastJiraAutomationTitle");
    localStorage.removeItem("lastViewTab");
    localStorage.removeItem("lastGenerationSource");

    // in-memory UI
    setResponseData(null);
    setAutomation?.({ markdown: "", title: "" }); // if you keep automation state
    setViewTab?.("testcases"); // if you store the tab
    setDisplayType?.("original"); // if you show a badge/variant
  };

  useEffect(() => {
    const tc = localStorage.getItem("lastJiraTestCases") || "";
    const auto = localStorage.getItem("lastJiraAutomation") || "";
    const autoTitle =
      localStorage.getItem("lastJiraAutomationTitle") || "Automation Script";
    const lastSource = localStorage.getItem("lastGenerationSource") || "";

    if (tc) {
      // Default tab is testcases
      setResponseData({
        status: 200,
        data: { message: tc, title: "Test Cases" },
      });
      setGeneratedResults("Generated Test Cases from Jira");
      setDisplayType("original");
    }
    if (auto) {
      setAutomation({ markdown: auto, title: autoTitle });
    }
    // Default to testcases; if you ever want to remember the last tab:
    const preferred = localStorage.getItem("lastViewTab");
    setViewTab(preferred === "automation" && auto ? "automation" : "testcases");

    // (Optional) remember source so the button shows only for Jira
    if (lastSource) setGenerationSource(lastSource);
  }, []);

  const canShowAutomationButton = () => {
    const hasCases = !!(
      responseData?.data?.message || localStorage.getItem("lastJiraTestCases")
    );
    const src =
      generationSource || localStorage.getItem("lastGenerationSource");
    return src === "Jira" && hasCases && !automation.markdown; // hide if already generated
  };

// Drop this inside LandingPage.jsx
const handleGenerateAutomation = async () => {
  if (isAutomationGenerating) return;
  setIsAutomationGenerating(true);
  setError("");
  setShowErrorToast(false);

  try {
    const email = localStorage.getItem("Email") || "";
    const testCasesMd =
      (responseData?.data?.message || localStorage.getItem("lastJiraTestCases") || "").trim();

    if (!testCasesMd) throw new Error("No Jira test cases available");

    const resp = await fetch(
      `${backend_baseURL}/jira/generate/automation?EmailId=${encodeURIComponent(email)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          test_cases_markdown: testCasesMd,
          // user_story / epic optional; backend reads from session if omitted
        }),
      }
    );

    const json = await resp.json();
    if (!resp.ok) throw new Error(json?.message || "Automation generation failed");

    const rawCode = (json.generated_code || json.message || "").trim();
    const title = (json.title || "Jira_Automation").trim();
    const safeBase = title.replace(/[^\w.-]+/g, "_");

    // If response already includes fenced blocks and a filename/path hint, keep as-is.
    const hasFence = /```/.test(rawCode);
    const hasFileHint = /^\s*(#|\/\/)\s*(filename:|src\/|tests\/|feature[s]?\/)/im.test(rawCode);

    const wrappedMarkdown = hasFence
      ? (hasFileHint ? rawCode : `### Generated Automation Code\n\n${rawCode}`)
      : `### Generated Automation Code\n\n\`\`\`python
# filename: ${safeBase}.py
${rawCode}
\`\`\`
`;

    // Persist so reload shows Test Cases by default; toggle can show automation later.
    localStorage.setItem("lastJiraTestCases", testCasesMd);
    localStorage.setItem("lastJiraAutomation", wrappedMarkdown);
    localStorage.setItem("lastJiraAutomationTitle", `${safeBase}.py`);
    localStorage.setItem("lastGenerationSource", "Jira");
    // localStorage.setItem("lastViewTab", "testcases"); // keep default on load

    // // Reload per your flow (title/header stays unchanged after reload)
    // window.location.reload();
    localStorage.setItem("lastViewTab", "automation"); // show code after generation (optional)

    // Update UI in-place (no reload) and KEEP whatever title is on screen
    setAutomation({ markdown: wrappedMarkdown, title: `${safeBase}.py` });
    setViewTab("automation");
    setResponseData(prev => ({
      status: 200,
      data: {
        message: wrappedMarkdown,
        title: prev?.data?.title || "Test Cases",
      },
    }));
    setGenerationSource("Jira");
  } catch (e) {
    setError(e.message || "Automation generation failed");
    setShowErrorToast(true);
  } finally {
    setIsAutomationGenerating(false);
  }
};


  const {
    showJiraPopup: externalJiraPopup,
    setShowJiraPopup: externalSetJiraPopup,
    showDevOpsPopup: externalDevOpsPopup,
    setShowDevOpsPopup: externalSetDevOpsPopup,
  } = props;
  // Then add these new state variables inside your LandingPage component
  const [showExcelPopup, setShowExcelPopup] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  // Create local state as fallback if external state is not provided
  const [localJiraPopup, setLocalJiraPopup] = useState(false);
  const [localDevOpsPopup, setLocalDevOpsPopup] = useState(false);
  const [testCaseFilter, setTestCaseFilter] = useState("all");

  // Use the external state if it exists, otherwise fall back to local state
  const showJiraPopup = externalJiraPopup !== undefined ? externalJiraPopup : localJiraPopup;
  const showJiraPopup =
    externalJiraPopup !== undefined ? externalJiraPopup : localJiraPopup;
  const setShowJiraPopup = externalSetJiraPopup || setLocalJiraPopup;
  const showDevOpsPopup =
    externalDevOpsPopup !== undefined ? externalDevOpsPopup : localDevOpsPopup;
  const setShowDevOpsPopup = externalSetDevOpsPopup || setLocalDevOpsPopup;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [file, setFile] = useState(null);
  const [testCaseType, setTestCaseType] = useState("Manual Test Cases");
  const [error, setError] = useState("");
  const [isChecked, setIsChecked] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [refinedTestCases, setRefinedTestCases] = useState(null);
  const [uploadPopup, setUploadPopup] = useState({
    flag: false,
    identifier: "",
  });
  const [profileFlag, setProfileFlag] = useState(false);

  const [showProgressBar, setShowProgressBar] = useState(false);

  const [jiraRedirectStatus, setJiraRedirectStatus] = useState(false);
  const [jiraTestCaseType, setJiraTestCaseType] = useState("");

  // DevOps states - no duplicate declaration with props
  const [devOpsRedirectStatus, setDevOpsRedirectStatus] = useState(false);
  const [devOpsTestCaseType, setDevOpsTestCaseType] = useState("");
  const [showJiraAnalysisPopup, setShowJiraAnalysisPopup] = useState(false);
  const [analysisContent, setAnalysisContent] = useState("");

  const backend_baseURL = process.env.REACT_APP_BACKEND_BASE_URL;

  const handleJiraAnalysisSuccess = (analysis) => {
    setResponseData({ status: 200, data: { message: analysis, title: "Test Case Analysis" } });
  // NEW: controls whether Jira popup is in "test-cases" or "feature (Gherkin)" mode
  const [jiraCreateMode, setJiraCreateMode] = useState("test-cases");

  const handleJiraAnalysisSuccess = (analysis) => {
    setResponseData({
      status: 200,
      data: { message: analysis, title: "Test Case Analysis" },
    });
    setGeneratedResults("Test Case Analysis");
    setDisplayType("identified");
    setAnalysisContent("");
    setShowJiraAnalysisPopup(false);
    setSuccessMessage("Test Case Analysis generated successfully!");
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const downloadAnalysis = async (format) => {
    try {
      const emailId = localStorage.getItem("Email");
      const endpoint =
        format === "pdf"
          ? `${backend_baseURL}/testcase-analysis/download/pdf?EmailId=${encodeURIComponent(
              emailId || ""
            )}`
          : `${backend_baseURL}/testcase-analysis/download/excel?EmailId=${encodeURIComponent(
              emailId || ""
            )}`;
      const resp = await axios.get(endpoint, {
        responseType: "blob",
        withCredentials: true,
      });
      if (resp.status === 200) {
        const blob = new Blob([resp.data], {
          type:
            format === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = format === "pdf" ? "Test_Case_Analysis.pdf" : "Test_Case_Analysis.xlsx";
        a.download =
          format === "pdf"
            ? "Test_Case_Analysis.pdf"
            : "Test_Case_Analysis.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Download failed");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    }
  };

  const [progressBar, setProgressBar] = useState("0%");
  const [progressMessage, setProgressMessage] = useState("");

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  const [downloadDropdown, setDownloadDropdown] = useState(false);
  const createDropdownRef = useRef(null);
  const [createFlag, setCreateFlag] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const hamburgerDropdownRef = useRef(null);
  // const [downloadType, setDownloadType] = useState(null);

  const [epicInput, setEpicInput] = useState("");
  const [userStoryInput, setUserStoryInput] = useState("");
  const [generatedResults, setGeneratedResults] = useState("");
  const [jiraKey, setJiraKey] = useState("");

  // DevOps inputs
  const [workItemInput, setWorkItemInput] = useState("");
  const [projectInput, setProjectInput] = useState("");
  const [devOpsKey, setDevOpsKey] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [showHistory, setShowHistory] = useState(false);

  //  const [uploadedFile, setUploadedFile] = useState(null);
  const [documentDescription, setDocumentDescription] = useState("");

  // Conversational feature state
  const [showConversationalModal, setShowConversationalModal] = useState(false);
  const [conversationContext, setConversationContext] = useState({
    requirementSummary: "",
    generatedFrom: "upload",
  });

  // New state variables for refined display management
  const [refinementIntent, setRefinementIntent] = useState(null); // 'MODIFICATION' or 'IDENTIFICATION'
  const [currentDisplayData, setCurrentDisplayData] = useState(null); // What's currently being displayed
  const [displayType, setDisplayType] = useState("original"); // 'original', 'modified', 'identified'

  // State for full-screen refinement spinner
  const [isRefinementInProgress, setIsRefinementInProgress] = useState(false);
  const [refinementProgress, setRefinementProgress] = useState(0);
  const [refinementMessage, setRefinementMessage] = useState("");

  // State for full-screen generation spinner (for original test case generation)
  const [isGenerationInProgress, setIsGenerationInProgress] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState("");
  const [generationSource, setGenerationSource] = useState(""); // Document, Jira, DevOps

  // Coverage-related state
  const [coverageData, setCoverageData] = useState(null);
  const [extractedRequirements, setExtractedRequirements] = useState("");
  const [showCoverageWarning, setShowCoverageWarning] = useState(false);
  const [coverageWarningData, setCoverageWarningData] = useState(null);
  const [pendingRefinementPrompt, setPendingRefinementPrompt] = useState(null);

  const [submit, setSubmit] = useState(false);

  useEffect(() => {
    if (submit) {
      handleFileUpload();
      setSubmit(false);
    }
  }, [submit]);
  // Show Jira Upload only when current/returned type is Manual
  const isManual = (jiraTestCaseType || testCaseType) === "Manual Test Cases";

  const handleTestCaseFilterChange = (filterType) => {
    setTestCaseFilter(filterType);
  };

  // Helper function to reset display state when new original test cases are generated
  const resetDisplayState = () => {
    setRefinementIntent(null);
    setCurrentDisplayData(null);
    setDisplayType("original");
    setRefinedTestCases(null);
    setCoverageData(null); // Reset coverage data for new test cases
    setExtractedRequirements(""); // Reset extracted requirements
  };
  // Add to LandingPage
  const [showJiraUpload, setShowJiraUpload] = useState(false);

  const handleOpenJiraUpload = () => {
    setUploadPopup({ flag: false, identifier: "" }); // close file upload
    setShowJiraPopup(false); // close Jira creation
    setShowJiraUpload(false); // close Jira upload
    setShowDevOpsPopup(false); // close DevOps if needed
    setShowJiraAnalysisPopup(false); // close analysis
    if (JiraTokenService.hasValidToken()) {
      setShowJiraUpload(true);
    } else {
      redirectToJira();
    }
  };

  const handleJiraUploadSuccess = (result) => {
    if (result?.success) {
      setSuccessMessage(result.message);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } else {
      setError(result?.message || "Upload failed.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    }
  };

  useEffect(() => {
    console.log("responseData changed:", responseData);
    if (responseData?.data?.message) {
      setTestCaseFilter("all"); // Reset filter when new data arrives
      // Don't reset display state for modifications - only for truly new original data
      // This will be handled explicitly when new original data is loaded
    }
  }, [responseData]);

  // Debug useEffect to track display state changes
  useEffect(() => {
    console.log("Display state changed:", {
      displayType,
      refinementIntent,
      hasCurrentDisplayData: !!currentDisplayData,
      responseDataLength: responseData?.data?.message?.length || 0,
    });
  }, [displayType, refinementIntent, currentDisplayData, responseData]);

  // Conversational handlers
  const handleOpenConversational = () => {
    setShowConversationalModal(true);
  };

  const handleCloseConversational = () => {
    setShowConversationalModal(false);
  };

  const handleRefinedTestCases = async (userPrompt, testCases, context) => {
    // Show full-screen spinner for refinement (replace progress bar)
    setIsRefinementInProgress(true);
    setRefinementProgress(0);
    setRefinementMessage("Initializing refinement...");

    // Don't show the progress bar during refinement - only use spinner
    setShowProgressBar(false);
    setError("");
    setShowSuccessToast(false);
    setShowErrorToast(false);

    try {
      const emailId = localStorage.getItem("Email");
      const payload = {
        userPrompt: userPrompt,
        testCases: testCases,
        context: context,
        EmailId: emailId,
      };

      const response = await fetch(`${backend_baseURL}/refine-test-cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body found!");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const events = text.split("\n\n");

        for (const event of events) {
          if (event.startsWith("data:")) {
            const jsonData = JSON.parse(event.replace("data: ", "").trim());

            // Only update spinner during refinement (not progress bar)
            setRefinementProgress(jsonData.progress);
            setRefinementMessage(jsonData.message);

            if (jsonData.progress === 100) {
              // Check for coverage warning
              if (jsonData.coverage_warning) {
                setCoverageWarningData({
                  coverageData: jsonData.coverage_data,
                  worthinessCheck: jsonData.worthiness_check,
                  warningMessage: jsonData.warning_message,
                });
                setPendingRefinementPrompt(userPrompt);
                setShowCoverageWarning(true);
                setIsRefinementInProgress(false);
                return;
              }

              if (jsonData.data) {
                const intent = jsonData.intent || "OPTIMIZATION";
                console.log("Refinement completed - Intent:", intent);
                console.log("Refinement data:", jsonData.data);
                setRefinementIntent(intent);

                // Update coverage data if available
                if (jsonData.coverage) {
                  // If this was a regeneration for missed requirements, merge with original coverage
                  if (window.isRegeneratingMissed && window.originalCoverageData) {
                    const originalCoverage = window.originalCoverageData;
                    const newCoverage = jsonData.coverage;

                    // Create a map to track unique requirements
                    const requirementMap = new Map();

                    // Add all original requirements
                    originalCoverage.detailed_analysis.forEach((req) => {
                      requirementMap.set(req.requirement, req);
                    });

                    // Update with new coverage data (this will update coverage status for previously missed requirements)
                    newCoverage.detailed_analysis.forEach((req) => {
                      if (requirementMap.has(req.requirement)) {
                        // Update existing requirement with new coverage status
                        const existing = requirementMap.get(req.requirement);
                        requirementMap.set(req.requirement, {
                          ...existing,
                          covered: req.covered || existing.covered, // Mark as covered if either old or new says so
                          covering_test_cases: [
                            ...(existing.covering_test_cases || []),
                            ...(req.covering_test_cases || []),
                          ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
                        });
                      } else {
                        // Add new requirement
                        requirementMap.set(req.requirement, req);
                      }
                    });

                    const mergedAnalysis = Array.from(requirementMap.values());
                    const coveredCount = mergedAnalysis.filter((req) => req.covered).length;

                    const mergedCoverage = {
                      ...newCoverage,
                      detailed_analysis: mergedAnalysis,
                      total_requirements: mergedAnalysis.length,
                      covered_requirements: coveredCount,
                      coverage_percentage: Math.round((coveredCount / mergedAnalysis.length) * 100),
                    };

                    setCoverageData(mergedCoverage);

                    // Clean up flags
                    window.isRegeneratingMissed = false;
                    window.originalCoverageData = null;
                  } else {
                    setCoverageData(jsonData.coverage);
                  }
                }

                if (intent === "ADDITION") {
                  console.log("Processing ADDITION intent - appending new test cases");
                  // Append new test cases to existing ones
                  const currentContent = responseData?.data?.message || "";
                  const combinedContent = currentContent + "\n\n" + jsonData.data;
                  const newResponseData = {
                    status: 200,
                    data: {
                      message: combinedContent,
                      title: "Test Cases", // Keep original title
                    },
                  };
                  console.log("Setting combined responseData for addition:", newResponseData);
                  setResponseData(newResponseData);
                  setCurrentDisplayData({
                    content: combinedContent,
                    type: "modified",
                    title: "Test Cases",
                  });
                  setDisplayType("modified");
                  setRefinedTestCases(null); // Clear refined section
                } else if (intent === "REDUCTION" || intent === "OPTIMIZATION") {
                  console.log("Processing", intent, "intent - updating main display");
                  // Replace the original test cases display with reduced/optimized content
                  const newResponseData = {
                    status: 200,
                    data: {
                      message: jsonData.data,
                      title: "Test Cases", // Keep original title
                    },
                  };
                  console.log("Setting new responseData:", newResponseData);
                  setResponseData(newResponseData);
                  setCurrentDisplayData({
                    content: jsonData.data,
                    type: "modified",
                    title: "Test Cases",
                  });
                  setDisplayType("modified");
                  setRefinedTestCases(null); // Clear refined section
                } else {
                  // Show in refined test cases section
                  setRefinedTestCases({
                    status: 200,
                    data: {
                      message: jsonData.data,
                      title: jsonData.title || "Refined Test Cases",
                    },
                  });
                  setCurrentDisplayData({
                    content: jsonData.data,
                    type: "identified",
                    title: jsonData.title || "Refined Test Cases",
                  });
                  setDisplayType("identified");
                }

                setShowSuccessToast(true);
                setSuccessMessage("Test cases refined successfully!");
              } else if (
                jsonData.message.includes("error") ||
                jsonData.message.includes("Error")
              ) {
                setError(jsonData.message);
                setShowErrorToast(true);
              }
              setIsRefinementInProgress(false); // Hide full-screen spinner
            }
          }
        }
      }
    } catch (error) {
      console.error("Error refining test cases:", error);
      setError(`Failed to refine test cases: ${error.message}`);
      setShowErrorToast(true);
      setIsRefinementInProgress(false); // Hide full-screen spinner on error
    }
  };

  const handleCreate = () => {
    setCreateFlag((prev) => !prev);
  };
  const handleHamburgerToggle = () => {
    setShowHamburgerMenu((prev) => !prev);
  };
  const handleOpenKnowledgeBase = () => {
    setShowHamburgerMenu(false);
    setCreateFlag(false);
    setShowJiraPopup(false);
    setShowDevOpsPopup(false);
    setShowKnowledgeBase(true);
  };

  // Coverage warning modal handlers
  const handleCoverageWarningClose = () => {
    setShowCoverageWarning(false);
    setCoverageWarningData(null);
    setPendingRefinementPrompt(null);
  };

  const handleCoverageWarningProceed = async () => {
    setShowCoverageWarning(false);

    // Proceed with the original refinement request by modifying it to force addition
    if (pendingRefinementPrompt) {
      const forcePrompt = `${pendingRefinementPrompt} (FORCE ADD: User confirmed to add despite coverage status)`;
      await handleRefinedTestCases(forcePrompt, responseData?.data?.message, conversationContext);
    }

    setCoverageWarningData(null);
    setPendingRefinementPrompt(null);
  };

  // Handler for regenerating test cases for missed requirements
  const handleRegenerateForMissed = async (missedRequirements) => {
    // Store current coverage data to preserve it
    const currentCoverageData = coverageData;

    const regeneratePrompt = `Generate test cases specifically for these missed requirements:\n\n${missedRequirements}\n\nEnsure each missed requirement is properly covered with appropriate test cases. IMPORTANT: When providing coverage analysis, include ALL requirements from the original analysis, not just the newly generated ones.`;

    // Set a flag to indicate this is a regeneration for missed requirements
    window.isRegeneratingMissed = true;
    window.originalCoverageData = currentCoverageData;

    await handleRefinedTestCases(
      regeneratePrompt,
      responseData?.data?.message,
      conversationContext
    );
  };

  // Fallback function for backward compatibility
  const handleTestCasesUpdate = (refinedTestCases) => {
    // This is kept for compatibility but the new flow uses handleRefinedTestCases
    console.log("handleTestCasesUpdate called (fallback):", refinedTestCases);
  };

  const handleDownloadRefined = async (format) => {
    try {
      const emailId = localStorage.getItem("Email");
      let endpoint;

      // Use different endpoint based on refinement intent
      if (refinementIntent === "IDENTIFICATION" && displayType === "identified") {
        endpoint =
          format === "excel"
            ? `${backend_baseURL}/download/excel/identified-test-cases?EmailId=${emailId}`
            : `${backend_baseURL}/download/pdf/identified-test-cases?EmailId=${emailId}`;
      } else {
        // For all modification types (ADDITION, REDUCTION, OPTIMIZATION), use refined endpoint
        endpoint =
          format === "excel"
            ? `${backend_baseURL}/download/excel/refined-test-cases?EmailId=${emailId}`
            : `${backend_baseURL}/download/pdf/refined-test-cases?EmailId=${emailId}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to download ${format} file`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `refined_test_cases.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage(`Refined test cases downloaded as ${format.toUpperCase()} successfully!`);
      setShowSuccessToast(true);
    } catch (error) {
      console.error(`Error downloading ${format}:`, error);
      setError(`Failed to download ${format} file: ${error.message}`);
      setShowErrorToast(true);
    }
  };
  const handleExcelFromUrl = async (urlData) => {
    setResponseData(null);
    setCreateFlag(false);
    // Show generation spinner instead of progress bar
    setIsGenerationInProgress(true);
    setGenerationProgress(0);
    setGenerationMessage("Processing Excel URL...");
    setGenerationSource("Document");
    setError("");
    setShowSuccessToast(false);
    setShowErrorToast(false);

    if (!urlData || !urlData.url) {
      setError("No valid URL provided!");
      setShowErrorToast(true);
      setIsGenerationInProgress(false);
      return;
    }

    const url = urlData.url.trim();

    // Validate URL format
    try {
      new URL(url); // This will throw an error if the URL is invalid
    } catch (err) {
      setError("Invalid URL format. Please provide a valid URL.");
      setShowErrorToast(true);
      setIsGenerationInProgress(false);
      return;
    }

    try {
      setGenerationProgress(20);
      setGenerationMessage("Fetching Excel file from URL...");

      // Create form data with URL
      const formData = new FormData();
      formData.append("file_url", url);
      formData.append("test_case_type", testCaseType);

      // Add email if available
      const emailId = localStorage.getItem("Email");
      if (emailId) {
        formData.append("EmailId", emailId);
      }

      setGenerationProgress(40);
      setGenerationMessage("Sending URL to server...");

      // Send request to backend
      const endPoint = backend_baseURL + "/upload_excel";

      fetch(endPoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`URL processing failed: ${response.status} - ${response.statusText}`);
          }

          if (!response.body) {
            throw new Error("No response body found!");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          let collectedData = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const events = text.split("\n\n");

            for (const event of events) {
              if (event.startsWith("data:")) {
                const jsonData = JSON.parse(event.replace("data: ", "").trim());

                console.log("Excel URL Event Data:", jsonData);

                if (jsonData.progress) {
                  setProgressBar(`${40 + jsonData.progress * 0.6}%`);
                }

                if (jsonData.message) {
                  setProgressMessage(jsonData.message);
                }

                if (jsonData.data) {
                  collectedData += jsonData.data + "\n---\n";
                }

                if (jsonData.progress === 100) {
                  let finalData =
                    collectedData.trim() !== "" ? collectedData.trim() : jsonData.data;

                  setResponseData({
                    status: 200,
                    data: { message: finalData },
                  });

                  setGeneratedResults("Generated Results for Excel from URL");
                  setSuccessMessage("Excel URL processing has been successful!");
                  setShowSuccessToast(true);

                  setTimeout(() => {
                    setIsGenerationInProgress(false);
                  }, 500);
                }
              }
            }
          }
        })
        .catch((error) => {
          console.error("Excel URL Processing Error:", error);
          setError(`Excel URL processing failed: ${error.message}`);
          setShowErrorToast(true);
          setIsGenerationInProgress(false);
        });
    } catch (error) {
      console.error("Error processing Excel URL:", error);
      setError(`Error processing Excel URL: ${error.message}`);
      setShowErrorToast(true);
      setIsGenerationInProgress(false);
    }
  };
  // Add this new function to handle Excel upload popup
  const handleExcelUploadPopup = (identifier) => {
    // setUploadPopup((prev) => ({ ...prev, flag: false }));
    setUploadPopup((prev) => ({ ...prev, identifier }));
    setShowExcelPopup(true);
  };
  // Add this new function to handle Excel file selection
  const handleExcelFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size should be less than 5MB.");
        setShowErrorToast(true);
      } else {
        const validExcelTypes = [
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel.sheet.macroEnabled.12",
        ];

        if (!validExcelTypes.includes(selectedFile.type)) {
          setError("Please upload a valid Excel file (.xls, .xlsx)");
          setShowErrorToast(true);
        } else {
          setExcelFile(selectedFile);
          setFile(selectedFile); // Also set the main file state
          setError("");
        }
      }
    }
  };
  useEffect(() => {
    function handleClickOutside(event) {
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target)) {
        if (!uploadPopup.flag && !showJiraPopup && !showDevOpsPopup && !showProgressBar) {
          setCreateFlag(false);
        }
      }
      if (hamburgerDropdownRef.current && !hamburgerDropdownRef.current.contains(event.target)) {
        setShowHamburgerMenu(false);
      }
    }

    if (createFlag || showHamburgerMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    createFlag,
    showHamburgerMenu,
    uploadPopup.flag,
    showJiraPopup,
    showDevOpsPopup,
    showProgressBar,
  ]);

  const toggleDownloadDropdown = () => {
    setDownloadDropdown(!downloadDropdown);
  };

  const handleClickOutsidedownloadDropdown = (event) => {
    if (!event.target.closest(".download-container")) {
      setDownloadDropdown(false);
    }
  };

  useEffect(() => {
    if (downloadDropdown) {
      document.addEventListener("click", handleClickOutsidedownloadDropdown);
    } else {
      document.removeEventListener("click", handleClickOutsidedownloadDropdown);
    }
    return () =>
      document.removeEventListener("click", handleClickOutsidedownloadDropdown);
  }, [downloadDropdown]);

  // const handleResponseFromJira = (testCases, type, inputs) => {
  //   console.log("fetched data :", testCases);
  //   console.log("type :", type);
  //   console.log("Data type of testCases:", typeof testCases);
  //   console.log("inputs ", inputs);
  //   if (inputs.error) {
  //     console.error("Error received from backend:", inputs.error);
  //     setError(inputs.error);
  //     setShowErrorToast(true);
  //     setShowJiraPopup(false);
  //     return;
  //   }
  //   setSuccessMessage(`Generation of data has been successful!`);
  //   setShowSuccessToast(true);
  //   setEpicInput(inputs.epic.epicInput);
  //   setUserStoryInput(inputs.userStory.userStoryInput);
  //   setJiraKey(inputs.key);

  //   // Check for empty strings after trimming whitespace
  //   if (
  //     inputs.epic.epicInput.trim() !== "" &&
  //     inputs.userStory.userStoryInput.trim() !== ""
  //   ) {
  //     setGeneratedResults(
  //       "Generated Test Cases for the User Story : " +
  //         inputs.userStory.userStoryName +
  //         " " +
  //         "(" +
  //         inputs.userStory.userStoryInput +
  //         ")",
  //     );
  //   } else if (
  //     inputs.epic.epicInput.trim() !== "" &&
  //     inputs.userStory.userStoryInput.trim() === ""
  //   ) {
  //     setGeneratedResults(
  //       "Generated User Stories for the Epic : " +
  //         inputs.epic.epicName +
  //         " " +
  //         "(" +
  //         inputs.epic.epicInput +
  //         ")",
  //     );
  //   }

  //   setJiraTestCaseType(type);
  //   resetDisplayState(); // Reset display state for new original data
  //   setGenerationSource("Jira"); // Set source for potential subsequent operations
  //   setResponseData({
  //     status: 200,
  //     data: {
  //       message: testCases,
  //       // message: typeof testCases === "string" ? testCases : JSON.stringify(testCases, null, 2),
  //     },
  //   });

  //   // Set conversation context for Jira
  //   setConversationContext({
  //     requirementSummary: `Epic: ${inputs.epic.epicName} (${inputs.epic.epicInput})\nUser Story: ${inputs.userStory.userStoryName} (${inputs.userStory.userStoryInput})`,
  //     generatedFrom: "jira",
  //   });

  //   setShowJiraPopup(false);
  // };
  // B) Make your success handler title dynamic for artifact types:
  const handleResponseFromJira = (payload, type, inputs) => {
    if (inputs?.error) {
      setError(inputs.error);
      setShowErrorToast(true);
      setShowJiraPopup(false);
      return;
    }

    const epicKey = inputs?.epic?.epicInput?.trim();
    const epicName = inputs?.epic?.epicName || "";
    const storyKey = inputs?.userStory?.userStoryInput?.trim();
    const storyName = inputs?.userStory?.userStoryName || "";
    const artifact = (inputs?.artifact || "").toLowerCase(); // "features" | "user-stories" | ""

    // Header
    if (artifact === "features" && storyKey) {
      setGeneratedResults(
        `Generated Feature Files for User Story: ${storyName} (${storyKey})`
      );
    } else if (artifact === "user-stories" && epicKey) {
      setGeneratedResults(
        `Generated User Stories for Epic: ${epicName} (${epicKey})`
      );
    } else {
      // fallback to your existing titles (test-case flow)
      if (epicKey && storyKey) {
        setGeneratedResults(
          `Generated Test Cases for the User Story: ${storyName} (${storyKey})`
        );
      } else if (epicKey && !storyKey) {
        setGeneratedResults(
          `Generated User Stories for the Epic: ${epicName} (${epicKey})`
        );
      } else {
        setGeneratedResults("Generated Results");
      }
    }

    // Save data
    setJiraTestCaseType(type); // "Features" in feature mode is fine
    resetDisplayState();
    setGenerationSource("Jira");
    
    setResponseData({ status: 200, data: { message: payload } });

    setConversationContext({
      requirementSummary: `Epic: ${epicName} (${
        epicKey || "-"
      })\nUser Story: ${storyName} (${storyKey || "-"})`,
      generatedFrom: "jira",
    });

    setShowJiraPopup(false);
  };

  const handleToggleView = (tab) => {
    setViewTab(tab);
    localStorage.setItem("lastViewTab", tab);

    if (tab === "testcases") {
      const tc =
        localStorage.getItem("lastJiraTestCases") ||
        responseData?.data?.message ||
        "";
      setResponseData({
        status: 200,
        data: { message: tc, title: responseData?.data?.title || "Test Cases" },
      });
      setDisplayType("original");
    } else {
      const code =
        automation.markdown || localStorage.getItem("lastJiraAutomation") || "";

      // ⬇️ DO NOT CHANGE THE TITLE — keep whatever is currently on screen
      const stableTitle =
        responseData?.data?.title ||
        (generatedResults ? generatedResults : "Generated Results");

      setResponseData({
        status: 200,
        data: { message: code, title: stableTitle },
      });
      setDisplayType("identified"); // or whatever tag you need; title won’t change
    }
  };

  useEffect(() => {
    setUploadPopup((prev) => ({ ...prev, flag: false }));
  }, [file]);

  // Handler for DevOps response
  const handleResponseFromDevOps = (testCases, type, inputs) => {
    setCreateFlag(false);

    console.log("fetched DevOps data:", testCases);
    console.log("DevOps type:", type);
    console.log("Data type of DevOps testCases:", typeof testCases);
    if (inputs.error) {
      console.error("Error received from DevOps backend:", inputs.error);
      setError(inputs.error);
      setShowErrorToast(true);
      setShowDevOpsPopup(false);
      return;
    }
    setSuccessMessage(`Generation of DevOps data has been successful!`);
    setShowSuccessToast(true);
    setProjectInput(inputs.projectInput);
    setWorkItemInput(inputs.workItemInput);
    setDevOpsKey(inputs.key);
    if (inputs.projectInput !== "" && inputs.workItemInput !== "") {
      console.log(inputs.projectInput);
      console.log(inputs.workItemInput);
      setGeneratedResults("Generated Test Cases for the Selected Work Item");
    } else if (inputs.projectInput !== "" && inputs.workItemInput === "") {
      setGeneratedResults("Generated Work Items for the Selected Project");
    }
    setDevOpsTestCaseType(type);
    resetDisplayState(); // Reset display state for new original data
    setGenerationSource("DevOps"); // Set source for potential subsequent operations
    setResponseData({
      status: 200,
      data: {
        message: testCases,
      },
    });

    // Set conversation context for DevOps
    setConversationContext({
      requirementSummary: `Project: ${inputs.projectInput}\nWork Item: ${inputs.workItemInput}`,
      generatedFrom: "devops",
    });

    setShowDevOpsPopup(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB.");
    } else {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleToggle = () => {
    setIsChecked((prevIsChecked) => {
      const newCheckedState = !prevIsChecked;
      setTestCaseType(newCheckedState ? "Automated Test Cases" : "Manual Test Cases");
      return newCheckedState;
    });
  };

  useEffect(() => {
    console.log("Updated testCaseType:", testCaseType);
  }, [testCaseType]);

  // Add this new function to handle Excel file upload
  const handleExcelFileUpload = async (fileOrUrl) => {
    setResponseData(null);
    setCreateFlag(false);
    setProgressBar("0%");
    setProgressMessage("Processing Excel file...");
    setShowProgressBar(true);
    setError("");
    setShowSuccessToast(false);
    setShowErrorToast(false);

    // If it's a URL object (from the URL input field)
    if (fileOrUrl && fileOrUrl.url) {
      handleExcelFromUrl(fileOrUrl);
      return;
    }

    if (!excelFile) {
      setError("No Excel file selected!");
      setShowErrorToast(true);
      setShowProgressBar(false);
      return;
    }

    // If it's a file object (from direct file upload)
    if (fileOrUrl) {
      // Set Excel file and close popup
      setExcelFile(fileOrUrl);
      setShowExcelPopup(false); // Close popup after file selection
      try {
        // Show initial progress
        setProgressBar("10%");
        setProgressMessage("Parsing Excel file...");

        // Parse the Excel file
        const excelData = await ExcelHandler.parseExcelFile(excelFile);
        setProgressBar("30%");
        setProgressMessage("Validating Excel content...");

        // Prepare form data for upload
        const formData = await ExcelHandler.prepareExcelForUpload(excelFile, (progress) => {
          setProgressBar(`${30 + progress * 0.2}%`);
        });

        // Add test case type
        formData.append("test_case_type", testCaseType);

        // Add email if available
        const emailId = localStorage.getItem("Email");
        if (emailId) {
          formData.append("EmailId", emailId);
        }

        setProgressBar("50%");
        setProgressMessage("Uploading Excel file...");

        // Reset file states to hide the success icon
        setExcelFile(null);
        setFile(null);

        // Send to backend
        const endPoint = backend_baseURL + "/upload_excel";

        fetch(endPoint, {
          method: "POST",
          body: formData,
          credentials: "include",
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`Upload failed: ${response.status} - ${response.statusText}`);
            }

            if (!response.body) {
              throw new Error("No response body found!");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let collectedData = "";

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

              const text = decoder.decode(value, { stream: true });
              const events = text.split("\n\n");

              for (const event of events) {
                if (event.startsWith("data:")) {
                  const jsonData = JSON.parse(event.replace("data: ", "").trim());

                  console.log("Excel URL Event Data:", jsonData);

                  if (jsonData.progress) {
                    setProgressBar(`${40 + jsonData.progress * 0.6}%`);
                  }

                  if (jsonData.message) {
                    setProgressMessage(jsonData.message);
                  }

                  if (jsonData.data) {
                    collectedData += jsonData.data + "\n---\n";
                  }

                  if (jsonData.progress === 100) {
                    let finalData =
                      collectedData.trim() !== "" ? collectedData.trim() : jsonData.data;

                    setResponseData({
                      status: 200,
                      data: { message: finalData },
                    });

                    setGeneratedResults("Generated Results for Excel from URL");
                    setSuccessMessage("Excel URL processing has been successful!");
                    setShowSuccessToast(true);

                    setTimeout(() => {
                      setShowProgressBar(false);
                    }, 500);
                  }
                }
              }
            }
          })
          .catch((error) => {
            console.error("Excel Upload Error:", error);
            setError(`Excel upload failed: ${error.message}`);
            setShowErrorToast(true);
            setShowProgressBar(false);
          });
      } catch (error) {
        console.error("Error processing Excel file:", error);
        setError(`Error processing Excel file: ${error.message}`);
        setShowErrorToast(true);
        setShowProgressBar(false);
      }
    }
  };
  useEffect(() => {
    if (excelFile) {
      setShowExcelPopup(false);
      // You might want to trigger upload here or keep it manual
    }
  }, [excelFile]);
  // Add this new function to close the Excel popup
  const handleExcelPopupClose = () => {
    setShowExcelPopup(false);
    setExcelFile(null);
  };

  const handleFileUpload = async () => {
    setResponseData(null);
    setCreateFlag(false);
    setProgressBar("0%");
    setProgressMessage("Initializing Function");
    setShowProgressBar(false);
    setError("");
    setShowSuccessToast(false); // Reset success toaster
    setShowErrorToast(false); // Reset error toaster
    setJiraTestCaseType("");
    setDevOpsTestCaseType("");

    if (!file) {
      setError("No file selected!");
      setShowErrorToast(true);
      return;
    }

    const formData = new FormData();
    formData.append("files", file);
    formData.append("test_case_type", testCaseType);

    let endPoint =
      uploadPopup.identifier === "code"
        ? `${backend_baseURL}/upload_code`
        : uploadPopup.identifier === "Document"
        ? `${backend_baseURL}/upload_documents`
        : uploadPopup.identifier === "Excel"
        ? `${backend_baseURL}/upload_excel`
        : "";

    if (!endPoint) {
      console.error("Invalid upload type");
      setError("Invalid upload type selected!");
      setShowErrorToast(true);
      setShowProgressBar(false);
      return;
    }

    // Append request params
    const emailId = localStorage.getItem("Email");
    const params = new URLSearchParams();
    //const docSource = "Code";
    if (emailId) params.append("EmailId", emailId);
    if (uploadPopup.identifier === "Document" && documentDescription) {
      params.append("document_description", documentDescription);
    }
    endPoint += `?${params.toString()}`;

    try {
      // Reset file state to hide the success icon
      setFile(null);
      setIsGenerationInProgress(true);
      setGenerationProgress(0);
      setGenerationMessage("Uploading document...");
      if (uploadPopup.identifier === "Document") {
        setGenerationSource("Document");
      } else if (uploadPopup.identifier === "Code") {
        setGenerationSource("Code");
      }

      fetch(endPoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      })
        .then(async (response) => {
          if (!response.ok) {
            console.error(`Upload failed: ${response.status} - ${response.statusText}`);
            setError(`Upload failed: ${response.status} - ${response.statusText}`);
            setShowErrorToast(true);
            setShowProgressBar(false);
            return;
          }

          if (!response.body) {
            setError("No response body found!");
            setShowErrorToast(true);
            setIsGenerationInProgress(false);
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          let collectedData = "";
          let title = "";

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
                  setGenerationProgress(jsonData.progress);
                }

                if (jsonData.message) {
                  setGenerationMessage(jsonData.message);
                }

                if (jsonData.data) {
                  collectedData += jsonData.data + "\n---\n";
                }

                if (jsonData.progress === 100) {
                  let finalData =
                    collectedData.trim() !== "" ? collectedData.trim() : jsonData.data;

                  setResponseData({
                    status: 200,
                    data: { message: finalData },
                  });
                  setGeneratedResults("Generated Results for " + jsonData.title);

                  // Extract and set coverage data if available
                  console.log("Checking for coverage data in jsonData:", jsonData);
                  if (jsonData.coverage) {
                    console.log("Coverage data found:", jsonData.coverage);
                    // If this was a regeneration for missed requirements, merge with original coverage
                    if (window.isRegeneratingMissed && window.originalCoverageData) {
                      const originalCoverage = window.originalCoverageData;
                      const newCoverage = jsonData.coverage;

                      // Create a map to track unique requirements
                      const requirementMap = new Map();

                      // Add all original requirements
                      originalCoverage.detailed_analysis.forEach((req) => {
                        requirementMap.set(req.requirement, req);
                      });

                      // Update with new coverage data
                      newCoverage.detailed_analysis.forEach((req) => {
                        if (requirementMap.has(req.requirement)) {
                          // Update existing requirement with new coverage status
                          const existing = requirementMap.get(req.requirement);
                          requirementMap.set(req.requirement, {
                            ...existing,
                            covered: req.covered || existing.covered,
                            covering_test_cases: [
                              ...(existing.covering_test_cases || []),
                              ...(req.covering_test_cases || []),
                            ].filter((v, i, a) => a.indexOf(v) === i),
                          });
                        } else {
                          // Add new requirement
                          requirementMap.set(req.requirement, req);
                        }
                      });

                      const mergedAnalysis = Array.from(requirementMap.values());
                      const coveredCount = mergedAnalysis.filter((req) => req.covered).length;

                      const mergedCoverage = {
                        ...newCoverage,
                        detailed_analysis: mergedAnalysis,
                        total_requirements: mergedAnalysis.length,
                        covered_requirements: coveredCount,
                        coverage_percentage: Math.round(
                          (coveredCount / mergedAnalysis.length) * 100
                        ),
                      };

                      setCoverageData(mergedCoverage);

                      // Clean up flags
                      window.isRegeneratingMissed = false;
                      window.originalCoverageData = null;
                    } else {
                      setCoverageData(jsonData.coverage);
                    }
                  } else {
                    console.log("No coverage data found in response, jsonData:", jsonData);
                  }

                  // Extract requirements for display
                  if (jsonData.extracted_requirements) {
                    setExtractedRequirements(jsonData.extracted_requirements);
                  }

                  // Set conversation context for file uploads
                  setConversationContext({
                    requirementSummary: `Document: ${
                      jsonData.title || file?.name || "Uploaded file"
                    }\nTest Case Type: ${testCaseType}`,
                    generatedFrom: uploadPopup.identifier || "upload",
                  });

                  setSuccessMessage("Generation of data has been successful!");
                  setShowSuccessToast(true);
                  setTimeout(() => {
                    setIsGenerationInProgress(false);
                  }, 500);
                }
              }
            });
          }
        })
        .catch((error) => {
          console.error("SSE Fetch Error:", error);
          setError(`Upload failed: ${error.message}`);
          setShowErrorToast(true);
          setIsGenerationInProgress(false);
        });
    } catch (error) {
      console.error("Error uploading files:", error);
      setError(`Error uploading files: ${error.message}`);
      setShowErrorToast(true);
      setIsGenerationInProgress(false);
    }
  };

  const handleClear = () => {
    // setCreateFlag(false);
    setFile(null);
    setTestCaseType("Manual Test Cases");
    setIsChecked(false);
  };

  const handleUploadPopup = (text) => {
    setShowJiraPopup(false); // close Jira creation
    setShowJiraUpload(false); // close Jira upload
    setShowDevOpsPopup(false); // close DevOps if needed
    setUploadPopup((prev) => ({ ...prev, flag: true, identifier: text }));
  };

  const handleClose = () => {
    setUploadPopup((prev) => ({ ...prev, flag: false }));
    setFile(null);
  };

  const downloadPdf = async (endpoint, fileType, filenamePrefix) => {
    try {
      const response = await axios.get(endpoint, {
        responseType: "blob",
        withCredentials: true,
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: fileType });

        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(now.getDate()).padStart(2, "0")}`;
        const formattedTime = `${String(now.getHours()).padStart(2, "0")}-${String(
          now.getMinutes()
        ).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
        const dateTime = `${formattedDate}_${formattedTime}`;

        const filename = `${filenamePrefix}_${dateTime}.pdf`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Failed to download file", response.data);
      }
    } catch (error) {
      console.error("Download failed", error.response ? error.response.data : error.message);
    }
  };

  const downloadExcel = async (endpoint, fileType, filenamePrefix) => {
    try {
      const response = await axios.get(endpoint, {
        responseType: "blob",
        withCredentials: true,
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: fileType });

        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(now.getDate()).padStart(2, "0")}`;
        const formattedTime = `${String(now.getHours()).padStart(2, "0")}-${String(
          now.getMinutes()
        ).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
        const dateTime = `${formattedDate}_${formattedTime}`;

        const filename = `${filenamePrefix}_${dateTime}.xlsx`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Failed to download file", response.data);
      }
    } catch (error) {
      console.error("Download failed", error.response ? error.response.data : error.message);
    }
  };

  const downloadZip = async (endpoint, fileType, filenamePrefix) => {
    try {
      const response = await axios.get(endpoint, {
        responseType: "blob",
        withCredentials: true,
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: fileType });

        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(now.getDate()).padStart(2, "0")}`;
        const formattedTime = `${String(now.getHours()).padStart(2, "0")}-${String(
          now.getMinutes()
        ).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
        const dateTime = `${formattedDate}_${formattedTime}`;

        const filename = `${filenamePrefix}_${dateTime}.zip`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Failed to download file", response.data);
      }
    } catch (error) {
      console.error("Download failed", error.response ? error.response.data : error.message);
    }
  };

  // The main downloadFile function, modified to call the appropriate download function
  const downloadFile = async (downloadType) => {
    const email = localStorage.getItem("Email");
    console.log("email", email);
    console.log("test case type", testCaseType);
    console.log("jira test case type: ", jiraTestCaseType);
    console.log("display type", displayType);
    console.log("current display data", currentDisplayData);

    let endpoint;
    let fileType;
    let filenamePrefix;

    console.log(downloadType);

    // For modified/refined content, the regular endpoints will work since
    // the content is already stored in ManualTestCases field in the database

    if (jiraTestCaseType === "Manual Test Cases") {
      if (downloadType === "pdf") {
        endpoint = `${backend_baseURL}/download/jira-test-cases?EmailId=${email}`;
        fileType = "application/pdf";
        filenamePrefix = "Jira_Manual_Test_Cases";
        await downloadPdf(endpoint, fileType, filenamePrefix);
      } else if (downloadType === "excel") {
        console.log(epicInput);
        console.log(userStoryInput);
        if (epicInput && !userStoryInput) {
          endpoint = backend_baseURL + `/download/excel/jira-user-stories?EmailId=` + email;
          filenamePrefix = "Jira_User_Stories_Excel";
        } else if (epicInput && userStoryInput) {
          endpoint = backend_baseURL + `/download/excel/jira-manual-test-cases?EmailId=` + email;
          filenamePrefix = "Jira_Test_Data_Excel";
        }
        await downloadExcel(
          endpoint,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          filenamePrefix
        );
      }
    } else if (devOpsTestCaseType === "Manual Test Cases") {
      debugger;
      if (downloadType === "pdf") {
        endpoint = `${backend_baseURL}/devops/download-pdf?EmailId=${email}`;
        fileType = "application/pdf";
        filenamePrefix = "azure-devops-generated-data";
        await downloadPdf(endpoint, fileType, filenamePrefix);
      } else if (downloadType === "excel") {
        console.log(projectInput);
        console.log(workItemInput);
        if (projectInput && !workItemInput) {
          endpoint = backend_baseURL + `/download/excel/devops-work-items?EmailId=` + email;
          filenamePrefix = "DevOps_Work_Items_Excel";
        } else if (projectInput && workItemInput) {
          endpoint = backend_baseURL + `/devops/download-excel?EmailId=` + email;
          filenamePrefix = "DevOps_Test_Data_Excel";
        }
        await downloadExcel(
          endpoint,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          filenamePrefix
        );
      }
    } else if (testCaseType === "Manual Test Cases") {
      if (downloadType === "pdf") {
        endpoint = `${backend_baseURL}/download/manual-test-cases?EmailId=${email}`;
        fileType = "application/pdf";
        filenamePrefix = "Manual_Test_Cases";
        await downloadPdf(endpoint, fileType, filenamePrefix);
      } else if (downloadType === "excel") {
        endpoint = `${backend_baseURL}/download/excel/manual-test-cases?EmailId=${email}`;
        fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filenamePrefix = "Manual_Test_Cases_Excel";
        await downloadExcel(endpoint, fileType, filenamePrefix);
      }
    } else if (testCaseType === "Automated Test Cases") {
      endpoint = `${backend_baseURL}/download/automated-test-cases?EmailId=${email}`;
      fileType = "application/zip";
      filenamePrefix = "Automated_Test_Cases";
      await downloadZip(endpoint, fileType, filenamePrefix);
    }
  };

  const redirectToJira = async () => {
    // First check if we already have a valid token
    if (JiraTokenService.hasValidToken() || JiraTokenService.isAuthenticated()) {
      console.log("Using existing Jira token");
      // Set the popup state directly instead of redirecting
      setShowJiraPopup(true);
      return;
    }

    localStorage.setItem("authType", "jira");
    const jiraAuthApi = backend_baseURL + "/jira-oauth/authorize";

    try {
      window.location.href = jiraAuthApi;
      console.log("Redirecting to Jira " + jiraAuthApi);
      setJiraRedirectStatus(true);
    } catch (error) {
      console.error("Error redirecting to Jira:", error);
    }
  };

  const jiraAuthorizationURL =
    (typeof window !== "undefined" && window.jiraAuthApi) ||
    `${backend_baseURL}/jira-oauth/authorize`;

  const redirectToJiraFeature = async () => {
    setJiraCreateMode("feature");
    // If already authenticated, open the Jira popup in "feature" mode
    if (
      JiraTokenService.hasValidToken() ||
      JiraTokenService.isAuthenticated()
    ) {
      // <--- important
      setShowJiraPopup(true);
      return;
    }

    // Otherwise kick off OAuth (same flow as redirectToJira)
    try {
      localStorage.setItem("authType", "jira");
      window.location.href = jiraAuthorizationURL;
      setJiraRedirectStatus(true);
    } catch (error) {
      console.error("Error redirecting to Jira (feature):", error);
    }
  };

  const handleCloseJiraPopup = () => {
    setShowJiraPopup(false);
    setJiraRedirectStatus(false);
  };
  // Add functions for DevOps
  const redirectToDevOps = async () => {
    // First check if we already have a valid token
    if (DevOpsTokenService.hasValidToken()) {
      console.log("Using existing DevOps token");
      // Set the popup state directly instead of redirecting
      setShowDevOpsPopup(true);
      return;
    }
    localStorage.setItem("authType", "devops");

    const devOpsAuthApi = backend_baseURL + "/azure-devops-oauth/authorize";

    try {
      window.location.href = devOpsAuthApi;
      console.log("Redirecting to DevOps " + devOpsAuthApi);
      setDevOpsRedirectStatus(true);
    } catch (error) {
      console.error("Error redirecting to DevOps:", error);
    }
  };

  return (
    <>
      <div className="container-fluid">
        <div className="main-body">
          {showHistory && (
            <div className="leftnav mt-3">
              <div className="logo mb-2">
                <img src={mainLogo} alt="Login Logo Banner" />
              </div>
              <LeftPane />
            </div>
          )}
          <div className="play-screen">
            <header>
              <div className="main-header">
                <div
                  className="pos-rel d-flex align-items-center justify-content-between"
                  style={{ width: "100%" }}
                >
                  {/* Logo + Button + Dropdown Container */}
                  <div
                    className="d-flex align-items-center justify-content-between gap-4"
                    style={{ position: "relative" }}
                  >
                    <img src={mainLogo} alt="Evoke Technologies Logo" style={{ height: "40px" }} />

                    {/* <div className="hamburger-container" ref={hamburgerDropdownRef}>
                      <button
                        className="hamburger-button"
                        onClick={handleHamburgerToggle}
                        aria-label="Open menu"
                      >
                        <img src={menuIcon} alt="Menu" />
                      </button>
                      {showHamburgerMenu && (
                        <div className="create-new-card card">
                          <ul className="create-new-dropdown">
                            <li
                              onClick={() => {
                                resetJiraGeneration();
                                handleCreate();
                                setShowHamburgerMenu(false);
                              }}
                            >
                              Create New
                            </li>
                            <li onClick={handleOpenKnowledgeBase}>Knowledge Base Upload</li>
                          </ul>
                        </div>
                      )}
                      {createFlag && (
                        <div
                          ref={createDropdownRef}
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            zIndex: 1000,
                          }}
                        >
                          <CreateList
                            uploadPopup={uploadPopup}
                            handleUploadPopup={handleUploadPopup}
                            successIconTick={successIconTick}
                            file={file}
                            handleClear={handleClear}
                            handleFileUpload={handleFileUpload}
                            handleToggle={handleToggle}
                            isChecked={isChecked}
                            redirectToJira={redirectToJira}
                            redirectToJiraFeature={redirectToJiraFeature}
                            redirectToDevOps={redirectToDevOps}
                            handleExcelUploadPopup={handleExcelUploadPopup}
                            handleOpenJiraAnalysis={() => {
                              setUploadPopup({ flag: false, identifier: "" });
                              setShowJiraPopup(false);
                              setShowJiraUpload(false);
                              setShowDevOpsPopup(false);
                              if (JiraTokenService.hasValidToken()) {
                                setShowJiraAnalysisPopup(true);
                              } else {
                                redirectToJira();
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* TOASTER ALERTS */}
                  <div>
                    {showErrorToast && (
                      <div className="alert alert-danger dashboard-toster d-flex justify-content-between align-items-center">
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

                    {showSuccessToast && (
                      <div className="alert alert-primary dashboard-toster d-flex justify-content-between align-items-center">
                        <img src={tosterCheckIcon} alt="Success Check" />
                        <span className="vert-mdle">{successMessage}</span>
                        <img
                          className="close-icon-green"
                          src={successIcon}
                          alt="Close"
                          onClick={() => setShowSuccessToast(false)}
                        />
                      </div>
                    )}
                  </div>
                  {/* Profile */}
                  <ProfileComponent profileFlag={profileFlag} setProfileFlag={setProfileFlag} />
                </div>
              </div>
            </header>
            {/* TOASTER ALERTS PLACED PROPERLY BELOW THE CREATE NEW SECTION */}
            {/*  <div className="toaster-container"> */}
            {/* Failure Toaster */}
            {/* {showErrorToast && ( */}
            {/* <div className="alert alert-danger dashboard-toster"> */}
            {/* <span className="vert-mdle"> */}
            {/* <strong>Error:</strong> {error} */}
            {/* </span> */}
            {/* <img */}
            {/* className="close-icon-red" */}
            {/* src={successIcon} */}
            {/* alt="Close" */}
            {/* onClick={() => setShowErrorToast(false)} */}
            {/* /> */}
            {/* </div> */}
            {/* )} */}

            {/* Success Toaster */}
            {/* {showSuccessToast && ( */}
            {/* <div className="alert alert-primary dashboard-toster"> */}
            {/* <img src={tosterCheckIcon} alt="Success Check" /> */}
            {/* <span className="vert-mdle"> */}
            {/* {" "} */}
            {/* Generation of data has been successful! */}
            {/* </span> */}
            {/* <img */}
            {/* className="close-icon-green" */}
            {/* src={successIcon} */}
            {/* alt="Close" */}
            {/* onClick={() => setShowSuccessToast(false)} */}
            {/* /> */}
            {/* </div> */}
            {/* )} */}
            {/* </div> */}
            {showProgressBar && !isGenerationInProgress && (
              <ProgressBar progressBar={progressBar} progressMessage={progressMessage} />
            )}

            {/* {progressBar !== '0%' && <ProgressBar  progressBar={progressBar}/>

                        } */}

            <div className="landing-body pos-rel">
              {responseData?.status === 200 && responseData?.data ? (
                <>
                  {/* Generated Results Section */}
                  <div className="product-list">
                    <div className="product-title-header">
                      <div className="d-flex just-space-btwn">
                        <h2
                          style={{
                            marginBottom: 0,
                            fontSize: `calc(0.6rem + 0.9vw)`,
                            padding: `0 10px`,
                          }}
                        >
                          <strong>
                            {generatedResults || "Generated Results"}
                            {displayType === "modified" && (
                              <span
                                style={{
                                  fontSize: "0.8em",
                                  color: "#28a745",
                                  marginLeft: "10px",
                                  fontWeight: "normal",
                                }}
                              >
                                {refinementIntent === "ADDITION" && "(Added)"}
                                {refinementIntent === "REDUCTION" && "(Reduced)"}
                                {refinementIntent === "OPTIMIZATION" && "(Optimized)"}
                                {!refinementIntent && "(Modified)"}
                              </span>
                            )}
                          </strong>
                        </h2>
                        <ul className="product-list-controlls">
                          {canShowAutomationButton() && (
                            <li className="jira-upload">
                              <button
                                type="button" // IMPORTANT: no form submit
                                className="download-btn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleGenerateAutomation();
                                }}
                                disabled={isAutomationGenerating}
                                title="Generate automated scripts from Jira test cases"
                                style={{
                                  opacity: isAutomationGenerating ? 0.7 : 1,
                                }}
                              >
                                {isAutomationGenerating ? (
                                  <span
                                    className="sc-spinner"
                                    aria-label="loading"
                                    style={{
                                      display: "inline-block",
                                      width: 18,
                                      height: 18,
                                      border: "2px solid #fff",
                                      borderTopColor: "transparent",
                                      borderRadius: "50%",
                                      marginRight: 8,
                                      animation: "scSpin 0.8s linear infinite",
                                    }}
                                  />
                                ) : (
                                  <img
                                    src={downloadIcon}
                                    alt="Generate"
                                    style={{
                                      cursor: "pointer",
                                      marginRight: 6,
                                    }}
                                  />
                                )}
                                <strong>
                                  {isAutomationGenerating
                                    ? "Generating…"
                                    : "Generate Automated Scripts"}
                                </strong>
                              </button>
                            </li>
                          )}

                          {isManual && (
                            <li className="jira-upload">
                              <button
                                className="download-btn"
                                onClick={handleOpenJiraUpload}
                              >
                                <img
                                  src={uploadIcon}
                                  alt="Upload to Jira"
                                  style={{ cursor: "pointer" }}
                                />
                                <strong>Jira Upload</strong>
                              </button>
                            </li>
                          )}

                          <li className="download-container jira-upload">
                            <button
                              className="download-btn"
                              onClick={toggleDownloadDropdown}
                            >
                              <img
                                src={downloadIcon}
                                // onClick={downloadFile}
                                alt="Download Icon"
                              />
                              <strong>Download</strong>
                            </button>

                            {downloadDropdown && (
                              <ul className="download-dropdown">
                                {jiraTestCaseType === "Manual Test Cases" ? (
                                  <>
                                    <li
                                      onClick={() => {
                                        downloadFile("pdf");
                                      }}
                                    >
                                      <img
                                        src={pdf}
                                        alt="PDF Icon"
                                        style={{
                                          width: "40px",
                                          paddingLeft: "8px",
                                          paddingRight: "8px",
                                        }}
                                      />
                                      <a href="#">Export as PDF</a>
                                    </li>
                                    <li
                                      onClick={() => {
                                        downloadFile("excel");
                                      }}
                                    >
                                      <img
                                        src={excel}
                                        alt="Excel Icon"
                                        style={{
                                          width: "40px",
                                          paddingLeft: "8px",
                                          paddingRight: "8px",
                                        }}
                                      />
                                      <a href="#">Export as Excel</a>
                                    </li>
                                  </>
                                ) : testCaseType === "Manual Test Cases" ? (
                                  <>
                                    <li
                                      onClick={() => {
                                        downloadFile("pdf");
                                      }}
                                    >
                                      <img
                                        src={pdf}
                                        alt="PDF Icon"
                                        style={{
                                          width: "40px",
                                          paddingLeft: "8px",
                                          paddingRight: "8px",
                                        }}
                                      />
                                      <a href="#">Export as PDF</a>
                                    </li>
                                    <li
                                      onClick={() => {
                                        downloadFile("excel");
                                      }}
                                    >
                                      <img
                                        src={excel}
                                        alt="Excel Icon"
                                        style={{
                                          width: "40px",
                                          paddingLeft: "8px",
                                          paddingRight: "8px",
                                        }}
                                      />
                                      <a href="#">Export as Excel</a>
                                    </li>
                                  </>
                                ) : (
                                  <li
                                    onClick={() => {
                                      downloadFile("zip");
                                    }}
                                  >
                                    <img
                                      src={zip}
                                      alt="Zip Icon"
                                      style={{
                                        paddingLeft: "8px",
                                        paddingRight: "8px",
                                      }}
                                    />
                                    <a href="#">Export as Zip</a>
                                  </li>
                                )}
                              </ul>
                            )}
                          </li>

                          {/* <li>
                            <img
                              src={downloadIcon}
                              onClick={downloadFile}
                              alt="Download Icon"
                            />
                          </li> */}
                        </ul>
                        {showJiraUpload && (
                          <JiraUploadDropdown
                            onClose={() => setShowJiraUpload(false)}
                            onSuccess={handleJiraUploadSuccess}
                          />
                        )}
                      </div>
                      {(automation.markdown ||
                        localStorage.getItem("lastJiraAutomation")) && (
                        <div className="sc-toggle-wrap">
                          <div
                            className="sc-view-toggle"
                            role="tablist"
                            aria-label="View Switch"
                          >
                            <button
                              type="button"
                              role="tab"
                              aria-selected={viewTab === "testcases"}
                              className={`sc-seg ${
                                viewTab === "testcases" ? "active" : ""
                              }`}
                              onClick={() => handleToggleView("testcases")}
                            >
                              <strong>Test Cases</strong>
                            </button>
                            <button
                              type="button"
                              role="tab"
                              aria-selected={viewTab === "automation"}
                              className={`sc-seg ${
                                viewTab === "automation" ? "active" : ""
                              }`}
                              onClick={() => handleToggleView("automation")}
                            >
                              <strong>Automation Scripts</strong>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Response Data */}
                  <div className="response-data">
                    {/* Coverage Display */}
                    {/* {coverageData && (
                      <CoverageDisplay
                        coverageData={coverageData}
                        showDetails={true}
                      />
                    )} */}

                    {/* Requirements List */}
                    {coverageData && (
                      <RequirementsList
                        coverageData={coverageData}
                        extractedRequirements={extractedRequirements}
                        onRegenerateForMissed={handleRegenerateForMissed}
                        isVisible={true}
                      />
                    )}

                    <div className="content-text">
                      <div className="markdown-body">
                        <MarkdownStyles
                          key={`${displayType}-${responseData?.data?.message?.length || 0}`}
                          content={responseData?.data?.message}
                          initialFilter={testCaseFilter}
                          onFilterChange={handleTestCaseFilterChange}
                        />
                      </div>

                      {/* Refinement section moved to floating chat button */}

                      {/* Refined Test Cases Section */}
                      {refinedTestCases && (
                        <div className="refined-test-cases-section">
                          <div className="refined-header">
                            <h3 className="refined-title">
                              {refinedTestCases?.data?.title || "Refined Test Cases"}
                            </h3>
                            <div className="refined-actions">
                              <button
                                className="download-btn excel-btn"
                                onClick={() => handleDownloadRefined("excel")}
                                title="Download Refined Test Cases as Excel"
                              >
                                <img src={excel} alt="Excel" />
                                Excel
                              </button>
                              <button
                                className="download-btn pdf-btn"
                                onClick={() => handleDownloadRefined("pdf")}
                                title="Download Refined Test Cases as PDF"
                              >
                                <img src={pdf} alt="PDF" />
                                PDF
                              </button>
                            </div>
                          </div>
                          <div className="refined-content">
                            <div className="markdown-body">
                              <MarkdownStyles
                                content={refinedTestCases?.data?.message}
                                initialFilter="all"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="d-flex align-items-center justify-content-between flex-column page-container">
                  <div className="w-100 d-flex align-items-center justify-content-center flex-column page-container-header-text">
                    {/* <img src={landingScreen} alt="Landing Screen Icon" /> */}
                    <h4 className="landing-empty-header">QA Accelerator</h4>
                    <p className="content-text">
                      Our QA accelerator connects with your code, documents and Jira/Azure DevOps to
                      generate test cases, automate execution, and speed up release cycles without
                      compromising quality.
                    </p>
                  </div>

                  <ListCards
                    uploadPopup={uploadPopup}
                    handleUploadPopup={handleUploadPopup}
                    successIconTick={successIconTick}
                    file={file}
                    handleClear={handleClear}
                    handleFileUpload={handleFileUpload}
                    handleToggle={handleToggle}
                    isChecked={isChecked}
                    redirectToJira={redirectToJira}
                    redirectToDevOps={redirectToDevOps}
                    handleExcelUploadPopup={handleExcelUploadPopup}
                    handleOpenKnowledgeBase={handleOpenKnowledgeBase}
                    handleOpenJiraAnalysis={() => {
                      setUploadPopup({ flag: false, identifier: "" });
                      setShowJiraPopup(false);
                      setShowJiraUpload(false);
                      setShowDevOpsPopup(false);
                      if (JiraTokenService.hasValidToken()) {
                        setShowJiraAnalysisPopup(true);
                      } else {
                        redirectToJira();
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/*
            <div className="alert alert-primary" role="alert">
                <img src={tosterCheckIcon} alt="Toster check" />
                <span className="vert-mdle"> Test Cases generated Successfully and are ready for download.</span>
                <img className="close-icon-green" src={successIcon} alt=" Success Icon" />
            </div> */}
      {/*
            <button type="button" className="btn btn-primary" data-bs-toggle="cust-modal" data-bs-target="#examplecust-modal">
                Upload file functionality
            </button> */}
      {uploadPopup.flag === true && (
        <UploadPopup
          uploadPopup={uploadPopup}
          handleFileChange={handleFileChange}
          handleClose={handleClose}
          setUploadPopup={setUploadPopup}
          setUploadedFile={setFile}
          setDocumentDescription={setDocumentDescription}
          handleToggle={handleToggle}
          isChecked={isChecked}
          setSubmit={setSubmit}
        />
      )}

      {showExcelPopup && (
        <ExcelUploadPopup
          handleClose={handleExcelPopupClose}
          handleFileChange={handleExcelFileChange}
          onSubmit={handleExcelFileUpload}
        />
      )}

      {showKnowledgeBase && (
        <KnowledgeBaseUpload
          onClose={() => setShowKnowledgeBase(false)}
          onSuccess={(result) => {
            if (result?.success) {
              setSuccessMessage(result.message);
              setShowSuccessToast(true);
              setTimeout(() => setShowSuccessToast(false), 3000);
            } else {
              setError(result?.message || "Upload failed.");
              setShowErrorToast(true);
              setTimeout(() => setShowErrorToast(false), 3000);
            }
          }}
        />
      )}
      {showJiraPopup && (
        <JiraDropdown
          createMode={jiraCreateMode}
          onClose={() => setShowJiraPopup(false)}
          onSuccess={handleResponseFromJira}
        />
      )}
      {showDevOpsPopup && (
        <DevOpsDropdown
          onClose={() => setShowDevOpsPopup(false)}
          onSuccess={handleResponseFromDevOps}
        />
      )}

      {showJiraAnalysisPopup && (
        <JiraAnalysisDropdown
          onClose={() => setShowJiraAnalysisPopup(false)}
          onSuccess={handleJiraAnalysisSuccess}
        />
      )}

      {/* Conversational Modal */}
      {showConversationalModal && (
        <ConversationalModal
          isOpen={showConversationalModal}
          onClose={handleCloseConversational}
          requirementSummary={conversationContext.requirementSummary}
          testCases={
            displayType === "modified" && currentDisplayData
              ? currentDisplayData.content
              : responseData?.data?.message
          }
          onTestCasesUpdate={handleTestCasesUpdate}
          onRefinedTestCases={handleRefinedTestCases}
          testCaseType={testCaseType}
          generatedFrom={conversationContext.generatedFrom}
          coverageData={coverageData}
        />
      )}

      {/* Full-screen spinner for refinement progress */}
      <FullScreenSpinner
        isVisible={isRefinementInProgress}
        message={refinementMessage}
        progress={refinementProgress}
      />

      {/* Full-screen spinner for original generation progress */}
      <FullScreenSpinner
        isVisible={isGenerationInProgress}
        title={`Generating Test Cases from ${generationSource}`}
        message={generationMessage}
        progress={generationProgress}
      />

      {/* Floating Chat Button for Test Case Refinement */}
      {responseData?.status === 200 && responseData?.data && (
        <div className="floating-chat-container">
          <button
            className="floating-chat-button"
            onClick={handleOpenConversational}
            title="Chat to Refine Test Cases"
          >
            <img src={robotChatIcon} alt="AI Robot" className="robot-chat-icon" />
          </button>
          <div className="floating-chat-tooltip">Chat to Refine Test Cases</div>
        </div>
      )}

      {/* Coverage Warning Modal */}
      <CoverageWarningModal
        isOpen={showCoverageWarning}
        onClose={handleCoverageWarningClose}
        onProceed={handleCoverageWarningProceed}
        coverageData={coverageWarningData?.coverageData}
        worthinessCheck={coverageWarningData?.worthinessCheck}
        warningMessage={coverageWarningData?.warningMessage}
      />
    </>
  );
}
export default LandingPage;
