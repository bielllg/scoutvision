"use client";

import { Download, Heart, Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Player } from "@/lib/data";
import { downloadReport } from "@/lib/export";
import { usePersonal } from "@/lib/personal";
import { dateLabel, decimal, integer } from "./ui";

export type PlayerOption = Pick<Player, "id" | "name" | "shortName" | "team"> & Partial<Pick<Player, "position">>;
const folded = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");

export function PlayerPicker({ players, value, onChange, label }: {
  players: PlayerOption[]; value: number | null; onChange: (value: number) => void; label: string;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const selected = players.find((player) => player.id === value);
  const terms = folded(query).trim().split(/\s+/).filter(Boolean);
  const matches = players.filter((player) => {
    const searchable = folded(player.shortName + " " + player.name + " " + player.team);
    return terms.every((term) => searchable.includes(term));
  });
  const options = matches.slice(0, 10);
  const activeOption = open ? options[active] : undefined;
  const optionId = (playerId: number) => id + "-option-" + playerId;
  useEffect(() => {
    if (activeOption) {
      document.getElementById(id + "-option-" + activeOption.id)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeOption, id]);

  function dismiss() {
    setOpen(false);
    setQuery("");
    setActive(-1);
  }

  function choose(player: PlayerOption) {
    onChange(player.id);
    dismiss();
  }

  return <div className="player-picker">
    <label htmlFor={id}>{label}</label>
    <div className="player-search"><Search size={15} aria-hidden /><input id={id} type="text" role="combobox" autoComplete="off"
      aria-autocomplete="list" aria-expanded={open} aria-controls={id + "-results"}
      aria-activedescendant={activeOption ? optionId(activeOption.id) : undefined}
      value={open ? query : selected ? selected.shortName + " · " + selected.team : ""}
      placeholder="Buscar por nome ou seleção"
      onFocus={() => setOpen(true)}
      onClick={() => setOpen(true)}
      onBlur={dismiss}
      onChange={(event) => { setOpen(true); setQuery(event.target.value); setActive(-1); }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); dismiss(); }
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          setOpen(true);
          if (!options.length) return;
          const last = options.length - 1;
          setActive(event.key === "ArrowDown" ? (active >= last ? 0 : active + 1) : active <= 0 ? last : active - 1);
        }
        if (event.key === "Enter" && open) {
          event.preventDefault();
          if (activeOption) choose(activeOption);
          else if (options.length === 1) choose(options[0]);
        }
      }} /></div>
    <div className="player-results" hidden={!open}>
      <div id={id + "-results"} role="listbox" aria-label={label + " — resultados"}>
        {options.map((player, index) => <button type="button" tabIndex={-1} role="option" className="player-option"
          key={player.id} id={optionId(player.id)} aria-selected={active === index}
          onMouseDown={(event) => event.preventDefault()} onClick={() => choose(player)}>
          <strong>{player.shortName}</strong><small>{player.team}{player.position && " · " + player.position}{player.name !== player.shortName && " · " + player.name}</small>
        </button>)}
      </div>
      <p className="player-result-count" role="status">{matches.length === 0 ? "Nenhum jogador encontrado." : matches.length > options.length ? options.length + " de " + matches.length + " resultados. Digite para filtrar." : matches.length + (matches.length === 1 ? " resultado" : " resultados")}</p>
    </div>
  </div>;
}

export function PlayerActions({ player, updated }: { player: Player; updated: string }) {
  const [personal, update] = usePersonal();
  const [report, setReport] = useState<"idle" | "busy" | "error">("idle");
  const favorite = personal.favorites.includes(player.id);
  return <>
    <button className="button" aria-pressed={favorite} title={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} onClick={() => update((current) => ({
      ...current, favorites: favorite ? current.favorites.filter((id) => id !== player.id) : [...current.favorites, player.id],
    }))}><Heart size={16} fill={favorite ? "currentColor" : "none"} />{favorite ? "Favoritado" : "Favoritar"}</button>
    <button className="button" disabled={report === "busy"} onClick={async () => {
      setReport("busy");
      try {
        await downloadReport(player.shortName + " · " + player.team, "Copa do Mundo 2022 · Importado em " + dateLabel(updated), [
          "Nome: " + player.name, "Posição: " + player.position, "Partidas: " + player.games,
          "Minutos: " + integer.format(player.minutes), "Gols: " + player.goals, "Assistências: " + player.assists,
          "Finalizações: " + player.shots, "xG: " + decimal(player.xg), "xG é a soma do valor por finalização da StatsBomb.",
        ]);
        setReport("idle");
      } catch { setReport("error"); }
    }}><Download size={16} />{report === "busy" ? "Preparando…" : "PDF"}</button>
    {report === "error" && <small role="alert">Falha ao gerar o PDF. Tente novamente.</small>}
  </>;
}
