import React from 'react'

interface IntervalTabsProps {
    currentInterval: number;
    onIntervalChange: (interval: number) => void
}



const IntervalTabs = ({ currentInterval, onIntervalChange }: IntervalTabsProps) => {
    const intervals = ['5m', '15m', '1h', '4h', '1d']

    function intervalToSeconds(interval: string): number {
        const unit = interval.slice(-1); // last char (m, h, d)
        const value = parseInt(interval.slice(0, -1), 10);

        switch (unit) {
            case 'm':
                return value * 60;
            case 'h':
                return value * 60 * 60;
            case 'd':
                return value * 60 * 60 * 24;
            default:
                throw new Error(`Unknown interval unit: ${unit}`);
        }
    }
    return (
        <div className='flex gap-2'>
            {intervals.map((interval) => (
                <button
                    key={interval}
                    onClick={() => onIntervalChange(intervalToSeconds(interval))}
                    className={`p-1 px-2 rounded-md transition-colors cursor-pointer text-sm ${currentInterval === intervalToSeconds(interval)
                        ? 'bg-card-light text-primary'
                        : ''
                        }`}
                // className={`p-1 min-w-[50px] rounded-lg transition-colors cursor-pointer ${currentInterval === intervalToSeconds(interval)
                //     ? 'bg-card-light text-primary'
                //     : ''
                //     }`}
                >
                    {interval}
                </button>
            ))}
        </div>
    )
}

export default IntervalTabs