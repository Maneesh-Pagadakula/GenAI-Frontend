import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { useUpload } from "./context/uploadContext";

export async function markdownToJson(markdown) {
  const processor = unified().use(remarkParse);
  const tree = processor.parse(markdown);
  return tree;
}

const StyledMarkdown = ({ content }) => {
  const [metricsData, setMetricsData] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [jiraTestCases, setJiraTestCases] = useState([]);
  const { uploadFlag } = useUpload();
  const [jiraMetricsData, setJiraMetricsData] = useState([]);
  const [codeMetricsData, setCodeMetricsData] = useState([]);
  const [codeTestCasesData, setCodeTestCasesData] = useState([]);
  const [onlyJiraTestStories, setOnlyJiraTestStories] = useState(false);
  const [jirastoryTestCases, setJiraStoryTestCases] = useState([]);
  const [automatedCodedata, setAutomatedCodeData] = useState(false);
  const [automatedDocdata, setAutomatedDocData] = useState(false);

  const styles = {
    markdownContent: {
      color: "rgb(13, 13, 13)",
      fontFamily: "Helvetica, sans-serif",
      textAlign: "justify",
      // whiteSpace: "pre-wrap",
      margin: "0",
    },
    heading: (level) => ({
      fontSize: `${24 - level * 2}px`,
      fontWeight: "bold",
      color: "rgb(13, 13, 13)",
      margin: "0",
      lineHeight: 1.5,
    }),
    strong: {
      fontWeight: "bold",
      color: "rgb(13, 13, 13)",
    },
    codeBlock: {
      fontFamily: "Courier, monospace",
      fontSize: "12px",
      backgroundColor: "#000",
      padding: "10px",
      borderRadius: "5px",
      color: "#fff",
      textAlign: "left",
      // whiteSpace: "pre-wrap",
      lineHeight: 1.5,
      margin: "0",
    },
    list: {
      paddingLeft: "20px",
      color: "rgb(13, 13, 13)",
      lineHeight: 1.5,
      margin: "0",
    },
    listItem: {
      fontSize: "16px",
      color: "rgb(13, 13, 13)",
      textAlign: "justify",
      lineHeight: 1.5,
      margin: "0",
    },
    horizontalRule: {
      margin: "1px 0",
    },
  };

  useEffect(() => {
    async function convertforDoc() {
      const result = await markdownToJson(content);
      if (result.children[0].type === "code") {
        setAutomatedDocData(true)
      } else {
        setAutomatedDocData(false)

        const metrics = [];
        const remainingData = [];
        let foundFirstBreak = false;

        for (let index = 0; index < result?.children?.length; index++) {
          const element = result.children[index];

          if (!foundFirstBreak) {
            if (element?.type === "thematicBreak") {
              foundFirstBreak = true;
              continue;
            }
            metrics.push(element);
          } else {
            remainingData.push(result.children[index]);
          }
        }

        const extractedMetricsArray = [];

        if (metrics.length < 6) {
          for (let index = 0; index < metrics.length; index++) {
            const element = metrics[index];

            if (element?.type === "paragraph") {
              const children = element?.children || [];
              if (children.length >= 14) {
                const dataPairs = [
                  {
                    title: children[0]?.children?.[0]?.value || "",
                    value: children[1]?.value || "",
                  },
                  {
                    title: children[3]?.children?.[0]?.value || "",
                    value: children[4]?.value || "",
                  },
                  {
                    title: children[6]?.children?.[0]?.value || "",
                    value: children[7]?.value || "",
                  },
                  {
                    title: children[9]?.children?.[0]?.value || "",
                    value: children[10]?.value || "",
                  },
                  {
                    title: children[12]?.children?.[0]?.value || "",
                    value: children[13]?.value || "",
                  },
                ];
                dataPairs.forEach((pair) => {
                  if (pair.title && pair.value) {
                    extractedMetricsArray.push(pair);
                  }
                });
              } else {
                console.log("Paragraph doesn't contain enough children for metrics parsing");
              }
            }
          }
        } else {
          for (let index = 0; index < metrics.length; index++) {
            const element = metrics[index];

            const headingTitle =
              element?.children?.[0]?.children?.[0]?.value || "";

            const headingValue =
              element?.children?.[1]?.value || "";

            if (headingTitle && headingValue) {
              extractedMetricsArray.push({
                title: headingTitle,
                value: headingValue,
              });
            }
          }
        }
        let blocksBetweenBreaks = [];
        let tempBlock = [];
        let dataBlocks = [];

        for (let i = 0; i < remainingData.length; i++) {
          const element = remainingData[i];
          if (element?.type === "thematicBreak") {
            if (tempBlock.length > 0) {
              blocksBetweenBreaks.push(tempBlock);
              dataBlocks.push(tempBlock);
              tempBlock = [];
            }
          } else {
            tempBlock.push(element);
          }
        }

        if (tempBlock.length > 0) {
          blocksBetweenBreaks.push(tempBlock);
        }

        const allTestCases = [];

        for (let index = 0; index < dataBlocks.length; index++) {
          const element = dataBlocks[index];
          const testCaseData = {};
          const testIdValue = element?.[0]?.children?.[1]?.value || "";
          const baseRequirementValue = element?.[2]?.children?.[0]?.value || "";
          testCaseData.testID = {
            title: "Test Case ID",
            value: testIdValue
          };
          testCaseData.baseRequirement = {
            title: "Base Requirement",
            value: baseRequirementValue
          };

          for (let i = 0; i < element.length; i++) {
            const current = element[i];
            const headingText = current?.children?.[0]?.children?.[0]?.value?.toLowerCase() || "";

            if (headingText === "title") {
              testCaseData.caseTitle = {
                title: current.children[0].children[0].value,
                value: element[i + 1]?.value || ""
              };
            } else if (headingText.includes("test steps")) {
              const stepsBlock = element[i + 1];
              if (stepsBlock?.type === "list") {
                testCaseData.testSteps = {
                  title: current.children[0].children[0].value,
                  value: stepsBlock.children
                    .map(item => item?.children?.[0]?.children?.[0]?.value)
                    .filter(Boolean)
                };
              }
            } else if (headingText.includes("expected result")) {
              const expectedList = element[i + 1];
              if (expectedList?.type === "list") {
                testCaseData.expectedResult = {
                  title: current.children[0].children[0].value,
                  value: expectedList.children
                    .map(item => item?.children?.[0]?.children?.[0]?.value)
                    .filter(Boolean)
                };
              }
            } else if (headingText.includes("test data")) {
              const testDataList = element[i + 1];
              if (testDataList?.type === "list") {
                testCaseData.testData = {
                  title: current.children[0].children[0].value,
                  value: testDataList.children
                    .map(item => item?.children?.[0]?.children?.[0]?.value)
                    .filter(Boolean)
                };
              } else {
                testCaseData.testData = {
                  title: current.children[0].children[0].value,
                  value: element[i + 1]?.value || ""
                };
              }
            }
          }
          allTestCases.push(testCaseData);
        }
        setMetricsData(extractedMetricsArray);
        setTestCases(allTestCases);
      }


    }

    async function convertforCode() {
      const result = await markdownToJson(content);



      const isAutomated = result.children.some((child) => child.type === "code");

      if (isAutomated) {

        setAutomatedCodeData(true);
      } else {

        setAutomatedCodeData(false);

        // proceed with parsing and setting code metrics and test cases
        const metrics = [];
        const remainingData = [];
        let foundFirstBreak = false;

        for (let index = 0; index < result?.children?.length; index++) {
          const element = result.children[index];

          if (!foundFirstBreak) {
            if (element?.type === "thematicBreak") {
              foundFirstBreak = true;
              continue;
            }
            metrics.push(element);
          } else {
            remainingData.push(element);
          }
        }

        const extractedCodeMetricsArray = [];

        for (let index = 0; index < metrics.length; index++) {
          const element = metrics[index];

          const headingTitle = element?.children?.[0]?.children?.[0]?.value || "";
          const headingValue = element?.children?.[1]?.value || "";

          if (headingTitle && headingValue) {
            extractedCodeMetricsArray.push({
              title: headingTitle,
              value: headingValue,
            });
          }
        }

        let blocksBetweenBreaks = [];
        let tempBlock = [];
        let dataBlocks = [];

        for (let i = 0; i < remainingData.length; i++) {
          const element = remainingData[i];
          if (element?.type === "thematicBreak") {
            if (tempBlock.length > 0) {
              blocksBetweenBreaks.push(tempBlock);
              dataBlocks.push(tempBlock);
              tempBlock = [];
            }
          } else {
            tempBlock.push(element);
          }
        }

        if (tempBlock.length > 0) {
          blocksBetweenBreaks.push(tempBlock);
        }

        const allCodeTestCases = [];

        for (let index = 0; index < dataBlocks.length; index++) {
          const element = dataBlocks[index];
          const testCaseData = {};
          const testIdValue = element?.[0]?.children?.[1]?.value || "";
          const baseRequirementValue = element?.[2]?.children?.[0]?.value || "";
          testCaseData.testID = {
            title: "Test Case ID",
            value: testIdValue
          };
          testCaseData.baseRequirement = {
            title: "Base Requirement",
            value: baseRequirementValue
          };

          for (let i = 0; i < element.length; i++) {
            const current = element[i];
            const headingText = current?.children?.[0]?.children?.[0]?.value?.toLowerCase() || "";

            if (headingText === "title") {
              testCaseData.caseTitle = {
                title: current.children[0].children[0].value,
                value: element[i + 1]?.value || ""
              };
            } else if (headingText.includes("test steps")) {
              const stepsBlock = element[i + 1];
              if (stepsBlock?.type === "list") {
                testCaseData.testSteps = {
                  title: current.children[0].children[0].value,
                  value: stepsBlock.children
                    .map(item => item?.children?.[0]?.children?.[0]?.value)
                    .filter(Boolean)
                };
              }
            } else if (headingText.includes("expected result")) {
              const expectedList = element[i + 1];
              if (expectedList?.type === "list") {
                testCaseData.expectedResult = {
                  title: current.children[0].children[0].value,
                  value: expectedList.children
                    .map(item => item?.children?.[0]?.children?.[0]?.value)
                    .filter(Boolean)
                };
              }
            } else if (headingText.includes("test data")) {
              const testDataList = element[i + 1];
              if (testDataList?.type === "list") {
                testCaseData.testData = {
                  title: current.children[0].children[0].value,
                  value: testDataList.children
                    .map(item => item?.children?.[0]?.children?.[0]?.value)
                    .filter(Boolean)
                };
              } else {
                testCaseData.testData = {
                  title: current.children[0].children[0].value,
                  value: element[i + 1]?.value || ""
                };
              }
            }
          }
          allCodeTestCases.push(testCaseData);
        }

        setCodeMetricsData(extractedCodeMetricsArray);
        setCodeTestCasesData(allCodeTestCases);
      }
    }

    async function convertforJira() {
      const result = await markdownToJson(content);
      console.log(result);

      const metrics = [];
      const remainingData = [];
      let headingCount = 0;
      let reachedSecondHeading = false;

      for (let index = 0; index < result?.children?.length; index++) {
        const element = result.children[index];

        if (!reachedSecondHeading) {
          if (element?.type === "heading") {
            headingCount++;
            if (headingCount === 2) {
              reachedSecondHeading = true;
              remainingData.push(element);
              continue;
            }
          }
          metrics.push(element);
        } else {
          remainingData.push(element);
        }
      }

      const jiraTestCasesArray = [];

      for (let i = 0; i < remainingData.length; i += 10) {
        const testCaseChunk = remainingData.slice(i, i + 10);
        if (testCaseChunk.length < 10) continue;

        const testCase = {
          testCaseDetails: {
            title: testCaseChunk[0]?.children?.[0]?.children?.[0]?.value || "",
            value: testCaseChunk[0]?.children?.[1]?.value || ""
          },
          baseReqDetails: {
            title: testCaseChunk[1]?.children?.[0]?.children?.[0]?.value || "",
            value: testCaseChunk[2]?.children?.[0]?.value || ""
          },
          testStepsDetails: {
            title: testCaseChunk[3]?.children?.[0]?.children?.[0]?.value || "",
            steps: testCaseChunk[4]?.children?.[0]?.children?.[0]?.value || "",
            value: Array.from({ length: 4 }, (_, j) =>
              testCaseChunk[5]?.children?.[j]?.children?.[0]?.children?.[0]?.value || ""
            ).filter(Boolean)
          },
          expResultDetails: {
            title: testCaseChunk[6]?.children?.[0]?.children?.[0]?.value || "",
            values: Array.from({ length: 2 }, (_, j) =>
              testCaseChunk[7]?.children?.[j]?.children?.[0]?.children?.[0]?.value || ""
            ).filter(Boolean)
          },
          testDetails: {
            title: testCaseChunk[8]?.children?.[0]?.children?.[0]?.value || "",
            value: [
              testCaseChunk[9]?.children?.[0]?.children?.[0]?.children?.[0]?.value || ""
            ].filter(Boolean)
          }
        };

        jiraTestCasesArray.push(testCase);
      }

      const extractedJirametricsArray = [];

      for (let index = 0; index < metrics.length; index++) {
        const element = metrics[index];

        const title = element?.children?.[0]?.children?.[0]?.value || "";
        const value = element?.children?.[1]?.value || "";

        if (title && value) {
          extractedJirametricsArray.push({
            title,
            value,
          });
        }
      }



      if (extractedJirametricsArray.length < 4) {

        setOnlyJiraTestStories(true);
        setJiraMetricsData(extractedJirametricsArray)


        let blocksBetweenBreaks = [];
        let tempBlock = [];
        let dataBlocks = [];

        for (let i = 0; i < remainingData.length; i++) {
          const element = remainingData[i];
          if (element?.type === "thematicBreak") {
            if (tempBlock.length > 0) {
              blocksBetweenBreaks.push(tempBlock);
              dataBlocks.push(tempBlock);
              tempBlock = [];
            }
          } else {
            tempBlock.push(element);
          }
        }


        if (tempBlock.length > 0) {
          blocksBetweenBreaks.push(tempBlock);
          dataBlocks.push(tempBlock);
        }



        const allStoryTestCases = [];

        for (let index = 0; index < dataBlocks.length; index++) {
          const block = dataBlocks[index];
          const storyCase = {};

          for (let i = 0; i < block.length; i++) {
            const current = block[i];
            const headingText =
              current?.children?.[0]?.children?.[0]?.value?.toLowerCase() || "";

            const nextElement = block[i + 1];

            if (headingText.includes("user story")) {
              storyCase.userStoryDetails = {
                heading: current.children[0].children[0].value,
                value: nextElement?.children?.[0]?.value || ""
              };
            } else if (headingText.includes("base requirement")) {
              storyCase.baseReqDetails = {
                heading: current.children[0].children[0].value,
                value: nextElement?.children?.[0]?.value || ""
              };
            } else if (headingText.includes("description")) {
              storyCase.descDetails = {
                heading: current.children[0].children[0].value,
                value: nextElement?.children?.[0]?.value || ""
              };
            } else if (headingText.includes("acceptance") || headingText.includes("acc")) {
              const list = nextElement?.children || [];
              const values = list.map(
                (item) => item?.children?.[0]?.children?.[0]?.value
              ).filter(Boolean);

              storyCase.accDetails = {
                heading: current.children[0].children[0].value,
                value: values
              };
            }
          }

          allStoryTestCases.push(storyCase);
        }

        setJiraStoryTestCases(allStoryTestCases)
      } else {
        setOnlyJiraTestStories(false);
        setJiraMetricsData(extractedJirametricsArray)
        setJiraTestCases(jiraTestCasesArray)
      }
    }



    if (uploadFlag === "Document") {
      convertforDoc();
    } else if (uploadFlag === "Code") {
      convertforCode();
    } else if (uploadFlag === "Jira") {
      convertforJira();
    }

  }, [content]);

  return (
    <div style={{ padding: "1rem", fontFamily: "Helvetica, sans-serif" }}>
      {uploadFlag === "Document" && (
        <>
          {!automatedDocdata ? (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {metricsData.map((metric, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#e0f7fa",
                      borderRadius: "20px",
                      padding: "10px 15px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#00796b",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {metric.title} {metric.value}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "2rem" }}>
                {testCases.map((testCase, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      padding: "20px",
                      marginBottom: "20px",
                      width: "95vw",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1e88e5", marginBottom: "10px" }}>
                      🧪 {testCase.testID?.title}: {testCase.testID?.value}
                    </div>

                    {testCase.caseTitle && (
                      <div style={{ marginBottom: "10px" }}>
                        <strong>{testCase.caseTitle.title}</strong> {testCase.caseTitle.value}
                      </div>
                    )}

                    {testCase.baseRequirement && (
                      <div style={{ marginBottom: "10px" }}>
                        <strong>{testCase.baseRequirement.title}:</strong> {testCase.baseRequirement.value}
                      </div>
                    )}

                    {testCase.testSteps && (
                      <div style={{ marginBottom: "10px" }}>
                        <strong>{testCase.testSteps.title}</strong>
                        <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                          {testCase.testSteps.value.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {testCase.expectedResult && (
                      <div style={{ marginBottom: "10px" }}>
                        <strong>{testCase.expectedResult.title}</strong>
                        <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                          {testCase.expectedResult.value.map((result, i) => (
                            <li key={i}>{result}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {testCase.testData && (
                      <div>
                        <strong>{testCase.testData.title}</strong>
                        {Array.isArray(testCase.testData.value) ? (
                          <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                            {testCase.testData.value.map((data, i) => (
                              <li key={i}>{data}</li>
                            ))}
                          </ul>
                        ) : (
                          <div>{testCase.testData.value}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={styles.markdownContent}>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 style={styles.heading(1)}>{children}</h1>,
                  h2: ({ children }) => <h2 style={styles.heading(2)}>{children}</h2>,
                  h3: ({ children }) => <h3 style={styles.heading(3)}>{children}</h3>,
                  h4: ({ children }) => <h4 style={styles.heading(4)}>{children}</h4>,
                  h5: ({ children }) => <h5 style={styles.heading(5)}>{children}</h5>,
                  h6: ({ children }) => <h6 style={styles.heading(6)}>{children}</h6>,

                  strong: ({ children }) => (
                    <strong className="muted-txt" style={styles.strong}>
                      {children}
                    </strong>
                  ),

                  code: ({ inline, children }) =>
                    inline ? (
                      <code style={styles.inlineCode}>{children}</code>
                    ) : (
                      <pre style={styles.codeBlock}>
                        <code>{children}</code>
                      </pre>
                    ),

                  hr: () => <hr style={styles.horizontalRule} />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </>
      )}

      {uploadFlag === "Code" && (
        <>
          {!automatedCodedata ? (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {codeMetricsData.map((metric, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#e0f7fa",
                      borderRadius: "20px",
                      padding: "10px 15px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#00796b",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {metric.title} {metric.value}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ marginTop: "2rem" }}>
                  {codeTestCasesData.map((testCase, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        padding: "20px",
                        marginBottom: "20px",
                        transition: "transform 0.2s",
                        width: "95vw",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1e88e5", marginBottom: "10px" }}>
                        🧪 {testCase.testID?.title}: {testCase.testID?.value}
                      </div>

                      {testCase.caseTitle && (
                        <div style={{ marginBottom: "10px" }}>
                          <strong>{testCase.caseTitle.title}</strong> {testCase.caseTitle.value}
                        </div>
                      )}

                      {testCase.baseRequirement && (
                        <div style={{ marginBottom: "10px" }}>
                          <strong>{testCase.baseRequirement.title}:</strong> {testCase.baseRequirement.value}
                        </div>
                      )}

                      {testCase.testSteps && (
                        <div style={{ marginBottom: "10px" }}>
                          <strong>{testCase.testSteps.title}</strong>
                          <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                            {testCase.testSteps.value.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {testCase.expectedResult && (
                        <div style={{ marginBottom: "10px" }}>
                          <strong>{testCase.expectedResult.title}</strong>
                          <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                            {testCase.expectedResult.value.map((result, i) => (
                              <li key={i}>{result}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {testCase.testData && (
                        <div>
                          <strong>{testCase.testData.title}</strong>
                          {Array.isArray(testCase.testData.value) ? (
                            <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                              {testCase.testData.value.map((data, i) => (
                                <li key={i}>{data}</li>
                              ))}
                            </ul>
                          ) : (
                            <div>{testCase.testData.value}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={styles.markdownContent}>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 style={styles.heading(1)}>{children}</h1>,
                  h2: ({ children }) => <h2 style={styles.heading(2)}>{children}</h2>,
                  h3: ({ children }) => <h3 style={styles.heading(3)}>{children}</h3>,
                  h4: ({ children }) => <h4 style={styles.heading(4)}>{children}</h4>,
                  h5: ({ children }) => <h5 style={styles.heading(5)}>{children}</h5>,
                  h6: ({ children }) => <h6 style={styles.heading(6)}>{children}</h6>,

                  strong: ({ children }) => (
                    <strong className="muted-txt" style={styles.strong}>
                      {children}
                    </strong>
                  ),

                  code: ({ inline, children }) =>
                    inline ? (
                      <code style={styles.inlineCode}>{children}</code>
                    ) : (
                      <div style={styles.codeBlock}>
                        <code>{children}</code>
                      </div>
                    ),

                  hr: () => <hr style={styles.horizontalRule} />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </>
      )}


      {uploadFlag === "Jira" && (
        onlyJiraTestStories ? (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {jiraMetricsData.map((metric, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#e0f7fa",
                    borderRadius: "20px",
                    padding: "10px 15px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#00796b",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {metric.title} {metric.value}
                </div>
              ))}
            </div>
            <div style={{ marginTop: "2rem" }}>
              {jirastoryTestCases.map((story, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    padding: "20px",
                    marginBottom: "20px",
                    width: "95vw",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {story.userStoryDetails && (
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#1e88e5",
                        marginBottom: "10px",
                      }}
                    >
                      📝 {story.userStoryDetails.heading} {story.userStoryDetails.value}
                    </div>
                  )}

                  {story.baseReqDetails && (
                    <div style={{ marginBottom: "10px" }}>
                      <strong>{story.baseReqDetails.heading}:</strong>{" "}
                      {story.baseReqDetails.value}
                    </div>
                  )}

                  {story.descDetails && (
                    <div style={{ marginBottom: "10px" }}>
                      <strong>{story.descDetails.heading}:</strong>{" "}
                      {story.descDetails.value}
                    </div>
                  )}

                  {story.accDetails && (
                    <div style={{ marginBottom: "10px" }}>
                      <strong>{story.accDetails.heading}:</strong>
                      <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                        {story.accDetails.value.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {jiraMetricsData.map((metric, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "#e0f7fa",
                  borderRadius: "20px",
                  padding: "10px 15px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#00796b",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                {metric.title} {metric.value}
              </div>
            ))}

            <div style={{ marginTop: "2rem" }}>
              {jiraTestCases.map((testCase, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    padding: "20px",
                    marginBottom: "20px",
                    transition: "transform 0.2s",
                    width: "95vw"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1e88e5", marginBottom: "10px" }}>
                    🧪 {testCase.testCaseDetails.title} {testCase.testCaseDetails.value}
                  </div>

                  {testCase.baseReqDetails && (
                    <div style={{ marginBottom: "10px" }}>
                      <strong>{testCase.baseReqDetails.title}</strong> {testCase.baseReqDetails.value}
                    </div>
                  )}

                  {testCase.testStepsDetails && (
                    <div style={{ marginBottom: "10px" }}>
                      <strong>{testCase.testStepsDetails.steps}</strong>
                      <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                        {testCase.testStepsDetails.value.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {testCase.expResultDetails && (
                    <div style={{ marginBottom: "10px" }}>
                      <strong>{testCase.expResultDetails.title}</strong>
                      <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                        {testCase.expResultDetails.values.map((result, i) => (
                          <li key={i}>{result}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {testCase.testDetails && (
                    <div>
                      <strong>{testCase.testDetails.title}</strong>
                      {Array.isArray(testCase.testDetails.value) ? (
                        <ul style={{ marginTop: "5px", paddingLeft: "20px" }}>
                          {testCase.testDetails.value.map((data, i) => (
                            <li key={i}>{data}</li>
                          ))}
                        </ul>
                      ) : (
                        <div>{testCase.testDetails.value}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>

  );

};

export default StyledMarkdown;
