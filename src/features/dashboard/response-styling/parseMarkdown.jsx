// function parseMarkdown(content) {
//   const lines = content.split("\n").map((line) => line.trim());
//   const testCases = [];
//   let currentTestCase = null;
//   let section = "";

//   for (let line of lines) {
//     // Handle new test case start
//     if (line.startsWith("## **Test Case ID:**")) {
//       if (currentTestCase) testCases.push(currentTestCase);
//       currentTestCase = {
//         id: line.split("**Test Case ID:**")[1]?.trim() || "",
//         type: "",
//         baseRequirement: "",
//         title: "",
//         preconditions: [],
//         steps: [],
//         expectedResult: [],
//         testData: [],
//       };
//       section = ""; // Reset section
//     }

//     // Section headers
//     else if (line.startsWith("## **Type:**")) {
//       const match = line.match(/## \*\*Type:\*\*\s*(.+)/);
//       if (match && currentTestCase) {
//         currentTestCase.type = match[1].trim();
//       }
//       section = ""; // Not multiline
//     } else if (line.startsWith("## **Base Requirement:**")) {
//       const match = line.match(/## \*\*Base Requirement:\*\*\s*(.+)/);
//       if (match) {
//         currentTestCase.baseRequirement = match[1].trim();
//         section = "";
//       } else {
//         section = "baseRequirement";
//       }
//     } else if (line.startsWith("## **Title:**")) {
//       const match = line.match(/## \*\*Title:\*\*\s*(.+)/);
//       if (match) {
//         currentTestCase.title = match[1].trim();
//         section = "";
//       } else {
//         section = "title";
//       }
//     } else if (line.startsWith("## **Preconditions:**")) {
//       section = "preconditions";
//     } else if (line.startsWith("## **Test Steps:**")) {
//       section = "steps";
//     } else if (line.startsWith("## **Expected Result:**")) {
//       section = "expectedResult";
//     } else if (line.startsWith("## **Test Data:**")) {
//       section = "testData";
//     }

//     // Unknown header, reset section
//     else if (line.startsWith("## **")) {
//       section = "";
//     }

//     // Content handling based on active section
//     else if (currentTestCase && section) {
//       const cleanedLine = line.replace(/^"|"$/g, "").trim();

//       if (["baseRequirement", "title", "type"].includes(section)) {
//         currentTestCase[section] +=
//           (currentTestCase[section] ? " " : "") + cleanedLine;
//       } else if (
//         ["steps", "expectedResult", "testData", "preconditions"].includes(
//           section,
//         )
//       ) {
//         // Handle preconditions header within Test Steps section
//         if (
//           section === "steps" &&
//           /\*\*Preconditions:\*\*/i.test(cleanedLine)
//         ) {
//           section = "preconditions";
//         }
//         // Handle steps header within Test Steps section
//         else if (
//           section === "preconditions" &&
//           /\*\*Steps:\*\*/i.test(cleanedLine)
//         ) {
//           section = "steps";
//         }
//         // Handle preconditions content (bullet points, numbered items, or plain text)
//         else if (section === "preconditions") {
//           if (/^(-|\*|\d+\.)/.test(cleanedLine)) {
//             currentTestCase.preconditions.push(
//               cleanedLine.replace(/^(-|\*|\d+\.)\s*/, ""),
//             );
//           } else if (
//             cleanedLine &&
//             !/\*\*(Steps|Preconditions):\*\*/i.test(cleanedLine)
//           ) {
//             // Handle multi-line preconditions or non-bullet point preconditions
//             if (currentTestCase.preconditions.length > 0) {
//               currentTestCase.preconditions[
//                 currentTestCase.preconditions.length - 1
//               ] += " " + cleanedLine;
//             } else {
//               currentTestCase.preconditions.push(cleanedLine);
//             }
//           }
//         }
//         // Handle regular numbered steps and other sections
//         else if (["steps", "expectedResult", "testData"].includes(section)) {
//           if (/^\d+\./.test(cleanedLine)) {
//             currentTestCase[section].push(cleanedLine.replace(/^\d+\.\s*/, ""));
//           }
//         }
//       }
//     }
//   }

//   // Push the last test case
//   if (currentTestCase) testCases.push(currentTestCase);

//   // Compute metrics dynamically
//   // Dynamically count test case types
//   const typeCountMap = {};
//   testCases.forEach((tc) => {
//     const type = tc.type || "Unknown";
//     typeCountMap[type] = (typeCountMap[type] || 0) + 1;
//   });

//   const metrics = {
//     totalTestCases: testCases.length,
//     typeBreakdown: typeCountMap,
//     // Keep original hardcoded metrics for backward compatibility
//     positiveCases: testCases.filter((tc) => /positive/i.test(tc.type)).length,
//     negativeCases: testCases.filter((tc) => /negative/i.test(tc.type)).length,
//     boundaryCases: testCases.filter((tc) => /boundary|edge/i.test(tc.type))
//       .length,
//   };

//   return { metrics, testCases };
// }
// Clean, markdown-agnostic parsers.
// This version strips '**', '##', '---', and ignores stray markdown so only data remains.

function normalizeContent(content) {
  return content
    // Remove hard separators and repeated dashes
    .replace(/^[\s\-–—]{3,}$/gm, "")
    // Remove common decorative UI lines (e.g., "Close", "Menu") if they are standalone headings
    .replace(/^(Menu|Close|User Icon|AI Robot)\s*$/gmi, "")
    // Strip bold markers
    .replace(/\*\*/g, "")
    // Normalize Windows newlines
    .replace(/\r\n/g, "\n");
}

// Greedy trim of line-level markdown
function cleanLine(line) {
  return line
    // Remove starting hashes (##, ###, etc.)
    .replace(/^#{1,6}\s*/, "")
    // Remove enclosing quotes
    .replace(/^"|"$/g, "")
    // Remove stray bolds already handled above, but just in case
    .replace(/\*\*/g, "")
    // Collapse excessive spaces
    .replace(/\s+/g, " ")
    .trim();
}

// Try to match a header in flexible ways (with/without '##', emojis, punctuation, etc.)
function matchHeader(line, name) {
  const patterns = [
    new RegExp(`^##\\s*${name}\\s*:?\\s*(.*)$`, "i"),
    new RegExp(`^${name}\\s*:?\\s*(.*)$`, "i"),
    // tolerate leading non-word characters/emojis, then header
    new RegExp(`^[^A-Za-z0-9]*\\s*${name}\\s*:?\\s*(.*)$`, "i"),
  ];
  for (const rx of patterns) {
    const m = line.match(rx);
    if (m) return (m[1] || "").trim();
  }
  return null;
}

// Split a line that may contain multiple inline headers, like:
// "Preconditions: Base URL... Steps: Send POST ... Expected Results: ..."
function splitInlineSections(line) {
  const keys = ["Preconditions", "Steps", "Expected Results?", "Expected Result", "Test Data"];
  // Build a regex that captures any of the keys followed by ':'
  const rx = new RegExp(`\\b(${keys.join("|")})\\s*:`, "ig");
  const parts = [];
  let lastIndex = 0;
  let m;

  while ((m = rx.exec(line)) !== null) {
    if (m.index > lastIndex) {
      const between = line.slice(lastIndex, m.index).trim();
      if (between) {
        parts.push({ key: null, text: between });
      }
    }
    const key = m[1];
    lastIndex = rx.lastIndex;
    // Look ahead to next match to know where this section ends
    const next = rx.exec(line);
    if (next) {
      const text = line.slice(lastIndex, next.index).trim();
      parts.push({ key, text });
      rx.lastIndex = next.index; // continue from next match
      lastIndex = next.index;
    } else {
      const text = line.slice(lastIndex).trim();
      parts.push({ key, text });
      break;
    }
  }

  if (parts.length === 0) {
    const remaining = line.slice(lastIndex).trim();
    if (remaining) parts.push({ key: null, text: remaining });
  }
  return parts;
}

function pushItem(arr, text) {
  if (!text) return;
  const t = text.trim();
  if (!t) return;
  // If text starts with a list marker or number, strip it.
  const stripped = t.replace(/^(\d+\.)|^[-*]\s+/, "");
  if (arr.length === 0) {
    arr.push(stripped);
  } else {
    // If previous item ended with punctuation and this looks like a continuation, append.
    // Otherwise, push as a new item if it begins with a typical step indicator.
    const prev = arr[arr.length - 1];
    if (!/[\.\:]$/.test(prev) && !/^(\d+\.|[-*])\s+/.test(t)) {
      arr[arr.length - 1] = prev + " " + stripped;
    } else {
      arr.push(stripped);
    }
  }
}

function parseMarkdown(content) {
  const text = normalizeContent(content);
  const rawLines = text.split("\n").map(cleanLine).filter(Boolean);

  const testCases = [];
  let current = null;
  let section = "";

  const setSection = (name) => { section = name; };

  for (let raw of rawLines) {
    let line = raw;

    // --- New Test Case start (very flexible: supports emojis like "🧪 Test Case ID: EAPBA-...")
    const idCap = matchHeader(line, "Test Case ID");
    if (idCap !== null) {
      if (current) testCases.push(current);
      current = {
        id: idCap,
        type: "",
        baseRequirement: "",
        title: "",
        preconditions: [],
        steps: [],
        expectedResult: [],
        testData: [],
      };
      section = "";
      continue;
    }

    if (!current) continue; // ignore junk until first ID is found

    // --- Top-level single-line headers (where value may be in same line or empty)
    const titleCap = matchHeader(line, "Title");
    if (titleCap !== null) { if (titleCap) current.title = titleCap; setSection(titleCap ? "" : "title"); continue; }

    const typeCap = matchHeader(line, "Type");
    if (typeCap !== null) { if (typeCap) current.type = typeCap; setSection(typeCap ? "" : "type"); continue; }

    const baseCap = matchHeader(line, "Base Requirement");
    if (baseCap !== null) { if (baseCap) current.baseRequirement = baseCap; setSection(baseCap ? "" : "baseRequirement"); continue; }

    // Section switches (no immediate content)
    if (matchHeader(line, "Preconditions") !== null && line.match(/:\s*$/)) { setSection("preconditions"); continue; }
    if (matchHeader(line, "Steps") !== null && line.match(/:\s*$/)) { setSection("steps"); continue; }
    if (matchHeader(line, "Expected Result") !== null && line.match(/:\s*$/)) { setSection("expectedResult"); continue; }
    if (matchHeader(line, "Expected Results") !== null && line.match(/:\s*$/)) { setSection("expectedResult"); continue; }
    if (matchHeader(line, "Test Data") !== null && line.match(/:\s*$/)) { setSection("testData"); continue; }

    // Inline multi-section line handling
    if (/(Preconditions|Steps|Expected Result|Expected Results|Test Data)\s*:/i.test(line)) {
      const chunks = splitInlineSections(line);
      for (const { key, text } of chunks) {
        if (!key) {
          // fall back to current section if any
          if (section === "preconditions") pushItem(current.preconditions, text);
          else if (section === "steps") pushItem(current.steps, text);
          else if (section === "expectedResult") pushItem(current.expectedResult, text);
          else if (section === "testData") pushItem(current.testData, text);
          continue;
        }
        const k = key.toLowerCase();
        if (k.startsWith("preconditions")) {
          section = "preconditions";
          pushItem(current.preconditions, text);
        } else if (k.startsWith("steps")) {
          section = "steps";
          pushItem(current.steps, text);
        } else if (k.startsWith("expected")) {
          section = "expectedResult";
          pushItem(current.expectedResult, text);
        } else if (k.startsWith("test data")) {
          section = "testData";
          pushItem(current.testData, text);
        }
      }
      continue;
    }

    // If we're inside a multiline field (title/base/type), append and move on
    if (["title", "baseRequirement", "type"].includes(section)) {
      const val = line.trim();
      if (val) {
        current[section] = (current[section] ? current[section] + " " : "") + val;
      }
      continue;
    }

    // If we're in a list-like section, push content lines
    if (section === "preconditions") {
      pushItem(current.preconditions, line);
      continue;
    }
    if (section === "steps") {
      pushItem(current.steps, line);
      continue;
    }
    if (section === "expectedResult") {
      pushItem(current.expectedResult, line);
      continue;
    }
    if (section === "testData") {
      // Allow "key: value" pairs or plain entries; convert simple "a: b" to "a=b" for normalized feel
      const kv = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)$/);
      if (kv) {
        current.testData.push(`${kv[1]}=${kv[2]}`.trim());
      } else {
        pushItem(current.testData, line);
      }
      continue;
    }

    // Unknown or decorative lines are ignored.
  }

  if (current) testCases.push(current);

  // Metrics (no markdown remnants)
  const typeBreakdown = {};
  for (const tc of testCases) {
    const t = tc.type || "Unknown";
    typeBreakdown[t] = (typeBreakdown[t] || 0) + 1;
  }

  const metrics = {
    totalTestCases: testCases.length,
    typeBreakdown,
    positiveCases: testCases.filter((tc) => /positive/i.test(tc.type)).length,
    negativeCases: testCases.filter((tc) => /negative/i.test(tc.type)).length,
    boundaryCases: testCases.filter((tc) => /(boundary|edge)/i.test(tc.type)).length,
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

// function parseFeatures(content) {
//   const lines = content.split("\n").map((line) => line.trim());
//   const features = [];
//   const metrics = {};
//   let currentFeature = null;
//   let section = "";
//   let currentSectionContent = [];

//   const saveSection = () => {
//     if (!currentFeature || !section) return;
//     const content = currentSectionContent.join(" ").trim();
//     if (section === "Base Requirement") {
//       currentFeature.baseRequirement = content;
//     } else if (section === "Description") {
//       currentFeature.description = content;
//     } else if (section === "Acceptance Criteria") {
//       const items = currentSectionContent
//         .filter((line) => /^\d+\./.test(line))
//         .map((line) => line.replace(/^\d+\.\s*/, "").trim());
//       currentFeature.acceptanceCriteria = items;
//     }
//   };

//   for (let line of lines) {
//     if (/^\*\*Total Features Generated:\*\*/.test(line)) {
//       const match = line.match(/\*\*Total Features Generated:\*\*\s*(\d+)/);
//       metrics.totalFeatures = match ? parseInt(match[1], 10) : null;
//     } else if (line.startsWith("## **Feature")) {
//       if (currentFeature) {
//         saveSection();
//         features.push(currentFeature);
//       }
//       const titleMatch = line.match(/^## \*\*Feature \d+:\*\*\s*(.+)$/);
//       currentFeature = {
//         title: titleMatch ? titleMatch[1].trim() : "",
//         baseRequirement: "",
//         description: "",
//         acceptanceCriteria: [],
//       };
//       section = "";
//       currentSectionContent = [];
//     } else if (line.startsWith("## **Base Requirement")) {
//       saveSection();
//       section = "Base Requirement";
//       currentSectionContent = [];
//     } else if (line.startsWith("## **Description")) {
//       saveSection();
//       section = "Description";
//       currentSectionContent = [];
//     } else if (line.startsWith("## **Acceptance Criteria")) {
//       saveSection();
//       section = "Acceptance Criteria";
//       currentSectionContent = [];
//     } else if (line.startsWith("## **")) {
//       saveSection();
//       section = "";
//       currentSectionContent = [];
//     } else if (currentFeature && section) {
//       currentSectionContent.push(line);
//     }
//   }

//   if (currentFeature) {
//     saveSection();
//     features.push(currentFeature);
//   }

//   return { metrics, features };
// }

export { parseMarkdown, parseUserStories };
