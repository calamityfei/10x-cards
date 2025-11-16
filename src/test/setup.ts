import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import "@testing-library/jest-dom/vitest";

expect.extend(matchers);

vi.spyOn(console, "error").mockImplementation(() => undefined);

afterEach(() => {
  cleanup();
});
