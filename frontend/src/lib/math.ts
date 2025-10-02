function getAmountIn(aptosReserves: number, tokenReserves: number, minCoins: number) {
    // get amount of aptos required to buy minCoins
    // fee not included
    // returns the desired amount of aptos for minCoins
    if(minCoins === 0 || !(aptosReserves > 0) || !(tokenReserves > 0)) {
        return 0;
    };
    return (aptosReserves * minCoins) / (tokenReserves - minCoins);
}

function getAmountOut(aptosReserves: number, tokenReserves: number, maxCoins: number) {
    // get amount of aptos received to sell maxCoins
    // fee not included
    // returns the expected aptos to receive for maxCoins
    if(maxCoins === 0 || !(aptosReserves > 0) || !(tokenReserves > 0)) {
        return 0;
    };
    return (aptosReserves * maxCoins) / (tokenReserves + maxCoins);
}

export function getAmountInWithFees(aptosReserves: number, tokenReserves: number, minCoins: number, feeInBps: number) {
    // expected aptos required with fee 
    const amountIn = getAmountIn(aptosReserves, tokenReserves, minCoins);
    console.log(amountIn);
    const feeAmount = amountIn * (feeInBps / 10000);
    return amountIn + feeAmount;
}

export function getAmountOutWithFees(aptosReserves: number, tokenReserves: number, maxCoins: number, feeInBps: number) {
    // expected aptos to receive after fee deduct
    const amountOut = getAmountOut(aptosReserves, tokenReserves, maxCoins);
    const feeAmount = amountOut * (feeInBps / 10000);
    return amountOut - feeAmount;
}

export function applySlippageInc(amount: number, slippage: number) {
  return amount * (1 + slippage / 100);
}

export function applySlippageDec(amount: number, slippage: number) {
  return amount * (1 - slippage / 100);
}

// Take fee from 
export function swapExactAptosForTokens(
    aptosReserves: number,
    tokenReserves: number,
    maxAptos: number,
    feeInBps: number
) {
     if (maxAptos === 0 || aptosReserves <= 0 || tokenReserves <= 0) {
        return 0;
    }

    const feeRate = 1 - feeInBps / 10000;
    const actualAptos = maxAptos * feeRate;

    return (tokenReserves * actualAptos) / (aptosReserves + actualAptos);
}

export function swapAptosForExactTokens(
    aptosReserves: number,
    tokenReserves: number,
    tokensOut: number,
    feeInBps: number
) {
    if (tokensOut === 0 || aptosReserves <= 0 || tokenReserves <= 0 || tokensOut >= tokenReserves) {
        return 0;
    }

    const feeRate = 1 - feeInBps / 10000;

    // effective input after fee
    const effectiveIn = (aptosReserves * tokensOut) / (tokenReserves - tokensOut);

    // actual input before fee deduction
    const requiredIn = effectiveIn / feeRate;

    return Math.ceil(requiredIn); // round up since you need at least this much
}
export function getMarketCap(
    aptosReserves: number,
    tokenReserves: number,
    initialTokenReserves: number,
) {
    // current price
    const price = aptosReserves / tokenReserves;
    return initialTokenReserves * price;
}

export function getBondingProgress(
    tokenReserves: number,
    initialTokenReserves: number,
    remainTokenReserves: number,
) {
    const totalSupply = initialTokenReserves - remainTokenReserves;
    const tokensSold = totalSupply - (tokenReserves - remainTokenReserves);
    return (tokensSold / totalSupply) * 100
}

export function getAmountToRaise(aptosReserves: number, tokenReserves: number, lockedPercentage: number) {
    const tokensToBuy = tokenReserves - (tokenReserves * lockedPercentage / 10000);
    const newY = tokenReserves - tokensToBuy;
    const k = aptosReserves * tokenReserves;
    const newX = k / newY;
    return newX - aptosReserves;
}