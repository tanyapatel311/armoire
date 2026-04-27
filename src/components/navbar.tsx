"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, User, Sparkles, Shirt, CalendarDays, Layers, LayoutDashboard } from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";

const allNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, guestVisible: true },
  { href: "/closet", label: "My Closet", icon: Shirt, guestVisible: true },
  { href: "/generate", label: "Generate", icon: Sparkles, guestVisible: true },
  { href: "/outfits", label: "Outfits", icon: Layers, guestVisible: true },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, guestVisible: false },
];

export function Navbar() {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const isOnAppPage = allNavLinks.some((l) => pathname.startsWith(l.href));
  const isGuest = !user && isOnAppPage;

  const visibleLinks = useMemo(
    () => (user ? allNavLinks : allNavLinks.filter((l) => l.guestVisible)),
    [user]
  );

  return (
    <nav className="sticky top-0 z-50 bg-burgundy text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
              <Image src="/logo-v2.png" alt="Armoire" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="font-heading text-xl font-bold tracking-wide text-white">Armoire</span>
            </Link>

            {(user || isGuest) && (
              <div className="hidden md:flex items-center gap-1">
                {visibleLinks.map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <Link key={link.href} href={link.href}>
                      <button
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "text-white/60 hover:text-white hover:bg-white/8"
                        }`}
                      >
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </button>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="relative h-9 w-9 rounded-full cursor-pointer focus:outline-none"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gold/20 text-gold text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer"
                      onClick={() => router.push("/closet")}
                    >
                      <User className="h-4 w-4" />
                      My Closet
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="gap-2 text-destructive cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-white/10 cursor-pointer text-white">
                    <Menu className="h-5 w-5" />
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64 bg-burgundy border-burgundy-light/30">
                    <div className="flex flex-col gap-2 mt-8">
                      {visibleLinks.map((link) => {
                        const isActive = pathname.startsWith(link.href);
                        return (
                          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                            <button
                              className={`w-full flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                                isActive
                                  ? "bg-white/15 text-white"
                                  : "text-white/60 hover:text-white hover:bg-white/8"
                              }`}
                            >
                              <link.icon className="h-4 w-4" />
                              {link.label}
                            </button>
                          </Link>
                        );
                      })}
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {isGuest && (
                  <span className="hidden sm:inline text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full mr-1">
                    Guest
                  </span>
                )}
                <Link href="/login">
                  <button className="text-sm text-white/80 hover:text-white px-3 py-1.5 transition-all duration-300">
                    Sign In
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="hidden sm:inline text-sm bg-brand hover:bg-brand-light text-white px-5 py-1.5 rounded-full font-medium transition-all duration-300 shadow-sm">
                    Get Started
                  </button>
                </Link>

                {isGuest && (
                  <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-white/10 cursor-pointer text-white">
                      <Menu className="h-5 w-5" />
                    </SheetTrigger>
                    <SheetContent side="right" className="w-64 bg-burgundy border-burgundy-light/30">
                      <div className="flex flex-col gap-2 mt-8">
                        {visibleLinks.map((link) => {
                          const isActive = pathname.startsWith(link.href);
                          return (
                            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                              <button
                                className={`w-full flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                                  isActive
                                    ? "bg-white/15 text-white"
                                    : "text-white/60 hover:text-white hover:bg-white/8"
                                }`}
                              >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                              </button>
                            </Link>
                          );
                        })}
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
