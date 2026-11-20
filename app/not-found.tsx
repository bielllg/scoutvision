import Link from "next/link";

export default function NotFound() {
  return <section className="scout-system-page">
    <h1>Página fora do recorte</h1>
    <p>O endereço ou registro solicitado não está disponível.</p>
    <Link className="button primary" href="/">Voltar ao dashboard</Link>
  </section>;
}
