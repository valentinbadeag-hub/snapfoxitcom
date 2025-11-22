const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground/5 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-foreground mb-2">Snapfox</h3>
            <p className="text-muted-foreground">Snap it. Love it.</p>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Snapfox. All rights reserved.
            </p>
            <div className="flex space-x-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-mint transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-mint transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
