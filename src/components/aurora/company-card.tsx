import Link from "next/link";
import Image from "next/image";
import { companies, jobs } from "@prisma/client";
import { MapPin, Users, ExternalLink, Building2, Briefcase, Star } from "lucide-react";

interface CompanyCardProps {
  company: companies & { _count?: { jobs: number } };
  variant?: "default" | "compact";
}

export function AuroraCompanyCard({ company, variant = "default" }: CompanyCardProps) {
  const jobCount = company._count?.jobs || 0;
  
  if (variant === "compact") {
    return (
      <Link
        href={`/zh/companies/${company.slug}`}
        className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#6366f1]/30 hover:shadow-lg hover:shadow-[#6366f1]/5 transition-all duration-300"
      >
        <div className="flex-shrink-0">
          {company.logo ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-[#6366f1]/20 transition-all">
              <Image src={company.logo} alt={company.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-lg shadow-md">
              {company.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-[#4f46e5] transition-colors truncate">{company.name}</h3>
          <p className="text-sm text-gray-500">{company.industry || "互联网"}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-medium text-[#6366f1]">{jobCount} 个职位</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/zh/companies/${company.slug}`}
      className="group aurora-card rounded-2xl overflow-hidden"
    >
      {/* Aurora top gradient bar */}
      <div className="h-2 bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#06b6d4]" />
      
      <div className="p-6">
        {/* Logo + Name */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            {company.logo ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-[#6366f1]/20 transition-all">
                <Image src={company.logo} alt={company.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {company.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#4f46e5] transition-colors mb-1">{company.name}</h3>
            <p className="text-sm text-gray-500">{company.industry || "互联网"}</p>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-wrap gap-3 mb-4">
          {company.location && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 text-sm rounded-lg">
              <MapPin className="w-3.5 h-3.5" />
              {company.location}
            </span>
          )}
          {company.size && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 text-sm rounded-lg">
              <Users className="w-3.5 h-3.5" />
              {company.size}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#eef2ff] text-[#4f46e5] text-sm rounded-lg font-medium">
            <Briefcase className="w-3.5 h-3.5" />
            {jobCount} 个在招职位
          </span>
        </div>

        {/* Description */}
        {company.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{company.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-gray-500">收藏</span>
          </div>
          <span className="text-[#6366f1] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            查看详情
            <ExternalLink className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
