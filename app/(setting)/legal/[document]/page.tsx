import { notFound } from "next/navigation";
import { CustomHeader } from "@/components/molecules/CustomHeader";
import { TERMS_TEXT, PRIVACY_TEXT } from "@/app/(auth)/signup/_hooks/content";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ document: string }>;
}) {
  const { document } = await params;
  if (document !== "terms" && document !== "privacy") notFound();
  const title = document === "terms" ? "서비스 이용약관" : "개인정보 처리방침";
  return (
    <div className="mx-auto min-h-dvh max-w-screen-sm bg-white">
      <CustomHeader title={title} />
      <main className="whitespace-pre-wrap px-6 py-6 text-body-medium leading-relaxed">
        {document === "terms" ? TERMS_TEXT : PRIVACY_TEXT}
      </main>
    </div>
  );
}
