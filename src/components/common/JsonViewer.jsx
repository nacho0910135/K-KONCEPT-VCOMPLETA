const JsonViewer = ({ value }) => (
  <pre className="max-h-96 overflow-auto rounded-lg bg-neutral-900 p-4 text-xs leading-5 text-neutral-50">
    {JSON.stringify(value, null, 2)}
  </pre>
);

export default JsonViewer;
