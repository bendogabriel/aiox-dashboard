import { cn } from '../../../lib/utils'
import type { HTMLAttributes } from 'react'

export interface CockpitTableColumn<T> {
  key: string
  header: string
  render?: (value: unknown, row: T) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface CockpitTableProps<T extends Record<string, unknown>> extends Omit<HTMLAttributes<HTMLTableElement>, 'children'> {
  columns: CockpitTableColumn<T>[]
  data: T[]
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  emptyMessage?: string
  striped?: boolean
  hoverable?: boolean
  compact?: boolean
}

function SortIndicator({ active, direction }: { active: boolean; direction?: 'asc' | 'desc' }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        marginLeft: '0.375rem',
        lineHeight: 0,
        fontSize: '0.5rem',
        verticalAlign: 'middle',
      }}
    >
      <span
        style={{
          color:
            active && direction === 'asc'
              ? 'var(--aiox-lime, #D1FF00)'
              : 'rgba(156, 156, 156, 0.3)',
          lineHeight: 1,
        }}
      >
        &#x25B2;
      </span>
      <span
        style={{
          color:
            active && direction === 'desc'
              ? 'var(--aiox-lime, #D1FF00)'
              : 'rgba(156, 156, 156, 0.3)',
          lineHeight: 1,
          marginTop: '-0.1rem',
        }}
      >
        &#x25BC;
      </span>
    </span>
  )
}

export function CockpitTable<T extends Record<string, unknown>>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  emptyMessage = 'No data available',
  striped = false,
  hoverable = true,
  compact = false,
  className,
  style,
  ...props
}: CockpitTableProps<T>) {
  const cellPadding = compact ? '0.5rem 0.75rem' : '0.85rem 1.25rem'
  const headerPadding = compact ? '0.5rem 0.75rem' : '0.85rem 1.25rem'

  const handleSort = (col: CockpitTableColumn<T>) => {
    if (!col.sortable || !onSort) return
    const newDir =
      sortKey === col.key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(col.key, newDir)
  }

  return (
    <div style={{ width: '100%', overflow: 'auto' }}>
      <table
        className={cn(className)}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-family-mono)',
          fontSize: '0.65rem',
          color: 'var(--aiox-gray-muted, #999999)',
          ...style,
        }}
        {...props}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col)}
                aria-sort={
                  sortKey === col.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
                style={{
                  padding: headerPadding,
                  background: 'var(--aiox-surface, #0F0F11)',
                  borderBottom: '1px solid rgba(156, 156, 156, 0.15)',
                  fontSize: '0.55rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--aiox-gray-dim, #696969)',
                  textAlign: col.align || 'left',
                  width: col.width,
                  whiteSpace: 'nowrap',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: col.sortable ? 'none' : 'auto',
                }}
              >
                {col.header}
                {col.sortable && (
                  <SortIndicator
                    active={sortKey === col.key}
                    direction={sortKey === col.key ? sortDirection : undefined}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  fontSize: '0.6rem',
                  color: 'var(--aiox-gray-dim, #696969)',
                  fontStyle: 'italic',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  background:
                    striped && rowIndex % 2 === 1
                      ? 'rgba(156, 156, 156, 0.03)'
                      : 'transparent',
                  transition: hoverable ? 'background 0.15s' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (hoverable) {
                    e.currentTarget.style.background = 'rgba(209, 255, 0, 0.02)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (hoverable) {
                    e.currentTarget.style.background =
                      striped && rowIndex % 2 === 1
                        ? 'rgba(156, 156, 156, 0.03)'
                        : 'transparent'
                  }
                }}
              >
                {columns.map((col) => {
                  const cellValue = row[col.key]
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: cellPadding,
                        borderBottom: '1px solid rgba(156, 156, 156, 0.08)',
                        textAlign: col.align || 'left',
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {col.render ? col.render(cellValue, row) : String(cellValue ?? '')}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
