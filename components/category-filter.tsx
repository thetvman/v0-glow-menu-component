"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Category {
  category_id: string
  category_name: string
  parent_id: number
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onCategoryChange: (categoryId: string | null) => void
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-4">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(null)}
          className={cn(
            "rounded-full transition-all duration-300",
            selectedCategory === null && "shadow-lg shadow-primary/50",
          )}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.category_id}
            variant={selectedCategory === category.category_id ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category.category_id)}
            className={cn(
              "rounded-full transition-all duration-300",
              selectedCategory === category.category_id && "shadow-lg shadow-primary/50",
            )}
          >
            {category.category_name}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
