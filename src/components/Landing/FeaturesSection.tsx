import { Card } from "@/components/ui/card";
import { Camera, Star, DollarSign, Lightbulb, Heart, Share2 } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Camera,
      title: "Snap & Scan",
      description: "Point your camera at any product and let our AI fox work its magic in seconds.",
      emoji: "📸"
    },
    {
      icon: Star,
      title: "Real Reviews",
      description: "Aggregated insights from thousands of real shoppers—the truth, without the fluff.",
      emoji: "⭐"
    },
    {
      icon: DollarSign,
      title: "Best Prices",
      description: "Find the lowest price across stores, track trends, and save big on every purchase.",
      emoji: "💰"
    },
    {
      icon: Lightbulb,
      title: "Smart Tips",
      description: "Get personalized usage tips and recommendations tailored to your lifestyle.",
      emoji: "💡"
    },
    {
      icon: Heart,
      title: "Love & Track",
      description: "Build your collection of favorites and get insights on what matches your vibe.",
      emoji: "💕"
    },
    {
      icon: Share2,
      title: "Share Gems",
      description: "Found something amazing? Share your discoveries as cute postcards with friends!",
      emoji: "✨"
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Shopping, but make it <span className="bg-gradient-to-r from-mint via-blush to-sunshine bg-clip-text text-transparent">sparkly</span>
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
                className="p-6 shadow-soft border-2 border-mint/20 bg-gradient-to-br from-card to-mint/5 hover:shadow-float transition-all hover:-translate-y-1 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-mint/20 to-blush/20 rounded-2xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-mint" />
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
  );
};

export default FeaturesSection;
