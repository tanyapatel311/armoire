"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
import { Menu, LogOut, User, Sparkles, Shirt, CalendarDays, Layers } from "lucide-react";
import type { User as SupaUser } from "@supabase/supabase-js";

const navLinks = [
  { href: "/closet", label: "My Closet", icon: Shirt },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/outfits", label: "Outfits", icon: Layers },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
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

  return (
    <nav className="sticky top-0 z-50 bg-burgundy text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={user ? "/closet" : "/"} className="flex items-center gap-2">
              <Image src="/logo-v2.png" alt="Armoire" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold tracking-tight text-white">Armoire</span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  return (
                    <Link key={link.href} href={link.href}>
                      <button
                        className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
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
                      <AvatarFallback className="bg-blush text-burgundy text-sm font-medium">
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
                  <SheetContent side="right" className="w-64">
                    <div className="flex flex-col gap-2 mt-8">
                      {navLinks.map((link) => {
                        const isActive = pathname.startsWith(link.href);
                        return (
                          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              className="w-full justify-start gap-2"
                            >
                              <link.icon className="h-4 w-4" />
                              {link.label}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <button className="text-sm text-white/80 hover:text-white px-3 py-1.5 transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="text-sm bg-brand hover:bg-brand-light text-white px-4 py-1.5 rounded-md font-medium transition-colors">
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
