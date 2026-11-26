import type { NextRequest } from "next/server";
import { backendProxy } from "@/lib/server/backendProxy";

export const GET = (request: NextRequest) => backendProxy(request);
