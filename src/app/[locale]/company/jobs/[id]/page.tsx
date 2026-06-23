import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function CompanyJobDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  redirect(`/${locale}/company/jobs/${id}/edit`);
}
