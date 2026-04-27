"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { ClothingItem } from "@/types";

interface GuestOutfit {
  name: string;
  items: ClothingItem[];
  item_ids: string[];
  reasoning: string;
  styling_tips: string;
  occasion: string;
}

interface GuestContextValue {
  isGuest: boolean;
  isLoading: boolean;
  guestItems: ClothingItem[];
  guestOutfits: GuestOutfit[];
  guestGenerationCount: number;
  addGuestItem: (item: ClothingItem) => void;
  removeGuestItem: (id: string) => void;
  addGuestOutfit: (outfit: GuestOutfit) => void;
  incrementGuestGeneration: () => void;
  clearGuestData: () => void;
}

const GuestContext = createContext<GuestContextValue | null>(null);

const STORAGE_KEYS = {
  items: "armoire_guest_items",
  outfits: "armoire_guest_outfits",
  generations: "armoire_guest_generations",
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function GuestProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [guestItems, setGuestItems] = useState<ClothingItem[]>([]);
  const [guestOutfits, setGuestOutfits] = useState<GuestOutfit[]>([]);
  const [guestGenerationCount, setGuestGenerationCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsGuest(!user);
      if (!user) {
        setGuestItems(loadFromStorage(STORAGE_KEYS.items, []));
        setGuestOutfits(loadFromStorage(STORAGE_KEYS.outfits, []));
        setGuestGenerationCount(loadFromStorage(STORAGE_KEYS.generations, 0));
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsGuest(!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const addGuestItem = useCallback((item: ClothingItem) => {
    setGuestItems((prev) => {
      const next = [...prev, item];
      localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeGuestItem = useCallback((id: string) => {
    setGuestItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(next));
      return next;
    });
  }, []);

  const addGuestOutfit = useCallback((outfit: GuestOutfit) => {
    setGuestOutfits((prev) => {
      const next = [...prev, outfit];
      localStorage.setItem(STORAGE_KEYS.outfits, JSON.stringify(next));
      return next;
    });
  }, []);

  const incrementGuestGeneration = useCallback(() => {
    setGuestGenerationCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(STORAGE_KEYS.generations, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearGuestData = useCallback(() => {
    setGuestItems([]);
    setGuestOutfits([]);
    setGuestGenerationCount(0);
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }, []);

  return (
    <GuestContext.Provider
      value={{
        isGuest,
        isLoading,
        guestItems,
        guestOutfits,
        guestGenerationCount,
        addGuestItem,
        removeGuestItem,
        addGuestOutfit,
        incrementGuestGeneration,
        clearGuestData,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuest must be used within GuestProvider");
  return ctx;
}
