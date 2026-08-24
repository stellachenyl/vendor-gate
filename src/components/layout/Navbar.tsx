"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { useRole } from "@/lib/role-context";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/inspections", label: "Inspections" },
  { href: "/ncrs", label: "NCRs" },
  { href: "/documents", label: "Documents" },
  { href: "/audits", label: "Audits" },
  { href: "/reports", label: "Reports" },
];

function RoleMenu() {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const roles: UserRole[] = ["Quality Manager", "Supplier User"];
  const initials = role === "Quality Manager" ? "QM" : "SU";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md border border-line bg-white px-2 py-1.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
        >
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-semibold leading-tight text-slate-800">
            {role === "Quality Manager" ? "D. Reyes" : "Cascade Polymer"}
          </span>
          <span className="block text-[10px] leading-tight text-slate-500">{role}</span>
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Switch role"
          className="absolute right-0 z-40 mt-1 w-56 rounded-md border border-line bg-white py-1 shadow-card"
        >
          <p className="px-3 py-1.5 text-xs font-medium text-slate-400">View portal as</p>
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              role="menuitemradio"
              aria-checked={r === role}
              onClick={() => {
                setRole(r);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent-soft",
                r === role ? "font-semibold text-accent" : "text-slate-700",
              )}
            >
              {r}
              {r === role ? <span aria-hidden>✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/suppliers?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <svg viewBox="0 0 64 64" aria-hidden className="h-8 w-8">
            <rect width="64" height="64" rx="12" fill="#1D4ED8" />
            <path
              d="M32 12l16 6v12c0 11-7 19-16 22-9-3-16-11-16-22V18l16-6z"
              fill="#F8FAFC"
            />
            <path
              d="M25 31.5l5 5 9.5-9.5"
              stroke="#10B981"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            Totalonics <span className="text-accent">Quality</span>
          </span>
        </Link>

        {/* Primary nav */}
        <nav
          aria-label="Primary"
          className="order-3 flex w-full gap-0.5 overflow-x-auto md:order-none md:w-auto"
        >
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Search + actions */}
        <div className="ml-auto flex items-center gap-2">
          <form role="search" onSubmit={handleSearch} className="w-48 lg:w-64">
            <Input
              type="search"
              placeholder="Supplier or part no…"
              aria-label="Search supplier name or part number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
          <Button onClick={() => router.push("/ncrs/new")}>+ New NCR</Button>
          <RoleMenu />
        </div>
      </div>
    </header>
  );
}
