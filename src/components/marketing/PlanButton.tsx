import Link from "next/link";

/**
 * Renders a real external payment link when one is configured via env vars,
 * otherwise a disabled "Coming soon" state. Never fakes a checkout.
 */
export default function PlanButton({
  href,
  variant = "ghost",
  children,
}: {
  href: string | undefined;
  variant?: "primary" | "ghost";
  children: React.ReactNode;
}) {
  const cls = `btn ${variant === "primary" ? "btn-primary" : "btn-ghost"}`;

  if (!href) {
    return (
      <span className={cls} aria-disabled="true" title="Payment link not configured yet">
        Coming soon
      </span>
    );
  }

  return (
    <Link className={cls} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </Link>
  );
}
