function parseMarkdown(content) {
  const lines = content.split("\n").map((line) => line.trim());
  const testCases = [];
  let currentTestCase = null;
  let section = "";

  for (let line of lines) {
    // Handle new test case start
    if (line.startsWith("## **Test Case ID:**")) {
      if (currentTestCase) testCases.push(currentTestCase);
      currentTestCase = {
        id: line.split("**Test Case ID:**")[1]?.trim() || "",
        type: "",
        baseRequirement: "",
        title: "",
        preconditions: [],
        steps: [],
        expectedResult: [],
        testData: [],
      };
      section = ""; // Reset section
    }

    // Section headers
    else if (line.startsWith("## **Type:**")) {
      const match = line.match(/## \*\*Type:\*\*\s*(.+)/);
      if (match && currentTestCase) {
        currentTestCase.type = match[1].trim();
      }
      section = ""; // Not multiline
    } else if (line.startsWith("## **Base Requirement:**")) {
      const match = line.match(/## \*\*Base Requirement:\*\*\s*(.+)/);
      if (match) {
        currentTestCase.baseRequirement = match[1].trim();
        section = "";
      } else {
        section = "baseRequirement";
      }
    } else if (line.startsWith("## **Title:**")) {
      const match = line.match(/## \*\*Title:\*\*\s*(.+)/);
      if (match) {
        currentTestCase.title = match[1].trim();
        section = "";
      } else {
        section = "title";
      }
    } else if (line.startsWith("## **Preconditions:**")) {
      section = "preconditions";
    } else if (line.startsWith("## **Test Steps:**")) {
      section = "steps";
    } else if (line.startsWith("## **Expected Result:**")) {
      section = "expectedResult";
    } else if (line.startsWith("## **Test Data:**")) {
      section = "testData";
    }

    // Unknown header, reset section
    else if (line.startsWith("## **")) {
      section = "";
    }

    // Content handling based on active section
    else if (currentTestCase && section) {
      const cleanedLine = line.replace(/^"|"$/g, "").trim();

      if (["baseRequirement", "title", "type"].includes(section)) {
        currentTestCase[section] +=
          (currentTestCase[section] ? " " : "") + cleanedLine;
      } else if (
        ["steps", "expectedResult", "testData", "preconditions"].includes(
          section,
        )
      ) {
        // Handle preconditions header within Test Steps section
        if (
          section === "steps" &&
          /\*\*Preconditions:\*\*/i.test(cleanedLine)
        ) {
          section = "preconditions";
        }
        // Handle steps header within Test Steps section
        else if (
          section === "preconditions" &&
          /\*\*Steps:\*\*/i.test(cleanedLine)
        ) {
          section = "steps";
        }
        // Handle preconditions content (bullet points, numbered items, or plain text)
        else if (section === "preconditions") {
          if (/^(-|\*|\d+\.)/.test(cleanedLine)) {
            currentTestCase.preconditions.push(
              cleanedLine.replace(/^(-|\*|\d+\.)\s*/, ""),
            );
          } else if (
            cleanedLine &&
            !/\*\*(Steps|Preconditions):\*\*/i.test(cleanedLine)
          ) {
            // Handle multi-line preconditions or non-bullet point preconditions
            if (currentTestCase.preconditions.length > 0) {
              currentTestCase.preconditions[
                currentTestCase.preconditions.length - 1
              ] += " " + cleanedLine;
            } else {
              currentTestCase.preconditions.push(cleanedLine);
            }
          }
        }
        // Handle regular numbered steps and other sections
        else if (["steps", "expectedResult", "testData"].includes(section)) {
          if (/^\d+\./.test(cleanedLine)) {
            currentTestCase[section].push(cleanedLine.replace(/^\d+\.\s*/, ""));
          }
        }
      }
    }
  }

  // Push the last test case
  if (currentTestCase) testCases.push(currentTestCase);

  // Compute metrics dynamically
  // Dynamically count test case types
  const typeCountMap = {};
  testCases.forEach((tc) => {
    const type = tc.type || "Unknown";
    typeCountMap[type] = (typeCountMap[type] || 0) + 1;
  });

  const metrics = {
    totalTestCases: testCases.length,
    typeBreakdown: typeCountMap,
    // Keep original hardcoded metrics for backward compatibility
    positiveCases: testCases.filter((tc) => /positive/i.test(tc.type)).length,
    negativeCases: testCases.filter((tc) => /negative/i.test(tc.type)).length,
    boundaryCases: testCases.filter((tc) => /boundary|edge/i.test(tc.type))
      .length,
  };

  return { metrics, testCases };
}

function parseUserStories(content) {
  const lines = content.split("\n").map((line) => line.trim());
  const userStories = [];
  const metrics = {};
  let currentStory = null;
  let section = "";
  let currentSectionContent = [];

  const userStoriesSection = () => {
    if (!currentStory || !section) return;
    const content = currentSectionContent.join(" ").trim();

    if (section === "Base Requirement") {
      currentStory.baseRequirement = content;
    } else if (section === "Description") {
      currentStory.description = content;
    } else if (section !== "Custom Fields") {
      const listItems = currentSectionContent
        .filter((line) => /^(\d+\.|-)/.test(line))
        .map((line) => line.replace(/^(\d+\.|-)/, ""));
      currentStory.custom_fields[section] =
        listItems.length > 0 ? listItems : content;
    }
  };

  for (let line of lines) {
    if (/^\*\*Total User Stories Generated:\*\*/.test(line)) {
      const match = line.match(/\*\*Total User Stories Generated:\*\*\s*(\d+)/);
      metrics.totalUserStories = match ? parseInt(match[1], 10) : null;
    } else if (line.startsWith("## **User Story")) {
      if (currentStory) {
        userStoriesSection();
        userStories.push(currentStory);
      }
      const titleMatch = line.match(/^## \*\*User Story \d+:\*\*\s*(.+)$/);
      currentStory = {
        title: titleMatch ? titleMatch[1].trim() : "",
        baseRequirement: "",
        description: "",
        custom_fields: {},
      };
      section = "";
      currentSectionContent = [];
    } else if (line.startsWith("## **Base Requirement**")) {
      userStoriesSection();
      section = "Base Requirement";
      currentSectionContent = [];
    } else if (line.startsWith("## **Description**")) {
      userStoriesSection();
      section = "Description";
      currentSectionContent = [];
    } else if (line.startsWith("## **Custom Fields**")) {
      userStoriesSection();
      section = "";
      currentSectionContent = [];
    } else if (line.startsWith("## **")) {
      const match = line.match(/^## \*\*(.+?)\*\*$/);
      if (match) {
        userStoriesSection();
        section = match[1].trim();
        currentSectionContent = [];
      }
    } else if (currentStory && section) {
      currentSectionContent.push(line);
    }
  }

  if (currentStory) {
    userStoriesSection();
    userStories.push(currentStory);
  }

  return { metrics, userStories };
}

function parseFeatures(content) {
  const lines = content.split("\n").map((line) => line.trim());
  const features = [];
  const metrics = {};
  let currentFeature = null;
  let section = "";
  let currentSectionContent = [];

  const saveSection = () => {
    if (!currentFeature || !section) return;
    const content = currentSectionContent.join(" ").trim();
    if (section === "Base Requirement") {
      currentFeature.baseRequirement = content;
    } else if (section === "Description") {
      currentFeature.description = content;
    } else if (section === "Acceptance Criteria") {
      const items = currentSectionContent
        .filter((line) => /^\d+\./.test(line))
        .map((line) => line.replace(/^\d+\.\s*/, "").trim());
      currentFeature.acceptanceCriteria = items;
    }
  };

  for (let line of lines) {
    if (/^\*\*Total Features Generated:\*\*/.test(line)) {
      const match = line.match(/\*\*Total Features Generated:\*\*\s*(\d+)/);
      metrics.totalFeatures = match ? parseInt(match[1], 10) : null;
    } else if (line.startsWith("## **Feature")) {
      if (currentFeature) {
        saveSection();
        features.push(currentFeature);
      }
      const titleMatch = line.match(/^## \*\*Feature \d+:\*\*\s*(.+)$/);
      currentFeature = {
        title: titleMatch ? titleMatch[1].trim() : "",
        baseRequirement: "",
        description: "",
        acceptanceCriteria: [],
      };
      section = "";
      currentSectionContent = [];
    } else if (line.startsWith("## **Base Requirement")) {
      saveSection();
      section = "Base Requirement";
      currentSectionContent = [];
    } else if (line.startsWith("## **Description")) {
      saveSection();
      section = "Description";
      currentSectionContent = [];
    } else if (line.startsWith("## **Acceptance Criteria")) {
      saveSection();
      section = "Acceptance Criteria";
      currentSectionContent = [];
    } else if (line.startsWith("## **")) {
      saveSection();
      section = "";
      currentSectionContent = [];
    } else if (currentFeature && section) {
      currentSectionContent.push(line);
    }
  }

  if (currentFeature) {
    saveSection();
    features.push(currentFeature);
  }

  return { metrics, features };
}

export { parseMarkdown, parseUserStories, parseFeatures };
