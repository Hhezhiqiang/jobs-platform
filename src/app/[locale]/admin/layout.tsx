import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export { default as error } from "../error";
