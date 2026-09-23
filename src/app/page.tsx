export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold text-blue-600">
        jeu_miniville <span className="text-base font-normal text-gray-500">(nom provisoire)</span>
      </h1>
      <p className="max-w-md text-gray-600">
        Le squelette technique est en place. Le premier contenu jouable
        arrive au Jalon 1 — « Naître quelque part » (voir{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5">docs/ROADMAP.md</code>).
      </p>
    </main>
  );
}
