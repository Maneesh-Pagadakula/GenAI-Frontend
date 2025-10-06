import React from "react";
import ReactMarkdown from "react-markdown";

const StyledMarkdown = ({ content }) => {
  const styles = {
    markdownContent: {
      color: "rgb(13, 13, 13)",
      fontFamily: "Helvetica, sans-serif",
      textAlign: "justify",
      margin: "0",
      padding: "0"
    },
    heading: (level) => ({
      fontSize: `${24 - level * 2}px`,
      fontWeight: "bold",
      color: "rgb(13, 13, 13)",
      margin: "0",
      padding: 0,
      lineHeight: 1.5,
    }),
    strong: {
      fontWeight: "bold",
      color: "rgb(13, 13, 13)",
      margin: 0,
      padding: 0,
    },
    codeBlock: {
      fontFamily: "Courier, monospace",
      fontSize: "12px",
      backgroundColor: "#000",
      padding: "10px",
      borderRadius: "5px",
      color: "#fff",
      textAlign: "left",
      lineHeight: 1.5,
      margin: 0,
      width: "100%",
      overflowX: "auto",
    },
    list: {
    //   paddingLeft: "20px",
      color: "rgb(13, 13, 13)",
      lineHeight: 1.5,
      margin: "0",
    },
    listItem: {
      fontSize: "16px",
      color: "rgb(13, 13, 13)",
      textAlign: "justify",
      lineHeight: 1.5,
      margin: 0,
      padding: 0,
    },
    horizontalRule: {
      margin: "1px 0",
      padding: 0
    },
  };

  return (
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
            <strong style={styles.strong}>{children}</strong>
          ),
          code: ({ inline, children }) =>
            inline ? (
              <code>{children}</code>
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
  );
};

export default StyledMarkdown;