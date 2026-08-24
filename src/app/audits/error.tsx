"use client";

import { RouteError } from "@/components/system/RouteError";

export default function SectionError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} />;
}
