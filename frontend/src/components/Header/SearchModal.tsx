"use client"

import { type Dispatch, type SetStateAction, useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIsMobile } from "@/hooks/use-mobile"
import { H1, P, Label14, XS, Label12 } from "@/components/ui/typography"
import { Search, X, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { BACKEND_URL } from "@/lib/env"
import type { Token } from "@/types/custom"
import GlobalSearch from "./GlobalSearch"
import { getMarketCap } from "@/lib/math"
import { useApp } from "@/providers/AppProvider"
import { beautifyNumber } from "@/utils/beautifyNumbers"

type ApiResponse = {
  data: Token[]
}

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// API fetch function
const fetchTokens = async (search: string): Promise<ApiResponse> => {
  if (!search.trim()) {
    return { data: [] }
  }

  const response = await fetch(`${BACKEND_URL}/api/token/get?search=${encodeURIComponent(search)}`)

  if (!response.ok) {
    throw new Error("Failed to fetch tokens")
  }

  return response.json()
}

// const SearchModal = ({ open, setOpen }: SearchModalProps) => {
const SearchModal = () => {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  if (!isMobile) {
    return <SearchDialog open={open} setOpen={setOpen} />
  }

  return <SearchDrawer open={open} setOpen={setOpen} />
}

export default SearchModal

type SearchModalProps = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

function SearchDialog({ open, setOpen }: SearchModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <GlobalSearch />
      </DialogTrigger>
      <DialogTitle>{''}</DialogTitle>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-lg bg-card rounded-3xl shadow-2xl p-5 flex flex-col max-h-[80vh]"
      >
        <SearchContent setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  )
}

function SearchDrawer({ open, setOpen }: SearchModalProps) {
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <GlobalSearch />
      </DrawerTrigger>
      <DrawerTitle>{''}</DrawerTitle>
      <DrawerContent className="bg-card h-[90dvh] flex flex-col">
        <div className="flex-1 pb-5 mt-4">
          <SearchContent setOpen={setOpen} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function SearchContent({ setOpen }: { setOpen: Dispatch<SetStateAction<boolean>> }) {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { chainToken } = useApp();

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Use react-query to fetch tokens
  const { data, isLoading, error, isFetching, isPending } = useQuery({
    queryKey: ["tokens", debouncedSearchQuery],
    queryFn: () => fetchTokens(debouncedSearchQuery),
    enabled: debouncedSearchQuery.length > 0,
    staleTime: 30000, // Data is fresh for 30 seconds
    retry: 2,
  })


  const tokens = data?.data || []

  const clearSearch = () => {
    setSearchQuery("")
  }

  const handleTokenClick = useCallback(
    (token: Token) => {
      router.push(`/${token.pre_addr}`)
      setOpen(false) // ✅ Close modal after clicking
    },
    [router, setOpen] // ✅ Proper dependencies
  )

  const isSearching = debouncedSearchQuery.length > 0 && (isPending || isLoading || isFetching)

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} />
        <Input
          placeholder="Search tokens by token address, token name or token symbol"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 py-3 rounded-xl border-2"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-card-light rounded-full transition-colors duration-200 flex items-center justify-center"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <X size={14} className="hover:text-foreground" />
          </Button>
        )}
      </div>

      {/* Show prompt when no input */}
      {!searchQuery && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Search size={24} className="text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <H1>Enter token name</H1>
            <P className="text-muted-foreground max-w-sm">Or paste contract address to start searching.</P>
          </div>
        </div>
      )}

      {/* Show loading state */}
      {searchQuery && isSearching && (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px]"
          role="status"
          aria-live="polite"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Loader2 size={24} className="text-muted-foreground animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <H1>Searching...</H1>
            <P className="text-muted-foreground max-w-sm">Please wait while we search for tokens.</P>
          </div>
        </div>
      )}

      {/* Show error state */}
      {searchQuery && error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Search size={24} className="text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <H1>Error occurred</H1>
            <P className="text-muted-foreground max-w-sm">Something went wrong while searching. Please try again.</P>
          </div>
        </div>
      )}

      {/* Show empty state if search has no results */}
      {searchQuery && !isSearching && !error && tokens.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Search size={24} className="text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <H1>No results found</H1>
            <P className="text-muted-foreground max-w-sm">
              We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Try adjusting your search terms.
            </P>
          </div>
        </div>
      )}

      {/* Render token list with scrollable container */}
      {searchQuery && !isSearching && !error && tokens.length > 0 && (
        <div className="flex-1 overflow-y-auto max-h-[400px]">
          <div className="flex flex-col gap-3">
            {tokens.map((token) => {

              const currentTokenReserves = token.last_trade ? token.last_trade.virtual_token_reserves : token.virtual_token_reserves;
              const currentAptosReserves = token.last_trade ? token.last_trade.virtual_aptos_reserves : token.virtual_aptos_reserves;

              const marketCapInAptos = getMarketCap(
                Number(currentAptosReserves),
                Number(currentTokenReserves),
                Number(token.virtual_token_reserves),
              ) / Math.pow(10, chainToken.decimals);

              const volumeInAptos = Number(token.volume) / Math.pow(10, chainToken.decimals);

              const marketCap = chainToken.price ? `${beautifyNumber(marketCapInAptos * chainToken.price, { showDollar: true })}` : `${beautifyNumber(marketCapInAptos)}`;
              const volume = chainToken.price ? `${beautifyNumber(volumeInAptos * chainToken.price, { showDollar: true, maxDigitsAfterZeros: 2 })}` : `${beautifyNumber(volumeInAptos, { maxDigitsAfterZeros: 2 })}`;
              return (
                <div
                  key={token.pool_addr}
                  className="flex gap-3 items-center p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleTokenClick(token)}
                >
                  {/* Token Image & Name */}
                  <div className="flex gap-2 items-center min-w-0">
                    <div className="relative w-4 h-4 flex-shrink-0">
                      <Image
                        src={token.image || "/token.svg"}
                        height={16}
                        width={16}
                        alt={token.name}
                        className="h-4 w-4 rounded-full border"
                        onError={(e) => {
                          // Fallback to default token icon if image fails to load
                          e.currentTarget.src = "/token.svg"
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex items-center gap-2">
                      <Label14 className="truncate">{token.symbol}</Label14>
                      <XS className="text-muted truncate">{token.name}</XS>
                    </div>
                  </div>
                  {/* Market Supply */}
                  <div className="flex gap-2 items-center flex-shrink-0">
                    <XS className="text-muted">MC</XS>
                    {/* <Label12 className="text-[#00ECF6]">{formatNumber(token.virtual_aptos_reserves)}</Label12> */}
                    <Label12 className="text-[#00ECF6]">{marketCap}</Label12>

                  </div>
                  {/* Volume */}
                  <div className="flex gap-2 items-center flex-shrink-0">
                    <XS className="text-muted">Vol</XS>
                    {/* <Label12>{formatNumber(token.volume)}</Label12> */}
                    <Label12>{volume}</Label12>
                  </div>
                </div>
              )

            })}
          </div>
        </div>
      )}
    </div>
  )
}
