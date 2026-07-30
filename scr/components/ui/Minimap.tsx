import React from 'react';
import { Zombie, WindowBarricade } from '../../types';
import { PERK_MACHINES } from '../../data/weapons';
import { Shield, Zap, Flame, Box, Crosshair, Sparkles, Navigation, Layers } from 'lucide-react';

interface MinimapProps {
  playerPosition: [number, number, number];
  playerYaw?: number; // radians
  zombies: Zombie[];
  activeMysteryBox: {
    position: [number, number, number];
    isOpen: boolean;
  };
  perks: string[];
  barricades: WindowBarricade[];
}

export const Minimap: React.FC<MinimapProps> = ({
  playerPosition,
  playerYaw = 0,
  zombies,
  activeMysteryBox,
  perks,
}) => {
  // Map world bounds [-75, 75] in 3D X/Z space to 0-100% percentage coordinates
  const mapToPct = (x: number, z: number) => {
    const pctX = ((x + 75) / 150) * 100;
    const pctY = ((z + 75) / 150) * 100;
    return {
      x: Math.max(3, Math.min(97, pctX)),
      y: Math.max(3, Math.min(97, pctY)),
    };
  };

  const playerPosPct = mapToPct(playerPosition[0], playerPosition[2]);

  // Convert yaw to degrees for SVG/CSS rotation (0 rad = looking towards -Z in Three.js)
  const playerDegrees = (-playerYaw * (180 / Math.PI)) % 360;

  // Key locations
  const ammoCratePosPct = mapToPct(25, -35);
  const packAPunchPosPct = mapToPct(0, -45);
  const mysteryBoxPosPct = mapToPct(activeMysteryBox.position[0], activeMysteryBox.position[2]);

  // Wall buys
  const wallBuys = [
    { name: 'Kuda SMG', pos: mapToPct(0, -74) },
    { name: 'KRM-262 Shotgun', pos: mapToPct(-74, 0) },
  ];

  // Zombie window barricades around perimeter
  const windowSpawns = [
    mapToPct(-73, -35),
    mapToPct(73, -35),
    mapToPct(-73, 35),
    mapToPct(73, 35),
    mapToPct(-35, -73),
    mapToPct(35, -73),
    mapToPct(-35, 73),
    mapToPct(35, 73),
  ];

  return (
    <div className="relative flex flex-col items-end gap-1.5 select-none">
      {/* MINIMAP CONTAINER */}
      <div className="relative h-44 w-44 rounded-2xl border-2 border-slate-700/80 bg-slate-950/90 p-1 shadow-[0_0_25px_rgba(15,23,42,0.8)] backdrop-blur-md overflow-hidden">
        {/* Radar Background Grid & Distance Circles */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {/* Radial Grid Rings */}
          <div className="absolute inset-2 rounded-full border border-cyan-500/50" />
          <div className="absolute inset-8 rounded-full border border-cyan-500/40" />
          <div className="absolute inset-14 rounded-full border border-cyan-500/30" />

          {/* Radar Crosshairs */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-500/40" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-500/40" />

          {/* Central Pillar Box Outline */}
          <div className="absolute left-[46.8%] top-[46.8%] w-[6.4%] h-[6.4%] border border-cyan-400 bg-cyan-950/40" />
        </div>

        {/* Sweep Scan Effect */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(6,182,212,0.15)_0deg,transparent_60deg)] animate-[spin_6s_linear_infinite]" />
        </div>

        {/* Compass Cardinal Points */}
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-500 tracking-tighter">N</span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-500 tracking-tighter">S</span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 tracking-tighter">W</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 tracking-tighter">E</span>

        {/* --- MAP ICONS / MARKERS --- */}
        <div className="relative h-full w-full">
          {/* 1. Window Spawn Barricades (Orange indicators) */}
          {windowSpawns.map((wPos, idx) => (
            <div
              key={`win-${idx}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 h-1.5 w-3 bg-amber-500/80 rounded-xs shadow-[0_0_6px_rgba(245,158,11,0.8)]"
              style={{ left: `${wPos.x}%`, top: `${wPos.y}%` }}
              title="Zombie Window Spawn"
            />
          ))}

          {/* 2. Wall Buy Markers */}
          {wallBuys.map((wb, idx) => (
            <div
              key={`wb-${idx}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-slate-300 border border-slate-900 shadow-[0_0_4px_rgba(255,255,255,0.6)]"
              style={{ left: `${wb.pos.x}%`, top: `${wb.pos.y}%` }}
              title={`Wall Buy: ${wb.name}`}
            />
          ))}

          {/* 3. Perk Machines */}
          {PERK_MACHINES.map((perk) => {
            const perkPct = mapToPct(perk.position[0], perk.position[2]);
            const isOwned = perks.includes(perk.id);

            let perkColor = 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.9)]';
            if (perk.id === 'speedcola') perkColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]';
            if (perk.id === 'doubletap') perkColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.9)]';
            if ((perk.id as string) === 'quickrevive' || (perk.id as string) === 'staminup')
              perkColor = 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]';

            return (
              <div
                key={perk.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-md flex items-center justify-center border border-white/80 font-mono text-[8px] font-black text-white ${perkColor} ${
                  isOwned ? 'ring-2 ring-white animate-pulse' : ''
                }`}
                style={{ left: `${perkPct.x}%`, top: `${perkPct.y}%` }}
                title={`${perk.name} (${perk.cost} PTS)`}
              >
                {perk.id === 'juggernog' && <Shield className="h-2.5 w-2.5" />}
                {perk.id === 'speedcola' && <Zap className="h-2.5 w-2.5" />}
                {perk.id === 'doubletap' && <Flame className="h-2.5 w-2.5" />}
                {((perk.id as string) === 'quickrevive' || (perk.id as string) === 'staminup') && (
                  <span className="text-[7px]">REV</span>
                )}
              </div>
            );
          })}

          {/* 4. Pack-A-Punch Machine (Purple Star) */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-md bg-purple-600 border border-purple-300 flex items-center justify-center text-white shadow-[0_0_10px_rgba(168,85,247,0.9)] animate-pulse"
            style={{ left: `${packAPunchPosPct.x}%`, top: `${packAPunchPosPct.y}%` }}
            title="Pack-A-Punch Machine (5000 PTS)"
          >
            <Sparkles className="h-2.5 w-2.5 text-purple-200" />
          </div>

          {/* 5. Mystery Box (Cyan Box) */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-md bg-cyan-600 border border-cyan-300 flex items-center justify-center text-white shadow-[0_0_10px_rgba(6,182,212,0.9)]"
            style={{ left: `${mysteryBoxPosPct.x}%`, top: `${mysteryBoxPosPct.y}%` }}
            title="Mystery Box (950 PTS)"
          >
            <Box className="h-2.5 w-2.5 text-cyan-200" />
          </div>

          {/* 6. Ammo Refill Crate (Green Box) */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-md bg-emerald-600 border border-emerald-300 flex items-center justify-center text-white shadow-[0_0_10px_rgba(34,197,94,0.9)]"
            style={{ left: `${ammoCratePosPct.x}%`, top: `${ammoCratePosPct.y}%` }}
            title="Full Ammo Refill Crate (500 PTS)"
          >
            <Layers className="h-2.5 w-2.5 text-emerald-100" />
          </div>

          {/* 7. Active Living Zombies (Pulsing Red Dots) */}
          {zombies
            .filter((z) => z.state !== 'dying')
            .map((zombie) => {
              const zPct = mapToPct(zombie.position[0], zombie.position[2]);
              return (
                <div
                  key={`zm-${zombie.id}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-600 border border-red-300 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-ping duration-1000"
                  style={{ left: `${zPct.x}%`, top: `${zPct.y}%` }}
                />
              );
            })}
          {zombies
            .filter((z) => z.state !== 'dying')
            .map((zombie) => {
              const zPct = mapToPct(zombie.position[0], zombie.position[2]);
              return (
                <div
                  key={`zm-solid-${zombie.id}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500 border border-white/80 shadow-[0_0_6px_rgba(239,68,68,1)]"
                  style={{ left: `${zPct.x}%`, top: `${zPct.y}%` }}
                />
              );
            })}

          {/* 8. Player Arrow (Bright Cyan Chevron Indicator) */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center transition-all duration-75"
            style={{
              left: `${playerPosPct.x}%`,
              top: `${playerPosPct.y}%`,
              transform: `translate(-50%, -50%) rotate(${playerDegrees}deg)`,
            }}
            title="Player Position"
          >
            <Navigation className="h-4 w-4 text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,1)]" />
          </div>
        </div>
      </div>

      {/* RADAR ICON LEGEND TOOLBAR */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-800/80 bg-black/80 px-2.5 py-1 text-[10px] text-slate-300 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-1 text-cyan-400 font-semibold">
          <Navigation className="h-3 w-3 fill-cyan-400" /> You
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1 text-red-400 font-semibold">
          <span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Zombies
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1 text-emerald-400 font-semibold">
          <Layers className="h-3 w-3" /> Ammo (500)
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1 text-cyan-300 font-semibold">
          <Box className="h-3 w-3" /> Box
        </div>
      </div>
    </div>
  );
};
