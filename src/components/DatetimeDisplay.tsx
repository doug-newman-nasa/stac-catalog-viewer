import '../styles/DatetimeDisplay.css';

interface DatetimeDisplayProps {
  datetime?: string | null;
  startDatetime?: string | null;
  endDatetime?: string | null;
}

export function DatetimeDisplay({
  datetime,
  startDatetime,
  endDatetime,
}: DatetimeDisplayProps) {
  if (!datetime && !startDatetime && !endDatetime) {
    return null;
  }

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="datetime-display">
      {datetime ? (
        <>
          <span className="datetime-label">📅 Datetime:</span>
          <span className="datetime-value">{formatDate(datetime)}</span>
        </>
      ) : (
        <>
          <span className="datetime-label">📅 Date Range:</span>
          <div className="datetime-range">
            {startDatetime && (
              <div className="datetime-range-item">
                <span className="datetime-range-label">Start:</span>
                <span className="datetime-range-value">{formatDate(startDatetime)}</span>
              </div>
            )}
            {endDatetime && (
              <div className="datetime-range-item">
                <span className="datetime-range-label">End:</span>
                <span className="datetime-range-value">{formatDate(endDatetime)}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
