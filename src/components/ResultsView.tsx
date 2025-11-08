import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Star, Heart, Share2, TrendingDown, Lightbulb, MessageSquare, ExternalLink, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  onlineDeals?: Array<{
    name: string;
    price: string;
    link?: string;
  }>;
}

interface ResultsViewProps {
  productData: ProductData;
  onBack: () => void;
}

const ResultsView = ({ productData, onBack }: ResultsViewProps) => {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState<string[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsLoadingChat(true);
    try {
      const { data, error } = await supabase.functions.invoke('product-chat', {
        body: {
          question: question.trim(),
          productName: productData.productName,
          productCategory: productData.category,
          productDescription: productData.description,
        }
      });

      if (error) throw error;

      setChatResponse(data.bulletPoints || []);
      setQuestion("");
    } catch (error) {
      console.error('Error asking question:', error);
      toast({
        title: "Oops!",
        description: "Couldn't get an answer right now. Try again?",
        variant: "destructive",
      });
    } finally {
      setIsLoadingChat(false);
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

  // Calculate discount percentage and trigger confetti for great deals
  useEffect(() => {
    if (productData.bestPrice !== 'N/A' && productData.averagePrice) {
      const bestPrice = parseFloat(productData.bestPrice);
      const avgPrice = parseFloat(productData.averagePrice);
      
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
  }, [productData]);

  const handleDealClick = () => {
    if (productData.dealLink) {
      window.open(productData.dealLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStoreClick = (link?: string) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const isPriceAvailable = productData.bestPrice !== 'N/A' && productData.bestDealer !== 'Not found';

  return (
    <section className="py-12 bg-gradient-to-b from-primary/5 to-background min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8 animate-slide-up">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Scan
          </Button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-[var(--shadow-soft)]">
              <span className="text-2xl">🛍️</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {productData.productName}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{productData.category}</span>
                {productData.userLocation && (
                  <>
                    <span>•</span>
                    <span>📍 {productData.userLocation.city}, {productData.userLocation.country}</span>
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
                  {renderStars(productData.rating)}
                </div>
                <div className="text-4xl font-bold text-foreground mb-1">{productData.rating}/5</div>
                <div className="text-sm text-muted-foreground">from {productData.reviewCount.toLocaleString()} reviews</div>
              </div>
              
              {/* Review Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">Quality</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${productData.reviewBreakdown.quality}%` }} />
                  </div>
                  <span className="text-sm font-medium text-primary">{productData.reviewBreakdown.quality}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">Durability</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${productData.reviewBreakdown.durability}%` }} />
                  </div>
                  <span className="text-sm font-medium text-primary">{productData.reviewBreakdown.durability}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">Value</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${productData.reviewBreakdown.value}%` }} />
                  </div>
                  <span className="text-sm font-medium text-primary">{productData.reviewBreakdown.value}%</span>
                </div>
              </div>
              
              {/* Review Snippets */}
              <div className="space-y-3">
                {productData.pros.slice(0, 2).map((pro, idx) => (
                  <div key={`pro-${idx}`} className="bg-accent/20 rounded-xl p-4 border border-accent/30">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-lg">😍</span>
                      <p className="text-sm font-medium text-foreground">Pro</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{pro}</p>
                  </div>
                ))}
                {productData.cons.slice(0, 1).map((con, idx) => (
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
            
            {/* Price Hunt */}
            <Card className="p-6 shadow-[var(--shadow-float)] border-2 border-primary/20 bg-gradient-to-br from-card to-accent/5 animate-scale-in" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-semibold text-foreground">Hunt smarter, not harder</h2>
              </div>
              
              {isPriceAvailable ? (
                <>
                  {/* Best Deal */}
                  <div className="bg-gradient-to-r from-accent/20 to-accent/10 rounded-2xl p-6 mb-6 relative overflow-hidden">
                    <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-semibold animate-bounce-gentle">
                      Best Deal! 🎉
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-xs text-muted-foreground mr-1">{productData.currency}</span>
                      <span className="text-4xl font-bold text-foreground">{productData.bestPrice}</span>
                    </div>
                    <div className="space-y-1 mb-4">
                      <p className="text-sm text-muted-foreground">at {productData.bestDealer}</p>
                      {productData.dealerDistance && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          📍 {productData.dealerDistance}
                        </p>
                      )}
                      {productData.averagePrice && (
                        <p className="text-xs text-accent font-medium mt-2">
                          💰 Market avg: {productData.currency}{productData.averagePrice}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="hero" 
                      size="sm" 
                      className="w-full" 
                      onClick={handleDealClick}
                      disabled={!productData.dealLink}
                    >
                      {productData.dealLink ? (
                        <>
                          Grab This Deal <ExternalLink className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        'View Details'
                      )}
                    </Button>
                  </div>
                  
                  {/* Price Range */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Market Price Range</p>
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4">
                      <p className="text-2xl font-bold text-foreground">
                        {productData.currency}{productData.priceRange}
                      </p>
                    </div>
                  </div>
                  
                  {/* No Nearby Stores Message */}
                  {(!productData.nearbyStores || productData.nearbyStores.length === 0) && (
                    <div className="bg-accent/10 rounded-xl p-4 border border-accent/20 mb-4">
                      <p className="text-sm text-muted-foreground text-center">
                        📍 No deals found within 100km of your location
                      </p>
                    </div>
                  )}
                  
                  {/* Online Deals Section */}
                  {productData.onlineDeals && productData.onlineDeals.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        🌐 Best Online Deals in {productData.userLocation?.country || 'your country'}
                      </p>
                      <p className="text-xs text-muted-foreground mb-3 italic">
                        These are online deals available for delivery
                      </p>
                      <div className="space-y-2">
                        {productData.onlineDeals.map((deal, idx) => (
                          <div 
                            key={idx} 
                            className={`bg-card rounded-xl p-3 border border-primary/10 flex items-center justify-between ${deal.link ? 'cursor-pointer hover:border-primary/30 transition-colors' : ''}`}
                            onClick={() => handleStoreClick(deal.link)}
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">{deal.name}</p>
                              <p className="text-xs text-muted-foreground">🌐 Online</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-primary">{productData.currency}{deal.price}</p>
                              {deal.link && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gradient-to-r from-accent/20 to-accent/10 rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-3">💕</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No deals found right now</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We couldn't find pricing for this product online. Try searching on your favorite shopping site!
                  </p>
                  <Button variant="outline" size="sm">
                    Manual Search →
                  </Button>
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
                  {productData.description}
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
                  {productData.usageTips.map((tip, idx) => (
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
                    <p className="text-sm font-semibold text-foreground mb-1">Pro tip from your pReview pal</p>
                    <p className="text-sm text-muted-foreground">
                      {productData.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Action Buttons */}
            <Card className="p-6 shadow-[var(--shadow-soft)] border-2 border-primary/20 bg-card">
              <div className="space-y-3">
                <Button variant="hero" size="lg" className="w-full">
                  <Heart className="w-5 h-5" />
                  Love It!
                </Button>
                <Button variant="outline" size="lg" className="w-full">
                  <Share2 className="w-5 h-5" />
                  Share This Gem
                </Button>
              </div>
            </Card>

            {/* AI Conversation Section */}
            <Card className="p-6 shadow-[var(--shadow-float)] border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 animate-scale-in" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Ask Me Anything</h2>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Got questions? Ask away and I'll share insights in bite-sized bullets! 💬✨
              </p>

              {/* Question Input */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="e.g., Is this good for sensitive skin?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  disabled={isLoadingChat}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAskQuestion}
                  disabled={isLoadingChat || !question.trim()}
                  size="icon"
                  variant="hero"
                >
                  {isLoadingChat ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Chat Response */}
              {chatResponse.length > 0 && (
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 space-y-2">
                  {chatResponse.map((point, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-foreground pt-0.5">{point}</p>
                    </div>
                  ))}
                </div>
              )}

              {isLoadingChat && chatResponse.length === 0 && (
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2 animate-bounce-gentle">🤔</div>
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsView;
