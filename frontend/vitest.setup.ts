import "@testing-library/jest-dom/vitest";

// Polyfill Element.prototype.scrollIntoView for jsdom testing
if (typeof window !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoViewMock() {
    // no-op in jsdom
  };
}

