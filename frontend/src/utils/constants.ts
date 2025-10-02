import { GoGift } from "react-icons/go";

export const Twitter_Link = "/";
export const Telegram_Link = "/";
export const navItems = [
    {
        title: "Explore",
        url: "/",
        icon: IoCompassOutline,
        disabled: false,
    },
    {
        title: "Launch",
        url: "/launch",
        icon: IoRocketOutline,
        disabled: false,
    },
    {
        title: "Rewards",
        url: "/rewards",
        icon: GoGift,
        disabled: true,
    },
];

export const EARNINGS_DATA = [
    {
        title: "Quest earning",
        sections: [
            {
                id: "questXP",
                title: "How XP works",
                description: "Below are the points given based on NFT rarity.",
                items: [
                    { color: "#FF6FCD", text: "Common -- 8.64/day" },
                    { color: "#FF6FCD", text: "Uncommon -- 17.28/day" },
                ],
            },
            {
                id: "questRewards",
                title: "Quest Rewards",
                description:
                    "Complete quests to earn additional rewards and multipliers.",
                items: [
                    { color: "#4ADE80", text: "Daily Quest -- 50 XP bonus" },
                    { color: "#60A5FA", text: "Weekly Quest -- 200 XP bonus" },
                    { color: "#F59E0B", text: "Special Quest -- 500 XP bonus" },
                ],
            },
            {
                id: "questBonus",
                title: "Bonus Multipliers",
                description:
                    "Earn multipliers by completing quest streaks and achievements.",
                items: [
                    {
                        color: "#8B5CF6",
                        text: "7-day streak -- 1.2x multiplier",
                    },
                    {
                        color: "#EC4899",
                        text: "30-day streak -- 1.5x multiplier",
                    },
                    {
                        color: "#EF4444",
                        text: "Achievement unlock -- 2x multiplier",
                    },
                ],
            },
        ],
    },
    {
        title: "Staking earning",
        sections: [
            {
                id: "stakingBasic",
                title: "How Staking works",
                description: "Below are the points given based on NFT rarity.",
                items: [
                    { color: "#FF6FCD", text: "Common -- 8.64/day" },
                    { color: "#FF6FCD", text: "Uncommon -- 17.28/day" },
                ],
            },
            {
                id: "stakingMultiplier",
                title: "Staking Multipliers",
                description:
                    "Longer staking periods earn higher multipliers and bonus rewards.",
                items: [
                    { color: "#10B981", text: "30 days -- 1.1x multiplier" },
                    { color: "#3B82F6", text: "90 days -- 1.25x multiplier" },
                    { color: "#7C3AED", text: "180 days -- 1.5x multiplier" },
                ],
            },
            {
                id: "stakingRewards",
                title: "Additional Rewards",
                description:
                    "Earn bonus tokens and exclusive rewards through staking.",
                items: [
                    {
                        color: "#F59E0B",
                        text: "Rare NFT drops -- Monthly chance",
                    },
                    {
                        color: "#EF4444",
                        text: "Governance tokens -- Weekly rewards",
                    },
                    {
                        color: "#8B5CF6",
                        text: "Exclusive access -- Special events",
                    },
                ],
            },
        ],
    },
];

import { Time } from "lightweight-charts"; // Assuming you're using lightweight-charts
import { ChartData } from "@/types/custom";
import { IoCompassOutline, IoRocketOutline } from "react-icons/io5";

// Dummy Chart Data
export const dummyChartData: ChartData[] = Array.from(
    { length: 15 },
    (_, i) => {
        const basePrice = 100 + Math.random() * 20; // Random price around 100–120
        const open = parseFloat((basePrice + Math.random() * 5).toFixed(2));
        const close = parseFloat(
            (open + (Math.random() - 0.5) * 10).toFixed(2)
        );
        const high =
            Math.max(open, close) + parseFloat((Math.random() * 5).toFixed(2));
        const low =
            Math.min(open, close) - parseFloat((Math.random() * 5).toFixed(2));

        return {
            time: (Math.floor(Date.now() / 1000) - (15 - i) * 60) as Time, // last 15 mins
            open,
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close,
            dev: {
                buy: Math.floor(Math.random() * 50),
                sell: Math.floor(Math.random() * 50),
            },
            user: {
                buy: Math.floor(Math.random() * 10),
                sell: Math.floor(Math.random() * 10),
            },
        };
    }
);

// function intervalToSeconds(interval: string): number {
//     const value = parseInt(interval.slice(0, -1)); // numeric part
//     const unit = interval.slice(-1); // last character (m, h, d)

//     switch (unit) {
//         case "m":
//             return value * 60;
//         case "h":
//             return value * 60 * 60;
//         case "d":
//             return value * 24 * 60 * 60;
//         default:
//             return 60; // fallback 1 min
//     }
// }
