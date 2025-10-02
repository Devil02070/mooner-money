"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQueryState } from "nuqs"
import { Stake } from "./Stake";
import { Earn } from "./Earn";
import { Play } from "./Play";
interface BodyProps {
    authToken?: string;
}

export function Body({ authToken }: BodyProps) {

    const [activeTab, setActiveTab] = useQueryState("tab", {
        defaultValue: "earn",
        // Optional: add validation to ensure only valid tab values
        parse: (value) => {
            if (["earn", "stake", "play"].includes(value)) {
                return value;
            }
            return "earn"; // fallback to default
        }
    });

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-20 md:mb-0 mx-auto mt-4">
            <TabsList className="grid w-fit md:w-sm grid-cols-3 rounded-full mx-auto bg-card">
                <TabsTrigger value="earn" className="rounded-full cursor-pointer px-6">Earn</TabsTrigger>
                <TabsTrigger value="stake" className="rounded-full cursor-pointer px-6">Stake</TabsTrigger>
                <TabsTrigger value="play" className="rounded-full cursor-pointer px-6">Play</TabsTrigger>
            </TabsList>

            <TabsContent value="earn">
                <Earn authToken={authToken} />
            </TabsContent>
            <TabsContent value="stake">
                <Stake />
            </TabsContent>
            <TabsContent value="play">
                <Play authToken={authToken} />
            </TabsContent>
        </Tabs>
    )
}