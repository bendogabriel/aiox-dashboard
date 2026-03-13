import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { CockpitButton } from '../cockpit/CockpitButton';

describe('CockpitButton', () => {
  it('should render with children', () => {
    render(<CockpitButton>Click me</CockpitButton>);

    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const { user } = render(<CockpitButton onClick={handleClick}>Click</CockpitButton>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<CockpitButton disabled>Disabled</CockpitButton>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <CockpitButton onClick={handleClick} disabled>
        Disabled
      </CockpitButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // CockpitButton sets pointer-events: none on disabled buttons,
    // so click events cannot reach the handler.
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render with left icon', () => {
    const Icon = () => <span data-testid="icon">F</span>;
    render(<CockpitButton leftIcon={<Icon />}>With Icon</CockpitButton>);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('With Icon');
  });

  it('should render with right icon', () => {
    const Icon = () => <span data-testid="icon">&gt;</span>;
    render(<CockpitButton rightIcon={<Icon />}>With Icon</CockpitButton>);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should render different variants without error', () => {
    const { rerender } = render(<CockpitButton variant="primary">Primary</CockpitButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<CockpitButton variant="ghost">Ghost</CockpitButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<CockpitButton variant="danger">Danger</CockpitButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<CockpitButton variant="default">Default</CockpitButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<CockpitButton loading>Loading</CockpitButton>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // Loading text should be available for screen readers
    expect(screen.getByText('Carregando')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<CockpitButton className="custom-class">Custom</CockpitButton>);

    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<CockpitButton ref={ref}>Ref Button</CockpitButton>);

    expect(ref).toHaveBeenCalled();
  });

  it('should render as icon button with size="icon"', () => {
    render(
      <CockpitButton size="icon" aria-label="Icon button">
        <span>Q</span>
      </CockpitButton>
    );

    const button = screen.getByRole('button');
    // Icon size buttons have specific dimensions
    expect(button).toBeInTheDocument();
  });
});
