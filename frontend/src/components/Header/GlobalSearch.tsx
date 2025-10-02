'use client'
import React from "react";
import { Input } from "../ui/input";
import { Search } from "lucide-react";

const GlobalSearch = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, onClick, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`relative max-w-sm cursor-pointer border md:border-0 w-fit md:w-full p-2 md:p-0 rounded-lg ${className || ""}`}
      onClick={onClick}
      {...props}
    >
      {/* Search Icon */}
      <Search className="md:absolute md:left-3 md:top-1/2 transform md:-translate-y-1/2 pointer-events-auto  md:pointer-events-none" size={18} />

      {/* Input - styled as trigger */}
      <Input
        type="text"
        placeholder="Search..."
        className="pl-9 hidden md:block pr-3 max-w-[13rem] cursor-pointer"
        readOnly
        tabIndex={-1}
      />
    </div>
  );
});

GlobalSearch.displayName = "GlobalSearch";

export default GlobalSearch;