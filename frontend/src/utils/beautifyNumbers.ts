interface BeautifyNumberOptions {
    showDash?: boolean;
    showDollar?: boolean;
    minZerosForSubscript?: number; // Minimum zeros to use subscript notation (default: 6)
    maxDigitsAfterZeros?: number; // Max digits to show after zeros (default: 3)
}

export function beautifyNumber(
    num: number | string,
    options: BeautifyNumberOptions = {}
): string {
    const {
        showDash = false,
        showDollar = false,
        minZerosForSubscript = 6,
        maxDigitsAfterZeros = 3,
    } = options;

    const n = Number(num);
    if (isNaN(n)) return showDash ? "-" : "0";
    if (n === 0) return showDash ? "-" : showDollar ? "$0" : "0";

    const absN = Math.abs(n);
    const isNegative = n < 0;
    const prefix = `${isNegative ? "-" : ""}${showDollar ? "$" : ""}`;

    // Subscript mapping for all digits 0-9
    const subscriptMap: Record<string, string> = {
        "0": "₀",
        "1": "₁",
        "2": "₂",
        "3": "₃",
        "4": "₄",
        "5": "₅",
        "6": "₆",
        "7": "₇",
        "8": "₈",
        "9": "₉",
    };

    // Handle very small numbers (< 1) with custom zero notation
    if (absN < 1 && absN > 0) {
        let str = absN.toString();

        // Handle scientific notation (e.g., 1.0024999999999999e-8)
        if (str.includes("e")) {
            const [, exponent] = str.split("e");
            const exp = Math.abs(parseInt(exponent, 10));

            // Convert to decimal format for processing
            const decimalValue = absN.toFixed(exp + 10); // Extra precision to avoid rounding
            str = decimalValue;
        }

        // Match pattern like 0.00000123 to extract zeros and digits
        const match = str.match(/^0\.0*(\d+)/);
        if (match) {
            const afterDecimal = str.split(".")[1];
            const leadingZeros = afterDecimal.match(/^0*/)?.[0] || "";
            const zeroCount = leadingZeros.length;
            const remainingDigits = afterDecimal.slice(zeroCount);

            // Take the specified number of digits first, then clean up precision issues
            let displayDigits = remainingDigits.slice(0, maxDigitsAfterZeros);
            
            // Only clean up obvious floating point errors at the end
            // Look for patterns like ...999999 or ...000000 at the end of a longer string
            if (displayDigits.length === maxDigitsAfterZeros && remainingDigits.length > maxDigitsAfterZeros) {
                // Check if we have obvious floating point artifacts
                const remaining = remainingDigits.slice(maxDigitsAfterZeros);
                
                // If the remaining part is all 9s or all 0s, it might be a precision issue
                if (/^9+$/.test(remaining) && remaining.length >= 6) {
                    // Round up the last digit if we have many trailing 9s
                    const lastDigitIndex = displayDigits.length - 1;
                    const lastDigit = parseInt(displayDigits[lastDigitIndex]);
                    if (lastDigit < 9) {
                        displayDigits = displayDigits.slice(0, lastDigitIndex) + (lastDigit + 1);
                    }
                } else if (/^0+$/.test(remaining) && remaining.length >= 6) {
                    // Remove trailing zeros if we have many of them
                    displayDigits = displayDigits.replace(/0+$/, "");
                }
            }

            if (zeroCount >= minZerosForSubscript) {
                // Use subscript notation: 0.0₆789
                const subscript = zeroCount
                    .toString()
                    .split("")
                    .map((digit) => subscriptMap[digit] || digit)
                    .join("");

                return `${prefix}0.0${subscript}${displayDigits}`;
            } else if (zeroCount > 0) {
                // Show all zeros normally: 0.00123
                const zeros = "0".repeat(zeroCount);
                return `${prefix}0.${zeros}${displayDigits}`;
            } else {
                // No leading zeros, just format normally
                const formatted = parseFloat(str)
                    .toFixed(maxDigitsAfterZeros)
                    .replace(/\.?0+$/, "");
                return `${prefix}${formatted}`;
            }
        }
    }

    // Handle extremely large numbers (≥ 1 trillion)
    if (absN >= 1_000_000_000_000) {
        const value = n / 1_000_000_000_000;

        // For numbers >= 1e21, use scientific notation to avoid precision issues
        if (absN >= 1e21) {
            return `${prefix}${(n / 1e12).toExponential(2)}T`;
        } else {
            const formatted = formatDecimal(value, 2);
            return `${prefix}${formatted}T`;
        }
    }

    // Handle billions
    if (absN >= 1_000_000_000) {
        const value = n / 1_000_000_000;
        const formatted = formatDecimal(value, 2);
        return `${prefix}${formatted}B`;
    }

    // Handle millions
    if (absN >= 1_000_000) {
        const value = n / 1_000_000;
        const formatted = formatDecimal(value, 2);
        return `${prefix}${formatted}M`;
    }
    // Handle thousands
    if (absN >= 1_000) {
        const value = n / 1_000;
        const formatted = formatDecimal(value, 2);
        return `${prefix}${formatted}K`;
    }

    // Handle thousands and smaller numbers
    const formatted = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 3,
        minimumFractionDigits: 0,
    }).format(absN);

    return `${prefix}${formatted}`;
}

// Helper function to format decimal numbers
function formatDecimal(value: number, maxDecimals: number): string {
    return value.toFixed(maxDecimals).replace(/\.?0+$/, "");
}

// Usage examples and type-safe variants:

// Option 1: Using the main function with options object
export function beautifyNumberWithDash(
    num: number | string,
    showDollar = false
): string {
    return beautifyNumber(num, { showDash: true, showDollar });
}

export function beautifyNumberNoDash(
    num: number | string,
    showDollar = false
): string {
    return beautifyNumber(num, { showDash: false, showDollar });
}

export function beautifyDollar(num: number | string, showDash = true): string {
    return beautifyNumber(num, { showDash, showDollar: true });
}

// Custom configurations
export function beautifyNumberCustomZeros(
    num: number | string,
    minZeros = 4,
    maxDigits = 2,
    showDollar = false
): string {
    return beautifyNumber(num, {
        minZerosForSubscript: minZeros,
        maxDigitsAfterZeros: maxDigits,
        showDollar,
    });
}