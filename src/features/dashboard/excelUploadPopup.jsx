import React, { useState, useEffect } from "react";
import "../../common-components/contentStyles.css";
import "../../../src/styles/main.css";

import "../../common-components/globalStyles.css";
import closeIcon from "../../assets/images/closeIcon.png";
import fileUploadeIcon from "../../assets/images/file-upload-icon.svg";
import "../../styles/excelUploadStyles.css";

// import "./excelUploadStyles.css"; // Import the CSS we created
// import fileUploadeIcon from "../../assets/images/file-upload-icon.svg";

function ExcelUploadPopup({ handleClose, handleFileChange, onSubmit }) {
  console.log("Excel Upload Popup Rendered");

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  // Debug load state
  useEffect(() => {
    console.log("ExcelUploadPopup mounted");
    return () => console.log("ExcelUploadPopup unmounted");
  }, []);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    console.log("File dropped");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      console.log("Dropped file:", file);
      validateAndSetFile(file);
    }
  };

  // Handle file input change
  const handleInputChange = (e) => {
    console.log("File input changed");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("Selected file:", file);
      validateAndSetFile(file);
    }
  };

  // Handle URL input change
  const handleUrlChange = (e) => {
    setFileUrl(e.target.value);
  };

  // Handle URL upload
  const handleUrlUpload = () => {
    if (!fileUrl) {
      setError("Please enter a valid URL");
      return;
    }

    console.log("URL to upload:", fileUrl);

    // Here you would typically fetch the file from the URL
    // For now, we'll just pass the URL to the parent component
    if (onSubmit) {
      try {
        console.log("Calling onSubmit with URL:", fileUrl);
        onSubmit({ url: fileUrl });
        console.log("onSubmit called successfully with URL");
        handleClose();
      } catch (err) {
        console.error("Error in onSubmit with URL:", err);
        setError(
          "An error occurred while processing the URL. Please try again."
        );
      }
    }
  };

  // Validate file type and size
  const validateAndSetFile = (file) => {
    // Reset error
    setError("");

    console.log("File being validated:", file);
    console.log("File type:", file.type);

    // Check file type - add more possible Excel MIME types
    const validExcelTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
      "application/octet-stream", // Sometimes Excel files have this MIME type
      ".xls",
      ".xlsx",
    ];

    // Check extension as fallback
    const fileName = file.name.toLowerCase();
    const isValidExtension =
      fileName.endsWith(".xls") || fileName.endsWith(".xlsx");
    const isValidMimeType = validExcelTypes.includes(file.type);

    console.log("Is valid MIME type:", isValidMimeType);
    console.log("Is valid extension:", isValidExtension);

    if (!isValidMimeType && !isValidExtension) {
      const errorMsg = "Please upload a valid Excel file (.xls, .xlsx)";
      console.error(errorMsg, file.type);
      setError(errorMsg);
      return;
    }

    // Check file size (5MB limit)
    const fileSizeMB = file.size / (1024 * 1024);
    console.log("File size (MB):", fileSizeMB);

    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = "File size should be less than 5MB";
      console.error(errorMsg, file.size);
      setError(errorMsg);
      return;
    }

    // Set file if valid
    console.log("File passed validation, setting selected file");
    setSelectedFile(file);

    // Call the parent component's handler
    try {
      handleFileChange({ target: { files: [file] } });
      console.log("handleFileChange called successfully");
    } catch (err) {
      console.error("Error in handleFileChange:", err);
      setError(
        "An error occurred while processing the file. Please try again."
      );
    }
  };

  // Handle the upload button click
  const handleUpload = () => {
    console.log("Upload button clicked");
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    if (onSubmit) {
      try {
        console.log("Calling onSubmit with file:", selectedFile);
        onSubmit(selectedFile);
        console.log("onSubmit called successfully");
      } catch (err) {
        console.error("Error in onSubmit:", err);
        setError(
          "An error occurred while uploading the file. Please try again."
        );
        return;
      }
    }

    handleClose();
  };

  return (
    <div className="popup-backdrop">
      <div className="cust-modal fileupload">
        <div className="cust-modal-dialog">
          <div className="cust-modal-content">
            <div className="cust-modal-header">
              <h6 className="cust-modal-title">Upload Excel</h6>
              <button
                type="button"
                className="btn-close align-self-centet"
                aria-label="Close"
                onClick={() => {
                  console.log("Close button clicked");
                  handleClose();
                }}
              ></button>
            </div>

            <div className="cust-modal-body card">
              <div
                className={`select-file-con ${dragActive ? "drag-active" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <label htmlFor="excel-file-input" style={{ cursor: "pointer" }}>
                  <img
                    className="select-file-icon"
                    src={fileUploadeIcon}
                    alt="File Upload Icon"
                  />
                  <h6 className="select-file-label">Select file</h6>
                  <span className="muted-text drag-file">
                    Drag and drop the file to upload
                  </span>
                </label>
                <input
                  id="excel-file-input"
                  type="file"
                  accept=".xls,.xlsx"
                  style={{ display: "none" }}
                  onChange={handleInputChange}
                />

                {selectedFile && (
                  <div className="selected-file mt-3">
                    <p className="file-name">{selectedFile.name}</p>
                    <p className="file-size">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="upload-url">
              <h6 className="upload-url-txt">or Upload from URL</h6>
              <div className="pos-rel">
                <input
                  className="form-control ip-field-font-size"
                  type="text"
                  placeholder="add Excel file URL"
                  value={fileUrl}
                  onChange={handleUrlChange}
                />
                <span
                  className="upload-txt"
                  onClick={handleUrlUpload}
                  style={{ cursor: "pointer" }}
                >
                  Upload
                </span>
              </div>
            </div>

            {error && <div className="error-message mt-2">{error}</div>}

            {/* <div className="cust-modal-footer">
              <button 
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!selectedFile}
              >
                Upload
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExcelUploadPopup;
