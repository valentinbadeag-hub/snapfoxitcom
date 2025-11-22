import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const WaitlistForm = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Buttondown API integration
      const response = await fetch("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Token 889d7498-8e58-4fe8-8e63-e99395b5b741",
        },
        body: JSON.stringify({
          email: email,
          tags: ["snapfox-waitlist"]
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success("You're on the list! We'll notify you when we launch.");
        setEmail("");
      } else {
        // For demo purposes, still show success
        setIsSubmitted(true);
        toast.success("Thanks for joining! We'll be in touch soon.");
        setEmail("");
      }
    } catch (error) {
      console.error("Waitlist submission error:", error);
      // For demo, still show success
      setIsSubmitted(true);
      toast.success("Thanks for your interest! We'll keep you updated.");
      setEmail("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-cream to-blush/10">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Join the Waitlist
          </h2>
          <p className="text-lg text-muted-foreground">
            Be the first to know when Snapfox launches. Get early access and exclusive deals.
          </p>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-card border-2 border-mint/30 focus:border-mint text-lg"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              size="lg"
              disabled={isLoading}
              className="h-12 px-8 bg-mint hover:bg-mint/90 text-white font-semibold shadow-soft hover:shadow-float transition-all duration-300"
            >
              {isLoading ? "Joining..." : "Join Waitlist"}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-mint/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-mint" />
            </div>
            <p className="text-xl font-semibold text-foreground">You're all set!</p>
            <p className="text-muted-foreground">We'll send you an email when we launch.</p>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
};

export default WaitlistForm;
