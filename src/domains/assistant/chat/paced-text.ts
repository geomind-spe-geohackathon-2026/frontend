import { useEffect, useRef, useState } from "react";

const tickMs = { least: 50, most: 200 };
const charsPerTickStep = 50;
const speed = { calm: 45, brisk: 240 };
const catchUpSeconds = 2;
const longestCatchUpSeconds = 6;
const longestWord = 40;
const space = /\s/;

function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff;
}

/** The characters per second to show: calm when text keeps up, faster when it piles up, so the reader is never far behind. */
export function toSpeed(backlog: number): number {
  const fastest = Math.max(speed.brisk, backlog / longestCatchUpSeconds);
  return Math.min(Math.max(backlog / catchUpSeconds, speed.calm), fastest);
}

/** The pause between updates: longer for long text, where each Markdown render costs more. */
export function toTickMs(length: number): number {
  return Math.min(Math.max(length / charsPerTickStep, tickMs.least), tickMs.most);
}

/** Moves a cut to the end of its word; with text still coming, a word without its end waits. */
export function toWordEnd(text: string, cut: number, shown: number, open: boolean): number {
  if (cut >= text.length) {
    if (!open) return text.length;
    for (let index = text.length - 1; index >= shown; index -= 1) {
      if (space.test(text.charAt(index))) return index + 1;
    }
    return text.length - shown > longestWord ? text.length : shown;
  }
  const limit = Math.min(cut + longestWord, text.length);
  for (let index = cut; index < limit; index += 1) {
    if (space.test(text.charAt(index))) return index + 1;
  }
  if (limit === text.length && !open) return text.length;
  return isLowSurrogate(text.charCodeAt(cut)) ? cut + 1 : cut;
}

function isMotionOff(): boolean {
  return document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Shows growing text word by word at a natural pace, re-rendering only its own reader; `settled` characters show at once. */
export function usePacedText(text: string, settled: number, open: boolean): string {
  const [shown, setShown] = useState(Math.min(settled, text.length));
  const latest = useRef({ text, open, shown });
  useEffect(() => {
    latest.current = { text, open, shown };
  }, [text, open, shown]);
  const start = Math.min(Math.max(shown, settled), text.length);
  const pending = start < text.length;
  const delay = toTickMs(text.length);
  useEffect(() => {
    if (!pending) return;
    let before = performance.now();
    let credit = 0;
    const timer = setInterval(() => {
      const current = latest.current;
      const now = performance.now();
      const from = Math.min(Math.max(current.shown, settled), current.text.length);
      if (isMotionOff()) {
        current.shown = current.text.length;
        setShown(current.shown);
        return;
      }
      credit += (toSpeed(current.text.length - from) * (now - before)) / 1000;
      before = now;
      const whole = Math.floor(credit);
      if (whole === 0) return;
      const next = toWordEnd(current.text, from + whole, from, current.open);
      if (next === from) return;
      credit = 0;
      current.shown = next;
      setShown(next);
    }, delay);
    return () => {
      clearInterval(timer);
    };
  }, [pending, delay, settled]);
  return isMotionOff() ? text : text.slice(0, start);
}
