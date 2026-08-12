"use client";

import { useEffect, useState } from "react";

const QUESTIONS = [
  "Which customers are spending less than they were?",
  "What is actually driving growth this quarter?",
  "Which region is underperforming, and by how much?",
  "Where is my revenue most exposed right now?",
  "Which products deserve more of the team's time?",
];

export default function AskLine() {
  const [text, setText] = useState(QUESTIONS[0]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setText(QUESTIONS[0]);
      return;
    }
    let qi = 0;
    let ci = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const q = QUESTIONS[qi];
      ci = deleting ? ci - 1 : ci + 1;
      setText(q.slice(0, ci));
      let wait = deleting ? 22 : 42;
      if (!deleting && ci === q.length) {
        deleting = true;
        wait = 2100;
      } else if (deleting && ci === 0) {
        deleting = false;
        qi = (qi + 1) % QUESTIONS.length;
        wait = 320;
      }
      timer = setTimeout(tick, wait);
    }
    timer = setTimeout(tick, 42);
    return () => clearTimeout(timer);
  }, []);

  return <span className="ask-q">{text}</span>;
}
