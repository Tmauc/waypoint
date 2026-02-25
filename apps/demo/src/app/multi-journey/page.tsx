import Link from "next/link";

export default function MultiJourneyHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Multi Journey</h1>
        <p className="mt-1 text-gray-500">
          Two independent journeys with isolated state running in parallel.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/multi-journey/journey-a/step1"
          className="block rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-blue-700">Journey A — Account Setup</h2>
          <p className="mt-1 text-sm text-gray-500">3 steps: credentials → profile → confirm</p>
        </Link>
        <Link
          href="/multi-journey/journey-b/step1"
          className="block rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-purple-700">Journey B — Subscription</h2>
          <p className="mt-1 text-sm text-gray-500">3 steps: plan → payment → confirm</p>
        </Link>
      </div>
    </div>
  );
}
