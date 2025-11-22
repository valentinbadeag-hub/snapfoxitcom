import foxHero from "@/assets/fox-hero-nobg.png";
import { Sparkles, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background to-primary/5">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blush/30 rounded-full blur-2xl animate-float" />
      <div className="absolute top-40 right-20 w-32 h-32 bg-mint/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-sunshine/20 rounded-full blur-2xl animate-float" style={{ animationDelay: "2s" }} />
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-up">
          {/* Logo Icon with Fox */}
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-32 h-32 md:w-40 md:h-40 animate-sniff">
              <img 
                src={foxHero} 
                alt="Snapfox mascot" 
                className="w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
            Snap it. Love it.
            <br />
            <span className="bg-gradient-to-r from-mint via-blush to-sunshine bg-clip-text text-transparent">
              Save big with Snapfox! ✨
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Point your camera at any product and instantly discover reviews, prices, and the best deals. 
            Shopping just got smarter! 🦊
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              variant="hero" 
              size="lg"
              className="group bg-mint hover:bg-mint/90 text-white"
              onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Sparkles className="w-5 h-5 group-hover:animate-wiggle" />
              Join Waitlist
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Camera className="w-5 h-5" />
              See Preview
            </Button>
          </div>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center pt-8">
            {[
              { text: "📸 Snap & Scan" },
              { text: "⭐ Real Reviews" },
              { text: "💰 Best Prices" },
              { text: "🎯 Smart Tips" }
            ].map((feature, i) => (
              <div 
                key={feature.text}
                className="px-5 py-2 bg-card rounded-full shadow-soft text-sm font-medium animate-scale-in border-2 border-mint/20"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {feature.text}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-mint/10 to-transparent" />
    </section>
  );
};

export default HeroSection;
