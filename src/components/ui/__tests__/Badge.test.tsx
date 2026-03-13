import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('should render with text', () => {
    render(<Badge>New</Badge>);

    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('should apply default variant class', () => {
    render(<Badge>Default</Badge>);

    expect(screen.getByText('Default')).toHaveClass('glass-badge');
  });

  it('should apply squad variant with squad type', () => {
    const { rerender } = render(
      <Badge variant="squad" squadType="copywriting">Copy</Badge>
    );
    expect(screen.getByText('Copy')).toHaveClass('bg-squad-copywriting-10');

    rerender(<Badge variant="squad" squadType="design">Design</Badge>);
    expect(screen.getByText('Design')).toHaveClass('bg-squad-design-10');

    rerender(<Badge variant="squad" squadType="creator">Creator</Badge>);
    expect(screen.getByText('Creator')).toHaveClass('bg-squad-creator-10');

    rerender(<Badge variant="squad" squadType="orchestrator">Orch</Badge>);
    expect(screen.getByText('Orch')).toHaveClass('bg-squad-orchestrator-10');
  });

  it('should apply status variant styles', () => {
    const { rerender } = render(
      <Badge variant="status" status="online">Online</Badge>
    );
    expect(screen.getByText('Online')).toHaveClass('text-status-success-muted');

    rerender(<Badge variant="status" status="busy">Busy</Badge>);
    expect(screen.getByText('Busy')).toHaveClass('text-status-warning-muted');

    rerender(<Badge variant="status" status="offline">Offline</Badge>);
    expect(screen.getByText('Offline')).toHaveClass('text-squad-default-muted');

    rerender(<Badge variant="status" status="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('text-status-success-muted');

    rerender(<Badge variant="status" status="error">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('text-status-error-muted');

    rerender(<Badge variant="status" status="warning">Warning</Badge>);
    // 'warning' is not in statusThemes, falls back to 'offline' theme
    expect(screen.getByText('Warning')).toHaveClass('text-squad-default-muted');
  });

  it('should apply count variant style', () => {
    render(<Badge variant="count">5</Badge>);

    const badge = screen.getByText('5');
    expect(badge).toHaveClass('bg-[var(--badge-count-bg)]', 'text-[var(--badge-count-text)]', 'rounded-full');
  });

  it('should apply size classes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('text-[10px]');

    rerender(<Badge size="md">Medium</Badge>);
    expect(screen.getByText('Medium')).toHaveClass('text-xs');
  });

  it('should apply custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>);

    expect(screen.getByText('Custom')).toHaveClass('custom-badge');
  });

  it('should have proper base classes', () => {
    render(<Badge>Test</Badge>);

    const badge = screen.getByText('Test');
    expect(badge).toHaveClass('inline-flex', 'items-center', 'justify-center', 'font-medium', 'rounded-md');
  });
});
