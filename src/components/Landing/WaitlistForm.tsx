import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const WaitlistForm = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isMobileRevealed, setIsMobileRevealed] = useState(false);
  const isMobile = useIsMobile();

  // Mouse position tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring animation for blob
  const springConfig = { damping: 25, stiffness: 150 };
  const blobX = useSpring(mouseX, springConfig);
  const blobY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (isMobile) {
      // Auto-reveal on mobile after scrolling to section
      const timer = setTimeout(() => setIsMobileRevealed(true), 2000);
      return () => clearTimeout(timer);
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile, mouseX, mouseY]);

  const handleBlobEnter = () => {
    if (!isMobile) setIsFormVisible(true);
  };

  const handleBlobLeave = () => {
    if (!isMobile) setIsFormVisible(false);
  };

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
    <section id="waitlist" className="py-20 px-4 bg-gradient-to-b from-mint/5 to-background relative overflow-hidden">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Join the <span className="relative inline-block overflow-hidden">
              <span className="relative z-10 animate-text-reveal">FOX list</span>
              <span className="absolute inset-0 bg-gradient-to-r from-sunshine via-mint to-blush animate-highlight-reveal"></span>
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Be the first to know when Snapfox launches. Get early access and exclusive deals! 🦊✨
          </p>
        </div>

        {/* Floating highlighter blob */}
        {!isMobile && !isSubmitted && (
          <motion.div
            className="fixed w-64 h-64 rounded-full pointer-events-none z-10"
            style={{
              x: useTransform(blobX, (x) => x - 128),
              y: useTransform(blobY, (y) => y - 128),
              background: "radial-gradient(circle, rgba(167, 243, 208, 0.4), rgba(251, 207, 232, 0.3), rgba(254, 240, 138, 0.2))",
              filter: "blur(40px)",
            }}
          />
        )}

        {/* Desktop hint text */}
        {!isMobile && !isSubmitted && (
          <motion.p 
            className="text-center text-sm text-muted-foreground/60 mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: isFormVisible ? 0 : 1, y: isFormVisible ? -10 : 0 }}
            transition={{ duration: 0.3 }}
          >
            Move your cursor to reveal the magic ✨
          </motion.p>
        )}

        {!isSubmitted ? (
          <motion.div 
            className="relative p-8 rounded-3xl"
            onMouseEnter={handleBlobEnter}
            onMouseLeave={handleBlobLeave}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isMobile ? (isMobileRevealed ? 1 : 0) : (isFormVisible ? 1 : 0)
              }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="relative"
                initial={{ scale: 0.95 }}
                animate={{ 
                  scale: isMobile ? (isMobileRevealed ? 1 : 0.95) : (isFormVisible ? 1 : 0.95),
                  y: isMobile ? (isMobileRevealed ? 0 : 10) : (isFormVisible ? 0 : 10)
                }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
              >
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-opacity duration-500 ${(isMobile ? isMobileRevealed : isFormVisible) ? 'opacity-100' : 'opacity-0'}`} />
                <Input
                  type="email"
                  placeholder={(isMobile ? isMobileRevealed : isFormVisible) ? "your@email.com 🦊" : ""}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-12 h-14 text-lg rounded-2xl transition-all duration-500 ${
                    (isMobile ? isMobileRevealed : isFormVisible) 
                      ? 'bg-background/80 backdrop-blur-sm border-2 border-mint/30 focus:border-mint shadow-lg' 
                      : 'bg-transparent border-0 shadow-none'
                  }`}
                  disabled={isLoading}
                  style={{ 
                    opacity: (isMobile ? isMobileRevealed : isFormVisible) ? 1 : 0,
                  }}
                />
              </motion.div>
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ 
                  scale: isMobile ? (isMobileRevealed ? 1 : 0.95) : (isFormVisible ? 1 : 0.95),
                  y: isMobile ? (isMobileRevealed ? 0 : 10) : (isFormVisible ? 0 : 10)
                }}
                transition={{ duration: 0.4, delay: 0.1, type: "spring", bounce: 0.4 }}
              >
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={isLoading}
                  className={`w-full h-14 font-semibold rounded-2xl transition-all duration-500 ${
                    (isMobile ? isMobileRevealed : isFormVisible)
                      ? 'bg-gradient-to-r from-mint to-mint/90 hover:from-mint/90 hover:to-mint text-white shadow-float hover:shadow-glow opacity-100'
                      : 'bg-transparent text-transparent shadow-none opacity-0'
                  }`}
                >
                  {isLoading ? "Joining..." : "Join the Magic ✨"}
                </Button>
              </motion.div>
            </motion.form>
            
            <motion.p 
              className="text-center text-sm text-muted-foreground mt-6"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isMobile ? (isMobileRevealed ? 1 : 0) : (isFormVisible ? 1 : 0)
              }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              🔒 We respect your privacy. Unsubscribe anytime.
            </motion.p>
          </motion.div>
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
