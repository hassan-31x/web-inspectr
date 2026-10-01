import { Suspense } from "react";
import Report from "./_components";
import { createDemoResult } from "@/lib/demo";
export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="shell loading-shell" role="status">
          Opening your report…
        </div>
      }
    >
      <Report demoResult={createDemoResult()} />
    </Suspense>
  );
}
