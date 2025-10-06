import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./markdownCSS.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

/**
 * Renders pretty code blocks with:
 * - toolbar (filename / language)
 * - copy button with feedback
 * - dark theme, rounded corners, soft shadow
 */
const CodeBlock = ({ children, className }) => {
  const [copied, setCopied] = useState(false);

  // Raw text inside the code fence
  const raw = useMemo(() => {
    if (Array.isArray(children)) return children.join("");
    return String(children || "");
  }, [children]);

  // Try to pull a filename from a first-line comment:
  //   # filename: foo.feature
  //   // filename: foo.feature
  //   // src/test/resources/features/foo.feature
  const { displayText, filename, language } = useMemo(() => {
    const langMatch = /language-([\w-]+)/.exec(className || "");
    let lang = (langMatch && langMatch[1]) || "";

    let file = null;
    let text = raw;

    // Prefer explicit "# filename: <name>"
    const explicit = /^\s*#\s*filename:\s*(.+?)\s*$/im;
    const m1 = text.match(explicit);
    if (m1) {
      file = m1[1].trim();
      text = text.replace(explicit, "").trimStart();
    }

    // Fallback: first line that looks like a comment path
    if (!file) {
      const m2 = text.match(
        /^\s*(?:#|\/\/)\s*(?:filename:\s*)?([^\n]+?\.(feature|json|yml|yaml|xml|java|ts|js))\s*$/im
      );
      if (m2) {
        file = m2[1].trim();
        // Don't strip that line automatically; it might be part of the content
      }
    }

    return { displayText: text, filename: file, language: lang || "text" };
  }, [className, raw]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  };

  return (
    <div className="mkd-code">
      <div className="mkd-code__toolbar">
        <div className="mkd-code__meta">
          {filename ? (
            <>
              <span className="mkd-code__file">{filename}</span>
              <span className="mkd-code__sep">•</span>
              <span className="mkd-code__lang">{language}</span>
            </>
          ) : (
            <span className="mkd-code__lang">{language}</span>
          )}
        </div>

        <button
          type="button"
          className={`mkd-code__copy ${copied ? "copied" : ""}`}
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="mkd-code__pre" tabIndex={0}>
        {/* <code className="mkd-code__code">{displayText}</code> */}
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          PreTag="div"
          customStyle={{ margin: 0, background: "transparent", fontSize: "15px" }}
        >
          {displayText}
        </SyntaxHighlighter>
      </pre>
    </div>
  );
};

const StyledMarkdown = ({ content }) => {
  const styles = {
    markdownContent: {
      color: "rgb(13, 13, 13)",
      fontFamily: "Helvetica, sans-serif",
      margin: 0,
      padding: 0,
      textAlign: "justify",
    },
    heading: (level) => ({
      fontSize: `${24 - level * 2}px`,
      fontWeight: "bold",
      color: "rgb(13, 13, 13)",
      margin: 0,
      padding: 0,
      lineHeight: 1.5,
    }),
    strong: {
      fontWeight: "bold",
      color: "rgb(13, 13, 13)",
      margin: 0,
      padding: 0,
    },
    list: {
      color: "rgb(13, 13, 13)",
      lineHeight: 1.5,
      margin: 0,
    },
    listItem: {
      fontSize: "16px",
      color: "rgb(13, 13, 13)",
      textAlign: "justify",
      lineHeight: 1.5,
      margin: 0,
      padding: 0,
    },
    horizontalRule: { margin: "1px 0", padding: 0 },
  };

  return (
    <div style={styles.markdownContent}>
      <ReactMarkdown
        components={{
          // NEW: remove react-markdown's auto <pre> wrapper
          // This prevents an extra parent <pre> around our custom mkd-code block.
          pre: ({ children }) => <>{children}</>,
          h1: ({ children }) => <h1 style={styles.heading(1)}>{children}</h1>,
          h2: ({ children }) => <h2 style={styles.heading(2)}>{children}</h2>,
          h3: ({ children }) => <h3 style={styles.heading(3)}>{children}</h3>,
          h4: ({ children }) => <h4 style={styles.heading(4)}>{children}</h4>,
          h5: ({ children }) => <h5 style={styles.heading(5)}>{children}</h5>,
          h6: ({ children }) => <h6 style={styles.heading(6)}>{children}</h6>,
          strong: ({ children }) => (
            <strong style={styles.strong}>{children}</strong>
          ),
          code: ({ inline, className, children }) =>
            inline ? (
              <code className="mkd-inline-code">{children}</code>
            ) : (
              <CodeBlock className={className}>{children}</CodeBlock>
            ),
          hr: () => <hr style={styles.horizontalRule} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default StyledMarkdown;
