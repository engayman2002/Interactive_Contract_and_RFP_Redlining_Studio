export interface PlaywrightLocator {
  click: () => Promise<void>;
  hover: () => Promise<void>;
  fill: (value: string) => Promise<void>;
  getAttribute: (name: string) => Promise<string | null>;
  textContent: () => Promise<string | null>;
}

export interface PlaywrightPage {
  goto: (url: string) => Promise<void>;
  getByTestId: (testId: string) => PlaywrightLocator;
}

export interface PlaywrightConfig {
  testDir: string;
  timeout: number;
  fullyParallel: boolean;
  retries: number;
  use: {
    baseURL: string;
    trace: "on-first-retry" | "off" | "on";
    headless: boolean;
  };
  webServer?: {
    command: string;
    url: string;
    reuseExistingServer: boolean;
  };
}

export function defineConfig(config: PlaywrightConfig): PlaywrightConfig {
  return config;
}

export function test(
  _name: string,
  _fn: (context: { page: PlaywrightPage }) => Promise<void>
): void {
  // Registered by Playwright runner at execution time
}

export function expect(actual: unknown): {
  toBe: (expected: unknown) => void;
  toContain: (substring: string) => void;
} {
  return {
    toBe: (expected: unknown) => {
      if (actual !== expected) {
        throw new Error(`Expected ${String(actual)} to be ${String(expected)}`);
      }
    },
    toContain: (substring: string) => {
      if (typeof actual !== "string" || !actual.includes(substring)) {
        throw new Error(
          `Expected ${String(actual)} to contain ${String(substring)}`
        );
      }
    },
  };
}

