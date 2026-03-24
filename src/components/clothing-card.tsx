"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClothingItem } from "@/types";

interface ClothingCardProps {
  item: ClothingItem;
  onDelete?: (id: string) => void;
}

export function ClothingCard({ item, onDelete }: ClothingCardProps) {
  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-square bg-muted">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        {onDelete && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm truncate">{item.name}</h3>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <Badge variant="secondary" className="text-xs capitalize">
            {item.category}
          </Badge>
          {item.color && (
            <Badge variant="outline" className="text-xs capitalize">
              {item.color}
            </Badge>
          )}
          {item.season && item.season !== "all" && (
            <Badge variant="outline" className="text-xs capitalize">
              {item.season}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
