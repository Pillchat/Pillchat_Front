"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken && pathname !== "/Signin") {
      router.push("/Signin");
    }
  }, [pathname, router]);

  return <>{children}</>;
}