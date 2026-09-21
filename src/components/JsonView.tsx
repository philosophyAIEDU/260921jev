function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function syntaxHighlight(jsonString: string): string {
  const escaped = escapeHtml(jsonString);
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-string";
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-boolean";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

/** API Key 등 민감정보가 포함되지 않은 객체만 전달해야 한다 */
export function JsonView({ data }: { data: unknown }) {
  const jsonString = JSON.stringify(data, null, 2);
  return (
    <pre className="json-view" dangerouslySetInnerHTML={{ __html: syntaxHighlight(jsonString) }} />
  );
}
