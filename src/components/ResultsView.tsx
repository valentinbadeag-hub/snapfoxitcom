import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Star, Heart, Share2, TrendingDown, Lightbulb, MessageSquare, ExternalLink, Send, ChevronUp, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { User } from "@supabase/supabase-js";

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
  averagePrice?: string;
  dealLink?: string;
  priceHistory?: any;
  userLocation?: {
    city: string;
    country: string;
    countryCode?: string;
    language?: string;
    uule?: string;
    serpLocation?: string;
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
    link?: string;
  }>;
  isTranslated?: boolean;
}

interface ResultsViewProps {
  productData: ProductData;
  onBack: () => void;
}

// Helper function to generate contextually relevant example questions
const getExampleQuestion = (category: string): string => {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('grill') || categoryLower.includes('bbq') || categoryLower.includes('grătar')) {
    return 'e.g., What temperature is best for grilling steaks?';
  } else if (categoryLower.includes('wine') || categoryLower.includes('vin') || categoryLower.includes('beverage')) {
    return 'e.g., What foods pair well with this wine?';
  } else if (categoryLower.includes('beauty') || categoryLower.includes('skincare') || categoryLower.includes('cosmetic')) {
    return 'e.g., Is this suitable for sensitive skin?';
  } else if (categoryLower.includes('electronic') || categoryLower.includes('tech') || categoryLower.includes('device')) {
    return 'e.g., Is this compatible with my phone?';
  } else if (categoryLower.includes('food') || categoryLower.includes('snack') || categoryLower.includes('grocery')) {
    return 'e.g., What are the nutritional benefits?';
  } else if (categoryLower.includes('clothing') || categoryLower.includes('apparel') || categoryLower.includes('fashion')) {
    return 'e.g., How does this fit compared to other brands?';
  } else if (categoryLower.includes('book') || categoryLower.includes('reading')) {
    return 'e.g., What age group is this book suitable for?';
  } else if (categoryLower.includes('toy') || categoryLower.includes('game')) {
    return 'e.g., Is this safe for young children?';
  } else if (categoryLower.includes('kitchen') || categoryLower.includes('cookware')) {
    return 'e.g., Can this go in the dishwasher?';
  } else if (categoryLower.includes('furniture')) {
    return 'e.g., What are the dimensions of this item?';
  } else {
    return 'e.g., How do I use this product?';
  }
};

const ResultsView = ({ productData, onBack }: ResultsViewProps) => {
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAiMinimized, setIsAiMinimized] = useState(true);
  const [translatedData, setTranslatedData] = useState<ProductData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [isRetryingOnline, setIsRetryingOnline] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use translated data if available, otherwise use original
  const displayData = translatedData || productData;

  // Check authentication status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if product is already favorited
  useEffect(() => {
    if (user) {
      checkIfFavorite();
    }
  }, [user, displayData.productName]);

  const checkIfFavorite = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_name', displayData.productName)
        .maybeSingle();

      if (error) throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const handleSaveFavorite = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to save favorites",
      });
      navigate('/auth');
      return;
    }

    setSavingFavorite(true);

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_name', displayData.productName);

        if (error) throw error;

        setIsFavorite(false);
        toast({
          title: "Removed from favorites",
          description: "Product removed from your favorites",
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_name: displayData.productName,
            category: displayData.category,
            description: displayData.description,
            rating: displayData.rating,
            review_count: displayData.reviewCount,
            price_range: displayData.priceRange,
            best_price: displayData.bestPrice,
            best_dealer: displayData.bestDealer,
            currency: displayData.currency,
            average_price: displayData.averagePrice,
            pros: displayData.pros,
            cons: displayData.cons,
            usage_tips: displayData.usageTips,
            recommendation: displayData.recommendation,
          });

        if (error) throw error;

        setIsFavorite(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast({
          title: "Added to favorites! ❤️",
          description: "Product saved to your favorites",
        });
      }
    } catch (error) {
      console.error('Error saving favorite:', error);
      toast({
        title: "Error",
        description: "Failed to save favorite. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingFavorite(false);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-8 h-8 ${i < fullStars ? 'fill-secondary text-secondary' : 'text-secondary/30'}`}
      />
    ));
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsAsking(true);
    setAnswers([]);

    try {
      const { data, error } = await supabase.functions.invoke('product-question', {
        body: {
          question: question.trim(),
          productName: displayData.productName,
          category: displayData.category,
          country: displayData.userLocation?.country || 'US'
        }
      });

      if (error) throw error;

      if (data?.bulletPoints) {
        setAnswers(data.bulletPoints);
      } else {
        throw new Error('No answer received');
      }

    } catch (error) {
      console.error('Error asking question:', error);
      toast({
        title: "Oops! 🐾",
        description: "Failed to get an answer. Please try again!",
        variant: "destructive",
      });
    } finally {
      setIsAsking(false);
    }
  };

  const handleTranslate = async () => {
    // If already translated, revert to original
    if (translatedData) {
      setTranslatedData(null);
      toast({
        title: "Language switched",
        description: `Showing in ${productData.userLocation?.language || 'original language'}`,
      });
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-product', {
        body: {
          productData: productData
        }
      });

      if (error) throw error;

      if (data) {
        setTranslatedData(data);
        toast({
          title: "Translated to English! 🌍",
          description: "Product information is now in English",
        });
      } else {
        throw new Error('No translation received');
      }

    } catch (error) {
      console.error('Error translating:', error);
      toast({
        title: "Translation failed",
        description: "Could not translate the product information",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRetryOnline = async () => {
    setIsRetryingOnline(true);
    toast({
      title: "Searching online... 🌍",
      description: "Looking for online offers in your country",
    });

    try {
      const { data, error } = await supabase.functions.invoke('fetch_geo_prices', {
        body: {
          product_name: displayData.productName,
          country: productData.userLocation?.countryCode || 'ro',
          location: '', // Empty location for online search
          uule: '' // Empty uule for online search
        }
      });

      if (error) throw error;

      if (data && data.best_deal) {
        // Update product data with new pricing info
        const updatedData = {
          ...productData,
          bestPrice: data.best_deal.numericPrice.toString(),
          bestDealer: data.best_deal.source,
          dealLink: data.best_deal.link,
          currency: data.currency,
          averagePrice: data.avg_price,
          nearbyStores: data.offers.map((offer: any) => ({
            name: offer.source,
            price: offer.numericPrice.toString(),
            distance: '',
            link: offer.link
          }))
        };

        // If we're showing translated data, update both
        if (translatedData) {
          setTranslatedData(updatedData);
        } else {
          // Update the display by forcing a re-render with new data
          Object.assign(productData, updatedData);
        }

        toast({
          title: "Online deals found! 🎉",
          description: `Found ${data.offers.length} online offers`,
        });

        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

    } catch (error) {
      console.error('Error fetching online prices:', error);
      toast({
        title: "Search failed",
        description: "Could not find online offers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRetryingOnline(false);
    }
  };

  // Calculate discount percentage and trigger confetti for great deals
  useEffect(() => {
    if (displayData.bestPrice !== 'N/A' && displayData.averagePrice) {
      const bestPrice = parseFloat(displayData.bestPrice);
      const avgPrice = parseFloat(displayData.averagePrice);
      
      if (!isNaN(bestPrice) && !isNaN(avgPrice) && avgPrice > 0) {
        const discountPercentage = ((avgPrice - bestPrice) / avgPrice) * 100;
        
        // Trigger confetti for >10% discount
        if (discountPercentage > 10) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }, 500);
        }
      }
    }
  }, [displayData]);

  const handleDealClick = () => {
    if (displayData.dealLink) {
      window.open(displayData.dealLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStoreClick = (link?: string) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const isPriceAvailable = displayData.bestPrice !== 'N/A' && displayData.bestDealer !== 'Not found';

  return (
    <section className="py-12 bg-gradient-to-b from-primary/5 to-background min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Scan
            </Button>
            
            {/* Language Toggle Button */}
            {productData.userLocation?.language && productData.userLocation.language !== "English" && (
              <Button
                variant={translatedData ? "default" : "outline"}
                size="sm"
                onClick={handleTranslate}
                disabled={isTranslating}
                className="ml-auto"
              >
                {isTranslating ? (
                  <>Translating...</>
                ) : translatedData ? (
                  <>🌍 {productData.userLocation.language}</>
                ) : (
                  <>🇬🇧 EN</>
                )}
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-[var(--shadow-soft)]">
              <span className="text-2xl">🛍️</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {displayData.productName}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{displayData.category}</span>
                {displayData.userLocation && (
                  <>
                    <span>•</span>
                    <span>📍 {displayData.userLocation.city}, {displayData.userLocation.country}</span>
                    {displayData.userLocation.language && !translatedData && (
                      <>
                        <span>•</span>
                        <span>🌍 {displayData.userLocation.language}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Split-Screen Results */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Review Roundup */}
            <Card className="p-6 shadow-[var(--shadow-float)] border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 animate-scale-in">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-secondary" />
                <h2 className="text-xl font-semibold text-foreground">What folks are whispering...</h2>
              </div>
              
              {/* Aggregated Score */}
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {renderStars(displayData.rating)}
                </div>
                <div className="text-4xl font-bold text-foreground mb-1">{displayData.rating}/5</div>
                <div className="text-sm text-muted-foreground">from {displayData.reviewCount.toLocaleString()} reviews</div>
              </div>
              
              {/* Review Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">Quality</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${displayData.reviewBreakdown.quality}%` }} />
                  </div>
                  <span className="text-sm font-medium text-primary">{displayData.reviewBreakdown.quality}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">Durability</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${displayData.reviewBreakdown.durability}%` }} />
                  </div>
                  <span className="text-sm font-medium text-primary">{displayData.reviewBreakdown.durability}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">Value</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${displayData.reviewBreakdown.value}%` }} />
                  </div>
                  <span className="text-sm font-medium text-primary">{displayData.reviewBreakdown.value}%</span>
                </div>
              </div>
              
              {/* Review Snippets */}
              <div className="space-y-3">
                {displayData.pros.slice(0, 2).map((pro, idx) => (
                  <div key={`pro-${idx}`} className="bg-accent/20 rounded-xl p-4 border border-accent/30">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-lg">😍</span>
                      <p className="text-sm font-medium text-foreground">Pro</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{pro}</p>
                  </div>
                ))}
                {displayData.cons.slice(0, 1).map((con, idx) => (
                  <div key={`con-${idx}`} className="bg-secondary/20 rounded-xl p-4 border border-secondary/30">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-lg">🤔</span>
                      <p className="text-sm font-medium text-foreground">Con</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{con}</p>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Price Hunt - Completely Rewritten */}
            <Card className="p-6 shadow-[var(--shadow-float)] border-2 border-primary/20 bg-gradient-to-br from-card to-accent/5 animate-scale-in" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🦊</span>
                <TrendingDown className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-semibold text-foreground">Hunt smarter, not harder</h2>
                {productData.userLocation && (
                  <span className="ml-auto text-sm text-muted-foreground">📍</span>
                )}
              </div>
              
              {isPriceAvailable ? (
                <>
                  {/* Big Glowing Best Deal Card with Confetti */}
                  <div className="bg-gradient-to-br from-accent/30 via-accent/20 to-primary/20 rounded-3xl p-6 mb-6 relative overflow-hidden border-2 border-accent/40 shadow-[0_0_20px_rgba(251,191,36,0.3)] animate-pulse-glow">
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-secondary to-accent text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-bold shadow-lg animate-bounce">
                      🎉 Best Deal!
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-5xl font-black text-foreground tracking-tight">
                          {displayData.currency}{displayData.bestPrice}
                        </span>
                      </div>
                      <p className="text-base text-muted-foreground font-medium">
                        at <span className="text-foreground font-semibold">{displayData.bestDealer}</span>
                      </p>
                    </div>
                    
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="w-full bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90 text-foreground font-bold shadow-lg rounded-2xl" 
                      onClick={handleDealClick}
                    >
                      Grab This Deal 🎯 <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  
                  {/* Three Small Cards/List Items for Top 3 Deals */}
                  {displayData.nearbyStores && displayData.nearbyStores.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {displayData.nearbyStores.slice(0, 3).map((store, idx) => (
                        <div 
                          key={idx} 
                          className="bg-gradient-to-r from-card to-primary/5 rounded-2xl p-4 border-2 border-primary/10 hover:border-primary/30 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-lg"
                          onClick={() => handleStoreClick(store.link)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-foreground">{store.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {idx === 0 && "🥇 "}{idx === 1 && "🥈 "}{idx === 2 && "🥉 "}
                                Click to view
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-xl font-black text-primary">
                                {displayData.currency}{store.price}
                              </p>
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Small Line "Market average" */}
                  {displayData.averagePrice && (
                    <div className="text-center py-3 border-t border-primary/10">
                      <p className="text-sm text-muted-foreground">
                        Market average: <span className="font-bold text-foreground">{displayData.currency}{displayData.averagePrice}</span>
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  {/* Friendly Orange Card for No Results */}
                  <div className="bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-3xl p-8 border-2 border-orange-200 dark:border-orange-800/30">
                    <div className="text-6xl mb-4">🦊</div>
                    <p className="text-xl font-bold text-foreground mb-2">No local gems nearby</p>
                    <p className="text-sm text-muted-foreground mb-6">Try searching without location filters?</p>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="rounded-2xl border-2 border-orange-300 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                      onClick={handleRetryOnline}
                      disabled={isRetryingOnline}
                    >
                      {isRetryingOnline ? "Searching..." : "🌍 Go Online"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Smart Scoop */}
            <Card className="p-6 shadow-[var(--shadow-float)] border-2 border-primary/20 bg-gradient-to-br from-card to-secondary/5 animate-scale-in" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Smart Scoop</h2>
              </div>
              
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">What is it?</h3>
                <p className="text-foreground leading-relaxed">
                  {displayData.description}
                </p>
              </div>
              
              {/* Product Character Illustration */}
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6 text-center">
                <div className="text-6xl mb-2 animate-bounce-gentle">✨</div>
                <p className="text-sm text-muted-foreground italic">"I'm here to help you make the best choice!"</p>
              </div>
              
              {/* Usage Tips */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground">How to use</h3>
                <div className="space-y-3">
                  {displayData.usageTips.map((tip, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-foreground pt-1">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Personalized Rec */}
              <div className="bg-gradient-to-r from-secondary/20 to-accent/20 rounded-xl p-4 border-2 border-secondary/30">
                <div className="flex items-start gap-2 mb-2">
                  <Heart className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Pro tip from your SnapFox pal</p>
                    <p className="text-sm text-muted-foreground">
                      {displayData.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Action Buttons */}
            <Card className="p-6 shadow-[var(--shadow-soft)] border-2 border-primary/20 bg-card">
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={handleSaveFavorite}
                  disabled={savingFavorite}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
                  {isFavorite ? 'Loved It!' : 'Love It!'}
                </Button>
                <Button variant="outline" size="lg" className="w-full">
                  <Share2 className="w-5 h-5" />
                  Share This Gem
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Fixed Floating AI Question Section */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        {isAiMinimized ? (
          // Minimized State - Small Floating Button
          <div className="flex justify-center animate-fade-in">
            <Button
              onClick={() => setIsAiMinimized(false)}
              className="rounded-full shadow-2xl h-14 px-6 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all duration-300 group"
              size="lg"
            >
              <MessageSquare className="w-5 h-5 mr-2 group-hover:animate-bounce-gentle" />
              <span className="font-semibold">Ask About This Product</span>
              <ChevronUp className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          // Maximized State - Full Card
          <Card className="p-6 shadow-2xl border-2 border-primary/30 bg-gradient-to-br from-card to-primary/10 backdrop-blur-sm animate-scale-in relative">
            {/* Minimize Button */}
            <Button
              onClick={() => setIsAiMinimized(true)}
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 rounded-full hover:bg-primary/10"
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2 mb-4 justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Ask About This Product</h2>
            </div>
            
            <div className="space-y-4">
              {/* Question Input */}
              <div className="flex gap-2">
                <Input
                  placeholder={getExampleQuestion(displayData.category)}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  disabled={isAsking}
                  className="flex-1 bg-background/80 backdrop-blur-sm"
                />
                <Button 
                  onClick={handleAskQuestion}
                  disabled={isAsking || !question.trim()}
                  size="icon"
                  className="shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Loading State */}
              {isAsking && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce-gentle" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce-gentle" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce-gentle" style={{ animationDelay: "0.4s" }} />
                  </div>
                  <span>Searching for answers...</span>
                </div>
              )}

              {/* Answers */}
              {answers.length > 0 && (
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 space-y-3 max-h-48 overflow-y-auto">
                  {answers.map((answer, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-foreground pt-1">{answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </section>
  );
};

export default ResultsView;
