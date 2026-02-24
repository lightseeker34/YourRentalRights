import React from "react";
import { Components } from "react-markdown";

/**
 * Compact inline markdown components for timeline/sidebar previews.
 * Renders all block elements inline so content stays on a single line.
 */
export const compactMarkdownComponents: Components = {
  p: ({ children }) => <span className="inline">{children}</span>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <span className="font-bold">{children}</span>,
  h2: ({ children }) => <span className="font-bold">{children}</span>,
  h3: ({ children }) => <span className="font-semibold">{children}</span>,
};
