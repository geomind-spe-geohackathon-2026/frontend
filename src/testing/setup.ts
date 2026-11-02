import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { createHandlers } from "@/mocks/handlers";
import { session } from "@/shared/api/session";
import { server } from "./server";

const noop = (): undefined => undefined;

class ResizeObserverStub {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
  window.ResizeObserver = ResizeObserverStub;
  window.HTMLElement.prototype.scrollIntoView = () => undefined;
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.releasePointerCapture = () => undefined;
});

beforeEach(() => {
  server.use(...createHandlers());
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  session.clear();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

afterAll(() => {
  server.close();
});
