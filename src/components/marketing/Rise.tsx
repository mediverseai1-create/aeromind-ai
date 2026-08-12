"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type RiseProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

/**
 * Reimplements the original site's IntersectionObserver-based ".rise" scroll
 * reveal as a React component instead of a global querySelectorAll pass.
 */
export default function Rise<T extends ElementType = "div">({
  as,
  children,
  className = "",
  ...rest
}: RiseProps<T>) {
  const Tag = (as || "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`rise ${visible ? "in" : ""} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
