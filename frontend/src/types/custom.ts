import { User } from "@/providers/AppProvider";
import { Time } from "lightweight-charts";

export interface Token {
  pool_addr: string;
  name: string;
  symbol: string;
  image: string;
  description: string;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  decimals: number;
  pre_addr: string;
  main_addr: string;
  virtual_aptos_reserves: string;
  virtual_token_reserves: string;
  remain_token_reserves: string;
  created_by: string;
  is_completed: boolean;
  ts: string;
  txn_version: string;
  buy_count: string;
  sell_count: string;
  last_trade?: {
    aptos_amount: number;
    token_amount: number;
    ts: number;
    virtual_aptos_reserves: number;
    virtual_token_reserves: number;
    is_buy: boolean;
    txn_version: number;
  };
  dev_holding: number;
  holders_count: string;
  top_ten_holdings: number;
  volume: string;
  creator?: User;
  bonding_curve: number;
}

// ohlc needed
export interface ChartData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  dev?: {
    buy?: number;
    sell?: number;
  };
  user?: {
    buy?: number;
    sell?: number;
  };
}

export interface Trade {
  txn_version: string;
  is_buy: boolean;
  user_addr: string;
  aptos_amount: string;
  token_amount: string;
  token_address: string;
  virtual_aptos_reserves: string;
  virtual_token_reserves: string;
  ts: string;
  user?: User;
};

export interface Chat {
  id: string;
  content: string;
  address: string;
  token_address: string;
  image: string | null;
  timestamp: string;
  user?: {
    address: string;
    username: string | null;
    profile_image: string | null;
  };
}

export interface Holder {
  user_addr: string;
  user: User;
  total_token_amount: number;
  percentage: number;
}

export interface Pnl {
  bought: number;
  sold: number;
  hodl: number;
  pnl: number;
  realizedPNL: number;
  unrealizedPNL: number;
}

export interface RecentTrade {
  aptos_amount: string;              // BigInt stored as string
  is_buy: boolean;
  token_address: string;
  virtual_aptos_reserves: string;    // BigInt stored as string
  virtual_token_reserves: string;    // BigInt stored as string
  txn_version: string;
  token: {
    symbol: string;
    image: string;
    decimals: number;
  };
}


export interface AccountPNL {
  total_pnl: number;
  total_invested: number;
  total_withdrawn: number;
  current_holding_value: number;
  realized_pnl: number;
  unrealized_pnl: number;
  total_tokens: number;
  tokens: {
    pre_addr: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
    bought: number;
    sold: number;
    holding_value: number;
    pnl: number;
    realized_pnl: number;
    unrealized_pnl: number;
    avg_entry: number;
    current_price: number;
    token_holding: number;
  }[]
}

export interface Position {
  position_addr: string;
  user: string;
  amount: number;
  unlock_ts: number;
  txn_version: number;
  is_removed: boolean;
  claimed: number;
}

export interface Leaderboard {
  address: string;
  x_username: string | null;
  x_display_picture: string | null;
  xp_earned: number;
}

export interface Task {
  id: number;
  description: string;
  progress: number;   // 0–100 percentage
  xp: number;         // XP reward
  repeatable: boolean;
  claim_count: number;
}

export interface WinnerLog {
  claimer: string;
  amount: number;
  win_type: number;
}

export interface StakeStats {
  totalStakers: number;
  totalStaked: number;
  totalFeeClaimed: number;
}