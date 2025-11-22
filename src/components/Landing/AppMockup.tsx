import { Smartphone, Camera, TrendingDown } from "lucide-react";

const AppMockup = () => {
  return (
    <section id="preview" className="py-20 px-4 bg-gradient-to-b from-mint/5 to-background">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            See the Magic ✨
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch how Snapfox transforms a simple photo into actionable shopping insights
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Phone mockup */}
          <div className="relative mx-auto w-[280px] md:w-[340px] aspect-[9/19] bg-gradient-to-br from-foreground to-foreground/90 rounded-[3rem] p-3 shadow-float animate-scale-in">
            {/* Phone notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-foreground rounded-b-2xl z-10" />
            
            {/* Screen */}
            <div className="relative h-full bg-background rounded-[2.5rem] overflow-hidden">
              {/* App Content */}
              <div className="absolute inset-0 bg-gradient-to-b from-mint/10 to-background">
                {/* Header */}
                <div className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-mint to-blush rounded-full mb-4 animate-pulse-soft">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Snapfox</h3>
                  <p className="text-sm text-muted-foreground">Point & Discover</p>
                </div>

                {/* Camera View */}
                <div className="mx-4 mb-4 relative aspect-square bg-gradient-to-br from-muted to-mint/10 rounded-3xl overflow-hidden border-2 border-dashed border-mint/30">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2 animate-bounce-gentle">
                      <Camera className="w-12 h-12 text-mint mx-auto" />
                      <p className="text-xs text-muted-foreground">Tap to scan</p>
                    </div>
                  </div>
                  
                  {/* Corner guides */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-mint/60 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-mint/60 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-mint/60 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-mint/60 rounded-br-lg" />
                </div>

                {/* Quick Stats */}
                <div className="mx-4 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-card p-3 rounded-xl border border-mint/20">
                    <div className="text-xs text-muted-foreground">Reviews</div>
                    <div className="text-sm font-bold text-mint">4.8⭐</div>
                  </div>
                  <div className="bg-card p-3 rounded-xl border border-mint/20">
                    <div className="text-xs text-muted-foreground">Savings</div>
                    <div className="text-sm font-bold text-mint">-30%</div>
                  </div>
                  <div className="bg-card p-3 rounded-xl border border-mint/20">
                    <div className="text-xs text-muted-foreground">Stores</div>
                    <div className="text-sm font-bold text-mint">12+</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating feature badges */}
          <div className="hidden md:block">
            <div className="absolute -left-12 top-1/4 bg-card px-4 py-2 rounded-full shadow-float border-2 border-mint/20 animate-float">
              <span className="text-sm font-medium">Instant Results 🚀</span>
            </div>
            <div className="absolute -right-12 top-1/2 bg-card px-4 py-2 rounded-full shadow-float border-2 border-blush/20 animate-float" style={{ animationDelay: "1s" }}>
              <span className="text-sm font-medium">Best Prices 💰</span>
            </div>
            <div className="absolute -left-8 bottom-1/4 bg-card px-4 py-2 rounded-full shadow-float border-2 border-sunshine/20 animate-float" style={{ animationDelay: "2s" }}>
              <span className="text-sm font-medium">Real Reviews ⭐</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppMockup;
