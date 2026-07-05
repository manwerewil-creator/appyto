"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches runtime failures from the WebGL scene (lost context, driver crash,
 * or anything else three.js/R3F can throw after mount) so a GL failure
 * degrades to `fallback` instead of crashing the whole page. Paired with an
 * upfront `supportsWebGL()` check in page.tsx for devices that can't create a
 * WebGL context at all (no GPU passthrough — common on VMs/locked-down
 * machines) — this boundary is the safety net for everything that check
 * can't predict in advance.
 */
export class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Hero 3D scene failed, showing fallback background instead:", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
