import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4">
      <div className="text-center">
        <div className="mb-6 font-display text-6xl font-semibold text-ink">404</div>
        <h1 className="mb-2 font-display text-2xl font-semibold text-ink">Page Not Found</h1>
        <p className="mb-8 text-ink-mute">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-green-600 px-6 text-sm font-medium text-paper-high transition-colors hover:bg-green-700"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
