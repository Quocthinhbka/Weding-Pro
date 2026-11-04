"use client";

import { createContext, useContext, type ReactNode } from "react";
import { defaultConfig, type WeddingConfig } from "@/content/wedding";

// Cấu hình thiệp (đọc từ cơ sở dữ liệu ở máy chủ) cho các component chạy trên trình duyệt.
const WeddingContext = createContext<WeddingConfig>(defaultConfig);

export const useWedding = () => useContext(WeddingContext);

export function WeddingProvider({ config, children }: { config: WeddingConfig; children: ReactNode }) {
  return <WeddingContext.Provider value={config}>{children}</WeddingContext.Provider>;
}
