'use client';

/** If anything breaks, show a calm page with a way forward instead of a blank screen. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4 py-10 text-center">
      <h1 className="!text-2xl">कुछ गड़बड़ हो गई / Something went wrong</h1>
      <p className="text-muted">कृपया फिर कोशिश करें। अगर बार-बार हो, तो प्रबंधक को यह कोड बताएँ। / Please try again. If it keeps happening, tell the admin this code.</p>
      {error.digest && <code className="rounded-lg bg-surface2 p-2 text-sm">{error.digest}</code>}
      <div className="flex flex-col gap-2">
        <button onClick={reset} className="btn">फिर कोशिश करें / Try again</button>
        <a href="/" className="btn-alt btn">मुख्य पृष्ठ / Home</a>
      </div>
    </main>
  );
}
