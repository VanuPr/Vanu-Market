
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface Category {
    id: string;
    name: string;
    slug: string;
}

export interface FilterState {
    categories: string[]; // slugs
    maxPrice: number;
}

interface FilterSidebarProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    categories: Category[];
    maxPrice: number;
}

export function FilterSidebar({ filters, onFilterChange, categories, maxPrice }: FilterSidebarProps) {
    
    const handleCategoryChange = (categorySlug: string) => {
        const newCategories = filters.categories.includes(categorySlug)
            ? filters.categories.filter(c => c !== categorySlug)
            : [...filters.categories, categorySlug];
        onFilterChange({ ...filters, categories: newCategories });
    };

    const handlePriceChange = (value: number[]) => {
        onFilterChange({ ...filters, maxPrice: value[0] });
    };
    
    const clearFilters = () => {
        onFilterChange({ categories: [], maxPrice: maxPrice });
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Filters</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-4">Category</h3>
                    <div className="space-y-2">
                        {categories.map(category => (
                            <div key={category.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={category.slug} 
                                    checked={filters.categories.includes(category.slug)}
                                    onCheckedChange={() => handleCategoryChange(category.slug)}
                                />
                                <Label htmlFor={category.slug} className="font-normal cursor-pointer">{category.name}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-4">Price</h3>
                    <Slider 
                        min={0}
                        max={maxPrice}
                        step={10}
                        value={[filters.maxPrice]}
                        onValueChange={handlePriceChange}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                        <span>₹0</span>
                        <span>₹{filters.maxPrice}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
