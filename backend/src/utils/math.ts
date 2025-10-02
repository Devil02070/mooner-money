export function getBondingProgress(
    tokenReserves: number,
    initialTokenReserves: number,
    remainTokenReserves: number,
) {
    const totalSupply = initialTokenReserves - remainTokenReserves;
    const tokensSold = totalSupply - (tokenReserves - remainTokenReserves);
    return (tokensSold / totalSupply) * 100
}
