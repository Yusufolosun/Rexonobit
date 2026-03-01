// Type shims for legacy Deno-based Clarinet v1 test imports.
// These declarations silence "Cannot find module" errors for URL-style imports
// that are only resolvable in a Deno runtime environment.

declare module "https://deno.land/x/clarinet@v1.7.1/index.ts" {
  export const Clarinet: any;
  export const Tx: any;
  export const Chain: any;
  export const Account: any;
  export const types: any;
}

declare module "https://deno.land/std@0.200.0/testing/asserts.ts" {
  export function assertEquals(actual: unknown, expected: unknown, msg?: string): void;
  export function assertNotEquals(actual: unknown, expected: unknown, msg?: string): void;
  export function assertThrows(fn: () => void, msg?: string): void;
}
