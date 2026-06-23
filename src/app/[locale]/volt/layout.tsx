import "@/styles/volt.css";

export default function VoltLayout({ children }: { children: React.ReactNode }) {
  return <div className="volt-scope">{children}</div>;
}
