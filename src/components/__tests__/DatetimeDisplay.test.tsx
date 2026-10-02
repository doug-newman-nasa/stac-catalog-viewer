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

  it('has accessible label and structure', () => {
    render(<DatetimeDisplay datetime="2023-06-15T10:30:00Z" />);
    const label = screen.getByText('📅 Datetime:');
    expect(label).toHaveClass('datetime-label');
  });

  it('handles empty string datetime', () => {
    const { container } = render(<DatetimeDisplay datetime="" startDatetime={null} endDatetime={null} />);
    // Empty string is falsy, so should render null
    expect(container.firstChild).toBeNull();
  });

  it('displays both start and end datetime together', () => {
    render(<DatetimeDisplay startDatetime="2023-01-01T00:00:00Z" endDatetime="2023-12-31T23:59:59Z" />);

    const startElement = screen.getByText('Start:');
    const endElement = screen.getByText('End:');

    expect(startElement).toBeInTheDocument();
    expect(endElement).toBeInTheDocument();

    const rangeContainer = screen.getByText('📅 Date Range:').parentElement;
    expect(rangeContainer?.textContent).toContain('Start:');
    expect(rangeContainer?.textContent).toContain('End:');
  });

  it('uses timezone information in formatted date', () => {
    render(<DatetimeDisplay datetime="2023-06-15T10:30:00Z" />);
    const datetimeContainer = screen.getByText('📅 Datetime:').parentElement;
    // The formatted date should contain some timezone info
    expect(datetimeContainer?.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });

  it('handles dates with different formatting requirements', () => {
    render(<DatetimeDisplay datetime="2020-06-15T12:00:00Z" />);
    const datetimeContainer = screen.getByText('📅 Datetime:').parentElement;
    expect(datetimeContainer).toHaveTextContent('2020');
    expect(datetimeContainer).toHaveTextContent('Jun');
  });

  it('formats end datetime only when start is null', () => {
    render(<DatetimeDisplay startDatetime={null} endDatetime="2023-12-31T23:59:59Z" />);

    expect(screen.queryByText('Start:')).not.toBeInTheDocument();
    expect(screen.getByText('End:')).toBeInTheDocument();
  });

  it('renders datetime display with proper CSS classes', () => {
    const { container } = render(<DatetimeDisplay datetime="2023-06-15T10:30:00Z" />);
    const datetimeDisplay = container.querySelector('.datetime-display');
    expect(datetimeDisplay).toBeInTheDocument();
  });

  it('applies correct CSS classes to date range items', () => {
    const { container } = render(
      <DatetimeDisplay startDatetime="2023-01-01T00:00:00Z" endDatetime="2023-12-31T23:59:59Z" />
    );

    const rangeItems = container.querySelectorAll('.datetime-range-item');
    expect(rangeItems.length).toBe(2);

    rangeItems.forEach((item) => {
      expect(item).toHaveClass('datetime-range-item');
    });
  });

  it('handles both undefined and null values for all datetime fields', () => {
    const { container } = render(<DatetimeDisplay datetime={undefined} startDatetime={undefined} endDatetime={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays range when datetime is null but start/end are provided', () => {
    render(<DatetimeDisplay datetime={null} startDatetime="2023-01-01T00:00:00Z" endDatetime="2023-12-31T23:59:59Z" />);

    expect(screen.getByText('📅 Date Range:')).toBeInTheDocument();
    expect(screen.getByText('Start:')).toBeInTheDocument();
    expect(screen.getByText('End:')).toBeInTheDocument();
  });

  it('formats very old dates', () => {
    render(<DatetimeDisplay datetime="1990-01-15T06:30:00Z" />);
    const datetimeContainer = screen.getByText('📅 Datetime:').parentElement;
    expect(datetimeContainer).toHaveTextContent('1990');
  });

  it('formats future dates', () => {
    render(<DatetimeDisplay datetime="2099-12-31T23:59:59Z" />);
    const datetimeContainer = screen.getByText('📅 Datetime:').parentElement;
    expect(datetimeContainer).toHaveTextContent('2099');
  });

  it('renders label with correct emoji icon', () => {
    render(<DatetimeDisplay datetime="2023-06-15T10:30:00Z" />);
    const label = screen.getByText('📅 Datetime:');
    expect(label).toBeInTheDocument();
  });

  it('renders range label with correct emoji icon', () => {
    render(<DatetimeDisplay startDatetime="2023-01-01T00:00:00Z" endDatetime="2023-12-31T23:59:59Z" />);
    const label = screen.getByText('📅 Date Range:');
    expect(label).toBeInTheDocument();
  });
});
