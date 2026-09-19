"use client";
import { createContext, useContext } from "react";
const CopyContext = createContext<Record<string, string>>({});
export default function CopyProvider({
  dictionary,
  children,
}: {
  dictionary: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <CopyContext.Provider value={dictionary}>{children}</CopyContext.Provider>
  );
}
export const useCopyDictionary = () => useContext(CopyContext);
