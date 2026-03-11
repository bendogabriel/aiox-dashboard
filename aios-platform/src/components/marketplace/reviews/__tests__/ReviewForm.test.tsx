import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewForm from '../ReviewForm';
import type { ReviewFormData } from '../ReviewForm';
import type { MarketplaceOrder } from '../../../../types/marketplace';

// ── Test Helpers ────────────────────────────────────────────────────────

function createMockOrder(overrides: Partial<MarketplaceOrder> = {}): MarketplaceOrder {
  return {
    id: 'order-123',
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
    agent_config_snapshot: {
      persona: { role: 'Dev Agent' },
      capabilities: ['typescript', 'react'],
      commands: [{ command: '/code', action: 'generate', description: 'Generate code' }],
    },
    created_at: '2026-03-01T10:00:00Z',
    started_at: null,
    completed_at: null,
    updated_at: '2026-03-01T10:00:00Z',
    listing: {
      id: 'listing-1',
      seller_id: 'seller-1',
      slug: 'test-agent',
      name: 'Test Agent',
      tagline: 'A test agent',
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

// ── Tests ───────────────────────────────────────────────────────────────

describe('ReviewForm', () => {
  const defaultProps = {
    order: createMockOrder(),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders the form with order listing name', () => {
    render(<ReviewForm {...defaultProps} />);
    expect(screen.getByText(/Avaliar.*Test Agent/)).toBeInTheDocument();
  });

  it('renders "Avaliar Agente" when listing name is not available', () => {
    const order = createMockOrder({ listing: undefined });
    render(<ReviewForm {...defaultProps} order={order} />);
    expect(screen.getByText(/Avaliar.*Agente/)).toBeInTheDocument();
  });

  it('renders overall rating section', () => {
    render(<ReviewForm {...defaultProps} />);
    expect(screen.getByText('Avaliacao Geral')).toBeInTheDocument();
  });

  it('renders title and body inputs', () => {
    render(<ReviewForm {...defaultProps} />);
    expect(screen.getByPlaceholderText('Resumo da sua experiencia')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Descreva sua experiencia com este agente...')).toBeInTheDocument();
  });

  it('submit button is disabled when no rating is selected', () => {
    render(<ReviewForm {...defaultProps} />);
    const submitButton = screen.getByText('Enviar Avaliacao');
    expect(submitButton.closest('button')).toBeDisabled();
  });

  it('submit button becomes enabled after selecting a star rating', () => {
    render(<ReviewForm {...defaultProps} />);

    // Button layout: [X close] [star1] [star2] [star3] [star4] [star5] [dimensions toggle] [submit] [cancel]
    // The overall star buttons are at indices 1-5
    const allButtons = screen.getAllByRole('button');
    fireEvent.click(allButtons[1]); // first star = rating 1

    const submitButton = screen.getByText('Enviar Avaliacao');
    expect(submitButton.closest('button')).not.toBeDisabled();
  });

  it('calls onSubmit with correct ReviewFormData when submitted', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<ReviewForm {...defaultProps} onSubmit={onSubmit} />);

    // Button layout: [X close] [star1] [star2] [star3] [star4] [star5] [toggle] [submit] [cancel]
    const allButtons = screen.getAllByRole('button');
    await user.click(allButtons[3]); // star3 = rating 3

    // Fill title
    const titleInput = screen.getByPlaceholderText('Resumo da sua experiencia');
    await user.type(titleInput, 'Great agent');

    // Fill body
    const bodyInput = screen.getByPlaceholderText('Descreva sua experiencia com este agente...');
    await user.type(bodyInput, 'Worked really well');

    // Submit
    const submitButton = screen.getByText('Enviar Avaliacao');
    await user.click(submitButton.closest('button')!);

    expect(onSubmit).toHaveBeenCalledOnce();
    const submittedData: ReviewFormData = onSubmit.mock.calls[0][0];
    expect(submittedData.order_id).toBe('order-123');
    expect(submittedData.listing_id).toBe('listing-1');
    expect(submittedData.rating_overall).toBe(3);
    expect(submittedData.title).toBe('Great agent');
    expect(submittedData.body).toBe('Worked really well');
    expect(submittedData.rating_quality).toBeNull();
    expect(submittedData.rating_speed).toBeNull();
    expect(submittedData.rating_value).toBeNull();
    expect(submittedData.rating_accuracy).toBeNull();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(<ReviewForm {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByText('Cancelar');
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows "Enviando..." text when isSubmitting is true', () => {
    render(<ReviewForm {...defaultProps} isSubmitting />);
    expect(screen.getByText('Enviando...')).toBeInTheDocument();
  });

  it('shows "Enviar Avaliacao" text when isSubmitting is false', () => {
    render(<ReviewForm {...defaultProps} isSubmitting={false} />);
    expect(screen.getByText('Enviar Avaliacao')).toBeInTheDocument();
  });

  it('submit button is disabled when isSubmitting is true even with rating', () => {
    render(<ReviewForm {...defaultProps} isSubmitting />);

    // Click a star first (index 1 = first star, after X close button)
    const allButtons = screen.getAllByRole('button');
    fireEvent.click(allButtons[1]);

    const submitButton = screen.getByText('Enviando...');
    expect(submitButton.closest('button')).toBeDisabled();
  });

  it('shows dimension ratings when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<ReviewForm {...defaultProps} />);

    // Click the dimensions toggle
    const toggle = screen.getByText('+ Avaliar dimensoes (opcional)');
    await user.click(toggle);

    expect(screen.getByText('Qualidade')).toBeInTheDocument();
    expect(screen.getByText('Velocidade')).toBeInTheDocument();
    expect(screen.getByText('Custo-Beneficio')).toBeInTheDocument();
    expect(screen.getByText('Precisao')).toBeInTheDocument();
  });

  it('hides dimension ratings when toggle is clicked again', async () => {
    const user = userEvent.setup();
    render(<ReviewForm {...defaultProps} />);

    // Open dimensions
    await user.click(screen.getByText('+ Avaliar dimensoes (opcional)'));
    expect(screen.getByText('Qualidade')).toBeInTheDocument();

    // Close dimensions
    await user.click(screen.getByText('- Ocultar dimensoes'));
    expect(screen.queryByText('Qualidade')).not.toBeInTheDocument();
  });

  it('displays the verified purchase notice', () => {
    render(<ReviewForm {...defaultProps} />);
    expect(screen.getByText(/Compra Verificada/)).toBeInTheDocument();
  });

  it('shows rating value after selecting overall rating', () => {
    render(<ReviewForm {...defaultProps} />);

    // Button layout: [X close] [star1] [star2] [star3] [star4] [star5] [toggle] ...
    const allButtons = screen.getAllByRole('button');
    fireEvent.click(allButtons[5]); // star5 = rating 5

    expect(screen.getByText('5/5')).toBeInTheDocument();
  });

  it('trims whitespace from title and body on submit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<ReviewForm {...defaultProps} onSubmit={onSubmit} />);

    // Select a rating (index 1 = first star, after X close)
    const allButtons = screen.getAllByRole('button');
    await user.click(allButtons[1]); // star1 = rating 1

    // Type with leading/trailing spaces
    const titleInput = screen.getByPlaceholderText('Resumo da sua experiencia');
    await user.type(titleInput, '  Spaced title  ');

    const bodyInput = screen.getByPlaceholderText('Descreva sua experiencia com este agente...');
    await user.type(bodyInput, '  Spaced body  ');

    // Submit
    const submitButton = screen.getByText('Enviar Avaliacao');
    await user.click(submitButton.closest('button')!);

    const submittedData: ReviewFormData = onSubmit.mock.calls[0][0];
    expect(submittedData.title).toBe('Spaced title');
    expect(submittedData.body).toBe('Spaced body');
  });
});
