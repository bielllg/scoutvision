"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <section className="scout-system-page">
    <h1>Falha ao carregar este recorte</h1>
    <p>Os dados podem estar temporariamente indisponíveis.</p>
    <button className="button primary" onClick={reset}>Tentar novamente</button>
  </section>;
}
