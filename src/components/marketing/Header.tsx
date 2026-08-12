"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import BrandMark from "./BrandMark";

const NAV_LINKS = [
  { href: "/signals", label: "What it finds" },
  { href: "/how", label: "How it works" },
  { href: "/deliverables", label: "Deliverables" },
  { href: "/pricing", label: "Pricing" },
];

const DRAWER_LINKS = [
  ...NAV_LINKS,
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header>
      <nav className="nav">
        <Link className="brand" href="/" aria-label="AeroMind AI home">
          <BrandMark />
          <span>aeromind</span>
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              className={`link${pathname === link.href ? " active" : ""}`}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <Link className="btn btn-primary" href={isAuthenticated ? "/app" : "/signup"}>
          {isAuthenticated ? "Go to dashboard" : "Get started"}
        </Link>
        <button
          className="menu-btn"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
        </button>
      </nav>
      <div className={`drawer${open ? " open" : ""}`}>
        {DRAWER_LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
        <Link href={isAuthenticated ? "/app" : "/signin"} onClick={() => setOpen(false)}>
          {isAuthenticated ? "Go to dashboard" : "Sign in"}
        </Link>
      </div>
    </header>
  );
}
