import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import ResultsView from "./ResultsView";

interface ProductData {
  productName: string;
  category: string;
  description: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  bestPrice: string;
  bestDealer: string;
  dealerDistance?: string;
  currency: string;
  userLocation?: {
    city: string;
    country: string;
  };
  reviewBreakdown: {
    quality: number;
    value: number;
    durability: number;
  };
  pros: string[];
  cons: string[];
  usageTips: string[];
  recommendation: string;
  nearbyStores?: Array<{
    name: string;
    price: string;
    distance: string;
  }>;
}

const ScanDemo = () => {
  const [showResults, setShowResults] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  // Listen for external camera trigger and history item clicks
  useEffect(() => {
    const handleTriggerCamera = () => {
      cameraInputRef.current?.click();
    };

    const handleTriggerUpload = () => {
      uploadInputRef.current?.click();
    };

    const handleShowHistoryItem = (event: CustomEvent) => {
      const data = event.detail;
      setProductData(data);
      setShowResults(true);
      // Scroll to top to show results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToScan = () => {
      setShowResults(false);
      setProductData(null);
    };

    window.addEventListener('triggerCamera', handleTriggerCamera);
    window.addEventListener('triggerUpload', handleTriggerUpload);
    window.addEventListener('showHistoryItem', handleShowHistoryItem as EventListener);
    window.addEventListener('backToScan', handleBackToScan);
    
    return () => {
      window.removeEventListener('triggerCamera', handleTriggerCamera);
      window.removeEventListener('triggerUpload', handleTriggerUpload);
      window.removeEventListener('showHistoryItem', handleShowHistoryItem as EventListener);
      window.removeEventListener('backToScan', handleBackToScan);
    };
  }, []);

  const getUserLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('Geolocation not supported');
        toast({
          title: "Location unavailable",
          description: "Your device doesn't support location services. Showing general prices.",
          variant: "destructive",
        });
        resolve(null);
        return;
      }

      // Show immediate feedback
      toast({
        title: "Getting your location...",
        description: "This helps us find local prices and stores near you.",
      });

      console.log('Requesting location with high accuracy...');

      const timeoutId = setTimeout(() => {
        console.log('Location timeout - proceeding without location');
        toast({
          title: "Location timeout",
          description: "Using general prices. Please enable location permission.",
          variant: "destructive",
        });
        resolve(null);
      }, 15000); // Extended to 15 seconds for mobile devices

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          console.log('✓ Location obtained successfully:', lat, lon, 'accuracy:', position.coords.accuracy, 'm');
          toast({
            title: "Location detected! 📍",
            description: "Finding local deals within 100km of you...",
          });
          resolve({
            latitude: lat,
            longitude: lon,
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          let errorMsg = "Unknown error";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = "Location permission denied. Please enable in settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = "Location unavailable. Check GPS/network.";
              break;
            case error.TIMEOUT:
              errorMsg = "Location request timed out.";
              break;
          }
          console.error('Location error:', error.code, error.message, errorMsg);
          toast({
            title: "Location access issue",
            description: errorMsg + " Showing general prices.",
            variant: "destructive",
          });
          resolve(null);
        },
        { 
          timeout: 15000,
          enableHighAccuracy: true, // Critical for accurate location on mobile
          maximumAge: 0 // Always get fresh location for accurate store finding
        }
      );
    });
  };

  const handleImageCapture = async (file: File | null) => {
    if (!file) return;
    
    setIsScanning(true);
    
    try {
      // Convert image to JPEG format for better AI compatibility
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Create canvas and convert to JPEG
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }
            ctx.drawImage(img, 0, 0);
            // Convert to JPEG with 90% quality
            const jpegData = canvas.toDataURL('image/jpeg', 0.9);
            resolve(jpegData);
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Get user location
      const location = await getUserLocation();

      // Call the edge function to analyze the product
      const { data, error } = await supabase.functions.invoke('analyze-product', {
        body: { 
          imageData,
          location: location ? {
            latitude: location.latitude,
            longitude: location.longitude
          } : undefined
        }
      });

      if (error) throw error;

      // Save full product data to history
      const scanItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        productData: data, // Store full product data
      };

      const existingHistory = localStorage.getItem('scanHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      const updatedHistory = [scanItem, ...history].slice(0, 20); // Keep last 20 scans
      localStorage.setItem('scanHistory', JSON.stringify(updatedHistory));
      
      // Dispatch event for history component
      window.dispatchEvent(new Event('scanComplete'));

      setProductData(data);
      setShowResults(true);
      
      toast({
        title: "Product identified! ✨",
        description: `Found: ${data.productName}`,
      });
      
    } catch (error) {
      console.error('Error analyzing product:', error);
      toast({
        title: "Oops! 🐾",
        description: "Failed to analyze the product. Please try again!",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleUploadClick = () => {
    uploadInputRef.current?.click();
  };

  if (showResults && productData) {
    return <ResultsView productData={productData} onBack={() => setShowResults(false)} />;
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
                {/* 3D Floating Phone Frame */}
                <div className="relative mx-auto max-w-[380px] perspective-1000">
                  {/* Phone body with 3D transform */}
                  <div className="relative bg-foreground rounded-[3rem] p-3 shadow-2xl transform hover:rotate-y-2 hover:-rotate-x-1 transition-transform duration-500 hover:scale-105"
                       style={{
                         transform: 'rotateY(-5deg) rotateX(2deg)',
                         transformStyle: 'preserve-3d',
                         boxShadow: '20px 30px 60px rgba(0, 0, 0, 0.3), 40px 60px 100px rgba(0, 0, 0, 0.2)'
                       }}>
                    {/* Phone notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-foreground rounded-b-3xl z-10" />
                    
                    {/* Phone screen */}
                    <div className="relative bg-background rounded-[2.5rem] overflow-hidden">
                      {/* Status bar with real time */}
                      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background/95 to-transparent z-10 flex items-center justify-between px-8 pt-2">
                        <span className="text-xs font-medium">
                          {currentTime.getHours().toString().padStart(2, '0')}:{currentTime.getMinutes().toString().padStart(2, '0')}
                        </span>
                        <div className="flex gap-1 items-center">
                          <svg className="w-4 h-3" viewBox="0 0 16 12" fill="none">
                            <path d="M1 6C1 6 3.5 1 8 1C12.5 1 15 6 15 6C15 6 12.5 11 8 11C3.5 11 1 6 1 6Z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
                          </svg>
                          <div className="w-4 h-3 border border-foreground/40 rounded-sm relative">
                            <div className="absolute inset-0.5 bg-foreground/60 rounded-[1px]" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Mock Camera View */}
                      <div 
                        className="relative aspect-square bg-gradient-to-br from-muted to-primary/10 overflow-hidden flex items-center justify-center group cursor-pointer transition-all"
                        onClick={handleCameraClick}
                      >
                        <div className="text-center space-y-4 pt-8">
                          <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Camera className="w-10 h-10 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Tap to capture or</p>
                            <p className="text-sm font-medium text-foreground">upload a photo</p>
                          </div>
                        </div>
                        
                        {/* Corner guides */}
                        <div className="absolute top-16 left-4 w-8 h-8 border-t-4 border-l-4 border-primary/40 rounded-tl-lg" />
                        <div className="absolute top-16 right-4 w-8 h-8 border-t-4 border-r-4 border-primary/40 rounded-tr-lg" />
                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary/40 rounded-bl-lg" />
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary/40 rounded-br-lg" />
                      </div>
                    </div>
                    
                    {/* Phone home indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-background/30 rounded-full" />
                  </div>
                  
                  {/* Floating shadow beneath phone */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-foreground/20 rounded-full blur-2xl" />
                </div>
                
                {/* Hidden file inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageCapture(e.target.files?.[0] || null)}
                />
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageCapture(e.target.files?.[0] || null)}
                />
                
                {/* Action Buttons */}
                <div className="space-y-3 max-w-[380px] mx-auto">
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full group"
                    onClick={handleCameraClick}
                  >
                    <Camera className="w-5 h-5 group-hover:animate-wiggle" />
                    Scan Sample Product
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full"
                    onClick={handleUploadClick}
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
