import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { CockpitInput, CockpitTextarea } from '../cockpit/CockpitInput';

describe('CockpitInput', () => {
  it('should render input element', () => {
    render(<CockpitInput placeholder="Enter text" />);

    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<CockpitInput label="Username" />);

    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should show required indicator with label', () => {
    render(<CockpitInput label="Email" required />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should handle value changes', async () => {
    const handleChange = vi.fn();
    const { user } = render(<CockpitInput onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('hello');
  });

  it('should show error message', () => {
    render(<CockpitInput error="This field is required" />);

    expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
  });

  it('should set aria-invalid when error is present', () => {
    render(<CockpitInput error="Error" />);

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should show hint text when no error', () => {
    render(<CockpitInput hint="Enter your username" />);

    expect(screen.getByText('Enter your username')).toBeInTheDocument();
  });

  it('should hide hint when error is shown', () => {
    render(<CockpitInput hint="Helpful hint" error="Error message" />);

    expect(screen.queryByText('Helpful hint')).not.toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should accept showCharacterCount prop without error (ignored)', () => {
    render(<CockpitInput showCharacterCount maxLength={10} />);

    // showCharacterCount is ignored by CockpitInput, but should not throw
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should accept success prop without error (ignored)', () => {
    render(<CockpitInput success />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('should render left icon', () => {
    const Icon = () => <span data-testid="left-icon">Q</span>;
    render(<CockpitInput leftIcon={<Icon />} />);

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('should accept rightIcon prop without error (ignored)', () => {
    const Icon = () => <span data-testid="right-icon">ok</span>;
    render(<CockpitInput rightIcon={<Icon />} />);

    // rightIcon is ignored by CockpitInput, but should not throw
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<CockpitInput disabled />);

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<CockpitInput ref={ref} />);

    expect(ref).toHaveBeenCalled();
  });
});

describe('CockpitTextarea', () => {
  it('should render textarea element', () => {
    render(<CockpitTextarea placeholder="Enter description" />);

    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<CockpitTextarea label="Description" />);

    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('should handle value changes', async () => {
    const handleChange = vi.fn();
    const { user } = render(<CockpitTextarea onChange={handleChange} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'test content');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should show error message', () => {
    render(<CockpitTextarea error="Description is required" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Description is required');
  });

  it('should accept showCharacterCount prop without error (ignored)', () => {
    render(<CockpitTextarea showCharacterCount maxLength={100} />);

    // showCharacterCount is ignored by CockpitTextarea, but should not throw
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should show hint text', () => {
    render(<CockpitTextarea hint="Maximum 500 characters" />);

    expect(screen.getByText('Maximum 500 characters')).toBeInTheDocument();
  });
});
