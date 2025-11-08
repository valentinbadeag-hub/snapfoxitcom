import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, DollarSign } from "lucide-react";

interface ProductData {
  productName: string;
  category: string;
  description: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  bestPrice: string;
  bestDealer: string;
  dealerDistance?: string;
  currency: string;
  userLocation?: {
    city: string;
    country: string;
  };
  reviewBreakdown: {
    quality: number;
    value: number;
    durability: number;
  };
  pros: string[];
  cons: string[];
  usageTips: string[];
  recommendation: string;
  nearbyStores?: Array<{
    name: string;
    price: string;
    distance: string;
  }>;
}

interface ScanHistoryItem {
  id: string;
  timestamp: number;
  productData: ProductData;
}

const ScanHistory = () => {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    const loadHistory = () => {
      const stored = localStorage.getItem('scanHistory');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Filter out invalid items (old format or corrupted data)
          const validItems = parsed.filter((item: any) => 
            item && 
            item.productData && 
            item.productData.productName
          );
          setHistory(validItems.slice(0, 6)); // Show last 6 scans
        } catch (error) {
          console.error('Error loading scan history:', error);
        }
      }
    };

    loadHistory();
    
    // Listen for new scans
    const handleStorageChange = () => loadHistory();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('scanComplete', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('scanComplete', handleStorageChange);
    };
  }, []);

  if (history.length === 0) {
    return null;
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleItemClick = (item: ScanHistoryItem) => {
    // Dispatch event with product data to show in ScanDemo
    window.dispatchEvent(new CustomEvent('showHistoryItem', { 
      detail: item.productData 
    }));
  };

  return (
    <section id="recent-scans" className="py-12 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-10">
            <h3 className="text-3xl font-bold text-foreground">
              Recent Scans ✨
            </h3>
            <p className="text-muted-foreground">
              Your latest product discoveries
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => {
              const { productData } = item;
              return (
                <Card 
                  key={item.id}
                  className="p-4 shadow-[var(--shadow-soft)] border border-primary/10 bg-card hover:shadow-[var(--shadow-float)] transition-all hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">
                          {productData.productName}
                        </h4>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {productData.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <span>⭐</span>
                        <span className="font-medium">{productData.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium text-primary">
                          {productData.bestPrice} {productData.currency}
                        </span>
                      </div>
                      
                      {productData.userLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">
                            {productData.userLocation.city}, {productData.userLocation.country}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimestamp(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScanHistory;
