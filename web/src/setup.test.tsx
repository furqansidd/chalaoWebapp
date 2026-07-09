// @vitest-environment jsdom
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

test("JSDOM works with React testing library", () => {
  render(React.createElement("h1", null, "Hello from Test"));
  expect(screen.getByText("Hello from Test")).toBeDefined();
});
