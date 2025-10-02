export const formatNumber = (num: number | string | undefined): string => {
    if (num === undefined || num === null || isNaN(Number(num))) return "0";

    const value = Number(num);

    if (value >= 1000000000) {
        // For billions and above, add B
        const billions = value / 1000000000;
        return billions % 1 === 0 ? `${billions}B` : `${billions.toFixed(2)}B`;
    } else if (value >= 1000000) {
        // For millions, add M
        const millions = value / 1000000;
        return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(2)}M`;
    } else if (value >= 1000) {
        // For thousands, add K
        const thousands = value / 1000;
        return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(2)}K`;
    } else if (value >= 1) {
        // For numbers 1 and above, show up to 2 decimal places
        return value % 1 === 0 ? value.toString() : value.toFixed(2);
    } else if (value > 0) {
        // For small decimal numbers, use subscript notation
        const str = value.toString();

        // Handle scientific notation
        if (str.includes('e')) {
            const exponent = parseInt(str.split('e')[1]);
            if (exponent < 0) {
                const zerosCount = Math.abs(exponent) - 1;
                const coefficient = parseFloat(str.split('e')[0]);
                const subscriptNumbers = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
                const subscript = zerosCount.toString().split('').map(digit => subscriptNumbers[parseInt(digit)]).join('');
                return `0.0${subscript}${coefficient.toString().replace('.', '')}`;
            }
            return value.toFixed(8).replace(/\.?0+$/, '');
        }

        // Count leading zeros after decimal point
        const decimalPart = str.split('.')[1];
        if (decimalPart) {
            const match = decimalPart.match(/^0*/);
            const leadingZeros = match ? match[0].length : 0;

            if (leadingZeros >= 2) {
                // For numbers like 0.00004066, show as 0.0₄4066
                const subscriptNumbers = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
                const zerosCount = leadingZeros;
                const subscript = zerosCount.toString().split('').map(digit => subscriptNumbers[parseInt(digit)]).join('');

                // Get the significant digits after the zeros
                const significantPart = decimalPart.substring(leadingZeros);
                const trimmedSignificant = significantPart.substring(0, 4); // Show first 4 significant digits

                return `0.0${subscript}${trimmedSignificant}`;
            } else {
                // Regular decimal formatting
                return value.toFixed(4).replace(/\.?0+$/, '');
            }
        }

        return value.toString();
    } else {
        return "0";
    }
};