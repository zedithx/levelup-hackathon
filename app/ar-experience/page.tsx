import { ArCameraScreen } from "@/components/scape-pulse/flow/screens/ar-camera-screen";

type ArExperiencePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArExperiencePage({ searchParams }: ArExperiencePageProps) {
  const resolvedSearchParams = await searchParams;
  const stationParam = resolvedSearchParams?.station;
  const station = Array.isArray(stationParam) ? stationParam[0] : stationParam;

  return <ArCameraScreen station={station} />;
}
