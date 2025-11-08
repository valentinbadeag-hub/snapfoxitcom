import { Button } from "@/components/ui/button";
import { Camera, Sparkles, Upload } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background to-primary/5 py-12">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-secondary/20 rounded-full blur-xl animate-float" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-accent/20 rounded-full blur-xl animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-primary/20 rounded-full blur-xl animate-float" style={{ animationDelay: "2s" }} />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6 animate-slide-up">
          {/* Logo Icon */}
          <div 
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full shadow-[var(--shadow-glow)] animate-pulse-soft mb-4 cursor-pointer hover:scale-110 transition-transform active:scale-95"
            onClick={() => {
              // First go back to main scan view if viewing results
              window.dispatchEvent(new Event('backToScan'));
              // Then scroll and trigger camera
              document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('triggerCamera'));
              }, 600);
            }}
            title="Click to scan a product"
          >
            <Camera className="w-8 h-8 text-white" />
          </div>
          
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Snap it, love it—see the magic! ✨
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              pReview makes shopping sparkle
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transform any product photo into instant reviews, prices, and insights. 
            Upload a photo and watch the magic happen! 🦊
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button 
              variant="hero" 
              size="lg"
              className="group"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Sparkles className="w-5 h-5 group-hover:animate-wiggle" />
              Try Demo Magic
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                // Trigger upload input in ScanDemo component
                window.dispatchEvent(new CustomEvent('triggerUpload'));
              }}
            >
              <Upload className="w-5 h-5" />
              Upload Photo
            </Button>
          </div>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            {["📸 Snap & Scan", "⭐ Real Reviews", "💰 Best Prices", "🎯 Smart Tips"].map((feature, i) => (
              <div 
                key={feature}
                className="px-4 py-1.5 bg-card rounded-full shadow-[var(--shadow-soft)] text-sm font-medium animate-scale-in border-2 border-primary/20"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/10 to-transparent" />
    </section>
  );
};

export default Hero;
