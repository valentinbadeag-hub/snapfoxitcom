import HeroSection from "@/components/Landing/HeroSection";
import AppMockup from "@/components/Landing/AppMockup";
import WaitlistForm from "@/components/Landing/WaitlistForm";
import AppStores from "@/components/Landing/AppStores";
import Footer from "@/components/Landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <AppMockup />
      <WaitlistForm />
      <AppStores />
      <Footer />
    </div>
  );
};

export default Index;
