import { Card } from "@/components/ui/card";
import { Camera, Star, DollarSign, Lightbulb, Heart, Share2 } from "lucide-react";
import ScanHistory from "./ScanHistory";

const Features = () => {
  const features = [
    {
      icon: Camera,
      title: "Snap & Scan",
      description: "Point your camera at any product and let our AI fox work its magic in seconds.",
      color: "primary",
      emoji: "📸",
      action: () => {
        document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          window.dispatchEvent(new Event('triggerCamera'));
        }, 600);
      }
    },
    {
      icon: Star,
      title: "Real Reviews",
      description: "Aggregated insights from thousands of real shoppers—the truth, without the fluff.",
      color: "secondary",
      emoji: "⭐",
      action: () => {
        document.getElementById('recent-scans')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      icon: DollarSign,
      title: "Best Prices",
      description: "Find the lowest price across stores, track trends, and save big on every purchase.",
      color: "accent",
      emoji: "💰"
    },
    {
      icon: Lightbulb,
      title: "Smart Tips",
      description: "Get personalized usage tips and recommendations tailored to your lifestyle.",
      color: "primary",
      emoji: "💡"
    },
    {
      icon: Heart,
      title: "Love & Track",
      description: "Build your collection of favorites and get insights on what matches your vibe.",
      color: "secondary",
      emoji: "💕"
    },
    {
      icon: Share2,
      title: "Share Gems",
      description: "Found something amazing? Share your discoveries as cute postcards with friends!",
      color: "accent",
      emoji: "✨"
    },
  ];

  return (
    <>
      <ScanHistory />
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Shopping, but make it <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">sparkly</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to shop smarter, wrapped in a delightful experience
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.title}
                  className="p-6 shadow-[var(--shadow-soft)] border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-[var(--shadow-float)] transition-all hover:-translate-y-1 cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={feature.action}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                        <Icon className={`w-6 h-6 text-${feature.color}`} />
                      </div>
                      <span className="text-3xl">{feature.emoji}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
