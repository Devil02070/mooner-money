export function shortenAddress(address: string, startChars: number = 3, endChars: number = 5) {
    if (address.length <= startChars + endChars) {
        return address
    }
    const start = address.substring(0, startChars)
    const end = address.substring(address.length - endChars)
    return `${start}...${end}`
}