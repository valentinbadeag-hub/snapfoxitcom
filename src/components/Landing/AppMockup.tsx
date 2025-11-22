import { Smartphone, Camera, TrendingDown } from "lucide-react";

const AppMockup = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-mint/10 to-cream">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to savings
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 md:gap-6">
          {/* Step 1 */}
          <div className="flex flex-col items-center space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="relative">
              <div className="absolute inset-0 bg-mint/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-card p-8 rounded-3xl shadow-soft border-2 border-mint/30">
                <Camera className="w-16 h-16 text-mint mx-auto" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-block px-3 py-1 bg-mint/20 text-mint rounded-full text-sm font-semibold mb-2">
                Step 1
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Snap a Photo
              </h3>
              <p className="text-muted-foreground">
                Take a picture of any product you're interested in
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative">
              <div className="absolute inset-0 bg-blush/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-card p-8 rounded-3xl shadow-soft border-2 border-blush/30">
                <Smartphone className="w-16 h-16 text-blush mx-auto" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-block px-3 py-1 bg-blush/20 text-blush rounded-full text-sm font-semibold mb-2">
                Step 2
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                AI Analysis
              </h3>
              <p className="text-muted-foreground">
                Our smart AI instantly identifies and searches for the product
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative">
              <div className="absolute inset-0 bg-sunshine/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-card p-8 rounded-3xl shadow-soft border-2 border-sunshine/30">
                <TrendingDown className="w-16 h-16 text-sunshine mx-auto" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-block px-3 py-1 bg-sunshine/20 text-sunshine rounded-full text-sm font-semibold mb-2">
                Step 3
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Best Deals
              </h3>
              <p className="text-muted-foreground">
                Get the best prices from trusted retailers instantly
              </p>
            </div>
          </div>
        </div>

        {/* Animated mockup preview */}
        <div className="mt-16 flex justify-center">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-0 bg-gradient-primary rounded-[3rem] blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-mint/10 to-blush/10 p-8 rounded-[3rem] border-4 border-white shadow-float">
              <div className="bg-card rounded-[2rem] overflow-hidden shadow-lg aspect-[9/16]">
                <div className="bg-mint/10 p-6 h-full flex flex-col items-center justify-center space-y-4">
                  <Camera className="w-20 h-20 text-mint animate-pulse" />
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold text-foreground">Ready to scan</p>
                    <p className="text-sm text-muted-foreground">Tap to capture</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppMockup;
