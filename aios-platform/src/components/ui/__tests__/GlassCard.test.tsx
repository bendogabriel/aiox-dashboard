import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { CockpitCard } from '../cockpit/CockpitCard';

describe('CockpitCard', () => {
  it('should render children', () => {
    render(<CockpitCard>Card Content</CockpitCard>);

    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should render with default variant', () => {
    const { container } = render(<CockpitCard>Content</CockpitCard>);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render with subtle variant', () => {
    const { container } = render(<CockpitCard variant="subtle">Subtle</CockpitCard>);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render with strong variant', () => {
    const { container } = render(<CockpitCard variant="strong">Strong</CockpitCard>);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render when interactive prop is true', () => {
    const { container } = render(<CockpitCard interactive>Interactive</CockpitCard>);

    expect(container.firstChild).toHaveClass('cursor-pointer');
  });

  it('should apply custom className', () => {
    const { container } = render(<CockpitCard className="custom-class">Content</CockpitCard>);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should apply different padding sizes', () => {
    const { rerender, container } = render(<CockpitCard padding="none">Content</CockpitCard>);
    expect(container.firstChild).not.toHaveClass('p-3', 'p-4', 'p-6');

    rerender(<CockpitCard padding="sm">Content</CockpitCard>);
    expect(container.firstChild).toHaveClass('p-3');

    rerender(<CockpitCard padding="md">Content</CockpitCard>);
    expect(container.firstChild).toHaveClass('p-4');

    rerender(<CockpitCard padding="lg">Content</CockpitCard>);
    expect(container.firstChild).toHaveClass('p-6');
  });

  it('should accept radius prop without error (ignored)', () => {
    const { container } = render(<CockpitCard radius="sm">Content</CockpitCard>);
    // radius is ignored by CockpitCard (brutalist, no rounding) but should not throw
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<CockpitCard ref={ref}>Content</CockpitCard>);

    expect(ref).toHaveBeenCalled();
  });

  it('should accept animate prop without error (ignored)', () => {
    const { container } = render(<CockpitCard animate={false}>Content</CockpitCard>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should pass onClick handler', async () => {
    const handleClick = vi.fn();
    const { user } = render(
      <CockpitCard onClick={handleClick}>Clickable</CockpitCard>
    );

    await user.click(screen.getByText('Clickable'));

    expect(handleClick).toHaveBeenCalled();
  });
});
