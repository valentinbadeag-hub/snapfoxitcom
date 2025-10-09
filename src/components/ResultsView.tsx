import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Star, Heart, Share2, TrendingDown, Lightbulb, MessageSquare } from "lucide-react";

interface ResultsViewProps {
  onBack: () => void;
}

const ResultsView = ({ onBack }: ResultsViewProps) => {
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
              <span className="text-2xl">🧴</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Organic Bamboo Toothbrush
              </h1>
              <p className="text-sm text-muted-foreground">Eco-friendly oral care</p>
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
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="w-8 h-8 fill-secondary text-secondary" />
                  ))}
                  <Star className="w-8 h-8 text-secondary" />
                </div>
                <div className="text-4xl font-bold text-foreground mb-1">4.2/5</div>
                <div className="text-sm text-muted-foreground">from 2,847 reviews</div>
              </div>
              
              {/* Review Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">Eco-friendly</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-to-r from-primary to-secondary rounded-full" />
                  </div>
                  <span className="text-sm font-medium text-primary">85%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">Durability</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[72%] bg-gradient-to-r from-primary to-secondary rounded-full" />
                  </div>
                  <span className="text-sm font-medium text-primary">72%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">Value</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[78%] bg-gradient-to-r from-primary to-secondary rounded-full" />
                  </div>
                  <span className="text-sm font-medium text-primary">78%</span>
                </div>
              </div>
              
              {/* Review Snippets */}
              <div className="space-y-3">
                <div className="bg-accent/20 rounded-xl p-4 border border-accent/30">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">😍</span>
                    <p className="text-sm font-medium text-foreground">Pro</p>
                  </div>
                  <p className="text-sm text-muted-foreground">"Love that it's sustainable! Bristles are gentle yet effective."</p>
                </div>
                <div className="bg-secondary/20 rounded-xl p-4 border border-secondary/30">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">🤔</span>
                    <p className="text-sm font-medium text-foreground">Con</p>
                  </div>
                  <p className="text-sm text-muted-foreground">"Needs replacing more often than plastic brushes."</p>
                </div>
              </div>
            </Card>
            
            {/* Price Hunt */}
            <Card className="p-6 shadow-[var(--shadow-float)] border-2 border-primary/20 bg-gradient-to-br from-card to-accent/5 animate-scale-in" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-semibold text-foreground">Hunt smarter, not harder</h2>
              </div>
              
              {/* Best Deal */}
              <div className="bg-gradient-to-r from-accent/20 to-accent/10 rounded-2xl p-6 mb-6 relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-semibold animate-bounce-gentle">
                  Save 15%! 🎉
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-foreground">$24.99</span>
                  <span className="text-xl text-muted-foreground line-through">$29.99</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">at Walmart</p>
                <Button variant="hero" size="sm" className="w-full">
                  Grab This Deal →
                </Button>
              </div>
              
              {/* Price Trend */}
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">12-Month Price Pulse</p>
                <div className="h-32 bg-gradient-to-b from-primary/10 to-transparent rounded-xl flex items-end justify-between px-4 pb-4">
                  {[65, 70, 68, 72, 60, 75, 73, 78, 70, 68, 72, 85].map((height, i) => (
                    <div 
                      key={i}
                      className="w-[7%] bg-gradient-to-t from-primary to-secondary rounded-t-md transition-all hover:opacity-80"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Stable at ~$25, dipped to $20 in June
                </p>
              </div>
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
                  A bamboo toothbrush with charcoal-infused bristles designed for eco-conscious oral care. 
                  The natural bamboo handle is biodegradable, while the soft bristles provide gentle yet 
                  effective cleaning for sensitive gums.
                </p>
              </div>
              
              {/* Product Character Illustration */}
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6 text-center">
                <div className="text-6xl mb-2 animate-bounce-gentle">🪥</div>
                <p className="text-sm text-muted-foreground italic">"I'm here to keep your smile bright & the planet happy!"</p>
              </div>
              
              {/* Usage Tips */}
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground">How to use</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">1</span>
                    </div>
                    <p className="text-sm text-foreground pt-1">Pair with fluoride toothpaste for best results</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">2</span>
                    </div>
                    <p className="text-sm text-foreground pt-1">Replace every 3 months for optimal hygiene</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">3</span>
                    </div>
                    <p className="text-sm text-foreground pt-1">Store in a dry place between uses</p>
                  </div>
                </div>
              </div>
              
              {/* Personalized Rec */}
              <div className="bg-gradient-to-r from-secondary/20 to-accent/20 rounded-xl p-4 border-2 border-secondary/30">
                <div className="flex items-start gap-2 mb-2">
                  <Heart className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Pro tip from your pReview pal</p>
                    <p className="text-sm text-muted-foreground">
                      Great for sensitive gums! Try pairing with natural mint floss for a complete eco-routine. 🌿
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsView;
