import { MainLayout } from "@/components/layout/MainLayout";
import { RecommendationsPanel } from "@/components/recommendations/RecommendationsPanel";

export default function Recommendations() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <RecommendationsPanel />
      </div>
    </MainLayout>
  );
}