/**
 * ToolSelector.jsx — Landing page with 3 tool cards
 */

function ToolSelector({ onSelectTool }) {
  const tools = [
    {
      id: 'matcher',
      icon: '🔍',
      title: 'Excel Sheet Matcher',
      subtitle: 'Fuzzy Match & Compare',
      description:
        'Upload multiple Excel sheets, select columns, and find matching or similar cells — even with small typos like "shubham" vs "shuham".',
      features: ['Levenshtein fuzzy matching', 'Typo detection', 'Character-level diff highlighting', 'Configurable threshold'],
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      glow: 'rgba(99, 102, 241, 0.25)',
    },
    {
      id: 'merger',
      icon: '🔗',
      title: 'Multiple Excel Merger',
      subtitle: 'Combine & Consolidate',
      description:
        'Merge two or more Excel files into a single workbook. Combine rows, append sheets, or merge by matching columns.',
      features: ['Append rows from multiple files', 'Merge into single sheet', 'Keep as separate sheets', 'Smart column alignment'],
      gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
      glow: 'rgba(6, 182, 212, 0.25)',
    },
    {
      id: 'vlookup',
      icon: '🔎',
      title: 'Excel VLOOKUP',
      subtitle: 'Lookup & Pull Data',
      description:
        'Perform VLOOKUP-style operations across Excel files. Match a key column and pull corresponding values from another sheet.',
      features: ['Cross-file lookups', 'Fuzzy key matching', 'Pull multiple columns', 'Export enriched results'],
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      glow: 'rgba(245, 158, 11, 0.25)',
    },
  ];

  return (
    <div className="tool-selector">
      <div className="tool-selector__grid">
        {tools.map((tool, idx) => (
          <button
            key={tool.id}
            className="tool-card animate-in"
            style={{ animationDelay: `${idx * 0.12}s` }}
            onClick={() => onSelectTool(tool.id)}
            id={`tool-${tool.id}`}
          >
            {/* Glow background */}
            <div
              className="tool-card__glow"
              style={{ background: `radial-gradient(circle at 50% 0%, ${tool.glow}, transparent 70%)` }}
            />

            <div className="tool-card__content">
              {/* Icon */}
              <div
                className="tool-card__icon"
                style={{ background: tool.gradient }}
              >
                <span>{tool.icon}</span>
              </div>

              {/* Text */}
              <div className="tool-card__subtitle">{tool.subtitle}</div>
              <h2 className="tool-card__title">{tool.title}</h2>
              <p className="tool-card__description">{tool.description}</p>

              {/* Features list */}
              <ul className="tool-card__features">
                {tool.features.map((f) => (
                  <li key={f}>
                    <span className="tool-card__feature-dot" style={{ background: tool.gradient }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="tool-card__cta" style={{ background: tool.gradient }}>
                Open Tool →
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ToolSelector;
