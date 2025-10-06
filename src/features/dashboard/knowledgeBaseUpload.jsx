import React, { useRef, useState } from "react";
import "../../common-components/contentStyles.css";
import "../../../src/styles/main.css";
import "../../styles/excelUploadStyles.css";
import "../../styles/components/modals.css";
import fileUploadeIcon from "../../assets/images/file-upload-icon.svg";

function KnowledgeBaseUpload({ onClose, onSuccess }) {
  const backend_baseURL = process.env.REACT_APP_BACKEND_BASE_URL;
  const [userStoriesFile, setUserStoriesFile] = useState(null);
  const [testCasesFile, setTestCasesFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userStoriesInputRef = useRef(null);
  const testCasesInputRef = useRef(null);

  const validateUserStoriesFile = (file) => {
    if (!file) return "User Stories file is required";
    const name = file.name.toLowerCase();
    const valid = name.endsWith(".docx") || name.endsWith(".pdf");
    if (!valid) return "User Stories must be .docx or .pdf";
    if (file.size > 10 * 1024 * 1024) return "User Stories file must be <= 10MB";
    return "";
  };

  const validateTestCasesFile = (file) => {
    if (!file) return "Test Cases file is required";
    const name = file.name.toLowerCase();
    const valid = name.endsWith(".xlsx");
    if (!valid) return "Test Cases must be .xlsx";
    if (file.size > 10 * 1024 * 1024) return "Test Cases file must be <= 10MB";
    return "";
  };

  const handleUserStoriesSelect = (e) => {
    const file = e.target.files?.[0];
    const err = validateUserStoriesFile(file);
    if (err) {
      setError(err);
      setUserStoriesFile(null);
    } else {
      setError("");
      setUserStoriesFile(file);
    }
  };

  const handleTestCasesSelect = (e) => {
    const file = e.target.files?.[0];
    const err = validateTestCasesFile(file);
    if (err) {
      setError(err);
      setTestCasesFile(null);
    } else {
      setError("");
      setTestCasesFile(file);
    }
  };

  const onSubmit = async () => {
    setError("");

    const emailId = localStorage.getItem("Email");
    if (!emailId) {
      setError("User not logged in. Email not found.");
      return;
    }

    const usErr = validateUserStoriesFile(userStoriesFile);
    if (usErr) {
      setError(usErr);
      return;
    }

    const tcErr = validateTestCasesFile(testCasesFile);
    if (tcErr) {
      setError(tcErr);
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("EmailId", emailId);
      formData.append("user_stories", userStoriesFile);
      formData.append("test_cases", testCasesFile);

      const endpoint = `${backend_baseURL}/rag/generate-faiss`;
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed with ${res.status}`);
      }

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = { success: true, message: "Knowledge base processed" };
      }

      if (payload?.success === false) {
        throw new Error(payload?.message || "Processing failed");
      }

      if (onSuccess) {
        onSuccess({ success: true, message: payload?.message || "FAISS index generated successfully" });
      }
      onClose();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="popup-backdrop">
      <div className="cust-modal fileupload kb-upload-modal">
        <div className="cust-modal-dialog">
          <div className="cust-modal-content">
            <div className="cust-modal-header">
              <h6 className="cust-modal-title">Knowledge Base Upload</h6>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
            </div>

            <div className="cust-modal-body card">
              <div className="p-3 text-center border rounded">
                <label className="form-label fw-semibold">User Stories (.docx or .pdf)</label>
                <div className="upload-container" onClick={() => userStoriesInputRef.current?.click()}>
                  <img className="select-file-icon" src={fileUploadeIcon} alt="File Upload Icon" />
                  <h6 className="select-file-label">Select File</h6>
                  <p className="muted-text drag-file">Drag and drop the file to upload</p>
                  <input
                    ref={userStoriesInputRef}
                    className="file-input"
                    type="file"
                    accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleUserStoriesSelect}
                  />
                </div>
                {userStoriesFile && (
                  <div className="selected-file mt-2">
                    <p className="file-name">{userStoriesFile.name}</p>
                  </div>
                )}
              </div>

              <div className="p-3 text-center border rounded">
                <label className="form-label fw-semibold">Test Cases (.xlsx)</label>
                <div className="upload-container" onClick={() => testCasesInputRef.current?.click()}>
                  <img className="select-file-icon" src={fileUploadeIcon} alt="File Upload Icon" />
                  <h6 className="select-file-label">Select File</h6>
                  <p className="muted-text drag-file">Drag and drop the file to upload</p>
                  <input
                    ref={testCasesInputRef}
                    className="file-input"
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleTestCasesSelect}
                  />
                </div>
                {testCasesFile && (
                  <div className="selected-file mt-2">
                    <p className="file-name">{testCasesFile.name}</p>
                  </div>
                )}
              </div>

              {error && <div className="error-message mt-2">{error}</div>}
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={submitting}>
                {submitting ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KnowledgeBaseUpload;
