import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-subtle">That page doesn&apos;t exist, or isn&apos;t ready yet.</p>
      <Link href="/" className="text-sm font-medium text-brand underline underline-offset-4">
        Back to the forum
      </Link>
    </main>
  );
}
