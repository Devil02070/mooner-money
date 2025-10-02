type Price = { symbol: string, price: string };
const priceCache: Price[] = [];
async function binanceApiSymbolInUsd(symbol: string) {
    try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
        if (!response.ok) {
            throw new Error("Response not ok")
        }
        const data = await response.json();
        return { symbol: symbol, price : data.price }
    } catch (error) {
        console.log(`Fatal error in fetching price of ${symbol}: ${error}`)
    }
}

async function pollPrices() {
    try {
        console.log(`Initialized price scheduler`)
        priceCache.push(await binanceApiSymbolInUsd("APT") as Price)
        console.log(`Prices Fetched at ${Date.now()}`)
    } catch (error) {
        console.log(`Fatal error in polling prices: ${error}`)
    }
}

export function getPriceBySymbol(symbol: string) {
    return priceCache.find(p => p.symbol.toUpperCase() === symbol.toUpperCase())
}

pollPrices()
setInterval(()=>{
    pollPrices()
},60000)
