import { atom } from "jotai";
import { getToken } from "@/lib/functions";

export const accessTokenAtom = atom<string | null>(
  typeof window !== "undefined" ? getToken() : null,
);

export const uploadKeyAtom = atom<string | null>(null);
export const preSignedUrlAtom = atom<string | null>(null);
