import Image from "next/image"
import Link from "next/link"
import Header from "./Header"
import FallingText from "@/components/falling-text"

const Hero = () => {
  const imageUrl = "url('/meow-hero.webp');"
  return (
    <div
      className="relative text-center  bg-hero -z-10 h-[100vh] flex  flex-col items-center "
      style={{ backgroundImage: imageUrl }}
    >
      <Header />
      {/* Background Image */}
      <div className="absolute  -z-10 bottom-0">
        <Image src="/hero-billa.webp" alt="Hero Background" className="pointer-events-none " height={639} width={531} />
      </div>

      {/* Hero Heading */}
      <div className=" mt-10 md:mt-10 space-y-7">
        <h1
          className=" text-[46px] md:text-[82px] text-outline z-10 text-white font-bold"
          style={{ textShadow: "7px 12px 0 #000" }}
        >
          Nine lives. one chain <br />
          Infinite vibes.
        </h1>
        <Link
          href="https://app.panora.exchange/swap/aptos?pair=APT-MEOW"
          target="_blank"
          className="z-20 cursor-pointer top-1/2"
        >
          <button className="px-6 py-3 rounded-xl bg-[#CE79FC] border-2 border-black text-white font-semibold text-lg shadow-[2.127px_3.646px_0_0_#000] transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-[4px_6px_0_0_#000] active:scale-95">
            <h3 className="text-2xl font-normal" style={{ textShadow: "2.127px 3.646px 0 #000" }}>
              Buy Now
            </h3>
          </button>
        </Link>
      </div>

      <FallingText
        text={`MEOW! UPONLY! WENMOON BUY MEOW! APT LOL MEOW! Gib LFG YES MEOW! UPONLY! WENMOON BUY MEOW! APT LOL `}
        highlightWords={["WENMOON", "BUY", "MEOW!", "MEOW!", "UPONLY!"]}
        trigger="scroll"
        backgroundColor="transparent"
        wireframes={false}
        gravity={0.56}
        fontSize="2rem"
        mouseConstraintStiffness={0.5}
      />
    </div>
  )
}

export default Hero
