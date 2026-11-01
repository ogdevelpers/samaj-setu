export default function Loading() {
  return <div className="flex flex-col gap-4" aria-busy><div className="skeleton h-9 w-1/2" /><div className="skeleton h-32" /><div className="skeleton h-48" /></div>;
}
