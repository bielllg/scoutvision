import type { Metadata } from 'next';
import { getMotionMode } from '@/lib/motion';
import type { ReactNode } from 'react';
import '@fontsource-variable/inter';
import Shell from '@/components/shell';
import { getRequestData } from '@/lib/data';
import './globals.css';
import './analytics.css';

export const metadata: Metadata = {
  title: { default: 'ScoutVision', template: '%s · ScoutVision' },
  description: 'Explore dados de futebol, compare jogadores e analise ações em campo.',
  icons: { icon: '/scoutvision.svg' },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const motion = await getMotionMode();
  const data = getRequestData();
  const searchItems = data ? [
    ...data.players.map((player) => ({
      label: player.shortName,
      detail: player.team + ' · ' + player.position + ' · ' + player.name,
      href: '/jogadores/' + player.id,
    })),
    ...data.teams.map((team) => ({
      label: team.name,
      detail: 'Seleção · Copa do Mundo 2022',
      href: '/equipes/' + team.id,
    })),
    { label: 'Copa do Mundo 2022', detail: 'Competição · StatsBomb Open Data', href: '/competicoes/copa-2022' },
    { label: 'Copa do Mundo 2018', detail: 'Resultados · StatsBomb Open Data', href: '/competicoes/copa-2018' },
    { label: 'Brasileirão Série A 2026', detail: 'Competição · referência oficial da CBF', href: '/competicoes/brasileirao-2026' },
  ] : [];
  return (
    <html lang="pt-BR" data-motion={motion}>
      <body>
        <Shell searchItems={searchItems} context={data ? 'Copa do Mundo 2022' : 'Dados históricos'}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
