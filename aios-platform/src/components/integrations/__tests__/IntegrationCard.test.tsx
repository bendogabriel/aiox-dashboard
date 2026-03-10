import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntegrationCard } from '../IntegrationCard';
import { Server } from 'lucide-react';

describe('IntegrationCard', () => {
  const defaultProps = {
    name: 'Test Service',
    description: 'A test integration',
    icon: <Server size={20} />,
    status: 'disconnected' as const,
    onConfigure: vi.fn(),
    onRefresh: vi.fn(),
  };

  it('should render name and description', () => {
    render(<IntegrationCard {...defaultProps} />);
    expect(screen.getByText('Test Service')).toBeDefined();
    expect(screen.getByText('A test integration')).toBeDefined();
  });

  it('should show "Connect" button when disconnected', () => {
    render(<IntegrationCard {...defaultProps} status="disconnected" />);
    expect(screen.getByText('Connect')).toBeDefined();
  });

  it('should show "Configure" button when connected', () => {
    render(<IntegrationCard {...defaultProps} status="connected" />);
    expect(screen.getByText('Configure')).toBeDefined();
  });

  it('should show status label for each status', () => {
    const { rerender } = render(<IntegrationCard {...defaultProps} status="connected" />);
    expect(screen.getByText('Connected')).toBeDefined();

    rerender(<IntegrationCard {...defaultProps} status="disconnected" />);
    expect(screen.getByText('Not Connected')).toBeDefined();

    rerender(<IntegrationCard {...defaultProps} status="checking" />);
    expect(screen.getByText('Checking...')).toBeDefined();

    rerender(<IntegrationCard {...defaultProps} status="error" />);
    expect(screen.getByText('Error')).toBeDefined();

    rerender(<IntegrationCard {...defaultProps} status="partial" />);
    expect(screen.getByText('Partial')).toBeDefined();
  });

  it('should render message when provided', () => {
    render(<IntegrationCard {...defaultProps} message="v1.0 — 2 WS clients" />);
    expect(screen.getByText('v1.0 — 2 WS clients')).toBeDefined();
  });

  it('should not render message when absent', () => {
    const { container } = render(<IntegrationCard {...defaultProps} />);
    // No message div with border-left style
    const messageDivs = container.querySelectorAll('[style*="border-left"]');
    expect(messageDivs.length).toBe(0);
  });

  it('should call onConfigure when button clicked', () => {
    const onConfigure = vi.fn();
    render(<IntegrationCard {...defaultProps} onConfigure={onConfigure} />);
    fireEvent.click(screen.getByText('Connect'));
    expect(onConfigure).toHaveBeenCalledOnce();
  });

  it('should call onRefresh when refresh button clicked', () => {
    const onRefresh = vi.fn();
    render(<IntegrationCard {...defaultProps} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByTitle('Refresh status'));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
