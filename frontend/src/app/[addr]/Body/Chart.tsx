"use client";

import React, { useEffect, useRef } from "react";
import {
    createChart,
    IChartApi,
    ISeriesApi,
} from "lightweight-charts";
import { ChartData } from "@/types/custom";
import { RoundedCandleSeries } from '@/plugins/rounded-candles-series';

export function Chart({ data, isDev }: { data: ChartData[], isDev: boolean }) {
    const chartRef = useRef<HTMLDivElement | null>(null);
    const chartInstance = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Custom"> | null>(null);
    // const priceLinesRef = useRef<Map<string, IPriceLine>>(new Map());


    useEffect(() => {
        if (!chartRef.current) return;
        const chart = createChart(chartRef.current, {
            autoSize: true,
            layout: { textColor: "white", background: { color: "black" } },
            grid: { vertLines: { color: "rgba(255,255,255,0.1)" }, horzLines: { color: "rgba(255,255,255,0.1)" } },
            width: chartRef.current.clientWidth,
            height: 400,
        });
        chartInstance.current = chart;
        const customSeriesView = new RoundedCandleSeries();
        const myCustomSeries = chart.addCustomSeries(customSeriesView, {
            upColor: "#19890D",
            downColor: "#F24138",
            borderVisible: false,
            wickUpColor: "#19890D",
            wickDownColor: "#F24138",
            priceFormat: { type: "price", precision: 8, minMove: 0.00000001 },
            lastValueVisible: true,
            
        });

        // chart.timeScale().applyOptions({
        //     barSpacing: 10,
        //     borderColor: '#000',
        //     rightOffset: 20,  // Small padding on the right
        //     fixLeftEdge: false,  // Allow scrolling to center
        //     fixRightEdge: false, // Allow scrolling to center
        // });

        // chartInstance.current = chart;
        // const series = chart.addSeries(CandlestickSeries, {
        //     upColor: "#19890D",
        //     downColor: "#F24138",
        //     borderVisible: false,
        //     wickUpColor: "#19890D",
        //     wickDownColor: "#F24138",
        //     priceFormat: { type: "price", precision: 8, minMove: 0.00000001 },
        //     lastValueVisible: true,
        //     // borderRadius: 4, // Add rounded corners to candlesticks
        // });

        seriesRef.current = myCustomSeries;

        return () => {
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (!seriesRef.current || !chartInstance.current) return;
        seriesRef.current.setData(data);
        // const newLines: Map<string, { price: number; color: string; title: string }> = new Map();

        // data.forEach(d => {
        //     const markers = isDev
        //         ? [
        //             ...(d.user?.buy ? [{ id: `user-buy-${d.time}`, price: d.open * 0.999, color: 'skyblue', title: 'BUY' }] : []),
        //             ...(d.user?.sell ? [{ id: `user-sell-${d.time}`, price: d.close * 1.002, color: 'purple', title: 'SELL' }] : []),
        //         ]
        //         : [
        //             ...(d.dev?.buy ? [{ id: `dev-buy-${d.time}`, price: d.open * 0.999, color: 'yellow', title: 'DEV BUY' }] : []),
        //             ...(d.dev?.sell ? [{ id: `dev-sell-${d.time}`, price: d.close * 1.002, color: 'tomato', title: 'DEV SELL' }] : []),
        //             ...(d.user?.buy ? [{ id: `user-buy-${d.time}`, price: d.open * 0.999, color: 'skyblue', title: 'BUY' }] : []),
        //             ...(d.user?.sell ? [{ id: `user-sell-${d.time}`, price: d.close * 1.002, color: 'purple', title: 'SELL' }] : []),
        //         ];

        //     markers.forEach(marker => newLines.set(marker.id, { price: marker.price, color: marker.color, title: marker.title }));
        // });

        // priceLinesRef.current.forEach((line, id) => {
        //     if (!newLines.has(id)) {
        //         seriesRef.current!.removePriceLine(line);
        //         priceLinesRef.current.delete(id);
        //     }
        // });

        // newLines.forEach(({ price, color, title }, id) => {
        //     if (!priceLinesRef.current.has(id)) {
        //         const line = seriesRef.current!.createPriceLine({
        //             price,
        //             color,
        //             lineWidth: 1,
        //             lineStyle: LineStyle.SparseDotted,
        //             title,
        //             axisLabelVisible: true,

        //         });
        //         priceLinesRef.current.set(id, line);
        //     } else {
        //         const line = priceLinesRef.current.get(id)!;
        //         line.applyOptions({ price, color });
        //     }
        // });
        chartInstance.current?.timeScale().applyOptions({
            timeVisible: true,
            visible: true
        })
    }, [data, isDev]);

    return <div ref={chartRef} style={{ width: "100%", height: "400px", position: "relative", overflow: "hidden", zIndex: "10" }} />;
}