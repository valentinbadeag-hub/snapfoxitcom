import foxHero from "@/assets/fox-hero.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-cream to-mint/10">
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <div className="w-full max-w-md md:max-w-lg lg:max-w-xl animate-fade-in">
            <img 
              src={foxHero} 
              alt="Snapfox mascot" 
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>
          
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground">
              Snapfox
            </h1>
            <p className="text-2xl md:text-4xl font-light text-muted-foreground">
              Snap it. Love it.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
              The smartest way to find the best deals on products you love. Simply snap a photo and let Snapfox do the rest.
            </p>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blush/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-mint/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-sunshine/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
    </section>
  );
};

export default HeroSection;
