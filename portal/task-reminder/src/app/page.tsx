import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import ProblemsSection from '@/components/ProblemsSection';
import FeaturesSection from '@/components/FeaturesSection';
import NotionIntegrationSection from '@/components/NotionIntegrationSection';
import PhilosophySection from '@/components/PhilosophySection';
import DownloadSection from '@/components/DownloadSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <HeroSection />
      <ProblemsSection />
      <FeaturesSection />
      <NotionIntegrationSection />
      <PhilosophySection />
      <DownloadSection />
      <Footer />
    </div>
  );
}
