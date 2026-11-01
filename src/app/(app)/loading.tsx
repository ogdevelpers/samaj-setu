export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="skeleton h-9 w-2/3" />
      <div className="skeleton h-28" />
      <div className="grid gap-4 sm:grid-cols-2"><div className="skeleton h-40" /><div className="skeleton h-40" /></div>
    </div>
  );
}
