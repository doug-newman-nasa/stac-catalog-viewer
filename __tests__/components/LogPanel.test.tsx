import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogPanel } from '../../src/components/LogPanel';
import { logger } from '../../src/lib/logger';

describe('LogPanel', () => {
  beforeEach(() => {
    logger.clearLogs();
    logger.setConfig({
      minLogLevel: 'info',
      persistToDisk: true,
      maxLogsInMemory: 500,
      maxLogsOnDisk: 5000,
    });
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render the toggle button', () => {
      render(<LogPanel />);
      const button = screen.getByRole('button', { name: /toggle log panel/i });

      expect(button).toBeInTheDocument();
    });

    it('should display log count in button', () => {
      logger.logInfo('Test 1');
      logger.logInfo('Test 2');

      render(<LogPanel />);
      const button = screen.getByRole('button', { name: /toggle log panel/i });

      expect(button).toHaveTextContent('(2)');
    });

    it('should display empty log count initially', () => {
      render(<LogPanel />);
      const button = screen.getByRole('button', { name: /toggle log panel/i });

      expect(button).toHaveTextContent('(0)');
    });

    it('should not show panel content initially', () => {
      render(<LogPanel />);

      expect(screen.queryByText('Request & Response Logs')).not.toBeInTheDocument();
    });
  });

  describe('panel toggle', () => {
    it('should show panel when toggle button is clicked', async () => {
      render(<LogPanel />);
      const button = screen.getByRole('button', { name: /toggle log panel/i });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Request & Response Logs')).toBeInTheDocument();
      });
    });

    it('should hide panel when close button is clicked', async () => {
      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const closeButton = screen.getByRole('button', { name: /✕/ });
      fireEvent.click(closeButton);

      expect(screen.queryByText('Request & Response Logs')).not.toBeInTheDocument();
    });

    it('should toggle panel state correctly', async () => {
      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });

      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(screen.getByText('Request & Response Logs')).toBeInTheDocument();
      });

      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(screen.queryByText('Request & Response Logs')).not.toBeInTheDocument();
      });
    });
  });

  describe('log display', () => {
    it('should display logs in the panel', async () => {
      logger.logInfo('Test message');

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
    });

    it('should display request logs with method and URL', async () => {
      logger.logRequest('GET', 'https://example.com/api');

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Request')).toBeInTheDocument();
        expect(screen.getByText('GET')).toBeInTheDocument();
        expect(screen.getByText('https://example.com/api')).toBeInTheDocument();
      });
    });

    it('should display response logs with status and duration', async () => {
      logger.logResponse('https://example.com/api', 200, 125);

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Response')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText(/125\.00ms/)).toBeInTheDocument();
      });
    });

    it('should display error logs', async () => {
      logger.logError('Test error', new Error('Something went wrong'));

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });
    });

    it('should display log levels', async () => {
      logger.logInfo('Info');
      logger.logWarn('Warning');
      logger.logError('Error', new Error('test'));

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('INFO')).toBeInTheDocument();
        expect(screen.getByText('WARN')).toBeInTheDocument();
        expect(screen.getByText('ERROR')).toBeInTheDocument();
      });
    });

    it('should show empty message when no logs', async () => {
      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('No logs yet')).toBeInTheDocument();
      });
    });
  });

  describe('refresh button', () => {
    it('should refresh logs', async () => {
      const { rerender } = render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      logger.logInfo('New log');
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      rerender(<LogPanel />);

      await waitFor(() => {
        expect(screen.getByText('New log')).toBeInTheDocument();
      });
    });
  });

  describe('clear button', () => {
    it('should clear logs when confirmed', async () => {
      logger.logInfo('Test log');

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('No logs yet')).toBeInTheDocument();
      });
    });

    it('should not clear logs when cancelled', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      logger.logInfo('Test log');

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('Test log')).toBeInTheDocument();
      });
    });

    it('should show confirmation dialog', () => {
      const confirmSpy = vi.spyOn(window, 'confirm');
      logger.logInfo('Test');

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      expect(confirmSpy).toHaveBeenCalled();
    });
  });

  describe('download button', () => {
    it('should trigger download', async () => {
      logger.logInfo('Test log');

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(downloadButton).toBeInTheDocument();
      });
    });
  });

  describe('settings panel', () => {
    it('should show settings button', async () => {
      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      expect(settingsButton).toBeInTheDocument();
    });

    it('should toggle settings panel', async () => {
      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Minimum Log Level:')).toBeInTheDocument();
      });

      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.queryByText('Minimum Log Level:')).not.toBeInTheDocument();
      });
    });

    it('should display all settings controls', async () => {
      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Minimum Log Level:')).toBeInTheDocument();
        expect(screen.getByLabelText(/persist logs to disk/i)).toBeInTheDocument();
        expect(screen.getByText('Max logs in memory:')).toBeInTheDocument();
        expect(screen.getByText('Max logs on disk:')).toBeInTheDocument();
      });
    });
  });

  describe('log level selector', () => {
    it('should change log level', async () => {
      const user = userEvent.setup();
      logger.setLogLevel('info');

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      await user.selectOptions(select, 'error');

      expect(select.value).toBe('error');
      expect(logger.getConfig().minLogLevel).toBe('error');
    });

    it('should have correct log level options', async () => {
      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      const options = Array.from(select.options).map((opt) => opt.value);

      expect(options).toContain('debug');
      expect(options).toContain('info');
      expect(options).toContain('warn');
      expect(options).toContain('error');
    });
  });

  describe('persistence checkbox', () => {
    it('should toggle persistence', async () => {
      const user = userEvent.setup();
      const initialState = logger.getConfig().persistToDisk;

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const checkbox = screen.getByRole('checkbox', {
        name: /persist logs to disk/i,
      }) as HTMLInputElement;

      const initialChecked = checkbox.checked;
      await user.click(checkbox);
      expect(checkbox.checked).toBe(!initialChecked);
    });
  });

  describe('max logs inputs', () => {
    it('should change max logs in memory', async () => {
      const user = userEvent.setup();

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const inputs = screen.getAllByRole('spinbutton');
      const memoryInput = inputs[0] as HTMLInputElement;

      await user.clear(memoryInput);
      await user.type(memoryInput, '1000');

      await waitFor(() => {
        expect(logger.getConfig().maxLogsInMemory).toBe(1000);
      });
    });

    it('should change max logs on disk', async () => {
      const user = userEvent.setup();

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const inputs = screen.getAllByRole('spinbutton');
      const diskInput = inputs[1] as HTMLInputElement;

      await user.clear(diskInput);
      await user.type(diskInput, '3000');

      await waitFor(() => {
        expect(logger.getConfig().maxLogsOnDisk).toBe(3000);
      });
    });
  });

  describe('clear disk logs button', () => {
    it('should clear disk logs when confirmed', async () => {
      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const clearDiskButton = screen.getByRole('button', { name: /clear disk logs/i });
      fireEvent.click(clearDiskButton);

      await waitFor(() => {
        expect(screen.getByText(/clear disk logs/i)).toBeInTheDocument();
      });
    });

    it('should show confirmation for disk log clearing', () => {
      const confirmSpy = vi.spyOn(window, 'confirm');

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const clearDiskButton = screen.getByRole('button', { name: /clear disk logs/i });
      fireEvent.click(clearDiskButton);

      expect(confirmSpy).toHaveBeenCalled();
    });

    it('should not clear disk logs when cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const clearDiskButton = screen.getByRole('button', { name: /clear disk logs/i });
      fireEvent.click(clearDiskButton);

      expect(screen.getByText(/clear disk logs/i)).toBeInTheDocument();
    });
  });

  describe('integration', () => {
    it('should allow config changes through settings panel', async () => {
      const user = userEvent.setup();

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      await user.selectOptions(select, 'error');

      expect(select.value).toBe('error');
      expect(logger.getConfig().minLogLevel).toBe('error');
    });

    it('should work with multiple log types', async () => {
      logger.logRequest('GET', 'https://api.example.com');
      logger.logResponse('https://api.example.com', 200, 100);
      logger.logInfo('Operation completed');
      logger.logWarn('Warning about something');

      render(<LogPanel />);
      const toggleButton = screen.getByRole('button', { name: /toggle log panel/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('GET')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText('Operation completed')).toBeInTheDocument();
        expect(screen.getByText('Warning about something')).toBeInTheDocument();
      });
    });
  });
});
