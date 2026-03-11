import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  PriceBadge,
  formatPrice,
  RatingStars,
  SellerBadge,
  CategoryBadge,
  ListingStatusBadge,
  EmptyMarketplace,
  EscrowBadge,
} from '..';

// ── PriceBadge & formatPrice ────────────────────────────────────────────

describe('formatPrice', () => {
  it('returns "Gratis" for free model', () => {
    const result = formatPrice('free', 0);
    expect(result.label).toBe('Gratis');
    expect(result.suffix).toBe('');
    expect(result.formatted).toBe('Gratis');
  });

  it('formats BRL per_task price correctly', () => {
    const result = formatPrice('per_task', 1500, 'BRL');
    expect(result.label).toBe('R$ 1500,00');
    expect(result.suffix).toBe('/task');
    expect(result.formatted).toBe('R$ 1500,00/task');
  });

  it('formats hourly price with /hora suffix', () => {
    const result = formatPrice('hourly', 75.5, 'BRL');
    expect(result.formatted).toBe('R$ 75,50/hora');
  });

  it('formats monthly price with /mes suffix', () => {
    const result = formatPrice('monthly', 299, 'BRL');
    expect(result.formatted).toBe('R$ 299,00/mes');
  });

  it('formats credits price with /credito suffix', () => {
    const result = formatPrice('credits', 10, 'BRL');
    expect(result.formatted).toBe('R$ 10,00/credito');
  });

  it('formats credits price with creditsPerUse', () => {
    const result = formatPrice('credits', 10, 'BRL', 5);
    expect(result.formatted).toBe('R$ 10,00 (5 cred.)');
  });

  it('uses USD symbol for USD currency', () => {
    const result = formatPrice('per_task', 25, 'USD');
    expect(result.label).toBe('$ 25,00');
  });

  it('falls back to currency code for unknown currencies', () => {
    const result = formatPrice('per_task', 100, 'EUR');
    expect(result.label).toBe('EUR 100,00');
  });
});

describe('PriceBadge', () => {
  it('renders free model with "Gratis" text', () => {
    render(<PriceBadge model="free" amount={0} />);
    expect(screen.getByText('Gratis')).toBeInTheDocument();
  });

  it('renders per_task price in BRL', () => {
    render(<PriceBadge model="per_task" amount={1500} currency="BRL" />);
    expect(screen.getByText('R$ 1500,00/task')).toBeInTheDocument();
  });

  it('renders monthly price', () => {
    render(<PriceBadge model="monthly" amount={299} currency="BRL" />);
    expect(screen.getByText('R$ 299,00/mes')).toBeInTheDocument();
  });

  it('applies sm size classes', () => {
    const { container } = render(<PriceBadge model="free" amount={0} size="sm" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-xs');
  });

  it('applies lg size classes', () => {
    const { container } = render(<PriceBadge model="free" amount={0} size="lg" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-base');
  });

  it('applies lime styling for free model', () => {
    const { container } = render(<PriceBadge model="free" amount={0} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('aiox-lime');
  });

  it('applies neutral styling for paid models', () => {
    const { container } = render(<PriceBadge model="per_task" amount={50} />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('color-bg-elevated');
  });
});

// ── RatingStars ─────────────────────────────────────────────────────────

describe('RatingStars', () => {
  it('renders 5 star buttons', () => {
    render(<RatingStars value={3} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('renders correct aria-labels on stars', () => {
    render(<RatingStars value={0} />);
    expect(screen.getByLabelText('1 estrela')).toBeInTheDocument();
    expect(screen.getByLabelText('2 estrelas')).toBeInTheDocument();
    expect(screen.getByLabelText('5 estrelas')).toBeInTheDocument();
  });

  it('shows count text when count is provided', () => {
    render(<RatingStars value={4} count={42} />);
    expect(screen.getByText('(42)')).toBeInTheDocument();
  });

  it('does not show count when count is not provided', () => {
    render(<RatingStars value={4} />);
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it('shows numeric value when showValue is true', () => {
    render(<RatingStars value={4.5} showValue />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('does not show numeric value by default', () => {
    render(<RatingStars value={4.5} />);
    expect(screen.queryByText('4.5')).not.toBeInTheDocument();
  });

  it('stars are disabled when not interactive', () => {
    render(<RatingStars value={3} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('stars are enabled when interactive', () => {
    const onChange = vi.fn();
    render(<RatingStars value={3} interactive onChange={onChange} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).not.toBeDisabled());
  });

  it('calls onChange with star value when clicked in interactive mode', () => {
    const onChange = vi.fn();
    render(<RatingStars value={0} interactive onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('4 estrelas'));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});

// ── SellerBadge ─────────────────────────────────────────────────────────

describe('SellerBadge', () => {
  it('renders "Novo" label for unverified', () => {
    render(<SellerBadge verification="unverified" />);
    expect(screen.getByText('Novo')).toBeInTheDocument();
  });

  it('renders "Verificado" label for verified', () => {
    render(<SellerBadge verification="verified" />);
    expect(screen.getByText('Verificado')).toBeInTheDocument();
  });

  it('renders "Pro" label for pro', () => {
    render(<SellerBadge verification="pro" />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('renders "Enterprise" label for enterprise', () => {
    render(<SellerBadge verification="enterprise" />);
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<SellerBadge verification="pro" showLabel={false} />);
    expect(screen.queryByText('Pro')).not.toBeInTheDocument();
  });

  it('applies md size classes', () => {
    const { container } = render(<SellerBadge verification="verified" size="md" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-xs');
  });

  it('applies sm size classes by default', () => {
    const { container } = render(<SellerBadge verification="verified" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-[10px]');
  });
});

// ── CategoryBadge ───────────────────────────────────────────────────────

describe('CategoryBadge', () => {
  // Note: getSquadType('development') matches /dev/ pattern -> 'engineering'
  it('renders the mapped label for a category via getSquadType', () => {
    render(<CategoryBadge category="development" />);
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('renders "Design" for design category', () => {
    render(<CategoryBadge category="design" />);
    expect(screen.getByText('Design')).toBeInTheDocument();
  });

  it('renders "Analytics" for analytics category', () => {
    render(<CategoryBadge category="data-analytics" />);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders "Outros" for unknown/unmapped categories', () => {
    render(<CategoryBadge category="zzz-unknown" />);
    expect(screen.getByText('Outros')).toBeInTheDocument();
  });

  it('applies md size classes', () => {
    const { container } = render(<CategoryBadge category="design" size="md" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-xs');
  });
});

// ── ListingStatusBadge ──────────────────────────────────────────────────

describe('ListingStatusBadge', () => {
  it('renders "Rascunho" for draft status', () => {
    render(<ListingStatusBadge status="draft" />);
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
  });

  it('renders "Aguardando Review" for pending_review', () => {
    render(<ListingStatusBadge status="pending_review" />);
    expect(screen.getByText('Aguardando Review')).toBeInTheDocument();
  });

  it('renders "Em Review" for in_review', () => {
    render(<ListingStatusBadge status="in_review" />);
    expect(screen.getByText('Em Review')).toBeInTheDocument();
  });

  it('renders "Aprovado" for approved', () => {
    render(<ListingStatusBadge status="approved" />);
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
  });

  it('renders "Rejeitado" for rejected', () => {
    render(<ListingStatusBadge status="rejected" />);
    expect(screen.getByText('Rejeitado')).toBeInTheDocument();
  });

  it('renders "Suspenso" for suspended', () => {
    render(<ListingStatusBadge status="suspended" />);
    expect(screen.getByText('Suspenso')).toBeInTheDocument();
  });

  it('renders "Arquivado" for archived', () => {
    render(<ListingStatusBadge status="archived" />);
    expect(screen.getByText('Arquivado')).toBeInTheDocument();
  });
});

// ── EscrowBadge ─────────────────────────────────────────────────────────

describe('EscrowBadge', () => {
  it('returns null for "none" status', () => {
    const { container } = render(<EscrowBadge status="none" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders "Em Escrow" for held status', () => {
    render(<EscrowBadge status="held" />);
    expect(screen.getByText('Em Escrow')).toBeInTheDocument();
  });

  it('renders "Liberado" for released status', () => {
    render(<EscrowBadge status="released" />);
    expect(screen.getByText('Liberado')).toBeInTheDocument();
  });

  it('renders "Congelado" for frozen status', () => {
    render(<EscrowBadge status="frozen" />);
    expect(screen.getByText('Congelado')).toBeInTheDocument();
  });

  it('renders "Reembolsado" for refunded status', () => {
    render(<EscrowBadge status="refunded" />);
    expect(screen.getByText('Reembolsado')).toBeInTheDocument();
  });

  it('shows days until release when held with releaseAt', () => {
    // Set releaseAt to 5 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    render(<EscrowBadge status="held" releaseAt={futureDate.toISOString()} />);
    expect(screen.getByText('(5d)')).toBeInTheDocument();
  });

  it('does not show release date for non-held statuses', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    render(<EscrowBadge status="released" releaseAt={futureDate.toISOString()} />);
    expect(screen.queryByText(/\(\d+d\)/)).not.toBeInTheDocument();
  });

  it('applies md size classes', () => {
    const { container } = render(<EscrowBadge status="held" size="md" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-xs');
  });
});

// ── EmptyMarketplace ────────────────────────────────────────────────────

describe('EmptyMarketplace', () => {
  it('renders browse variant by default', () => {
    render(<EmptyMarketplace />);
    expect(screen.getByText('Marketplace vazio')).toBeInTheDocument();
    expect(screen.getByText('Ainda nao ha agentes publicados no marketplace.')).toBeInTheDocument();
  });

  it('renders purchases variant', () => {
    render(<EmptyMarketplace variant="purchases" />);
    expect(screen.getByText('Nenhuma compra ainda')).toBeInTheDocument();
    expect(screen.getByText('Voce ainda nao contratou nenhum agente. Explore o marketplace!')).toBeInTheDocument();
  });

  it('renders listings variant', () => {
    render(<EmptyMarketplace variant="listings" />);
    expect(screen.getByText('Nenhum listing')).toBeInTheDocument();
    expect(screen.getByText('Voce ainda nao submeteu nenhum agente para venda.')).toBeInTheDocument();
  });

  it('renders search variant', () => {
    render(<EmptyMarketplace variant="search" />);
    expect(screen.getByText('Nenhum resultado')).toBeInTheDocument();
  });

  it('shows action button when onAction is provided', () => {
    const onAction = vi.fn();
    render(<EmptyMarketplace variant="purchases" onAction={onAction} />);
    const button = screen.getByRole('button', { name: 'Explorar Marketplace' });
    expect(button).toBeInTheDocument();
  });

  it('does not show action button when onAction is not provided', () => {
    render(<EmptyMarketplace variant="purchases" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onAction when action button is clicked', () => {
    const onAction = vi.fn();
    render(<EmptyMarketplace variant="listings" onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar Primeiro Agente' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('shows correct action text per variant', () => {
    const onAction = vi.fn();

    const { unmount: u1 } = render(<EmptyMarketplace variant="browse" onAction={onAction} />);
    expect(screen.getByRole('button', { name: 'Seja o primeiro a publicar' })).toBeInTheDocument();
    u1();

    const { unmount: u2 } = render(<EmptyMarketplace variant="search" onAction={onAction} />);
    expect(screen.getByRole('button', { name: 'Limpar Filtros' })).toBeInTheDocument();
    u2();
  });
});
