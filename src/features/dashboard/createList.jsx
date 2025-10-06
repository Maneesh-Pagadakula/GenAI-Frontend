import codeIcon from "../../assets/images/code-icon.svg";
import documentIcon from "../../assets/images/document-icon.svg";
import excelIcon from "../../assets/images/excel.svg";
import jiraIcon from "../../assets/images/jira-icon.svg";
import devopsIcon from "../../assets/images/devops.png";
import { useState, useEffect, useRef } from "react";

export default function CreateList({
  uploadPopup,
  handleUploadPopup,
  successIconTick,
  file,
  handleClear,
  handleFileUpload,
  handleToggle,
  isChecked,
  redirectToJira,
  redirectToDevOps,
  handleExcelUploadPopup,
  handleOpenJiraAnalysis,
}) {
  const [showJiraSubmenu, setShowJiraSubmenu] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const [selectedMenu, setSelectedMenu] = useState(null);

  const submenuRef = useRef(null);
  const jiraRef = useRef(null);

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        submenuRef.current &&
        !submenuRef.current.contains(event.target) &&
        !event.target.closest(".jira-menu-item")
      ) {
        setShowJiraSubmenu(false);
        setSelectedMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle Jira click → calculate submenu position
  const handleJiraClick = () => {
    if (jiraRef.current) {
      const rect = jiraRef.current.getBoundingClientRect();
      const parentRect =
        jiraRef.current.closest(".create-new-card").getBoundingClientRect();

      setSubmenuPosition({
        top: rect.top - parentRect.top, // align with Jira row
        left: parentRect.width, // flush to the right, no gap
      });
    }
    setShowJiraSubmenu(true);
  };

  // Define option items data
  const optionItems = [
    {
      id: "code",
      icon: codeIcon,
      label: "Code",
      description: "Supports .html, .py and .java",
      onClick: () => {
        setSelectedMenu("code");
        handleUploadPopup("code");
      },
      iconStyle: {
        paddingLeft: "8px",
        paddingRight: "8px",
      },
      containerStyle: {
        paddingLeft: "8px",
        paddingRight: "8px",
      },
    },
    {
      id: "Document",
      icon: documentIcon,
      label: "Document",
      description: "Supports .pdf and .docx",
      onClick: () => {
        setSelectedMenu("Document");
        handleUploadPopup("Document");
      },
      iconStyle: {
        paddingLeft: "9px",
        paddingRight: "9px",
      },
      containerStyle: {
        paddingLeft: "8px",
        paddingRight: "8px",
      },
    },
    {
      id: "jira",
      icon: jiraIcon,
      label: "Jira",
      description: "Implementation and Support",
      onClick: () => {
        setSelectedMenu("jira");
        handleJiraClick();
      },
      iconStyle: {
        paddingLeft: "4px",
        paddingRight: "4px",
      },
      containerStyle: {
        paddingLeft: "8px",
        paddingRight: "8px",
      },
    },
    {
      id: "devops",
      icon: devopsIcon,
      label: "Devops",
      description: "Implementation and Support",
      onClick: () => {
        setSelectedMenu("devops");
        redirectToDevOps();
      },
      iconStyle: {
        paddingLeft: "4px",
        paddingRight: "4px",
      },
      containerStyle: {
        paddingLeft: "10px",
        paddingRight: "10px",
      },
    },
  ];

  // Item component for list items
  const ListItem = ({ item }) => (
    <li>
      <div
        ref={item.id === "jira" ? jiraRef : null}
        className={`d-flex ${item.id === "jira" ? "jira-menu-item" : ""} ${
          selectedMenu === item.id ? "active-menu" : ""
        }`}
        onClick={item.onClick}
      >
        <div className="align-self-center" style={item.iconStyle}>
          <img
            src={item.icon}
            alt={`${item.label} Icon`}
            style={item.imageStyle}
          />
        </div>
        <div role="button" style={item.containerStyle}>
          <h6 className="create-new-label">{item.label}</h6>
          <p className="mb-0">{item.description}</p>
        </div>
        {uploadPopup.identifier === item.id && file !== null && (
          <div className="success-check-icon">
            <img src={successIconTick} alt="success-icon" />
          </div>
        )}
      </div>
    </li>
  );

  return (
    <div className="d-flex position-relative">
      {/* Main Menu */}
      <div className="create-new-card card">
        <ul className="create-new-dropdown">
          {optionItems.map((item) => (
            <ListItem key={item.id} item={item} />
          ))}
        </ul>

        <div className="btm-brdr">
          <div>
            <p className="pt-3">Do you want automated test case?</p>
          </div>
          <div className="d-flex just-space-btwn">
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
        </div>

        <div className="mt-3">
          <button className="btn btn-secondary me-2" onClick={handleClear}>
            Clear
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (uploadPopup.identifier === "") {
                alert("Please select from above options");
              } else {
                handleFileUpload();
              }
            }}
          >
            Create
          </button>
        </div>
      </div>

      {/* Jira Submenu */}
      {showJiraSubmenu && (
        <div
          className="create-new-card card"
          ref={submenuRef}
          style={{
            position: "absolute",
            top: submenuPosition.top,
            left: submenuPosition.left,
            zIndex: 1000,
          }}
        >
          <ul className="create-new-dropdown">
            <li>
              <div className="d-flex" onClick={redirectToJira}>
                <div role="button" style={{ padding: "0 8px" }}>
                  <h6 className="create-new-label">Generate Test Cases</h6>
                  <p className="mb-0">Use selected User Story</p>
                </div>
              </div>
            </li>
            <li>
              <div className="d-flex" onClick={handleOpenJiraAnalysis}>
                <div role="button" style={{ padding: "0 8px" }}>
                  <h6 className="create-new-label">Test Case Analysis</h6>
                  <p className="mb-0">Analyze EPIC’s US & TCs</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
