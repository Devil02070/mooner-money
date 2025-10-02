import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: number;
  onCopy?: (text: string) => void;
  disabled?: boolean;
}

export const CopyButton = ({
  text,
  className = "",
  size = 16,
  onCopy,
  disabled = false,
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (onCopy) onCopy(text);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={disabled}
          className={`
            relative p-1 rounded-md h-[1.5rem] w-[1.5rem]
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            ${className}
          `}
        >
          <span className="sr-only">Copy to clipboard</span>
          {copied ? (
            <Check
              size={size}
              className="text-green-600 transition-all duration-300 ease-out"
              style={{ transform: copied ? "scale(1.1)" : "scale(1)" }}
            />
          ) : (
            <Copy
              size={size}
              className={`transition-all duration-200 ${isHovered ? "text-muted-foreground" : "text-gray-500"
                }`}
              style={{
                transform: isHovered ? "scale(1.05)" : "scale(1)",
              }}
            />
          )}
          {/* Optional ripple effect */}
          {copied && (
            <div className="absolute inset-0 rounded-md bg-success/10 animate-ping-once" />
          )}
        </Button>
      </TooltipTrigger>

      <TooltipContent side="top" align="center">
        {copied ? "Copied!" : "Copy to clipboard"}
      </TooltipContent>
    </Tooltip>
  );
};
