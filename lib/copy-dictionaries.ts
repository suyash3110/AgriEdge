import en from "@/messages/ui-en.json";
import hi from "@/messages/ui-hi.json";
import mr from "@/messages/ui-mr.json";
import formMr from "@/messages/form-mr.json";
import { hindi } from "./form-copy";
// Imported only by the server locale layout: each browser receives one language.
export const copyDictionaries = {
  en,
  hi: { ...hindi, ...hi },
  mr: { ...formMr, ...mr },
};
