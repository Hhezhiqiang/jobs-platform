"use client";

import { useTranslations } from "next-intl";

const featureKeys = [
  { icon: "🎯", title: "items.0.title", desc: "items.0.description", color: "from-blue-500 to-blue-600" },
  { icon: "⚡", title: "items.1.title", desc: "items.1.description", color: "from-green-500 to-green-600" },
  { icon: "🛡️", title: "items.2.title", desc: "items.2.description", color: "from-purple-500 to-purple-600" },
  { icon: "💡", title: "items.3.title", desc: "items.3.description", color: "from-orange-500 to-orange-600" },
  { icon: "📊", title: "items.4.title", desc: "items.4.description", color: "from-pink-500 to-pink-600" },
  { icon: "🌟", title: "items.5.title", desc: "items.5.description", color: "from-indigo-500 to-indigo-600" },
];

export function FeaturesSection() {
  const t = useTranslations("features");

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t("title")}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureKeys.map((feature, index) => (
            <div
              key={feature.icon}
              className="group relative bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-2xl transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t(feature.title)}</h3>
              <p className="text-gray-600 leading-relaxed">{t(feature.desc)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
