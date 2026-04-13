"use client";

import { Building2, MapPin } from "lucide-react";

interface FilterSectionProps {
  industries: string[];
  cities: string[];
  selectedIndustry: string;
  selectedCity: string;
  onIndustryChange: (industry: string) => void;
  onCityChange: (city: string) => void;
}

export function FilterSection({
  industries,
  cities,
  selectedIndustry,
  selectedCity,
  onIndustryChange,
  onCityChange,
}: FilterSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">行业筛选：</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onIndustryChange("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedIndustry === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            全部
          </button>
          {industries.slice(0, 8).map((industry) => (
            <button
              key={industry}
              onClick={() => onIndustryChange(industry)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedIndustry === industry
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {industry}
            </button>
          ))}
        </div>
      </div>

      {cities.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">城市筛选：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCityChange("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCity === "all"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              全部
            </button>
            {cities.slice(0, 10).map((city) => (
              <button
                key={city}
                onClick={() => onCityChange(city)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCity === city
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
