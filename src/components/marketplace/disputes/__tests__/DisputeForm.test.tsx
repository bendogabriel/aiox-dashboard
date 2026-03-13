import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DisputeForm from '../DisputeForm';
import type { DisputeFormData } from '../DisputeForm';
import type { MarketplaceOrder } from '../../../../types/marketplace';

// ── Test Helpers ────────────────────────────────────────────────────────

function createMockOrder(overrides: Partial<MarketplaceOrder> = {}): MarketplaceOrder {
  return {
    id: 'order-456',
    buyer_id: 'buyer-1',
    listing_id: 'listing-1',
    seller_id: 'seller-1',
    order_type: 'task',
    status: 'active',
    task_description: null,
    task_deliverables: null,
    hours_contracted: null,
    hours_used: 0,
    hourly_rate: null,
    subscription_period: null,
    subscription_start: null,
    subscription_end: null,
    auto_renew: false,
    credits_purchased: null,
    credits_remaining: null,
    subtotal: 1500,
    platform_fee: 225,
    seller_payout: 1275,
    currency: 'BRL',
    escrow_status: 'held',
    escrow_release_at: null,
    stripe_payment_id: null,
    stripe_subscription_id: null,
    agent_instance_id: null,
    agent_config_snapshot: null,
    created_at: '2026-03-01T10:00:00Z',
    started_at: null,
    completed_at: null,
    updated_at: '2026-03-01T10:00:00Z',
    listing: {
      id: 'listing-1',
      seller_id: 'seller-1',
      slug: 'dispute-agent',
      name: 'Dispute Agent',
      tagline: 'A disputed agent',
      description: 'Test description',
      category: 'development' as never,
      tags: ['test'],
      icon: 'Bot',
      cover_image_url: null,
      screenshots: [],
      agent_config: {},
      agent_tier: 'specialist' as never,
      squad_type: 'development' as never,
      capabilities: ['test'],
      supported_models: ['claude-sonnet'],
      required_tools: [],
      required_mcps: [],
      pricing_model: 'per_task',
      price_amount: 1500,
      price_currency: 'BRL',
      credits_per_use: null,
      sla_response_ms: null,
      sla_uptime_pct: null,
      sla_max_tokens: null,
      downloads: 100,
      active_hires: 5,
      rating_avg: 4.5,
      rating_count: 10,
      status: 'approved',
      rejection_reason: null,
      featured: false,
      featured_at: null,
      version: '1.0.0',
      changelog: null,
      published_at: '2026-01-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    } as never,
    ...overrides,
  };
}

/**
 * Finds the submit button (the flex-1 button that contains either
 * "Abrir Disputa" or "Enviando...").
 */
function getSubmitButton(): HTMLButtonElement {
  const allButtons = screen.getAllByRole('button');
  const btn = allButtons.find((b) => b.className.includes('flex-1'));
  if (!btn) throw new Error('Submit button not found');
  return btn as HTMLButtonElement;
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('DisputeForm', () => {
  const defaultProps = {
    order: createMockOrder(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders the dispute form header', () => {
    render(<DisputeForm {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Abrir Disputa' })).toBeInTheDocument();
  });

  it('renders the order reference with listing name and date', () => {
    render(<DisputeForm {...defaultProps} />);
    expect(screen.getByText(/Dispute Agent/)).toBeInTheDocument();
  });

  it('renders all 5 dispute reasons', () => {
    render(<DisputeForm {...defaultProps} />);
    expect(screen.getByText('Nao Entrega')).toBeInTheDocument();
    expect(screen.getByText('Qualidade Baixa')).toBeInTheDocument();
    expect(screen.getByText('Diferente do Anunciado')).toBeInTheDocument();
    expect(screen.getByText('Erro de Cobranca')).toBeInTheDocument();
    expect(screen.getByText('Outro')).toBeInTheDocument();
  });

  it('renders descriptions for each dispute reason', () => {
    render(<DisputeForm {...defaultProps} />);
    expect(screen.getByText('O agente nao executou a tarefa solicitada')).toBeInTheDocument();
    expect(screen.getByText('O resultado ficou muito abaixo do esperado')).toBeInTheDocument();
    expect(screen.getByText('O agente nao corresponde a descricao do listing')).toBeInTheDocument();
    expect(screen.getByText('Fui cobrado incorretamente')).toBeInTheDocument();
    expect(screen.getByText('Outro motivo nao listado')).toBeInTheDocument();
  });

  it('submit button is disabled initially (no reason or description)', () => {
    render(<DisputeForm {...defaultProps} />);
    expect(getSubmitButton()).toBeDisabled();
  });

  it('selecting a reason alone keeps submit disabled (description too short)', async () => {
    const user = userEvent.setup();
    render(<DisputeForm {...defaultProps} />);

    await user.click(screen.getByText('Nao Entrega'));

    expect(getSubmitButton()).toBeDisabled();
  });

  it('submit remains disabled when description is under 20 characters', async () => {
    const user = userEvent.setup();
    render(<DisputeForm {...defaultProps} />);

    await user.click(screen.getByText('Nao Entrega'));

    const descInput = screen.getByPlaceholderText(/Descreva o problema/);
    await user.type(descInput, 'Too short');

    expect(getSubmitButton()).toBeDisabled();
  });

  it('submit becomes enabled when reason is selected and description >= 20 chars', async () => {
    const user = userEvent.setup();
    render(<DisputeForm {...defaultProps} />);

    await user.click(screen.getByText('Qualidade Baixa'));

    const descInput = screen.getByPlaceholderText(/Descreva o problema/);
    await user.type(descInput, 'This is a long enough description for the form');

    expect(getSubmitButton()).not.toBeDisabled();
  });

  it('calls onSubmit with correct DisputeFormData', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<DisputeForm {...defaultProps} onSubmit={onSubmit} />);

    await user.click(screen.getByText('Diferente do Anunciado'));

    const descInput = screen.getByPlaceholderText(/Descreva o problema/);
    await user.type(descInput, 'The agent did not match what was described in the listing');

    await user.click(getSubmitButton());

    expect(onSubmit).toHaveBeenCalledOnce();
    const data: DisputeFormData = onSubmit.mock.calls[0][0];
    expect(data.order_id).toBe('order-456');
    expect(data.reason).toBe('not_as_described');
    expect(data.description).toBe('The agent did not match what was described in the listing');
    expect(data.evidence).toEqual([]);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(<DisputeForm {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows "Enviando..." when isSubmitting is true', () => {
    render(<DisputeForm {...defaultProps} isSubmitting />);
    expect(screen.getByText('Enviando...')).toBeInTheDocument();
  });

  it('shows "Abrir Disputa" on submit button when not submitting', () => {
    render(<DisputeForm {...defaultProps} isSubmitting={false} />);
    const submitBtn = getSubmitButton();
    expect(submitBtn.textContent).toContain('Abrir Disputa');
  });

  it('submit button is disabled when isSubmitting even with valid form', async () => {
    const user = userEvent.setup();

    const { rerender } = render(<DisputeForm {...defaultProps} />);

    await user.click(screen.getByText('Nao Entrega'));
    const descInput = screen.getByPlaceholderText(/Descreva o problema/);
    await user.type(descInput, 'A sufficiently long description here');

    rerender(<DisputeForm {...defaultProps} isSubmitting />);

    expect(getSubmitButton()).toBeDisabled();
  });

  // ── Evidence URLs ───────────────────────────────────────────────────

  it('can add an evidence URL', async () => {
    const user = userEvent.setup();
    render(<DisputeForm {...defaultProps} />);

    const evidenceInput = screen.getByPlaceholderText('URL de screenshot ou evidencia...');
    await user.type(evidenceInput, 'https://example.com/screenshot.png');

    const addButton = screen.getByText('Adicionar');
    await user.click(addButton);

    expect(screen.getByText('https://example.com/screenshot.png')).toBeInTheDocument();
    expect(evidenceInput).toHaveValue('');
  });

  it('can remove an evidence URL', async () => {
    const user = userEvent.setup();
    render(<DisputeForm {...defaultProps} />);

    // Add evidence
    const evidenceInput = screen.getByPlaceholderText('URL de screenshot ou evidencia...');
    await user.type(evidenceInput, 'https://example.com/evidence1.png');
    await user.click(screen.getByText('Adicionar'));

    expect(screen.getByText('https://example.com/evidence1.png')).toBeInTheDocument();

    // Find and click the remove button in the evidence row
    const evidenceText = screen.getByText('https://example.com/evidence1.png');
    const evidenceRow = evidenceText.closest('div[class*="flex items-center"]');
    const trashButton = evidenceRow?.querySelector('button');
    expect(trashButton).toBeTruthy();
    await user.click(trashButton!);

    expect(screen.queryByText('https://example.com/evidence1.png')).not.toBeInTheDocument();
  });

  it('Adicionar button is disabled when evidence URL is empty', () => {
    render(<DisputeForm {...defaultProps} />);
    const addButton = screen.getByText('Adicionar');
    expect(addButton.closest('button')).toBeDisabled();
  });

  it('includes evidence in onSubmit data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<DisputeForm {...defaultProps} onSubmit={onSubmit} />);

    // Select reason
    await user.click(screen.getByText('Outro'));

    // Fill description
    const descInput = screen.getByPlaceholderText(/Descreva o problema/);
    await user.type(descInput, 'Description that is long enough for validation purposes');

    // Add evidence
    const evidenceInput = screen.getByPlaceholderText('URL de screenshot ou evidencia...');
    await user.type(evidenceInput, 'https://example.com/proof.png');
    await user.click(screen.getByText('Adicionar'));

    // Submit
    await user.click(getSubmitButton());

    expect(onSubmit).toHaveBeenCalledOnce();
    const data: DisputeFormData = onSubmit.mock.calls[0][0];
    expect(data.evidence).toHaveLength(1);
    expect(data.evidence[0]).toEqual({
      url: 'https://example.com/proof.png',
      type: 'url',
    });
  });

  it('shows character count for description', () => {
    render(<DisputeForm {...defaultProps} />);
    expect(screen.getByText('0/2000')).toBeInTheDocument();
  });

  it('updates character count as user types', async () => {
    const user = userEvent.setup();
    render(<DisputeForm {...defaultProps} />);

    const descInput = screen.getByPlaceholderText(/Descreva o problema/);
    await user.type(descInput, 'Hello');

    expect(screen.getByText('5/2000')).toBeInTheDocument();
  });

  it('displays the escrow warning message', () => {
    render(<DisputeForm {...defaultProps} />);
    expect(
      screen.getByText(/Abrir uma disputa congela o escrow ate a resolucao/),
    ).toBeInTheDocument();
  });

  it('shows "Agente" when listing name is not available', () => {
    const order = createMockOrder({ listing: undefined });
    render(<DisputeForm {...defaultProps} order={order} />);
    expect(screen.getByText(/Order:.*Agente/)).toBeInTheDocument();
  });
});
