import { NextRequest } from "next/server";
import { backendProxy } from "@/lib/server/backendProxy";

export const POST = (request: NextRequest) => backendProxy(request);
