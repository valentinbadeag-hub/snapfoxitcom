import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Sparkles } from "lucide-react";
import ResultsView from "./ResultsView";

const ScanDemo = () => {
  const [showResults, setShowResults] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsScanning(false);
      setShowResults(true);
    }, 2500);
  };

  if (showResults) {
    return <ResultsView onBack={() => setShowResults(false)} />;
  }

  return (
    <section id="demo" className="py-20 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6 mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            See the Magic ✨
          </h2>
          <p className="text-lg text-muted-foreground">
            Try our demo! Upload a product photo and watch pReview work its charm.
          </p>
        </div>
        
        <div className="max-w-xl mx-auto">
          <Card className="p-8 shadow-[var(--shadow-float)] border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 animate-scale-in">
            {isScanning ? (
              <div className="space-y-6 text-center py-12">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full animate-pulse-soft flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white animate-wiggle" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full animate-ping opacity-20" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-foreground">Analyzing your snap...</h3>
                  <p className="text-muted-foreground">Our AI fox is sniffing out the details! 🦊</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce-gentle" />
                  <div className="w-3 h-3 bg-secondary rounded-full animate-bounce-gentle" style={{ animationDelay: "0.2s" }} />
                  <div className="w-3 h-3 bg-accent rounded-full animate-bounce-gentle" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Mock Camera View */}
                <div className="relative aspect-square bg-gradient-to-br from-muted to-primary/10 rounded-2xl overflow-hidden border-2 border-dashed border-primary/30 flex items-center justify-center group cursor-pointer hover:border-primary/60 transition-all">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tap to capture or</p>
                      <p className="text-sm font-medium text-foreground">upload a photo</p>
                    </div>
                  </div>
                  
                  {/* Corner guides */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-primary/40 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-primary/40 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary/40 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary/40 rounded-br-lg" />
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full group"
                    onClick={handleScan}
                  >
                    <Camera className="w-5 h-5 group-hover:animate-wiggle" />
                    Scan Sample Product
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Photo
                  </Button>
                </div>
                
                <p className="text-xs text-center text-muted-foreground">
                  💕 Your snaps stay private—we promise!
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ScanDemo;
