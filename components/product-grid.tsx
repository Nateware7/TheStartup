"use client"

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { ProductCard } from "@/components/product-card"

type Product = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  startingBid?: number;
  currentBid?: number;
  price: number;
  category: string;
  assetType?: string;
  sellerId: string;
  seller?: {
    id: string;
    name: string;
    handle?: string;
    avatar?: string;
    verified?: boolean;
    joinDate?: string;
    sales?: number;
    rating?: number;
  };
  createdAt: any; // Use appropriate type for Timestamp
  status: "active" | "sold";
};

interface ProductGridProps {
  filter?: string;
}

export function ProductGrid({ filter }: ProductGridProps = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Get all listings
        const querySnapshot = await getDocs(collection(db, "listings"));
        let productsData: Product[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "Untitled",
            description: data.description || "No description",
            longDescription: data.longDescription || "",
            startingBid: data.startingBid,
            currentBid: data.currentBid,
            price: data.price || 0,
            category: data.category || "Other",
            assetType: data.assetType || "username",
            sellerId: data.sellerId || "",
            createdAt: data.createdAt,
            status: data.status || "active",
          };
        });

        // Filter out non-active products
        productsData = productsData.filter(product => product.status === "active");
        
        // Get unique seller IDs
        const sellerIds = [...new Set(productsData.map(product => product.sellerId))].filter(id => id);
        
        // Fetch seller information for each unique seller
        const sellerData = new Map();
        
        for (const sellerId of sellerIds) {
          try {
            const sellerDoc = await getDoc(doc(db, "users", sellerId));
            if (sellerDoc.exists()) {
              const data = sellerDoc.data();
              sellerData.set(sellerId, {
                id: sellerId,
                name: data.username || data.displayName || "Anonymous",
                handle: data.handle || `@${(data.username || 'user').toLowerCase().replace(/\s+/g, '')}`,
                avatar: data.profilePicture || data.photoURL || "/placeholder.svg?height=200&width=200",
                verified: data.isVerified || false,
                joinDate: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : "Unknown",
                sales: data.sales || 0,
                rating: data.rating || 0,
              });
            }
          } catch (error) {
            console.error(`Error fetching seller ${sellerId}:`, error);
          }
        }
        
        // Add seller data to products
        productsData = productsData.map(product => ({
          ...product,
          seller: product.sellerId ? sellerData.get(product.sellerId) || {
            id: product.sellerId,
            name: "Anonymous",
            handle: "@user",
            avatar: "/placeholder.svg?height=200&width=200",
            verified: false
          } : undefined
        }));
        
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Apply filter when it changes
  useEffect(() => {
    if (!filter || filter === "All") {
      setFilteredProducts(products);
    } else {
      // Convert filter to correct format for comparison
      const assetTypeFilter = filter === "Usernames" ? "username" : filter === "Accounts" ? "account" : null;
      
      if (assetTypeFilter) {
        setFilteredProducts(products.filter(product => product.assetType === assetTypeFilter));
      } else {
        setFilteredProducts(products);
      }
    }
  }, [filter, products]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 h-[300px]"></div>
        ))}
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl text-zinc-300 mb-2">No Products Available</h3>
        <p className="text-zinc-500">Check back later for new listings{filter && filter !== "All" ? ` or try a different filter` : ''}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

