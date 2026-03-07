"use client";

import { useQuery } from "@tanstack/react-query";

type HealthResponse = {
  status: string;
  timestamp: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

async function getHealth() {
  const endpoint = apiBaseUrl ? `${apiBaseUrl}/api/health` : "/api/health";
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error("Failed to fetch health data.");
  }

  return (await response.json()) as HealthResponse;
}

export function DemoHealthCard() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-slate-900">TanStack Query Demo</h2>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isFetching}
        >
          {isFetching ? "Refreshing..." : "Refetch"}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading health status...</p>
      ) : null}

      {isError ? (
        <p className="text-sm text-red-600">
          {(error as Error)?.message ?? "Something went wrong."}
        </p>
      ) : null}

      {data ? (
        <dl className="space-y-2 text-sm text-slate-700">
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <dt className="font-medium text-slate-900">Status</dt>
            <dd>{data.status}</dd>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <dt className="font-medium text-slate-900">Timestamp</dt>
            <dd className="break-all">{data.timestamp}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
