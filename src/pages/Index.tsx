import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ScanDemo from "@/components/ScanDemo";
import ScanHistory from "@/components/ScanHistory";
import WaitlistForm from "@/components/Landing/WaitlistForm";
import AppStores from "@/components/Landing/AppStores";
import Footer from "@/components/Landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <ScanDemo />
      <ScanHistory />
      <Features />
      <WaitlistForm />
      <AppStores />
      <Footer />
    </div>
  );
};

export default Index;
