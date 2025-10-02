'use client'
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export function useCountdown(unixTs: number) {
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {

    const interval = setInterval(() => {
      const now = dayjs().unix();

      if (now > unixTs) {
        setCountdown("00d:00h:00m");
      } else {
        const d = dayjs.duration(unixTs, "seconds");
        setCountdown(`${d.days()}d ${d.hours()}h ${d.minutes()}m ${d.seconds()}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [unixTs]);

  return { countdown };
}