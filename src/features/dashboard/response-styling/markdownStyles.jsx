import React, { useEffect, useState } from "react";
import StyledMarkdown from "./styledMarkdown.jsx";
import {
  parseMarkdown,
  parseUserStories,
  parseFeatures,
} from "./parseMarkdown";
import "./markdownCSS.css";

const MarkdownStyles = ({ content, initialFilter = "all", onFilterChange }) => {
  const [parsedData, setParsedData] = useState(null);
  const [hasTestCases, setHasTestCases] = useState(false);

  const [userStoriesData, setUserStoriesData] = useState(null);
  const [hasUserStories, setHasUserStories] = useState(false);

  const [featureData, setFeatureData] = useState(null);
  const [hasFeatures, setHasFeatures] = useState(false);

  const [isStructuredContent, setIsStructuredContent] = useState(false);

  // Filter states
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [filteredTestCases, setFilteredTestCases] = useState([]);

  useEffect(() => {
    if (content) {
      console.log("Received markdown content:", content);
      const testCaseResult = parseMarkdown(content);
      const userStoryResult = parseUserStories(content);
      const featureResult = parseFeatures(content);

      setParsedData(testCaseResult);
      setUserStoriesData(userStoryResult);
      setFeatureData(featureResult);

      const userStoriesExist =
        userStoryResult?.metrics?.totalUserStories != null &&
        userStoryResult.metrics.totalUserStories > 0;
      const testCasesExist =
        testCaseResult?.metrics?.totalTestCases != null &&
        testCaseResult.metrics.totalTestCases > 0;

      const featuresExist =
        featureResult?.metrics?.totalFeatures != null &&
        featureResult.metrics.totalFeatures > 0;

      setHasTestCases(testCasesExist);
      setHasUserStories(userStoriesExist);
      setHasFeatures(featuresExist);
      setIsStructuredContent(
        userStoriesExist || testCasesExist || featuresExist,
      );

      // Initialize filtered test cases and reset filter
      if (testCasesExist) {
        setFilteredTestCases(testCaseResult.testCases || []);
        // Reset to "all" when new content arrives to show all test cases including refined ones
        if (activeFilter !== "all") {
          setActiveFilter("all");
        }
      }

      console.log("Test Case Result:", testCaseResult);
      console.log("User Story Result:", userStoryResult);
      console.log("Feature Result:", featureResult);
      console.log("Has User Stories:", userStoriesExist);
      console.log("Has Test Cases:", testCasesExist);
      console.log("Has Features:", featuresExist);
    }
  }, [content]);

  // Filter test cases based on type
  // useEffect(() => {
  //   if (parsedData?.testCases) {
  //     let filtered = [];

  //     console.log("Filtering test cases:", {
  //       activeFilter,
  //       totalTestCases: parsedData.testCases.length,
  //       metrics: parsedData.metrics,
  //     });

  //     if (activeFilter === "all") {
  //       filtered = [...parsedData.testCases]; // Use spread operator to ensure we get all cases
  //     } else if (activeFilter === "positive") {
  //       // Filter positive cases - first N cases
  //       filtered = parsedData.testCases.slice(
  //         0,
  //         parsedData.metrics.positiveCases
  //       );
  //     } else if (activeFilter === "negative") {
  //       // Filter negative cases - middle N cases
  //       const startIndex = parsedData.metrics.positiveCases;
  //       const endIndex = startIndex + parsedData.metrics.negativeCases;
  //       filtered = parsedData.testCases.slice(startIndex, endIndex);
  //     } else if (activeFilter === "boundary") {
  //       // Filter boundary cases - last N cases
  //       const startIndex =
  //         parsedData.metrics.positiveCases + parsedData.metrics.negativeCases;
  //       filtered = parsedData.testCases.slice(startIndex);
  //     }

  //     console.log("Filtered result:", {
  //       filterType: activeFilter,
  //       filteredCount: filtered.length,
  //       originalCount: parsedData.testCases.length,
  //     });

  //     setFilteredTestCases(filtered);
  //   }
  // }, [activeFilter, parsedData]);

  useEffect(() => {
    if (parsedData?.testCases && parsedData.testCases.length > 0) {
      let filtered = [];

      if (activeFilter === "all") {
        filtered = [...parsedData.testCases];
      } else {
        // Dynamic filtering based on the active filter type
        filtered = parsedData.testCases.filter((tc) => {
          const tcType = (tc.type || "").trim();

          // Handle legacy filters for backward compatibility
          if (activeFilter === "positive") {
            return /positive/i.test(tcType);
          } else if (activeFilter === "negative") {
            return /negative/i.test(tcType);
          } else if (activeFilter === "boundary") {
            return /(boundary|edge)/i.test(tcType);
          } else {
            // For dynamic types, match the type exactly (case-insensitive)
            // Also try partial matching for compound types
            const lowerCaseType = tcType.toLowerCase();
            const lowerCaseFilter = activeFilter.toLowerCase();
            return (
              lowerCaseType === lowerCaseFilter ||
              lowerCaseType.includes(lowerCaseFilter) ||
              lowerCaseFilter.includes(lowerCaseType)
            );
          }
        });
      }

      console.log(
        `Filtering: ${activeFilter}, Found ${filtered.length} of ${parsedData.testCases.length} test cases`,
      );
      setFilteredTestCases(filtered);
    } else {
      setFilteredTestCases([]);
    }
  }, [activeFilter, parsedData]);

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    if (onFilterChange) {
      onFilterChange(filterType);
    }
  };

  if (!content) return null;

  // If no structured content was found, fallback to markdown rendering
  if (!isStructuredContent) {
    return <StyledMarkdown content={content} />;
  }

  return (
    <div className="parsed-markdown">
      {hasFeatures && featureData?.features?.length > 0 && (
        <div>
          <ul>
            <li>
              <strong>Total Features Generated:</strong>{" "}
              {featureData.metrics.totalFeatures}
            </li>
          </ul>
          {featureData.features.map((feature, index) => (
            <div key={index} className="test-case">
              <h3>
                📝 Feature {index + 1}: {feature.title}
              </h3>
              <div>
                <strong>Base Requirement:</strong> {feature.baseRequirement}
              </div>
              <div>
                <strong>Description:</strong> {feature.description}
              </div>
              <div>
                <strong>Acceptance Criteria:</strong>
                <ol id="epicOl">
                  {feature.acceptanceCriteria.map((item, i) => (
                    <li key={i} id="epicLi">
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasUserStories && userStoriesData?.userStories?.length > 0 && (
        <div>
          <ul>
            <li>
              <strong>Total User Stories Generated:</strong>{" "}
              {userStoriesData.metrics.totalUserStories}
            </li>
          </ul>
          {userStoriesData.userStories.map((story, index) => (
            <div key={index} className="test-case">
              <h3>
                📝 User Story {index + 1}: {story.title}
              </h3>
              <div>
                <strong>Base Requirement:</strong> {story.baseRequirement}
              </div>
              <div>
                <strong>Description:</strong> {story.description}
              </div>
              {Object.entries(story.custom_fields).map(([key, value]) => (
                <div key={key}>
                  <strong>{key}:</strong>{" "}
                  {Array.isArray(value) ? (
                    <ol id="epicOl">
                      {value.map((item, i) => (
                        <li key={i} id="epicLi">
                          {item}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <span>{value}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {hasTestCases && parsedData?.testCases?.length > 0 && (
        <div>
          <div className="filter-bar">
            <ul>
              <li
                className={`metric-filter ${
                  activeFilter === "all" ? "active" : ""
                }`}
                onClick={() => handleFilterChange("all")}
              >
                <strong>Total Test Cases Generated:</strong>{" "}
                {parsedData.metrics.totalTestCases}
              </li>
              {/* Dynamic filters for each test case type */}
              {parsedData.metrics.typeBreakdown &&
                Object.entries(parsedData.metrics.typeBreakdown).map(
                  ([type, count]) => (
                    <li
                      key={type}
                      className={`metric-filter ${
                        activeFilter === type.toLowerCase() ? "active" : ""
                      }`}
                      onClick={() => handleFilterChange(type.toLowerCase())}
                    >
                      <strong>{type} Cases:</strong> {count}
                    </li>
                  ),
                )}
            </ul>
            <div className="filter-message">
              <strong>
                Showing {filteredTestCases.length} out of{" "}
                {parsedData.metrics.totalTestCases} test cases
              </strong>
            </div>
          </div>
          {/* Filtered Test Cases */}
          <div className="filtered-results">
            {/*<p className="filter-info">*/}
            {/* Showing {filteredTestCases.length} of{" "}
              {parsedData.metrics.totalTestCases} test cases */}
            {/* activeFilter !== "all" && ` (${activeFilter} cases)` */}
            {/*</p>*/}

            {filteredTestCases.map((testCase, index) => (
              <div
                key={`${testCase.id}-${index}-${testCase.title?.substring(0, 10) || "tc"}`}
                className="test-case"
              >
                <h3>🧪 Test Case ID: {testCase.id}</h3>
                <div>
                  <strong>Title:</strong> {testCase.title}
                </div>
                <div>
                  <strong>Type:</strong> {testCase.type}
                </div>
                <div>
                  <strong>Base Requirement:</strong> {testCase.baseRequirement}
                </div>
                {testCase.preconditions &&
                  testCase.preconditions.length > 0 && (
                    <div>
                      <strong>Preconditions:</strong>
                      <ol>
                        {testCase.preconditions.map((precondition, i) => (
                          <li key={i}>{precondition}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                <div>
                  <strong>Steps:</strong>
                  <ol>
                    {testCase.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <strong>Expected Results:</strong>
                  <ol>
                    {testCase.expectedResult.map((res, i) => (
                      <li key={i}>{res}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <strong>Test Data:</strong>
                  <ol>
                    {testCase.testData.map((data, i) => (
                      <li key={i}>{data}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownStyles;
