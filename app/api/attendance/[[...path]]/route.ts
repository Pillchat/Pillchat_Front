import { NextRequest } from "next/server";
import { backendProxy } from "@/lib/server/backendProxy";

const handle = (request: NextRequest) => backendProxy(request);
export { handle as GET, handle as POST };
