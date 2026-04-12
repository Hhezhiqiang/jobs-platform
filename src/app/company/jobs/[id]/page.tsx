import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyJobDetailPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/company/jobs/${id}/edit`);
}
