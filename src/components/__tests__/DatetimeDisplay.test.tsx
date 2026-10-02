import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DatetimeDisplay } from '../DatetimeDisplay';

describe('DatetimeDisplay', () => {
  it('returns null when no datetime fields provided', () => {
    const { container } = render(<DatetimeDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it('displays single datetime', () => {
    render(<DatetimeDisplay datetime="2023-06-15T10:30:00Z" />);
    expect(screen.getByText('📅 Datetime:')).toBeInTheDocument();
  });

  it('formats single datetime correctly', () => {
    render(<DatetimeDisplay datetime="2023-06-15T10:30:00Z" />);
    // Check that the datetime was formatted (contains date and month)
    const datetimeContainer = screen.getByText('📅 Datetime:').parentElement;
    expect(datetimeContainer).toHaveTextContent('2023');
    expect(datetimeContainer).toHaveTextContent('Jun 15');
  });

  it('displays date range label when no datetime but has start/end', () => {
    render(<DatetimeDisplay startDatetime="2023-01-01T00:00:00Z" endDatetime="2023-12-31T23:59:59Z" />);
    expect(screen.getByText('📅 Date Range:')).toBeInTheDocument();
  });

  it('displays start datetime in range', () => {
    render(<DatetimeDisplay startDatetime="2023-01-01T00:00:00Z" endDatetime="2023-12-31T23:59:59Z" />);
    expect(screen.getByText('Start:')).toBeInTheDocument();
  });

  it('displays end datetime in range', () => {
    render(<DatetimeDisplay startDatetime="2023-01-01T00:00:00Z" endDatetime="2023-12-31T23:59:59Z" />);
    expect(screen.getByText('End:')).toBeInTheDocument();
  });

  it('displays only start datetime when end is not provided', () => {
    render(<DatetimeDisplay startDatetime="2023-01-01T00:00:00Z" />);
    expect(screen.getByText('Start:')).toBeInTheDocument();
    expect(screen.queryByText('End:')).not.toBeInTheDocument();
  });

  it('displays only end datetime when start is not provided', () => {
    render(<DatetimeDisplay endDatetime="2023-12-31T23:59:59Z" />);
    expect(screen.getByText('End:')).toBeInTheDocument();
    expect(screen.queryByText('Start:')).not.toBeInTheDocument();
  });

  it('prefers single datetime over date range', () => {
    render(
      <DatetimeDisplay
        datetime="2023-06-15T10:30:00Z"
        startDatetime="2023-01-01T00:00:00Z"
        endDatetime="2023-12-31T23:59:59Z"
      />
    );
    expect(screen.getByText('📅 Datetime:')).toBeInTheDocument();
    expect(screen.queryByText('📅 Date Range:')).not.toBeInTheDocument();
  });

  it('handles null datetime with start/end dates', () => {
    render(<DatetimeDisplay datetime={null} startDatetime="2023-01-01T00:00:00Z" endDatetime="2023-12-31T23:59:59Z" />);
    expect(screen.getByText('📅 Date Range:')).toBeInTheDocument();
  });

  it('formats dates with locale-aware formatting', () => {
    render(<DatetimeDisplay datetime="2023-12-25T15:45:30Z" />);
    const datetimeContainer = screen.getByText('📅 Datetime:').parentElement;
    expect(datetimeContainer).toHaveTextContent('2023');
    expect(datetimeContainer).toHaveTextContent('Dec 25');
  });

  it('handles invalid datetime string gracefully', () => {
    render(<DatetimeDisplay datetime="invalid-date" />);
    expect(screen.getByText('invalid-date')).toBeInTheDocument();
  });

  it('handles null datetime gracefully', () => {
    render(<DatetimeDisplay datetime={null} startDatetime="2023-01-01T00:00:00Z" />);
    expect(screen.getByText('Start:')).toBeInTheDocument();
  });

  it('formats range with multiple dates correctly', () => {
    render(<DatetimeDisplay startDatetime="2023-03-21T08:00:00Z" endDatetime="2023-04-20T16:00:00Z" />);

    expect(screen.getByText('Start:')).toBeInTheDocument();
    expect(screen.getByText('End:')).toBeInTheDocument();

    const datetimeContainer = screen.getByText('📅 Date Range:').parentElement;
    // Check that both start and end dates are present (just check for year and AM/PM)
    expect(datetimeContainer).toHaveTextContent('2023');
    expect(datetimeContainer).toHaveTextContent('Mar 21');
    expect(datetimeContainer).toHaveTextContent('Apr 20');
  });
});
