/**
 * Accessibility Tests using vitest-axe
 * These tests validate WCAG 2.1 AA compliance for UI components
 */

import type {} from '../../../test/vitest-axe.d.ts';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';

// Add custom matcher
expect.extend(matchers);

// Components
import { CockpitButton } from '../cockpit/CockpitButton';
import { CockpitInput, CockpitTextarea } from '../cockpit/CockpitInput';
import { CockpitCard } from '../cockpit/CockpitCard';
import { Badge } from '../Badge';
import { Avatar } from '../Avatar';
import { ToastContainer } from '../Toast';

describe('Accessibility Tests', () => {
  describe('CockpitButton', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<CockpitButton>Click me</CockpitButton>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with loading state', async () => {
      const { container } = render(<CockpitButton loading>Loading</CockpitButton>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with left icon', async () => {
      const { container } = render(
        <CockpitButton leftIcon={<span aria-hidden="true">+</span>}>
          Add Item
        </CockpitButton>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations when disabled', async () => {
      const { container } = render(
        <CockpitButton disabled>Disabled Button</CockpitButton>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CockpitInput', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <CockpitInput label="Email" placeholder="Enter your email" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with error state', async () => {
      const { container } = render(
        <CockpitInput label="Email" error="Invalid email address" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with hint text', async () => {
      const { container } = render(
        <CockpitInput label="Password" hint="Must be at least 8 characters" type="password" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with required field', async () => {
      const { container } = render(
        <CockpitInput label="Username" required />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CockpitTextarea', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <CockpitTextarea label="Description" placeholder="Enter description" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with character count', async () => {
      const { container } = render(
        <CockpitTextarea label="Bio" showCharacterCount maxLength={200} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CockpitCard', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <CockpitCard animate={false}>
          <h2>Card Title</h2>
          <p>Card content goes here</p>
        </CockpitCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with aria-label', async () => {
      const { container } = render(
        <CockpitCard animate={false} aria-label="Feature card">
          <p>Content</p>
        </CockpitCard>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Badge', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Badge>Active</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with status variant', async () => {
      const { container } = render(
        <Badge variant="status" status="success">Success</Badge>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Avatar', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Avatar name="John Doe" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with image', async () => {
      const { container } = render(
        <Avatar name="Jane Smith" src="https://example.com/avatar.jpg" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ToastContainer', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<ToastContainer />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('Color Contrast', () => {
  it('CockpitButton text should have sufficient contrast', async () => {
    const { container } = render(
      <div style={{ backgroundColor: '#ddd6cc' }}>
        <CockpitButton>Primary Button</CockpitButton>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('CockpitInput label should have sufficient contrast', async () => {
    const { container } = render(
      <div style={{ backgroundColor: '#ddd6cc' }}>
        <CockpitInput label="Form Field" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Keyboard Navigation', () => {
  it('CockpitButton should be focusable', () => {
    const { getByRole } = render(<CockpitButton>Click me</CockpitButton>);
    const button = getByRole('button');
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it('CockpitInput should be focusable', () => {
    const { getByRole } = render(<CockpitInput label="Test" />);
    const input = getByRole('textbox');
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('disabled CockpitButton should not be focusable via click', () => {
    const { getByRole } = render(<CockpitButton disabled>Disabled</CockpitButton>);
    const button = getByRole('button');
    expect(button).toHaveAttribute('disabled');
  });
});

describe('ARIA Attributes', () => {
  it('CockpitInput with error should have aria-invalid', () => {
    const { getByRole } = render(
      <CockpitInput label="Email" error="Invalid email" />
    );
    const input = getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('CockpitInput with error should have aria-describedby', () => {
    const { getByRole } = render(
      <CockpitInput label="Email" error="Invalid email" />
    );
    const input = getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('required CockpitInput should have required attribute', () => {
    const { getByRole } = render(<CockpitInput label="Name" required />);
    const input = getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });
});
