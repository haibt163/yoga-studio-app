export default function BookingLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto grid w-full max-w-5xl gap-8 px-6 pb-20 pt-10 sm:pt-14 lg:grid-cols-2"
    >
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-3 h-10 w-2/3 animate-pulse rounded-full bg-stone-200" />
        <div className="mb-8 h-4 w-full animate-pulse rounded-full bg-stone-100" />
        <div className="mb-6 h-4 w-1/3 animate-pulse rounded-full bg-stone-200" />
        <div className="mb-6 h-10 w-full animate-pulse rounded-xl bg-stone-100" />
        <div className="mb-6 h-10 w-full animate-pulse rounded-xl bg-stone-100" />
        <div className="h-14 w-full animate-pulse rounded-full bg-stone-200" />
      </section>
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-3 h-8 w-1/2 animate-pulse rounded-full bg-stone-200" />
        <div className="mb-8 h-4 w-full animate-pulse rounded-full bg-stone-100" />
        <div className="space-y-5">
          <div className="h-10 w-full animate-pulse rounded-xl bg-stone-100" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-stone-100" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-stone-100" />
        </div>
      </section>
    </main>
  );
}
