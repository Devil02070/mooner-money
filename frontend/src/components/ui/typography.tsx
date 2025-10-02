import { cn } from "@/lib/utils"
import { type HTMLAttributes, forwardRef, ElementType } from "react"

type TypographyElement = HTMLHeadingElement | HTMLParagraphElement | HTMLElement
type TypographyTag =
  | "h1"
  | "h2"
  | "h3"
  | "h1-xl"
  | "p"
  | "p-medium"
  | "p-semi-bold"
  | "p-bold"
  | "p-button-link"
  | "small"
  | "small-link"
  | "xs"
  | "xs-medium"
  | "xs-semi-bold"
  | "xs-link"
  | "label-button"
  | "label-12"
  | "label-14"
  | "button-text"

interface TypographyProps extends HTMLAttributes<TypographyElement> {
  as?: TypographyTag
}

const Typography = forwardRef<TypographyElement, TypographyProps>(
  ({ className, as = "p", children, ...props }, ref) => {
    const Component = (
      as === "small" || as === "small-link"
        ? "small"
        : as === "xs" ||
          as === "xs-medium" ||
          as === "xs-semi-bold" ||
          as === "xs-link"
          ? "small"
          : as === "label-button" || as === "label-12" || as === "label-14"
            ? "span"
            : as === "button-text"
              ? "span"
              : as.startsWith("h")
                ? as
                : "p"
    ) as ElementType

    const variants = {
      // Headings
      h1: "font-urbanist text-xl md:text-2xl font-semibold md:font-bold leading-5 md:leading-[27px] tracking-[0.2px] md:tracking-[0.24px] text-foreground",
      h2: "font-urbanist text-lg md:text-xl font-semibold leading-5 tracking-[0.18px] md:tracking-[0.2px] text-foreground",
      h3: "font-urbanist text-lg font-semibold leading-5 tracking-[0.18px] text-foreground",
      "h1-xl": "text-[24px] md:text-[2rem] leading-[24px] md:leading-[2rem] font-bold",
      // Paragraphs
      p: "font-urbanist text-sm font-normal leading-6",
      "p-medium": "font-urbanist text-sm font-medium leading-6",
      "p-semi-bold": "font-urbanist text-sm font-semibold leading-6",
      "p-bold": "font-urbanist text-sm font-extrabold leading-6 ",
      "p-button-link": "font-urbanist text-sm font-normal leading-[14px]",

      // Small text
      small: "font-urbanist text-xs font-medium leading-[21px]",
      "small-link": "font-urbanist text-xs font-normal leading-[14px]",

      // Extra small text
      xs: "font-urbanist text-[10px] font-normal leading-[10px]",
      // [&:not(:first-child)]:mt-3

      "xs-medium": "font-urbanist text-[10px] font-medium leading-[10px] ",
      "xs-semi-bold": "font-urbanist text-[10px] font-semibold leading-[10px]",
      "xs-link": "font-urbanist text-[10px] font-normal leading-[10px]",

      // Button text variant ✅
      "button-text": "font-urbanist text-[1rem] font-medium leading-[1.125rem] text-foreground",

      // Labels
      "label-button": "font-urbanist text-sm font-medium leading-4",
      "label-12": "font-urbanist text-xs font-medium leading-3",
      "label-14": "font-urbanist text-sm font-bold leading-[14px]",
    }

    return (
      <Component
        className={cn(variants[as], className)}
        ref={ref}
        {...props}
      >
        {children}
      </Component>
    )
  },
)

Typography.displayName = "Typography"

export { Typography }

// Heading components
export function H1({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <Typography as="h1" className={className} {...props} />
}

export function H2({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <Typography as="h2" className={className} {...props} />
}

export function H3({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <Typography as="h3" className={className} {...props} />
}
export function H1Xl({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <Typography as="h1-xl" className={className} {...props} />
}


// Paragraph components
export function P({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <Typography as="p" className={className} {...props} />
}

export function PMedium({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <Typography as="p-medium" className={className} {...props} />
}

export function PSemiBold({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <Typography as="p-semi-bold" className={className} {...props} />
}

export function PBold({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <Typography as="p-bold" className={className} {...props} />
}

export function PButtonLink({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <Typography as="p-button-link" className={className} {...props} />
}

// Small text components
export function Small({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <Typography as="small" className={className} {...props} />
}

export function SmallLink({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <Typography as="small-link" className={className} {...props} />
}

// Extra small text components
export function XS({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <Typography as="xs" className={className} {...props} />
}

export function XSMedium({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <Typography as="xs-medium" className={className} {...props} />
}

export function XSSemiBold({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <Typography as="xs-semi-bold" className={className} {...props} />
}

export function XSLink({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <Typography as="xs-link" className={className} {...props} />
}

// Label components
export function LabelButton({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <Typography as="label-button" className={className} {...props} />
}

export function Label12({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <Typography as="label-12" className={className} {...props} />
}

export function Label14({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <Typography as="label-14" className={className} {...props} />
}

// ✅ Button text component
export function ButtonText({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <Typography as="button-text" className={className} {...props} />
}

// Inline text helpers
export function TextMedium({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <span
      className={cn("font-urbanist text-sm font-medium leading-6 text-foreground", className)}
      {...props}
    />
  )
}

export function TextSemiBold({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <span
      className={cn("font-urbanist text-sm font-semibold leading-6 text-foreground", className)}
      {...props}
    />
  )
}

export function TextBold({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <span
      className={cn("font-urbanist text-sm font-extrabold leading-6 text-foreground", className)}
      {...props}
    />
  )
}