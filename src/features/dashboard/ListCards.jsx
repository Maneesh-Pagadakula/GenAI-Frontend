import knowledgeBaseIcon from "../../assets/images/knowledge-base-icon.svg";
import codeIcon from "../../assets/images/code-icon2.svg";
import documentIcon from "../../assets/images/document-icon1.svg";
import excelIcon from "../../assets/images/excel.svg";
import jiraIcon from "../../assets/images/jira-icon2.svg";
import devopsIcon from "../../assets/images/devops-icon.svg";
import automationIcon from "../../assets/images/automation-icon.svg";
import landingScreen from "../../assets/images/landing-screen-icon.svg";
import generateTestsIcon from "../../assets/images/generate-tests-icon.svg";
import testCaseAnalysisIcon from "../../assets/images/test-case-analysis.svg";


import { useState, useEffect, useRef } from "react";
import { Button, CardImg, Col, Modal, Row } from "react-bootstrap";

export default function ListCards({
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
  handleOpenKnowledgeBase,
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
      const parentRect = jiraRef.current.closest(".create-new-card").getBoundingClientRect();

      setSubmenuPosition({
        top: rect.top - parentRect.top, // align with Jira row
        left: parentRect.width, // flush to the right, no gap
      });
    }
    setShowJiraSubmenu(true);
  };

  const featuresData = [
    {
      title: "Train your accelerator",
      items: [
        {
          iconSrc: knowledgeBaseIcon,
          heading: "Knowledge base upload",
          text: "Train the accelerator with your knowledge base for smarter test generation.",
          onClick: () => handleOpenKnowledgeBase(),
        },
      ],
    },
    {
      title: "Generate smart test cases",
      items: [
        {
          iconSrc: codeIcon,
          heading: "Code",
          text: "Generate test cases directly from .html, .py, and .java code",
          onClick: () => {
            setSelectedMenu("code");
            handleUploadPopup("code");
          },
        },
        {
          iconSrc: documentIcon,
          heading: "Document",
          text: "Turn requirement docs (.pdf, .docx) into actionable test cases.",
          onClick: () => {
            setSelectedMenu("Document");
            handleUploadPopup("Document");
          },
        },
        {
          iconSrc: jiraIcon,
          heading: "Jira",
          text: "Connect to Jira, read user stories, and auto-generate test cases.",
          onClick: () => {
            setSelectedMenu("jira");
            handleJiraClick();
          },
        },
        {
          iconSrc: devopsIcon,
          heading: "Devops",
          text: "Connect to Azure DevOps and generate tests.",
          onClick: () => {
            setSelectedMenu("devops");
            redirectToDevOps();
          },
        },
      ],
    },
    // {
    //   title: "Automate with Ease !",
    //   items: [
    //     {
    //       iconSrc: automationIcon,
    //       heading: "Automation",
    //       text: "Convert tests into automated scripts",
    //     },
    //   ],
    // },
  ];

  const cards = [
    {
      icon: generateTestsIcon,
      border: "#1a73e8",
      title: "Generate Test Cases",
      subtitle: "Use Selected user story",
      onClick: ()=>{
       redirectToJira();
      }
    },
    {
      icon: testCaseAnalysisIcon,
      border: "#28a745",
      title: "Test Cases Analysis",
      subtitle: "Analyze EPIC’s US & TCs",
      onClick: ()=>{
        handleOpenJiraAnalysis();
       }
    },
  ];

  return (
    <>
      <section className="featureGrid">
        {featuresData.map((col, i) => (
          <div
            className="featureCol"
            key={col.title}
            data-has-sep={i < featuresData.length - 1}
            data-wide={col.items.length > 1} // marks the middle column
          >
            <h3 className="featureTitle">{col.title}</h3>

            <div className={`cards ${col.items.length > 1 ? "twoUp" : ""}`}>
              {col.items.map((item) => (
                <button
                  key={item.heading}
                  className={`card-styles ${item.iconLeft ? "icon-left" : ""}`} // default TOP; add iconLeft:true to move left
                  type="button"
                  onClick={item?.onClick}
                >
                  {/* <span className="iconWrap"> */}
                    <img src={item.iconSrc} width="40" height="40" alt="" />
                  {/* </span> */}

                  <span className="cardText">
                    <span className="cardHeading">{item.heading}</span>
                    <span className="cardBody">{item.text}</span>
                  </span>

                  <span className="arrow" aria-hidden>
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <Modal
        show={showJiraSubmenu}
        onHide={() => setShowJiraSubmenu(false)}
        centered
        dialogClassName="custom-modal"
        contentClassName="custom-modal-content"
      >
        <Modal.Header closeButton className="border-0 pb-0" />

        <Modal.Body>
          <Row>
            {cards.map((card, idx) => (
              <Col xs={6} className="mb-3" key={idx}>
                <div
                onClick={card.onClick}
                  className="card-box"
                  style={{
                    border: `2px solid ${card.border}`,
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "0.3s",
                  }}
                >
                  {/* <div style={{ marginBottom: "10px" }}>{card.icon}</div> */}
                  <img src={card.icon} alt="logo" width={50} height={50} />
                  <h6 style={{ fontWeight: "600", marginBottom: "5px" }}>{card.title}</h6>
                  <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>{card.subtitle}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Modal.Body>
      </Modal>
    </>
  );
}
