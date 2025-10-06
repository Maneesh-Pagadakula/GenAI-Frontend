import React, { useState } from "react";
import fileUploadeIcon from "../../assets/images/file-upload-icon.svg";
import { useUpload } from "./context/uploadContext";

export default function UploadPopup({
  uploadPopup,
  handleClose,
  setUploadedFile,
  setDocumentDescription,
  setUploadPopup,
  isChecked,
  handleToggle,
  setSubmit
}) {
  const { setUploadFlag } = useUpload();
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const isCodeOrDocument = ["code", "Document"].includes(uploadPopup.identifier)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleSubmit = () => {
    if (uploadPopup.identifier !== "code") {
      const wordCount = text.trim().split(/\s+/).length;
      if (wordCount < 50) {
        setError(`Please enter at least 50 words. Currently: ${wordCount}`);
        return;
      }
    }

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setError("");

    // Store file and text to parent state
    setUploadedFile(file);
    if (uploadPopup.identifier !== "code") {
      setDocumentDescription(text);
    }

    // Update upload type in context
    switch (uploadPopup.identifier) {
      case "code":
        setUploadFlag("Code");
        break;
      case "Document":
        setUploadFlag("Document");
        break;
      case "Jira":
      case "DevOps":
        setUploadFlag("Jira");
        break;
      default:
        break;
    }
    
    setSubmit(true);
    // Close the popup
    setUploadPopup((prev) => ({ ...prev, flag: false }));
  };

  return (
    <div className="popup-backdrop">
      <div className="cust-modal fileupload">
        <div className="cust-modal-dialog">
          <div
            className="cust-modal-content d-flex flex-column"
            style={{
              height: "100%",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
              backgroundColor: "#fff",
            }}
          >
            {/* Header */}
            <div className="cust-modal-header border-bottom py-3">
              <h6 className="cust-modal-title mb-0">
                {uploadPopup.identifier === "code"
                  ? "Upload Code"
                  : uploadPopup.identifier === "Document"
                  ? "Upload Document"
                  : "Upload Jira"}
              </h6>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={handleClose}
              ></button>
            </div>

            {/* Body Content */}
            <div className="flex-grow-1 pb-3 overflow-auto">
              {/* Text Input – only show if NOT code */}
              {uploadPopup.identifier !== "code" && (
                <div className="pb-3">
                  <label className="form-label fw-semibold">
                    {uploadPopup.identifier === "Document"
                      ? "Functional background about the document"
                      : "Functional background about the selected Jira Ticket"}
                  </label>
                  <textarea
                    className="form-control"
                    placeholder="Describe the context in at least 50 words..."
                    rows="6"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    style={{ borderRadius: "8px", resize: "vertical" }}
                  />
                </div>
              )}

              {/* File Upload */}
              <div
                className="p-4 text-center border rounded"
                style={{
                  borderStyle: "dashed",
                  borderColor: "#d3d3d3",
                  cursor: "pointer",
                }}
                onClick={() => document.getElementById("file-input").click()}
              >
                <img src={fileUploadeIcon} alt="File Upload Icon" style={{ width: "40px" }} />
                <h6 className="mt-2 mb-1 fw-semibold">Select file</h6>
                <p className="text-muted mb-0">Drag and drop the file to upload</p>
                <input
                  id="file-input"
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />
              </div>

              {/* Error Message */}
              {error && <p className="text-danger mt-2">{error}</p>}

              {/* Uploaded File Name */}
              {file && (
                <div className="pb-3 d-flex align-items-center">
                  <label
                    className="form-label fw-semibold mb-0 me-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Uploaded File:
                  </label>
                  <span style={{ fontSize: "0.85rem", color: "#555" }}>{file.name}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className={`d-flex ${ isCodeOrDocument ? "justify-content-between" : "justify-content-end" }`}>
              {isCodeOrDocument && (
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="create-new-label">Automated</h6>
                  <div className="align-self-center">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="flexSwitchCheckDefault"
                        checked={isChecked}
                        onChange={handleToggle}
                      />
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                style={{
                  padding: "6px 16px",
                  borderRadius: "6px",
                }}
              >
                {isCodeOrDocument ? 'Submit & Create' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
