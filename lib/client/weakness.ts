import { fetchAPI } from "@/lib/client/fetch";
import type { WeaknessLibrary } from "@/lib/learning/weakness";

export function readWeaknessLibrary(): Promise<WeaknessLibrary> {
  return fetchAPI("/api/learning/weakness", "GET");
}
