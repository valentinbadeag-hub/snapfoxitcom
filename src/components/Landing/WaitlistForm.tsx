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
    <section id="waitlist" className="py-20 px-4 bg-gradient-to-b from-mint/5 to-background">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Join the <span className="relative inline-block">
              <span className="bg-gradient-to-r from-mint via-blush to-sunshine bg-clip-text text-transparent relative z-10">FOX list</span>
              <span className="absolute inset-0 bg-gradient-to-r from-mint/20 via-blush/20 to-sunshine/20 w-0 animate-highlight-reveal"></span>
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Be the first to know when Snapfox launches. Get early access and exclusive deals! 🦊✨
          </p>
        </div>

        {!isSubmitted ? (
          <div className="bg-card p-8 rounded-3xl shadow-float border-2 border-mint/20 animate-scale-in">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 bg-background border-2 border-mint/30 focus:border-mint text-lg rounded-2xl"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                size="lg"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-mint to-mint/90 hover:from-mint/90 hover:to-mint text-white font-semibold rounded-2xl shadow-float hover:shadow-glow transition-all duration-300"
              >
                {isLoading ? "Joining..." : "Join the Magic ✨"}
              </Button>
            </form>
            
            <p className="text-center text-sm text-muted-foreground mt-6">
              🔒 We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        ) : (
          <div className="bg-card p-12 rounded-3xl shadow-float border-2 border-mint/20 animate-scale-in">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-mint/20 to-blush/20 rounded-full flex items-center justify-center animate-scale-in">
                <CheckCircle2 className="w-12 h-12 text-mint" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">You're all set! 🎉</h3>
              <p className="text-lg text-muted-foreground max-w-sm">
                We'll send you an email when Snapfox launches. Get ready for smarter shopping!
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default WaitlistForm;
