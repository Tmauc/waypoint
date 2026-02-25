import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Waypoint Demo
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Interactive examples for multi-step journey navigation.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/simple-journey"
          className="block rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-xl font-semibold text-gray-900">Simple Journey</h2>
          <p className="mt-2 text-sm text-gray-600">
            A 5-step form with a progress bar, goNext / goBack navigation, and
            history management.
          </p>
        </Link>

        <Link
          href="/multi-journey"
          className="block rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-xl font-semibold text-gray-900">Multi Journey</h2>
          <p className="mt-2 text-sm text-gray-600">
            Two independent journeys running in parallel with isolated state and
            their own progress bars.
          </p>
        </Link>
      </div>
    </div>
  );
}
