"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandMark from "@/components/marketing/BrandMark";
import { signOutAction } from "@/app/actions/auth";

const LINKS = [
  { href: "/app", label: "Dashboard", exact: true },
  { href: "/app/upload", label: "Upload data" },
  { href: "/app/follow-ups", label: "Follow-Up AI" },
  { href: "/app/history", label: "History" },
  { href: "/app/ask", label: "Ask AeroMind" },
  { href: "/app/settings", label: "Settings" },
];

export default function AppSidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      <Link
        className="brand"
        href="/"
        aria-label="AeroMind AI home"
        style={{ padding: "6px 14px 18px" }}
      >
        <BrandMark />
        <span>aeromind</span>
      </Link>
      <p
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "var(--mute)",
          padding: "0 14px 10px",
        }}
      >
        {orgName}
      </p>
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} className={active ? "active" : ""}>
            {link.label}
          </Link>
        );
      })}
      <form action={signOutAction} style={{ marginTop: "auto", paddingTop: 12 }}>
        <button type="submit" className="btn btn-ghost" style={{ width: "100%" }}>
          Sign out
        </button>
      </form>
    </aside>
  );
}
