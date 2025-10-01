import { atom } from 'jotai';

export const accessTokenAtom = atom<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
);

export const uploadKeyAtom = atom<string | null>(null);
export const preSignedUrlAtom = atom<string | null>(null);