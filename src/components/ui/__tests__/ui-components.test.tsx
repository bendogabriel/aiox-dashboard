/**
 * Consolidated UI Primitive Component Tests
 *
 * Tests for: CockpitButton, CockpitCard, Badge, Avatar, EmptyState,
 *            ErrorBoundary, Dialog, ContextMenu
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/test-utils';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion: new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          return React.forwardRef(
            (props: Record<string, unknown>, ref: React.Ref<HTMLElement>) => {
              const {
                initial,
                animate,
                exit,
                transition,
                layout,
                whileHover,
                whileTap,
                variants,
                onAnimationComplete,
                ...rest
              } = props;
              return React.createElement(prop, { ...rest, ref });
            }
          );
        },
      }
    ),
  };
});

// Mock agent-avatars module
vi.mock('../../../lib/agent-avatars', () => ({
  getAgentAvatarUrl: (id: string) => {
    const map: Record<string, string> = {
      dev: '/avatars/dev.png',
      dex: '/avatars/dev.png',
    };
    return map[id] || undefined;
  },
}));

// Mock theme module
vi.mock('../../../lib/theme', () => {
  const statusMap: Record<string, { text: string; bg: string; dot: string; border: string }> = {
    online: { text: 'text-status-success-muted', bg: 'bg-status-success-10', dot: 'bg-status-success', border: 'border-status-success-30' },
    busy: { text: 'text-status-warning-muted', bg: 'bg-status-warning-10', dot: 'bg-status-warning', border: 'border-status-warning-30' },
    offline: { text: 'text-squad-default-muted', bg: 'bg-squad-default-10', dot: 'bg-squad-default', border: 'border-squad-default-30' },
    error: { text: 'text-status-error-muted', bg: 'bg-status-error-10', dot: 'bg-status-error', border: 'border-status-error-30' },
    success: { text: 'text-status-success-muted', bg: 'bg-status-success-10', dot: 'bg-status-success', border: 'border-status-success-30' },
  };
  return {
    getSquadTheme: (squadType: string) => ({
      gradient: `from-squad-${squadType} to-squad-${squadType}-dark`,
      primary: `var(--squad-${squadType})`,
      bg: `bg-squad-${squadType}`,
      bgSubtle: `bg-squad-${squadType}-10`,
      bgHover: `hover:bg-squad-${squadType}-20`,
      border: `border-squad-${squadType}`,
      borderSubtle: `border-squad-${squadType}-30`,
      text: `text-squad-${squadType}`,
      textMuted: `text-squad-${squadType}-muted`,
      badge: `bg-squad-${squadType}-10 border-squad-${squadType}-20 text-squad-${squadType}-muted`,
      card: `bg-squad-${squadType}-5 border-squad-${squadType}-20`,
      cardHover: `hover:bg-squad-${squadType}-10 hover:border-squad-${squadType}-30`,
      iconBg: `bg-squad-${squadType}-20`,
      dot: `bg-squad-${squadType}`,
      ring: `ring-squad-${squadType}-20 focus:ring-squad-${squadType}-40`,
      borderLeft: `border-l-squad-${squadType}`,
      glow: `shadow-squad-${squadType}-30`,
      gradientBg: `bg-gradient-to-br from-squad-${squadType}-10 to-squad-${squadType}-10`,
      gradientSubtle: `from-squad-${squadType}-20 to-squad-${squadType}-20`,
      cssVar: `var(--squad-${squadType}-default)`,
    }),
    getStatusTheme: (status: string) => statusMap[status] || statusMap.offline,
  };
});

import { CockpitButton } from '../cockpit/CockpitButton';
import { CockpitCard } from '../cockpit/CockpitCard';
import { Badge } from '../Badge';
import { Avatar } from '../Avatar';
import { EmptyState, NoSearchResults, NoMessages, NoActivity, ErrorState } from '../EmptyState';
import { ErrorBoundary, CompactErrorFallback } from '../ErrorBoundary';
import { Dialog } from '../Dialog';
import { ContextMenu } from '../ContextMenu';

// ============================================================
// CockpitButton
// ============================================================
describe('CockpitButton', () => {
  it('renders with children text', () => {
    render(<CockpitButton>Click me</CockpitButton>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    const { user } = render(<CockpitButton onClick={onClick}>Go</CockpitButton>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<CockpitButton disabled>Disabled</CockpitButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    const { user } = render(
      <CockpitButton onClick={onClick} disabled>
        No click
      </CockpitButton>
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows loading spinner and disables the button', () => {
    render(<CockpitButton loading>Save</CockpitButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('svg')).toBeInTheDocument();
    // Screen reader text for loading
    expect(screen.getByText('Carregando')).toBeInTheDocument();
  });

  it('hides children text when loading', () => {
    render(<CockpitButton loading>Save</CockpitButton>);
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { rerender } = render(<CockpitButton variant="default">A</CockpitButton>);
    expect(screen.getByRole('button')).toHaveClass('glass-button');

    rerender(<CockpitButton variant="primary">B</CockpitButton>);
    expect(screen.getByRole('button')).toHaveClass('glass-button-primary');

    rerender(<CockpitButton variant="ghost">C</CockpitButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');
  });

  it('applies size classes', () => {
    const { rerender } = render(<CockpitButton size="sm">S</CockpitButton>);
    expect(screen.getByRole('button')).toHaveClass('h-8');

    rerender(<CockpitButton size="md">M</CockpitButton>);
    expect(screen.getByRole('button')).toHaveClass('h-10');

    rerender(<CockpitButton size="lg">L</CockpitButton>);
    expect(screen.getByRole('button')).toHaveClass('h-12');

    rerender(<CockpitButton size="icon">I</CockpitButton>);
    expect(screen.getByRole('button')).toHaveClass('h-11', 'w-11');
  });

  it('renders left and right icons', () => {
    render(
      <CockpitButton
        leftIcon={<span data-testid="left-icon">L</span>}
        rightIcon={<span data-testid="right-icon">R</span>}
      >
        Text
      </CockpitButton>
    );
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CockpitButton className="my-extra-class">Btn</CockpitButton>);
    expect(screen.getByRole('button')).toHaveClass('my-extra-class');
  });

  it('forwards ref', () => {
    const ref = vi.fn();
    render(<CockpitButton ref={ref}>Ref</CockpitButton>);
    expect(ref).toHaveBeenCalled();
  });
});

// ============================================================
// CockpitCard
// ============================================================
describe('CockpitCard', () => {
  it('renders children', () => {
    render(<CockpitCard>Card body</CockpitCard>);
    expect(screen.getByText('Card body')).toBeInTheDocument();
  });

  it('applies default variant class', () => {
    const { container } = render(<CockpitCard>C</CockpitCard>);
    expect(container.firstChild).toHaveClass('glass');
  });

  it('applies subtle variant', () => {
    const { container } = render(<CockpitCard variant="subtle">S</CockpitCard>);
    expect(container.firstChild).toHaveClass('glass-subtle');
  });

  it('applies strong variant', () => {
    const { container } = render(<CockpitCard variant="strong">G</CockpitCard>);
    expect(container.firstChild).toHaveClass('glass-lg');
  });

  it('applies interactive class when interactive', () => {
    const { container } = render(<CockpitCard interactive>I</CockpitCard>);
    expect(container.firstChild).toHaveClass('glass-interactive');
  });

  it('applies padding sizes', () => {
    const { container, rerender } = render(<CockpitCard padding="none">C</CockpitCard>);
    expect(container.firstChild).not.toHaveClass('p-3', 'p-4', 'p-6');

    rerender(<CockpitCard padding="sm">C</CockpitCard>);
    expect(container.firstChild).toHaveClass('p-3');

    rerender(<CockpitCard padding="md">C</CockpitCard>);
    expect(container.firstChild).toHaveClass('p-4');

    rerender(<CockpitCard padding="lg">C</CockpitCard>);
    expect(container.firstChild).toHaveClass('p-6');
  });

  it('applies radius sizes', () => {
    const { container, rerender } = render(<CockpitCard radius="sm">C</CockpitCard>);
    expect(container.firstChild).toHaveClass('rounded-xl');

    rerender(<CockpitCard radius="lg">C</CockpitCard>);
    expect(container.firstChild).toHaveClass('rounded-glass');
  });

  it('applies custom className', () => {
    const { container } = render(<CockpitCard className="extra">C</CockpitCard>);
    expect(container.firstChild).toHaveClass('extra');
  });

  it('forwards ref', () => {
    const ref = vi.fn();
    render(<CockpitCard ref={ref}>C</CockpitCard>);
    expect(ref).toHaveBeenCalled();
  });

  it('handles onClick', async () => {
    const onClick = vi.fn();
    const { user } = render(<CockpitCard onClick={onClick}>Click</CockpitCard>);
    await user.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalled();
  });
});

// ============================================================
// Badge
// ============================================================
describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies default variant class', () => {
    render(<Badge>Tag</Badge>);
    expect(screen.getByText('Tag')).toHaveClass('glass-badge');
  });

  it('applies squad variant with squad type colors', () => {
    const { rerender } = render(
      <Badge variant="squad" squadType="copywriting">
        Copy
      </Badge>
    );
    expect(screen.getByText('Copy')).toHaveClass('bg-squad-copywriting-10');

    rerender(
      <Badge variant="squad" squadType="design">
        Design
      </Badge>
    );
    expect(screen.getByText('Design')).toHaveClass('bg-squad-design-10');

    rerender(
      <Badge variant="squad" squadType="development">
        Dev
      </Badge>
    );
    expect(screen.getByText('Dev')).toHaveClass('bg-squad-development-10');
  });

  it('applies status variant styles', () => {
    const { rerender } = render(
      <Badge variant="status" status="online">
        Online
      </Badge>
    );
    expect(screen.getByText('Online')).toHaveClass('text-status-success-muted');

    rerender(
      <Badge variant="status" status="error">
        Error
      </Badge>
    );
    expect(screen.getByText('Error')).toHaveClass('text-status-error-muted');
  });

  it('applies count variant', () => {
    render(<Badge variant="count">42</Badge>);
    const badge = screen.getByText('42');
    expect(badge).toHaveClass('rounded-full');
    expect(badge).toHaveClass('bg-[var(--badge-count-bg)]');
  });

  it('applies size classes', () => {
    const { rerender } = render(<Badge size="sm">S</Badge>);
    expect(screen.getByText('S')).toHaveClass('text-[10px]');

    rerender(<Badge size="md">M</Badge>);
    expect(screen.getByText('M')).toHaveClass('text-xs');
  });

  it('applies custom className', () => {
    render(<Badge className="my-badge">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('my-badge');
  });

  it('has semantic base classes', () => {
    render(<Badge>Base</Badge>);
    const badge = screen.getByText('Base');
    expect(badge).toHaveClass('inline-flex', 'items-center', 'font-medium');
  });
});

// ============================================================
// Avatar
// ============================================================
describe('Avatar', () => {
  it('renders initials from name', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial for single-word name', () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders question mark with no name and no src', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders image when src is provided', () => {
    render(<Avatar src="https://example.com/pic.jpg" name="Jo" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/pic.jpg');
    expect(img).toHaveAttribute('alt', 'Jo');
  });

  it('prefers alt prop over name for alt text', () => {
    render(<Avatar src="https://x.com/a.jpg" alt="Custom alt" name="Ignored" />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Custom alt');
  });

  it('resolves avatar from agentId', () => {
    render(<Avatar agentId="dev" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/avatars/dev.png');
  });

  it('applies size classes', () => {
    const { container, rerender } = render(<Avatar name="T" size="sm" />);
    expect(container.querySelector('.h-8')).toBeInTheDocument();

    rerender(<Avatar name="T" size="lg" />);
    expect(container.querySelector('.h-12')).toBeInTheDocument();

    rerender(<Avatar name="T" size="xl" />);
    expect(container.querySelector('.h-16')).toBeInTheDocument();
  });

  it('shows status indicator when status is provided', () => {
    const { container } = render(<Avatar name="J" status="online" />);
    expect(container.querySelector('.status-online')).toBeInTheDocument();
  });

  it('shows busy status indicator', () => {
    const { container } = render(<Avatar name="J" status="busy" />);
    expect(container.querySelector('.status-busy')).toBeInTheDocument();
  });

  it('does not show status indicator when no status', () => {
    const { container } = render(<Avatar name="J" />);
    expect(container.querySelector('.status-online')).not.toBeInTheDocument();
    expect(container.querySelector('.status-offline')).not.toBeInTheDocument();
    expect(container.querySelector('.status-busy')).not.toBeInTheDocument();
  });

  it('applies squad gradient classes', () => {
    const { container } = render(<Avatar name="T" squadType="development" />);
    expect(container.querySelector('.from-squad-development')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Avatar name="T" className="custom-av" />);
    expect(container.firstChild).toHaveClass('custom-av');
  });
});

// ============================================================
// EmptyState
// ============================================================
describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="T" description="Some description text" />);
    expect(screen.getByText('Some description text')).toBeInTheDocument();
  });

  it('renders action button and fires callback', async () => {
    const onClick = vi.fn();
    const { user } = render(
      <EmptyState title="T" action={{ label: 'Add', onClick }} />
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders secondary action', async () => {
    const onSecondary = vi.fn();
    const { user } = render(
      <EmptyState
        title="T"
        action={{ label: 'Primary', onClick: vi.fn() }}
        secondaryAction={{ label: 'Cancel', onClick: onSecondary }}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('renders custom icon for type="custom"', () => {
    render(
      <EmptyState
        type="custom"
        icon={<span data-testid="custom-ico">IC</span>}
        title="Custom"
      />
    );
    expect(screen.getByTestId('custom-ico')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    const { container } = render(<EmptyState title="T" />);
    // only the title <h3> and the icon wrapper, no <p>
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });
});

describe('EmptyState presets', () => {
  it('NoSearchResults shows query and clear button', async () => {
    const onClear = vi.fn();
    const { user } = render(<NoSearchResults query="foobar" onClear={onClear} />);
    expect(screen.getByText(/foobar/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('NoMessages renders start chat action', async () => {
    const onStart = vi.fn();
    const { user } = render(<NoMessages onStartChat={onStart} />);
    await user.click(screen.getByRole('button', { name: 'Iniciar conversa' }));
    expect(onStart).toHaveBeenCalled();
  });

  it('NoActivity renders compact state', () => {
    render(<NoActivity />);
    expect(screen.getByText('Sem atividade recente')).toBeInTheDocument();
  });

  it('ErrorState renders error with retry', async () => {
    const onRetry = vi.fn();
    const { user } = render(<ErrorState message="Oops" onRetry={onRetry} />);
    expect(screen.getByText('Oops')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalled();
  });
});

// ============================================================
// ErrorBoundary
// ============================================================
describe('ErrorBoundary', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  function ThrowingChild({ shouldThrow = true }: { shouldThrow?: boolean }) {
    if (shouldThrow) throw new Error('Boom');
    return <div>Safe child</div>;
  }

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>OK content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('OK content')).toBeInTheDocument();
  });

  it('catches error and renders default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.queryByText('Safe child')).not.toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('calls onError callback with error object', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Boom');
  });

  it('shows retry button in default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });
});

describe('CompactErrorFallback', () => {
  it('renders default message', () => {
    render(<CompactErrorFallback />);
    expect(screen.getByText('Erro ao carregar')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<CompactErrorFallback message="Data load failed" />);
    expect(screen.getByText('Data load failed')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', async () => {
    const onRetry = vi.fn();
    const { user } = render(<CompactErrorFallback onRetry={onRetry} />);
    await user.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render button when no onRetry', () => {
    render(<CompactErrorFallback />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

// ============================================================
// Dialog
// ============================================================
describe('Dialog', () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <p>Dialog body</p>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Dialog isOpen={false} onClose={vi.fn()}>
        <p>Hidden</p>
      </Dialog>
    );
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(<Dialog {...baseProps} />);
    expect(screen.getByText('Dialog body')).toBeInTheDocument();
  });

  it('renders title and description', () => {
    render(<Dialog {...baseProps} title="My Title" description="Details" />);
    expect(screen.getByText('My Title')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('has dialog role and aria-modal', () => {
    render(<Dialog {...baseProps} title="Accessible" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Accessible');
  });

  it('shows close button by default and calls onClose', async () => {
    const onClose = vi.fn();
    const { user } = render(
      <Dialog isOpen onClose={onClose} title="X">
        <p>C</p>
      </Dialog>
    );
    await user.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides close button when showClose is false', () => {
    render(<Dialog {...baseProps} title="No X" showClose={false} />);
    expect(screen.queryByLabelText('Close dialog')).not.toBeInTheDocument();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(
      <Dialog isOpen onClose={onClose} title="Esc">
        <p>C</p>
      </Dialog>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer', () => {
    render(
      <Dialog {...baseProps} footer={<button>Save</button>}>
        <p>Body</p>
      </Dialog>
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});

// ============================================================
// ContextMenu
// ============================================================
describe('ContextMenu', () => {
  const items = [
    { label: 'Edit', onClick: vi.fn() },
    { label: 'Delete', onClick: vi.fn(), danger: true },
  ];

  beforeEach(() => {
    items.forEach((i) => i.onClick.mockClear());
  });

  it('renders children', () => {
    render(
      <ContextMenu items={items}>
        <div data-testid="trigger">Right click me</div>
      </ContextMenu>
    );
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
  });

  it('menu is hidden initially', () => {
    render(
      <ContextMenu items={items}>
        <div>Trigger</div>
      </ContextMenu>
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens on right-click (contextmenu event)', () => {
    render(
      <ContextMenu items={items}>
        <div data-testid="trigger">Trigger</div>
      </ContextMenu>
    );
    fireEvent.contextMenu(screen.getByTestId('trigger'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });

  it('calls onClick when menu item is clicked', () => {
    render(
      <ContextMenu items={items}>
        <div data-testid="trigger">T</div>
      </ContextMenu>
    );
    fireEvent.contextMenu(screen.getByTestId('trigger'));
    fireEvent.click(screen.getByText('Edit'));
    expect(items[0].onClick).toHaveBeenCalledTimes(1);
  });

  it('closes menu after clicking an item', () => {
    render(
      <ContextMenu items={items}>
        <div data-testid="trigger">T</div>
      </ContextMenu>
    );
    fireEvent.contextMenu(screen.getByTestId('trigger'));
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not call onClick for disabled items', () => {
    const disabledItems = [{ label: 'Nope', onClick: vi.fn(), disabled: true }];
    render(
      <ContextMenu items={disabledItems}>
        <div data-testid="trigger">T</div>
      </ContextMenu>
    );
    fireEvent.contextMenu(screen.getByTestId('trigger'));
    fireEvent.click(screen.getByText('Nope'));
    expect(disabledItems[0].onClick).not.toHaveBeenCalled();
  });

  it('renders separator as a non-menuitem element', () => {
    const itemsWithSep = [
      { label: 'A', onClick: vi.fn() },
      { label: '', onClick: vi.fn(), separator: true },
      { label: 'B', onClick: vi.fn() },
    ];
    render(
      <ContextMenu items={itemsWithSep}>
        <div data-testid="trigger">T</div>
      </ContextMenu>
    );
    fireEvent.contextMenu(screen.getByTestId('trigger'));
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    expect(screen.getByRole('menu').children).toHaveLength(3);
  });

  it('closes on Escape key', () => {
    render(
      <ContextMenu items={items}>
        <div data-testid="trigger">T</div>
      </ContextMenu>
    );
    fireEvent.contextMenu(screen.getByTestId('trigger'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
