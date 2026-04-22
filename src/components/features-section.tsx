"use client";

import { useTranslations } from "next-intl";
import { Target, Zap, Shield, Lightbulb, BarChart3, Star } from "lucide-react";

const features = [
  { icon: Target, titleKey: "items.0.title", descKey: "items.0.description", gradient: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/20" },
  { icon: Zap, titleKey: "items.1.title", descKey: "items.1.description", gradient: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20" },
  { icon: Shield, titleKey: "items.2.title", descKey: "items.2.description", gradient: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/20" },
  { icon: Lightbulb, titleKey: "items.3.title", descKey: "items.3.description", gradient: "from-violet-500 to-violet-600", shadow: "shadow-violet-500/20" },
  { icon: BarChart3, titleKey: "items.4.title", descKey: "items.4.description", gradient: "from-pink-500 to-pink-600", shadow: "shadow-pink-500/20" },
  { icon: Star, titleKey: "items.5.title", descKey: "items.5.description", gradient: "from-indigo-500 to-indigo-600", shadow: "shadow-indigo-500/20" },
];

export function FeaturesSection() {
  const t = useTranslations("features");

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t("title")}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.titleKey}
                className="group relative bg-gray-50/50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg ${feature.shadow} mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t(feature.titleKey)}</h3>
                <p className="text-gray-600 leading-relaxed">{t(feature.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
