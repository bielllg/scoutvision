'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ChartNoAxesCombined, ChevronRight, Heart, House, Map, Menu, Search, Settings, Shield, Trophy, Users, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

type SearchItem = { label: string; detail: string; href: string };

function NavigationProgress() {
  const { pending } = useLinkStatus();
  return pending ? <i className="nav-progress" role="status" aria-label="Carregando página" /> : null;
}

const sections = [
  { href: '/', label: 'Dashboard', Icon: House },
  { href: '/jogadores', label: 'Jogadores', Icon: Users },
  { href: '/equipes', label: 'Equipes', Icon: Shield },
  { href: '/competicoes', label: 'Competições', Icon: Trophy },
  { href: '/comparador', label: 'Comparador', Icon: ChartNoAxesCombined },
  { href: '/mapas', label: 'Mapas de calor', Icon: Map },
  { href: '/analise', label: 'Análise avançada', Icon: Activity },
  { href: '/favoritos', label: 'Favoritos', Icon: Heart },
];

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
}

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="ScoutVision, dashboard">
      <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
        <rect width="48" height="48" rx="13" fill="currentColor" />
        <path d="M24 9 39 24 24 39 9 24Z" fill="#182922" />
        <path d="M24 15 33 24 24 33 15 24Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="24" cy="24" r="2.5" fill="currentColor" />
      </svg>
      <span>ScoutVision</span>
    </Link>
  );
}

export default function Shell({ children, searchItems, context }: {
  children: ReactNode;
  searchItems: SearchItem[];
  context: string;
}) {
  const pathname = usePathname();
  const searchDialog = useRef<HTMLDialogElement>(null);
  const navigationDialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const resultLinks = useRef<(HTMLAnchorElement | null)[]>([]);
  const [query, setQuery] = useState('');
  const [activeResult, setActiveResult] = useState(-1);
  const [prefetchPath, setPrefetchPath] = useState('');
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const results = (terms.length
    ? searchItems.filter((item) => {
        const text = normalize(`${item.label} ${item.detail}`);
        return terms.every((term) => text.includes(term));
      })
    : searchItems).slice(0, 10);

  function openSearch() {
    navigationDialog.current?.close();
    if (!searchDialog.current?.open) searchDialog.current?.showModal();
    searchInput.current?.focus();
  }

  useEffect(() => {
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        navigationDialog.current?.close();
        if (!searchDialog.current?.open) searchDialog.current?.showModal();
        searchInput.current?.focus();
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  function onSearchKeys(event: KeyboardEvent) {
    if (!results.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = event.key === 'ArrowDown'
        ? (activeResult + 1) % results.length
        : (activeResult <= 0 ? results.length - 1 : activeResult - 1);
      setActiveResult(next);
      resultLinks.current[next]?.focus();
    }
    if (event.key === 'Enter' && event.target === searchInput.current) {
      event.preventDefault();
      resultLinks.current[Math.max(0, activeResult)]?.click();
    }
  }

  function renderNav() {
    return (
      <nav className="sidebar-navigation" aria-label="Navegação principal">
        <p className="nav-label">Espaço de trabalho</p>
        {sections.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} aria-label={label} title={label} aria-current={active ? 'page' : undefined} className="nav-link"
              prefetch={!active && prefetchPath === href}
              onPointerEnter={() => setPrefetchPath(href)}
              onFocus={() => setPrefetchPath(href)}
              onClick={() => navigationDialog.current?.close()}>
              <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
              <span>{label}</span><NavigationProgress />
            </Link>
          );
        })}
      </nav>
    );
  }

  function renderFooter() {
    return (
      <div className="sidebar-footer">
        <Link href="/configuracoes" className="nav-link" aria-label="Configurações" title="Configurações" aria-current={pathname === '/configuracoes' ? 'page' : undefined}
          prefetch={pathname !== '/configuracoes' && prefetchPath === '/configuracoes'}
          onPointerEnter={() => setPrefetchPath('/configuracoes')}
          onFocus={() => setPrefetchPath('/configuracoes')}
          onClick={() => navigationDialog.current?.close()}>
          <NavigationProgress />
          <Settings size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>Configurações</span>
        </Link>
        <div className="nav-context" title={context}>
          <span className="nav-context-icon"><Trophy size={15} aria-hidden="true" /></span>
          <span>{context}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
      <aside className="sidebar">
        <Brand />
        <button className="sidebar-search" type="button" aria-label="Buscar no ScoutVision" aria-haspopup="dialog" aria-keyshortcuts="Control+k Meta+k" title="Buscar no ScoutVision (Ctrl+K)" onClick={openSearch}>
          <Search size={16} aria-hidden="true" />
          <span>Buscar no ScoutVision</span>
          <kbd>Ctrl K</kbd>
        </button>
        {renderNav()}
        {renderFooter()}
      </aside>
      <div className="mobile-topbar">
        <button className="icon-button" type="button" aria-label="Abrir navegação" aria-haspopup="dialog" onClick={() => navigationDialog.current?.showModal()}><Menu size={20} /></button>
        <Brand />
        <button className="icon-button" type="button" aria-label="Buscar no ScoutVision" aria-haspopup="dialog" onClick={openSearch}><Search size={19} /></button>
      </div>
      <main className="main-content" id="conteudo" tabIndex={-1}>
        {children}
      </main>
      <dialog className="search-dialog" ref={searchDialog} aria-label="Busca global" onKeyDown={onSearchKeys}
        onClose={() => { setQuery(''); setActiveResult(-1); }}
        onClick={(event) => { if (event.target === event.currentTarget) searchDialog.current?.close(); }}>
        <div className="search-dialog-inner">
          <div className="search-dialog-heading">
            <Search size={20} aria-hidden="true" />
            <input ref={searchInput} aria-label="Buscar jogadores, equipes e competições" value={query}
              placeholder="Buscar jogadores, equipes e competições"
              onFocus={() => setActiveResult(-1)}
              onChange={(event) => { setQuery(event.target.value); setActiveResult(-1); }} />
            <button type="button" className="icon-button" aria-label="Fechar busca" onClick={() => searchDialog.current?.close()}><X size={18} /></button>
          </div>
          <div className="search-results" aria-live="polite">
            {results.length ? results.map((item, index) => (
              <Link key={item.href} href={item.href} className="search-result"
                ref={(element) => { resultLinks.current[index] = element; }}
                onFocus={() => setActiveResult(index)}
                onClick={() => searchDialog.current?.close()}>
                <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                <ChevronRight size={16} aria-hidden="true" />
              </Link>
            )) : <p className="empty">Nenhum resultado para esta busca.</p>}
          </div>
        </div>
      </dialog>
      <dialog className="mobile-navigation" ref={navigationDialog} aria-label="Navegação do ScoutVision"
        onClick={(event) => { if (event.target === event.currentTarget) navigationDialog.current?.close(); }}>
        <div className="mobile-navigation-inner">
          <div className="mobile-nav-head">
            <span className="mobile-nav-title">ScoutVision</span>
            <button type="button" className="icon-button" aria-label="Fechar navegação" onClick={() => navigationDialog.current?.close()}><X size={19} /></button>
          </div>
          {renderNav()}
          {renderFooter()}
        </div>
      </dialog>
    </div>
  );
}
