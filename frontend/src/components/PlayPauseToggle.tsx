"use client"

import { useState } from "react";
import { IoPlayOutline, IoPauseOutline } from "react-icons/io5";

interface PlayPauseToggleProps {
    className?: string;
    onToggle?: (isPlaying: boolean) => void;
    initialState?: boolean;
}

export function PlayPauseToggle({
    className = "h-5 w-5 cursor-pointer hover:text-primary-default transition-all duration-300",
    onToggle,
    initialState = false
}: PlayPauseToggleProps) {
    const [isPlaying, setIsPlaying] = useState(initialState);

    const handleToggle = () => {
        const newState = !isPlaying;
        setIsPlaying(newState);
        onToggle?.(newState);
    };

    return (
        <button
            onClick={handleToggle}
            className="p-0 border-0 bg-transparent"
            aria-label={isPlaying ? "Pause" : "Play"}
        >
            {isPlaying ? (
                <IoPauseOutline className={className} />
            ) : (
                <IoPlayOutline className={className} />
            )}
        </button>
    );
}