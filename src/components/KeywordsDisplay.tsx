import '../styles/KeywordsDisplay.css';

interface KeywordsDisplayProps {
  keywords: string[];
}

export function KeywordsDisplay({ keywords }: KeywordsDisplayProps) {
  if (!keywords || keywords.length === 0) {
    return null;
  }

  return (
    <div className="keywords-display">
      <h4 className="keywords-title">Keywords</h4>
      <div className="keywords-list">
        {keywords.map((keyword, idx) => (
          <span key={idx} className="keyword-tag">
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
}
