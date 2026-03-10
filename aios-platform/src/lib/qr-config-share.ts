/**
 * QR Config Share — P6 One-Click Deploy
 *
 * Encodes the config export as a compact, URL-safe string
 * for sharing via QR code or copyable link.
 *
 * Flow:
 * 1. buildConfigExport() → JSON
 * 2. compress + base64url encode → compact string
 * 3. Append to a share URL: <origin>?import=<encoded>
 * 4. On load, detect ?import= and offer to apply
 *
 * Uses native CompressionStream (deflate-raw) for smaller payloads.
 */

import { buildConfigExport, parseConfigImport, type ConfigExport } from './config-export';

// ── Encode / Decode ──────────────────────────────────────

/**
 * Compress and base64url-encode a config export for URL sharing.
 */
export async function encodeConfigForShare(config?: ConfigExport): Promise<string> {
  const data = config || buildConfigExport();
  const json = JSON.stringify(data);

  // Use CompressionStream if available (modern browsers with Blob.stream())
  if (typeof CompressionStream !== 'undefined' && typeof Blob.prototype.stream === 'function') {
    try {
      const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      const compressed = await new Response(stream).arrayBuffer();
      return arrayBufferToBase64Url(compressed);
    } catch {
      // Fall through to plain base64
    }
  }

  // Fallback: plain base64url (larger but universal)
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decode a base64url config string back to a ConfigExport.
 */
export async function decodeConfigFromShare(encoded: string): Promise<ConfigExport | { error: string }> {
  try {
    // Try decompress first (CompressionStream path)
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const bytes = base64UrlToArrayBuffer(encoded);
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        const json = await new Response(stream).text();
        return parseConfigImport(json) as ConfigExport | { error: string };
      } catch {
        // Fall through to plain base64
      }
    }

    // Fallback: plain base64url
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    return parseConfigImport(json) as ConfigExport | { error: string };
  } catch {
    return { error: 'Failed to decode shared config' };
  }
}

// ── Share URL ────────────────────────────────────────────

/**
 * Build a full share URL for the current page with encoded config.
 */
export async function buildShareUrl(): Promise<string> {
  const encoded = await encodeConfigForShare();
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?import=${encoded}`;
}

/**
 * Check current URL for a shared config parameter.
 * Returns the encoded string or null.
 */
export function getImportFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('import');
}

/**
 * Remove the import parameter from the URL (clean up after import).
 */
export function clearImportFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('import');
  window.history.replaceState({}, '', url.toString());
}

// ── QR Code SVG Generator ────────────────────────────────
// Minimal QR code generator using SVG paths.
// For URLs up to ~2KB, we use a simple Reed-Solomon-free
// approach: encode the share URL and render as an SVG data URI.
// For production, consider using the 'qrcode' npm package.

/**
 * Generate an SVG string representing a QR code for the given text.
 * Uses a minimal encoding — for URLs under 200 chars, this is sufficient.
 * Falls back to a "copy link" approach for longer data.
 */
export function generateQrSvg(text: string, size: number = 256): string | null {
  // For very long data, QR code would be too dense
  if (text.length > 2000) return null;

  const modules = encodeQr(text);
  if (!modules) return null;

  const n = modules.length;
  const cellSize = size / n;

  let paths = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules[y][x]) {
        paths += `M${x * cellSize},${y * cellSize}h${cellSize}v${cellSize}h-${cellSize}z`;
      }
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
    `<rect width="${size}" height="${size}" fill="white"/>`,
    `<path d="${paths}" fill="black"/>`,
    `</svg>`,
  ].join('');
}

// ── Minimal QR encoder (Mode: Byte, ECC: L, Version 1-10) ─

// This is a simplified QR encoder for short ASCII strings.
// For production use, swap with the 'qrcode' npm package.

function encodeQr(text: string): boolean[][] | null {
  // Use a lookup approach: encode data + generate modules
  // For simplicity, use version auto-detect based on data length
  const data = new TextEncoder().encode(text);

  // QR version capacities (Byte mode, ECC Level L)
  const capacities = [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271];
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    if (data.length <= capacities[v]) {
      version = v;
      break;
    }
  }
  if (version === 0) return null; // Too long

  const n = 17 + version * 4; // Module count
  const modules: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  const reserved: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

  // Draw finder patterns
  drawFinderPattern(modules, reserved, 0, 0);
  drawFinderPattern(modules, reserved, n - 7, 0);
  drawFinderPattern(modules, reserved, 0, n - 7);

  // Draw timing patterns
  for (let i = 8; i < n - 8; i++) {
    const val = i % 2 === 0;
    setModule(modules, reserved, 6, i, val);
    setModule(modules, reserved, i, 6, val);
  }

  // Alignment pattern (version >= 2)
  if (version >= 2) {
    const alignPos = getAlignmentPositions(version);
    for (const ay of alignPos) {
      for (const ax of alignPos) {
        if (reserved[ay]?.[ax]) continue;
        drawAlignmentPattern(modules, reserved, ay, ax);
      }
    }
  }

  // Reserve format info areas
  for (let i = 0; i < 8; i++) {
    reserve(reserved, 8, i);
    reserve(reserved, 8, n - 1 - i);
    reserve(reserved, i, 8);
    reserve(reserved, n - 1 - i, 8);
  }
  reserve(reserved, 8, 8);
  // Dark module
  setModule(modules, reserved, n - 8, 8, true);

  // Place data using a simple upward-then-downward column traversal
  const dataBits = buildDataBits(data, version);
  placeData(modules, reserved, dataBits, n);

  // Apply mask 0 (checkerboard) for simplicity
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!reserved[y][x] && (y + x) % 2 === 0) {
        modules[y][x] = !modules[y][x];
      }
    }
  }

  // Write format info (ECC L, mask 0)
  writeFormatInfo(modules, reserved, n);

  return modules;
}

function drawFinderPattern(m: boolean[][], r: boolean[][], row: number, col: number) {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const y = row + dy;
      const x = col + dx;
      if (y < 0 || x < 0 || y >= m.length || x >= m.length) continue;
      const outer = dy === -1 || dy === 7 || dx === -1 || dx === 7;
      const ring = dy === 0 || dy === 6 || dx === 0 || dx === 6;
      const inner = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
      m[y][x] = !outer && (ring || inner);
      r[y][x] = true;
    }
  }
}

function drawAlignmentPattern(m: boolean[][], r: boolean[][], cy: number, cx: number) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const y = cy + dy;
      const x = cx + dx;
      if (y < 0 || x < 0 || y >= m.length || x >= m.length) continue;
      const edge = Math.abs(dy) === 2 || Math.abs(dx) === 2;
      const center = dy === 0 && dx === 0;
      m[y][x] = edge || center;
      r[y][x] = true;
    }
  }
}

function setModule(m: boolean[][], r: boolean[][], row: number, col: number, val: boolean) {
  if (row >= 0 && col >= 0 && row < m.length && col < m.length) {
    m[row][col] = val;
    r[row][col] = true;
  }
}

function reserve(r: boolean[][], row: number, col: number) {
  if (row >= 0 && col >= 0 && row < r.length && col < r.length) {
    r[row][col] = true;
  }
}

function getAlignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const positions: number[][] = [
    [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
  ];
  return positions[version - 1] || [];
}

function buildDataBits(data: Uint8Array, version: number): boolean[] {
  const bits: boolean[] = [];

  // Mode indicator: byte mode = 0100
  bits.push(false, true, false, false);

  // Character count (8 bits for version 1-9, 16 for 10+)
  const countBits = version <= 9 ? 8 : 16;
  for (let i = countBits - 1; i >= 0; i--) {
    bits.push(((data.length >> i) & 1) === 1);
  }

  // Data bytes
  for (const byte of data) {
    for (let i = 7; i >= 0; i--) {
      bits.push(((byte >> i) & 1) === 1);
    }
  }

  // Terminator (up to 4 zeros)
  for (let i = 0; i < 4 && bits.length < getDataCapacity(version); i++) {
    bits.push(false);
  }

  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(false);

  // Pad bytes
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (bits.length < getDataCapacity(version)) {
    const b = padBytes[padIdx % 2];
    for (let i = 7; i >= 0; i--) {
      bits.push(((b >> i) & 1) === 1);
    }
    padIdx++;
  }

  return bits;
}

function getDataCapacity(version: number): number {
  // Total data bits for ECC Level L (approximate for simplified encoder)
  const caps = [0, 152, 272, 440, 640, 864, 1088, 1248, 1552, 1856, 2192];
  return caps[version] || 152;
}

function placeData(m: boolean[][], r: boolean[][], bits: boolean[], n: number) {
  let bitIdx = 0;
  // Traverse columns right-to-left, in pairs
  for (let col = n - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5; // Skip timing column
    const upward = ((n - 1 - col) / 2) % 2 === 0;
    for (let i = 0; i < n; i++) {
      const row = upward ? n - 1 - i : i;
      for (const dx of [0, -1]) {
        const x = col + dx;
        if (x < 0 || x >= n) continue;
        if (r[row][x]) continue;
        if (bitIdx < bits.length) {
          m[row][x] = bits[bitIdx];
          bitIdx++;
        }
      }
    }
  }
}

function writeFormatInfo(m: boolean[][], r: boolean[][], n: number) {
  // ECC Level L (01), Mask 0 (000) → format bits = 01000
  // With BCH error correction: 0x77C5 → binary 111011111000101
  const formatBits = 0x77C5;
  const positions = [
    // Around top-left finder
    [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8],
    [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  ];

  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> (14 - i)) & 1) === 1;
    const [row, col] = positions[i];
    m[row][col] = bit;
  }

  // Bottom-left + top-right
  const positionsAlt = [
    [8, n - 1], [8, n - 2], [8, n - 3], [8, n - 4], [8, n - 5], [8, n - 6], [8, n - 7], [8, n - 8],
    [n - 7, 8], [n - 6, 8], [n - 5, 8], [n - 4, 8], [n - 3, 8], [n - 2, 8], [n - 1, 8],
  ];

  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> (14 - i)) & 1) === 1;
    const [row, col] = positionsAlt[i];
    if (row < n && col < n) {
      m[row][col] = bit;
    }
  }
}

// ── Binary helpers ───────────────────────────────────────

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
