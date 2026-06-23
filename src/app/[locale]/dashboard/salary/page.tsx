"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DollarSign, BarChart3, TrendingUp, MapPin, Briefcase } from "lucide-react";

type RoleKey = "frontend" | "backend" | "fullstack" | "pm" | "data";
type CityKey = "beijing" | "shanghai" | "shenzhen" | "hangzhou" | "chengdu" | "remote";

const ROLE_KEYS: RoleKey[] = ["frontend", "backend", "fullstack", "pm", "data"];
const CITY_KEYS: CityKey[] = ["beijing", "shanghai", "shenzhen", "hangzhou", "chengdu", "remote"];

const SALARY_DATA: Record<RoleKey, Record<CityKey, { min: number; mid: number; max: number }>> = {
  frontend: {
    beijing:   { min: 12, mid: 22, max: 40 },
    shanghai:  { min: 11, mid: 20, max: 38 },
    shenzhen:  { min: 11, mid: 21, max: 36 },
    hangzhou:  { min: 10, mid: 18, max: 32 },
    chengdu:   { min: 8,  mid: 14, max: 25 },
    remote:    { min: 10, mid: 18, max: 35 },
  },
  backend: {
    beijing:   { min: 14, mid: 24, max: 45 },
    shanghai:  { min: 13, mid: 22, max: 42 },
    shenzhen:  { min: 13, mid: 23, max: 40 },
    hangzhou:  { min: 11, mid: 19, max: 35 },
    chengdu:   { min: 9,  mid: 15, max: 28 },
    remote:    { min: 11, mid: 19, max: 38 },
  },
  fullstack: {
    beijing:   { min: 15, mid: 26, max: 48 },
    shanghai:  { min: 14, mid: 24, max: 45 },
    shenzhen:  { min: 14, mid: 25, max: 42 },
    hangzhou:  { min: 12, mid: 21, max: 38 },
    chengdu:   { min: 10, mid: 16, max: 30 },
    remote:    { min: 12, mid: 21, max: 40 },
  },
  pm: {
    beijing:   { min: 13, mid: 23, max: 42 },
    shanghai:  { min: 12, mid: 21, max: 40 },
    shenzhen:  { min: 12, mid: 22, max: 38 },
    hangzhou:  { min: 11, mid: 19, max: 35 },
    chengdu:   { min: 9,  mid: 15, max: 28 },
    remote:    { min: 11, mid: 19, max: 36 },
  },
  data: {
    beijing:   { min: 15, mid: 25, max: 50 },
    shanghai:  { min: 14, mid: 23, max: 48 },
    shenzhen:  { min: 14, mid: 24, max: 45 },
    hangzhou:  { min: 12, mid: 20, max: 38 },
    chengdu:   { min: 10, mid: 16, max: 30 },
    remote:    { min: 12, mid: 20, max: 42 },
  },
};

export default function SalaryComparePage() {
  const t = useTranslations("dashboard.salaryPage");
  const tRoles = useTranslations("dashboard.salaryPage.roles");
  const tCities = useTranslations("dashboard.salaryPage.cities");

  const [selectedCity, setSelectedCity] = useState<CityKey>("beijing");
  const [selectedRole, setSelectedRole] = useState<RoleKey>("frontend");

  useEffect(() => {
    // placeholder for future async load
  }, []);

  const data = SALARY_DATA[selectedRole][selectedCity];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-600" />
            {t("title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("subtitle")}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {t("role")}
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLE_KEYS.map(role => (
                  <button key={role} onClick={() => setSelectedRole(role)} className={`px-3 py-1.5 rounded-full text-sm transition ${selectedRole === role ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    {tRoles(role)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {t("city")}
              </label>
              <div className="flex flex-wrap gap-2">
                {CITY_KEYS.map(city => (
                  <button key={city} onClick={() => setSelectedCity(city)} className={`px-3 py-1.5 rounded-full text-sm transition ${selectedCity === city ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    {tCities(city)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Salary Display */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {tCities(selectedCity)} · {tRoles(selectedRole)} {t("kPerMonth")}
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">{t("junior")}</div>
              <div className="text-3xl font-bold text-blue-600">{data.min}K</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">{t("mid")}</div>
              <div className="text-3xl font-bold text-green-600">{data.mid}K</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">{t("senior")}</div>
              <div className="text-3xl font-bold text-purple-600">{data.max}K</div>
            </div>
          </div>
          {/* Bar chart */}
          <div className="mt-6 space-y-3">
            {[
              { label: t("junior"), value: data.min, color: "bg-blue-500" },
              { label: t("mid"),    value: data.mid, color: "bg-green-500" },
              { label: t("senior"), value: data.max, color: "bg-purple-500" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-12 text-right">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div className={`${item.color} h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium transition-all`} style={{ width: `${Math.max((item.value / 50) * 100, 8)}%` }}>
                    {item.value}K
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* City comparison */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            {t("allCitiesComparison")}
          </h3>
          <div className="space-y-2">
            {CITY_KEYS.map(city => {
              const d = SALARY_DATA[selectedRole][city];
              return (
                <div key={city} className={`flex items-center gap-4 p-3 rounded-lg ${city === selectedCity ? "bg-blue-50 border border-blue-200" : ""}`}>
                  <span className="w-12 text-sm font-medium text-gray-900">{tCities(city)}</span>
                  <div className="flex-1 grid grid-cols-3 gap-2 text-center text-sm">
                    <span className="text-blue-600">{d.min}K</span>
                    <span className="text-green-600">{d.mid}K</span>
                    <span className="text-purple-600">{d.max}K</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
