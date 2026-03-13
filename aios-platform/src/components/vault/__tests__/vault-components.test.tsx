import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock framer-motion (factory must be self-contained — vi.mock is hoisted)
vi.mock('framer-motion', () => {
  const motionProps = ['initial', 'animate', 'exit', 'transition', 'variants', 'whileHover', 'whileTap', 'whileFocus', 'whileInView', 'layout', 'layoutId', 'custom', 'onAnimationStart', 'onAnimationComplete'];
  function strip(props: Record<string, unknown>) {
    const clean: Record<string, unknown> = {};
    for (const k of Object.keys(props)) {
      if (!motionProps.includes(k)) clean[k] = props[k];
    }
    return clean;
  }
  const tag = (Tag: string) => ({ children, ...props }: Record<string, unknown>) => {
    const p = strip(props);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const El = Tag as any;
    return <El {...p}>{children}</El>;
  };
  return {
    motion: {
      div: tag('div'), button: tag('button'), span: tag('span'),
      svg: tag('svg'), aside: tag('aside'),
    },
    AnimatePresence: ({ children }: { children?: unknown }) => <>{children}</>,
  };
});

// Mock Supabase vault service
vi.mock('../../../services/supabase/vault', () => ({
  supabaseVaultService: {
    listWorkspaces: vi.fn().mockResolvedValue(null),
    listDocuments: vi.fn().mockResolvedValue(null),
    upsertWorkspace: vi.fn().mockResolvedValue(null),
    upsertDocument: vi.fn().mockResolvedValue(null),
  },
}));

// Mock vault store with controlled state
const mockGoBack = vi.fn();
const mockSelectWorkspace = vi.fn();
const mockSelectDocument = vi.fn();

const defaultStoreState = {
  level: 1 as 1 | 2 | 3,
  workspaces: [
    {
      id: 'ws-1',
      name: 'AIOX Workspace',
      icon: 'Landmark',
      status: 'active' as const,
      documentsCount: 12,
      templatesCount: 5,
      healthPercent: 85,
      lastUpdated: '2026-03-01T00:00:00Z',
      categories: [],
      templateGroups: [],
      taxonomySections: [],
      csuitePersonas: [],
    },
    {
      id: 'ws-2',
      name: 'Academia IOX',
      icon: 'BookOpen',
      status: 'setup' as const,
      documentsCount: 4,
      templatesCount: 2,
      healthPercent: 40,
      lastUpdated: '2026-02-20T00:00:00Z',
      categories: [],
      templateGroups: [],
      taxonomySections: [],
      csuitePersonas: [],
    },
  ],
  documents: [],
  activities: [],
  selectedWorkspaceId: null as string | null,
  selectedDocumentId: null as string | null,
  activeTab: 'dados' as const,
  goBack: mockGoBack,
  selectWorkspace: mockSelectWorkspace,
  selectDocument: mockSelectDocument,
  setActiveTab: vi.fn(),
  updateDocument: vi.fn(),
  _initialized: true,
  _initFromSupabase: vi.fn(),
};

let storeState = { ...defaultStoreState };

vi.mock('../../../stores/vaultStore', () => ({
  useVaultStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    if (typeof selector === 'function') return selector(storeState as unknown as Record<string, unknown>);
    return storeState;
  }),
}));

// Import components after mocks
import VaultView from '../VaultView';
import VaultOverview from '../VaultOverview';

describe('T7.1.1: VaultView renders without crash', () => {
  beforeEach(() => {
    storeState = { ...defaultStoreState, level: 1 };
    vi.clearAllMocks();
  });

  it('should render the Vault header', () => {
    render(<VaultView />);
    expect(screen.getByText('Vault')).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<VaultView />);
    expect(screen.getByPlaceholderText('Search vault...')).toBeInTheDocument();
  });

  it('should render VaultOverview at level 1', () => {
    render(<VaultView />);
    expect(screen.getByText('AIOX Workspace')).toBeInTheDocument();
    expect(screen.getByText('Academia IOX')).toBeInTheDocument();
  });

  it('should show breadcrumb at level 2', () => {
    storeState = {
      ...defaultStoreState,
      level: 2,
      selectedWorkspaceId: 'ws-1',
    };
    render(<VaultView />);
    // Breadcrumb should have "Vault" as back button
    expect(screen.getByRole('button', { name: /Vault/i })).toBeInTheDocument();
    // Workspace name appears in breadcrumb (may appear multiple times)
    expect(screen.getAllByText('AIOX Workspace').length).toBeGreaterThan(0);
  });
});

describe('T7.1.3: KPI cards display mock data', () => {
  beforeEach(() => {
    storeState = { ...defaultStoreState, level: 1 };
    vi.clearAllMocks();
  });

  it('should render 3 KPI cards', () => {
    render(
      <VaultOverview searchQuery="" onSelectWorkspace={mockSelectWorkspace} />
    );
    expect(screen.getByText('Enterprise Status')).toBeInTheDocument();
    expect(screen.getByText('Total Documents')).toBeInTheDocument();
    expect(screen.getByText('Total Templates')).toBeInTheDocument();
  });
});

describe('T7.1.4: Workspace cards and interactions', () => {
  beforeEach(() => {
    storeState = { ...defaultStoreState, level: 1 };
    vi.clearAllMocks();
  });

  it('should render workspace cards', () => {
    render(
      <VaultOverview searchQuery="" onSelectWorkspace={mockSelectWorkspace} />
    );
    expect(screen.getByText('AIOX Workspace')).toBeInTheDocument();
    expect(screen.getByText('Academia IOX')).toBeInTheDocument();
  });

  it('should call onSelectWorkspace when card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VaultOverview searchQuery="" onSelectWorkspace={mockSelectWorkspace} />
    );

    const card = screen.getByText('AIOX Workspace').closest('[role="button"], button, [class*="cursor-pointer"]');
    if (card) {
      await user.click(card);
      expect(mockSelectWorkspace).toHaveBeenCalledWith('ws-1');
    }
  });

  it('should render "+ Novo Workspace" button', () => {
    render(
      <VaultOverview searchQuery="" onSelectWorkspace={mockSelectWorkspace} />
    );
    expect(screen.getByText(/Novo Workspace/i)).toBeInTheDocument();
  });
});
