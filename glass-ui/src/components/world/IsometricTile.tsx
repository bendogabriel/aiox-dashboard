import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

// Default tile dimensions (can be overridden)
export const DEFAULT_TILE_WIDTH = 100;
export const DEFAULT_TILE_HEIGHT = 50;

export interface IsometricTileProps {
  /** Grid column */
  col: number;
  /** Grid row */
  row: number;
  /** Fill color */
  color: string;
  /** Border/stroke color */
  borderColor?: string;
  /** Is this tile highlighted / hovered */
  highlighted?: boolean;
  /** Glow pulse animation (for active rooms) */
  pulse?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Children rendered inside the tile */
  children?: React.ReactNode;
  /** Extra className */
  className?: string;
  /** Pixel offset for centering the world */
  offsetX?: number;
  offsetY?: number;
  /** Tile dimensions */
  tileWidth?: number;
  tileHeight?: number;
}

/**
 * Renders a single isometric diamond tile at a grid position.
 * Uses CSS transform for the isometric perspective.
 */
export function IsometricTile({
  col,
  row,
  color,
  borderColor,
  highlighted,
  pulse,
  onClick,
  children,
  className,
  offsetX = 0,
  offsetY = 0,
  tileWidth = DEFAULT_TILE_WIDTH,
  tileHeight = DEFAULT_TILE_HEIGHT,
}: IsometricTileProps) {
  // Convert grid position to pixel position (isometric projection)
  const px = (col - row) * (tileWidth / 2) + offsetX;
  const py = (col + row) * (tileHeight / 2) + offsetY;

  return (
    <motion.div
      className={cn(
        'absolute flex items-center justify-center',
        onClick && 'cursor-pointer',
        className,
      )}
      style={{
        left: px,
        top: py,
        width: tileWidth,
        height: tileHeight,
      }}
      whileHover={onClick ? { scale: 1.08, zIndex: 10 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
    >
      {/* Diamond shape via SVG */}
      <svg
        viewBox={`0 0 ${tileWidth} ${tileHeight}`}
        className="absolute inset-0 w-full h-full"
      >
        <polygon
          points={`${tileWidth / 2},0 ${tileWidth},${tileHeight / 2} ${tileWidth / 2},${tileHeight} 0,${tileHeight / 2}`}
          fill={color}
          stroke={borderColor || color}
          strokeWidth="1.5"
          opacity={highlighted ? 1 : 0.85}
        />
        {pulse && (
          <polygon
            points={`${tileWidth / 2},0 ${tileWidth},${tileHeight / 2} ${tileWidth / 2},${tileHeight} 0,${tileHeight / 2}`}
            fill={color}
            opacity={0.4}
          >
            <animate
              attributeName="opacity"
              values="0.4;0.1;0.4"
              dur="2s"
              repeatCount="indefinite"
            />
          </polygon>
        )}
      </svg>

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
        {children}
      </div>
    </motion.div>
  );
}

/**
 * Helper to create an isometric grid
 */
export function createIsometricGrid(
  rows: number,
  cols: number,
  options?: {
    tileWidth?: number;
    tileHeight?: number;
    centerX?: number;
    centerY?: number;
  }
) {
  const tileWidth = options?.tileWidth ?? DEFAULT_TILE_WIDTH;
  const tileHeight = options?.tileHeight ?? DEFAULT_TILE_HEIGHT;

  // Calculate offset to center the grid
  const gridWidth = (rows + cols) * (tileWidth / 2);
  const gridHeight = (rows + cols) * (tileHeight / 2);

  const offsetX = options?.centerX ?? gridWidth / 2;
  const offsetY = options?.centerY ?? 0;

  const tiles: Array<{ col: number; row: number; offsetX: number; offsetY: number }> = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tiles.push({ col, row, offsetX, offsetY });
    }
  }

  return { tiles, gridWidth, gridHeight, offsetX, offsetY };
}
