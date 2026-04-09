import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { generateCompanyMetadata } from "@/lib/metadata";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
  });

  if (!company) {
    return { title: "公司未找到" };
  }

  return generateCompanyMetadata(company);
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      jobs: {
        where: { status: "ACTIVE" },
        orderBy: { datePosted: "desc" },
      },
    },
  });

  if (!company) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/companies" className="text-blue-600 hover:text-blue-800">
              ← 返回公司列表
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <div className="flex items-start gap-6 mb-8">
              {company.logo && (
                <Image
                  src={company.logo}
                  alt={`${company.name} Logo`}
                  width={100}
                  height={100}
                  className="rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                <div className="flex items-center gap-4 mt-3 text-gray-600">
                  {company.industry && <span>{company.industry}</span>}
                  {company.size && (
                    <>
                      <span>·</span>
                      <span>{company.size}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {company.description && (
              <section className="mb-8">
                <h2 className="text-xl font-bold mb-4">公司简介</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{company.description}</p>
              </section>
            )}

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">公司信息</h2>
              <div className="grid grid-cols-2 gap-4">
                {company.location && (
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-600">📍 地址</p>
                    <p className="font-semibold">{company.location}</p>
                  </div>
                )}
                {company.website && (
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-gray-600">🔗 官网</p>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                      访问网站 →
                    </a>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">在招职位 ({company.jobs.length})</h2>
              <div className="space-y-4">
                {company.jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.slug}`}
                    className="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-600">{job.location}</p>
                      </div>
                      <span className="text-blue-600">查看 →</span>
                    </div>
                  </Link>
                ))}
              </div>
              
              {company.jobs.length === 0 && (
                <p className="text-gray-500">暂无在招职位</p>
              )}
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
