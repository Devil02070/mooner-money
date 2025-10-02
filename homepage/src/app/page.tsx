import Hero from "./sections/Hero";
import Header from "./sections/Header";
import About from "./sections/About";
import Vision from "./sections/Vision";
import Buy from "./sections/Buy";
import Stats from "./sections/Stats";
import Cta from "./sections/Cta";
import Footer from "./sections/Footer";

export default function Home() {
  return (
    <div className="bg-[#FCFEF3] sticky ">
      
      <Hero />
      <About />
      <Vision />
      <Buy />
      <Stats />
      <Cta />
      <Footer />
    </div>
  );
}
