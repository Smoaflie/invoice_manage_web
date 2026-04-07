export interface RuleEditorRule {
  name: string;
  pattern: string;
  tag: string;
}

export interface RuleEditorProps {
  rules?: RuleEditorRule[];
}

export function RuleEditor({ rules = [] }: RuleEditorProps) {
  return (
    <section aria-label="Rule editor">
      <h2>Rules</h2>
      <p>Configure simple regex-based tagging rules.</p>
      <label>
        Rule name
        <input type="text" placeholder="hotel" />
      </label>
      <label>
        Pattern
        <input type="text" placeholder="酒店" />
      </label>
      <label>
        Tag
        <input type="text" placeholder="住宿" />
      </label>
      <button type="button">Save rule</button>
      <ul>
        {rules.map((rule) => (
          <li key={rule.name}>
            {rule.name}: /{rule.pattern}/ -&gt; {rule.tag}
          </li>
        ))}
      </ul>
    </section>
  );
}
