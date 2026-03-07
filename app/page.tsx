import { DemoHealthCard } from "@/components/examples/demo-health-card";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <section className="space-y-3">
        <p className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Starter Template
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Next.js + Tailwind + TanStack Query
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
          This base is ready for Figma-driven implementation. Drop your design ID
          and node ID next, then we can build the exact screens/components.
        </p>
      </section>

      <DemoHealthCard />
    </main>
  );
}
