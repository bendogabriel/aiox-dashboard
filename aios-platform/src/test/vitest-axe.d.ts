/// <reference types="vitest-axe/extend-expect" />

import type { AxeResults } from 'axe-core';

declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
