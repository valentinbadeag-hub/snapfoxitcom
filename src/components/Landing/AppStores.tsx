import { Apple, Smartphone } from "lucide-react";

const AppStores = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-blush/10 to-cream">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Coming Soon
        </h2>
        <p className="text-lg text-muted-foreground mb-12">
          Snapfox will be available on iOS and Android
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {/* App Store Badge */}
          <div className="group cursor-not-allowed relative">
            <div className="absolute inset-0 bg-mint/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-card border-2 border-border rounded-2xl px-8 py-4 shadow-soft flex items-center space-x-4 opacity-60">
              <Apple className="w-10 h-10 text-foreground" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Download on the</p>
                <p className="text-xl font-semibold text-foreground">App Store</p>
              </div>
            </div>
            <div className="absolute top-2 right-2 bg-sunshine px-2 py-1 rounded-lg text-xs font-semibold text-foreground">
              Soon
            </div>
          </div>

          {/* Google Play Badge */}
          <div className="group cursor-not-allowed relative">
            <div className="absolute inset-0 bg-blush/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-card border-2 border-border rounded-2xl px-8 py-4 shadow-soft flex items-center space-x-4 opacity-60">
              <Smartphone className="w-10 h-10 text-foreground" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Get it on</p>
                <p className="text-xl font-semibold text-foreground">Google Play</p>
              </div>
            </div>
            <div className="absolute top-2 right-2 bg-sunshine px-2 py-1 rounded-lg text-xs font-semibold text-foreground">
              Soon
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Join our waitlist to be notified when we launch
        </p>
      </div>
    </section>
  );
};

export default AppStores;
