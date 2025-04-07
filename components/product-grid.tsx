"use client"

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { ProductCard } from "@/components/product-card"

type Product = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  startingBid: number;
  currentBid: number;
  price: number;
  category: string;
  sellerId: string;
  createdAt: any; // Use appropriate type for Timestamp
  status: "active" | "sold";
};

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "listings"));
      const productsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          longDescription: data.longDescription,
          startingBid: data.startingBid,
          currentBid: data.currentBid,
          price: data.price,
          category: data.category,
          sellerId: data.sellerId,
          createdAt: data.createdAt,
          status: data.status,
        };
      });
      setProducts(productsData);
    };

    fetchProducts();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

