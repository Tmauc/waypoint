"use client";

interface StepCardProps {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  isFirst?: boolean;
  isLast?: boolean;
}

export function StepCard({
  title,
  children,
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Next",
  isFirst = false,
  isLast = false,
}: StepCardProps) {
  return (
    <div className="rounded-xl border bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-semibold text-gray-900">{title}</h2>
      <div className="mb-8">{children}</div>
      <div className="flex justify-between">
        {!isFirst ? (
          <button
            onClick={onBack}
            className="rounded-lg border px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {backLabel}
          </button>
        ) : (
          <div />
        )}
        {!isLast ? (
          <button
            onClick={onNext}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {nextLabel}
          </button>
        ) : (
          <button
            onClick={onNext}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}
