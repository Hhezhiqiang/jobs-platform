import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  const title = locale === "en" ? "{{TITLE_EN}}" : "{{TITLE_ZH}}";
  return { title };
}

export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = await Promise.resolve(params);
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") redirect(`/${locale}/auth/login/admin`);
  const isEn = locale === "en";
  const title = isEn ? "{{TITLE_EN}}" : "{{TITLE_ZH}}";
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <div className="mt-8 bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-500">{isEn ? "In development..." : "功能开发中..."}</p>
        </div>
      </div>
    </div>
  );
}
