"use client";
import React, { useEffect, useState } from "react";
import { formatNumber } from "@/lib/formatNumber";

interface DexPair {
  volume: { h24: number };
  fdv: number;
  priceUsd: string;
}

const API_URL =
  "https://api.dexscreener.com/latest/dex/pairs/aptos/liquidswapv0p5-10294";

const Stats: React.FC = () => {
  const [data, setData] = useState<DexPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch stats");

      const result = await res.json();
      const pair = result?.pair;

      if (pair) {
        setData({
          volume: { h24: pair.volume.h24 },
          fdv: pair.fdv,
          priceUsd: pair.priceUsd,
        });
      } else {
        setError("No pair data found");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDisplayValue = (value: number | string | undefined) => {
    if (loading || error || !data) return "0";
    return formatNumber(value);
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string | undefined;
    bgColor: string;
    className?: string;
  }> = ({ title, value, bgColor, className }) => (
    <div
      className={`p-6 rounded-xl border border-black ${className}`}
      style={{
        backgroundColor: bgColor,
        boxShadow: "7px 12px 0 0 #000",
      }}
    >
      <h2
        className="font-normal"
        style={{ fontSize: "clamp(20px, 2vw, 32px)" }}
      >
        {title}
      </h2>
      <h1
        className="font-normal"
        style={{ fontSize: "clamp(50px, 5vw, 60px)" }}
      >
        $ {getDisplayValue(value)}
      </h1>
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <div className="relative mt-20 mb-40 hidden md:flex flex-col px-4 md:px-[5%] h-[60vh] justify-center items-center">
        <h1
          className="text-[82px] mb-20 text-outline text-white font-bold"
          style={{ textShadow: "7px 12px 0 #000" }}
        >
          stats
        </h1>

        <div className="relative w-full max-w-[1200px] h-full">
          <StatCard
            title="Market Cap"
            value={data?.fdv}
            bgColor="#FAE94F"
            className="absolute top-[0%] left-[10%] w-sm"
          />
          <StatCard
            title="24 HRS Volume"
            value={data?.volume.h24}
            bgColor="#CE79FC"
            className="absolute bottom-[30%] left-[38%] w-sm"
          />
          <StatCard
            title="Current Price"
            value={data?.priceUsd}
            bgColor="#79E6FC"
            className="absolute top-[19%] right-[2%] w-sm"
          />
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col px-[5%] mb-20 justify-center items-center">
        <h1
          className="text-[82px] mb-20 text-outline text-white font-bold"
          style={{ textShadow: "7px 12px 0 #000" }}
        >
          stats
        </h1>

        <div className="w-full flex flex-col items-center gap-5 max-w-[1200px] h-full">
          <StatCard title="Market Cap" value={data?.fdv} bgColor="#FAE94F" className="w-full" />
          <StatCard
            title="24 HRS Volume"
            value={data?.volume.h24}
            bgColor="#CE79FC"
            className="w-full"
          />
          <StatCard
            title="Current Price"
            value={data?.priceUsd}
            bgColor="#79E6FC"
            className="w-full"
          />
        </div>
      </div>
    </>
  );
};

export default Stats;
