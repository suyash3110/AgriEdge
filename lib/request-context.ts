import { AsyncLocalStorage } from "node:async_hooks";
export const mutationContext = new AsyncLocalStorage<{
  key: string;
  fingerprint: string;
}>();
