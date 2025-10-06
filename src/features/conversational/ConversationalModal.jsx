import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../../styles/components/conversational.css";

const ConversationalModal = ({
  isOpen,
  onClose,
  requirementSummary,
  testCases,
  onTestCasesUpdate,
  onRefinedTestCases, // New callback for streaming refinement
  testCaseType,
  generatedFrom, // 'upload', 'jira', 'devops' etc.
  coverageData, // Coverage data for requirements
}) => {
  const [userPrompt, setUserPrompt] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const backend_baseURL = process.env.REACT_APP_BACKEND_BASE_URL;

  // Document upload state
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [documentContent, setDocumentContent] = useState("");
  const [isReadingDocument, setIsReadingDocument] = useState(false);
  const fileInputRef = useRef(null);

  // Quick action templates
  const quickActions = [
    {
      label: "Make More Detailed",
      prompt:
        "Make the existing test cases more detailed by expanding the test steps, expected results, and test data for each current test case. Do not add new test cases, only enhance the existing ones.",
    },
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  useEffect(() => {
    if (isOpen && conversation.length === 0) {
      // Initialize conversation with original test cases
      setConversation([
        {
          type: "system",
          content:
            "Original test cases generated successfully. You can now refine or customize them.",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, testCases, conversation.length]);

  const handleSubmit = async (promptText = userPrompt) => {
    if (!promptText.trim()) return;

    setLoading(true);
    setError("");

    // Enhance prompt with document content if available
    let enhancedPrompt = promptText;
    if (documentContent) {
      enhancedPrompt = `${promptText}

Additional Context from Uploaded Document "${uploadedDocument}":
${documentContent}

Please use this document as reference/template when refining the test cases.`;
    }

    // Add user message to conversation
    const userMessage = {
      type: "user",
      content: promptText,
      timestamp: new Date(),
    };

    setConversation((prev) => [...prev, userMessage]);
    setUserPrompt("");

    try {
      // Use the parent callback for streaming refinement
      if (onRefinedTestCases) {
        const context = {
          requirementSummary,
          testCaseType,
          generatedFrom,
          conversationHistory: conversation,
          coverageData: coverageData,
        };

        // Close modal and let parent handle the streaming
        onClose();

        // Call parent function to handle refinement with streaming
        await onRefinedTestCases(enhancedPrompt, testCases, context);
      } else {
        // Fallback to old behavior if callback not provided
        const emailId = localStorage.getItem("Email");

        const payload = {
          userPrompt: enhancedPrompt,
          testCases: testCases,
          context: {
            requirementSummary,
            testCaseType,
            generatedFrom,
            conversationHistory: conversation,
          },
          EmailId: emailId,
        };

        const response = await axios.post(
          `${backend_baseURL}/refine-test-cases`,
          payload,
          { withCredentials: true },
        );

        console.log("Backend response:", response.data); // Debug log

        let refinedTestCases = null;

        // Handle multiple possible response formats
        if (response.data) {
          // Try different possible response structures
          refinedTestCases =
            response.data.refinedTestCases ||
            response.data.refined_test_cases ||
            response.data.testCases ||
            response.data.test_cases ||
            response.data.data?.refinedTestCases ||
            response.data.data?.refined_test_cases ||
            response.data.result ||
            response.data.response ||
            (typeof response.data === "string" ? response.data : null);
        }

        if (refinedTestCases) {
          // Add assistant response to conversation
          const assistantMessage = {
            type: "assistant",
            content: refinedTestCases,
            timestamp: new Date(),
          };

          setConversation((prev) => [...prev, assistantMessage]);

          // Update the main test cases
          if (onTestCasesUpdate) {
            onTestCasesUpdate(refinedTestCases);
          }
        } else {
          // Log the actual response structure for debugging
          console.error("Unexpected response structure:", response.data);
          throw new Error(
            `Invalid response format. Expected refined test cases but received: ${JSON.stringify(response.data, null, 2)}`,
          );
        }
      }
    } catch (error) {
      console.error("Refinement error:", error);
      console.error("Error response data:", error.response?.data);

      let errorMessage = "Failed to refine test cases";

      if (error.response) {
        // Server responded with error status
        errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          error.response.data?.detail ||
          `Server error (${error.response.status}): ${error.response.statusText}`;
      } else if (error.request) {
        // Network error
        errorMessage =
          "Network error: Unable to connect to the server. Please check your connection.";
      } else {
        // Other error
        errorMessage = error.message || "An unexpected error occurred";
      }

      setError(errorMessage);

      // Add error message to conversation
      const errorConversationMessage = {
        type: "error",
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setConversation((prev) => [...prev, errorConversationMessage]);
    }

    setLoading(false);
  };

  const handleQuickAction = (action) => {
    handleSubmit(action.prompt);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearConversation = () => {
    setConversation([
      {
        type: "system",
        content: "Conversation cleared. Original test cases restored.",
        timestamp: new Date(),
      },
    ]);
    setError("");
  };

  // Document upload handler
  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type (matching backend allowed extensions)
    const fileName = file.name.toLowerCase();
    const allowedExtensions = [".txt", ".pdf", ".docx", ".csv"];
    const fileExtension = fileName.substring(fileName.lastIndexOf("."));

    if (!allowedExtensions.includes(fileExtension)) {
      setError("Please upload a valid document file (txt, pdf, docx, csv)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setError("File size must be less than 10MB");
      return;
    }

    setIsReadingDocument(true);
    setError("");

    try {
      // Read file content
      if (file.type === "text/plain" || file.type === "text/csv") {
        // Handle text files directly
        const text = await file.text();
        setDocumentContent(text);
        setUploadedDocument(file.name);

        // Add to conversation
        setConversation((prev) => [
          ...prev,
          {
            type: "system",
            content: `Document "${file.name}" uploaded and ready to use in prompts.`,
            timestamp: new Date(),
          },
        ]);
      } else {
        // For other file types, send to backend for processing
        const formData = new FormData();
        formData.append("document", file);

        const response = await fetch(`${backend_baseURL}/process-document`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to process document");
        }

        const result = await response.json();
        setDocumentContent(result.content || result.text || "");
        setUploadedDocument(file.name);

        // Add to conversation
        setConversation((prev) => [
          ...prev,
          {
            type: "system",
            content: `Document "${file.name}" processed and ready to use in prompts.`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Document upload error:", error);
      setError(`Failed to process document: ${error.message}`);
    } finally {
      setIsReadingDocument(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove uploaded document
  const removeDocument = () => {
    setUploadedDocument(null);
    setDocumentContent("");
    setConversation((prev) => [
      ...prev,
      {
        type: "system",
        content: "Document removed from context.",
        timestamp: new Date(),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="conversational-modal-overlay">
      <div className="conversational-modal">
        <div className="conversational-modal-header">
          <h2>Refine Test Cases</h2>
          <div className="conversational-modal-actions">
            <button
              className="btn-secondary btn-sm"
              onClick={clearConversation}
              disabled={loading}
            >
              Clear Chat
            </button>
            <button
              className="conversational-modal-close"
              onClick={onClose}
              disabled={loading}
            >
              ×
            </button>
          </div>
        </div>

        {/* Quick Actions */}
       {/*<div className="quick-actions">
          <p className="quick-actions-label">Quick Actions:</p>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action-btn"
                onClick={() => handleQuickAction(action)}
                disabled={loading}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div> */}

        {/* Document Upload Section */}
        <div className="document-upload-section">
          <div className="document-upload-header">
            <p className="document-upload-label">
              📎 Upload Reference Document{" "}
              <span className="optional-badge">(Optional)</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.docx,.csv"
              onChange={handleDocumentUpload}
              disabled={loading || isReadingDocument}
              className="document-upload-input"
              id="document-upload"
            />
            <label htmlFor="document-upload" className="document-upload-btn">
              {isReadingDocument ? (
                <>
                  <span className="processing-spinner">⏳</span> Processing...
                </>
              ) : (
                <>
                  <span className="upload-icon">📁</span> Choose File
                </>
              )}
            </label>
          </div>

          {uploadedDocument && (
            <div className="uploaded-document-info">
              <div className="document-details">
                <span className="document-icon">📄</span>
                <span className="document-name">{uploadedDocument}</span>
                <span className="document-status">✅ Ready</span>
              </div>
              <button
                onClick={removeDocument}
                className="remove-document-btn"
                disabled={loading}
                title="Remove document"
              >
                ✕
              </button>
            </div>
          )}

          <p className="document-upload-description">
            <strong>Supported formats:</strong> PDF, Word (.docx), Text (.txt),
            CSV
            <br />
            <em>
              Upload templates, standards, or examples to enhance refinement
              quality
            </em>
          </p>
        </div>

        {/* Conversation History */}
        <div className="conversation-history">
          {conversation.map((message, index) => (
            <div key={index} className={`message message-${message.type}`}>
              <div className="message-content">
                {message.type === "assistant" ? (
                  <div className="markdown-content">
                    <pre className="assistant-response">{message.content}</pre>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message message-assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="conversation-error">
            <p>Error: {error}</p>
          </div>
        )}

        {/* Input Area */}
        <div className="conversation-input-area">
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe how you'd like to refine the test cases (e.g., 'Add edge cases for user authentication')"
            className="conversation-textarea"
            disabled={loading}
            rows="3"
          />
          <button
            onClick={() => handleSubmit()}
            className="conversation-submit-btn"
            disabled={loading || !userPrompt.trim()}
          >
            {loading ? "Processing..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationalModal;
