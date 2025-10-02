"use client"

import { type Dispatch, type SetStateAction, useState } from "react"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { H1, ButtonText, PBold, Small, XSSemiBold, PMedium } from "@/components/ui/typography"
import { ChevronDown, Info } from "lucide-react"

type QuickGuideModalProps = {
    open: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
}
type EarningsModalProps = {
    open: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
}

type DropdownItem = {
    color: string
    text: string
}

type DropdownSection = {
    id: string
    title: string
    description: string
    items: DropdownItem[]
}

type EarningCategory = {
    title: string
    sections: DropdownSection[]
}

const EARNINGS_DATA: EarningCategory[] = [
    {
        title: "Quest earning",
        sections: [
            {
                id: "questXP",
                title: "Quest reward",
                description: "",
                items: [
                    { color: "#FF6FCD", text: "Complete tasks and missions on the EARN page to earn guaranteed XP and other rewards. " },
                    { color: "#FF6FCD", text: "The more quests you complete, the more XP and benefits you unlock!" },
                ],
            },
            {
                id: "bonusMultipliers",
                title: "Bonus Multipliers",
                description: "",
                items: [
                    { color: "#FF6FCD", text: "Multiply your XP earnings through limited-time bonuses or partner events" },
                    { color: "#FF6FCD", text: "Look out for XP Boost campaigns to maximize your gains." },
                ],
            },
            {
                id: "additionalRewards",
                title: "Additional Rewards",
                description: "",
                items: [
                    { color: "#FF6FCD", text: "Random XP bonuses on every buy/sell action." },
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
                description: "",
                items: [
                    { color: "#FF6FCD", text: "Buy MOON tokens from Panora." },
                    { color: "#FF6FCD", text: "Stake for 30 days to earn a share of platform fees." },
                    { color: "#FF6FCD", text: "You can claim fees anytime, but unstaking is available only after 30 days." },
                ],
            },
            {
                id: "stakingMultiplier",
                title: "Staking Multipliers",
                description: "",
                items: [
                    { color: "#FF6FCD", text: "Longer staking periods and higher MOON amounts unlock better reward rates." },
                    { color: "#FF6FCD", text: "Stay staked and climb tiers to boost your share of rewards and XP. " },

                ],
            },
            {
                id: "stakingRewards",
                title: "Additional Rewards",
                description: "",
                items: [
                    { color: "#FF6FCD", text: " Random Token Airdrops from our ecosystem partners" },

                ],
            },
        ],
    },
    {
        title: "Spin spending",
        sections: [
            {
                id: "xpSpins",
                title: " XP Spins",
                description: "",
                items: [
                    { color: "#FF6FCD", text: "1 XP = 1 Spin with a chance to win rare items." },
                ],
            },

        ],
    },
]

const EarningsModal = ({ open, setOpen }: EarningsModalProps) => {
    const isMobile = useIsMobile()

    if (!isMobile) {
        return <EarningsDialog open={open} setOpen={setOpen} />
    }

    return <EarningsDrawer open={open} setOpen={setOpen} />
}

export default EarningsModal

function EarningsDialog({ open, setOpen }: QuickGuideModalProps) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="cursor-pointer">
                <ButtonText className="text-primary flex items-center gap-1">
                    Learn More <Info size={16} />
                </ButtonText>
            </DialogTrigger>
            <DialogContent
                showCloseButton={false}
                className="w-full max-w-lg bg-card rounded-3xl shadow-2xl p-5 flex flex-col"
            >

                <DialogTitle className="text-center hidden">{''}</DialogTitle>
                <H1 className="text-center">How earning works </H1>
                <EarningsContent setOpen={setOpen} />

                <DialogFooter>
                    <DialogClose className="bg-primary w-full text-primary-foreground text-[1rem] leading-[1.125rem] font-medium hover:bg-primary/90 px-4.5 py-3 h-[2.625rem] rounded-[12px] cursor-pointer">
                        <ButtonText className="text-black">Got it</ButtonText>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function EarningsDrawer({ open, setOpen }: EarningsModalProps) {
    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger className="cursor-pointer">
                <ButtonText className="text-primary flex items-center gap-1">
                    Learn More <Info size={16} />
                </ButtonText>
            </DrawerTrigger>
            <DrawerContent className="bg-card">
                <DrawerTitle className="text-center">{''}</DrawerTitle>
                <H1 className="text-center mt-4">How earning works </H1>
                <div className="mt-6">
                    <EarningsContent setOpen={setOpen} />
                </div>
                <DrawerFooter className="pt-4 px-0">
                    <DrawerClose className="bg-primary text-primary-foreground text-[1rem] leading-[1.125rem] font-medium hover:bg-primary/90 py-3 h-[2.625rem] rounded-[12px] cursor-pointer">
                        <ButtonText className="w-full text-black">Got it</ButtonText>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

function DropdownSection({
    section,
    isExpanded,
    onToggle,
}: {
    section: DropdownSection
    isExpanded: boolean
    onToggle: () => void
}) {
    return (
        <div
            className={`p-3 rounded-[12px] cursor-pointer transition-colors ${isExpanded ? "bg-card-light" : "bg-background"}`}
            onClick={onToggle}
        >
            <div className="flex justify-between items-center">
                <PBold>{section.title}</PBold>
                <ChevronDown className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </div>
            {isExpanded && (
                <div className="mt-3 space-y-2">
                    <div>
                        <Small>{section.description}</Small>
                    </div>
                    {section.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="p-1.5 rounded-full overflow-hidden" style={{ backgroundColor: item.color }} />
                            <PMedium>{item.text}</PMedium>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function EarningsContent({
    className,
}: {
    setOpen: Dispatch<SetStateAction<boolean>>
    className?: string
}) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }))
    }

    return (
        <div className={`max-h-[50vh] flex flex-col overflow-hidden overflow-y-auto space-y-4 ${className || ""}`}>
            {EARNINGS_DATA.map((category, categoryIndex) => (
                <div key={categoryIndex} className="space-y-2">
                    <XSSemiBold className="text-muted">{category.title}</XSSemiBold>
                    {category.sections.map((section) => (
                        <DropdownSection
                            key={section.id}
                            section={section}
                            isExpanded={expandedSections[section.id] || false}
                            onToggle={() => toggleSection(section.id)}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}