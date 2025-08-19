
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, GalleryHorizontal } from "lucide-react";
import Link from 'next/link';

export default function AdminDashboard() {

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your website's content from here.</p>
      </div>
       <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShoppingBag /> Product Management</CardTitle>
            <CardDescription>Add, edit, and manage all the products available in your store. Mark products as 'featured' to show them on the homepage.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/admin/products" passHref>
                <Button>
                    Manage Products <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GalleryHorizontal/> Slideshow Management</CardTitle>
            <CardDescription>Control the images that appear in the full-screen hero slideshow on your homepage. Add or remove slides as needed.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/admin/slideshow" passHref>
                <Button>
                    Manage Slideshow <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
