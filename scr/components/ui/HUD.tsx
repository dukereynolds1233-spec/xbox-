import React, { useState, useEffect } from 'react';
import { Weapon, PerkId, GameStats, Zombie, WindowBarricade } from '../../types';
import { PERK_MACHINES } from '../../data/weapons';
import {
  Shield,
  Zap,
  Flame,
  RefreshCw,
  Crosshair,
  Skull,
  Heart,
  Coins,
  MousePointer,
  Keyboard,
  Gamepad2,
  Footprints,
  Bug,
  Layers,
  Sparkles,
  Target,
  Disc,
  Radio,
  Timer,
} from 'lucide-react';
import { Minimap } from './Minimap';

interface HUDProps {
  stats: GameStats;
  currentWeapon: Weapon;
  health: number;
  maxHealth: number;
  perks: PerkId[];
  widowCharges?: number;
  inventory?: Weapon[];
  thrashMode?: boolean;
  collectedCassettesCount?: number;
  thrashBannerMessage?: string | null;
  survivalTimer?: number;
  isSurvivalTimerActive?: boolean;
  survivalVictoryBanner?: string | null;
  hitmarker: { active: boolean; isHeadshot: boolean } | null;
  scorePopups: Array<{ id: string; text: string; x: number; y: number }>;
  interactPrompt: string | null;
  isReloading: boolean;
  roundMessage: string | null;
  playerPosition: [number, number, number];
  playerYaw?: number;
  zombies: Zombie[];
  activeMysteryBox: {
    position: [number, number, number];
    isOpen: boolean;
  };
  barricades: WindowBarricade[];
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  currentWeapon,
  health,
  maxHealth,
  perks,
  widowCharges = 4,
  inventory = [],
  thrashMode = false,
  collectedCassettesCount = 0,
  thrashBannerMessage = null,
  survivalTimer = 180,
  isSurvivalTimerActive = true,
  survivalVictoryBanner = null,
  hitmarker,
  scorePopups,
  interactPrompt,
  isReloading,
  roundMessage,
  playerPosition,
  playerYaw = 0,
  zombies,
  activeMysteryBox,
  barricades,
}) => {
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const clipPercent = Math.max(0, Math.min(100, (currentWeapon.currentClip / currentWeapon.clipSize) * 100));

  // Gamepad connection listener
  const [hasGamepad, setHasGamepad] = useState(false);

  useEffect(() => {
    const checkGamepad = () => {
      const gps = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
      const connected = Array.from(gps).some((gp) => gp && gp.connected);
      setHasGamepad(connected);
    };

    checkGamepad();
    window.addEventListener('gamepadconnected', checkGamepad);
    window.addEventListener('gamepaddisconnected', checkGamepad);
    const interval = setInterval(checkGamepad, 2000);

    return () => {
      window.removeEventListener('gamepadconnected', checkGamepad);
      window.removeEventListener('gamepaddisconnected', checkGamepad);
      clearInterval(interval);
    };
  }, []);

  // Format interact prompt to include Xbox controller [Y] button
  const formattedPrompt = interactPrompt
    ? interactPrompt.replace('[E]', '[E / Y]').replace('PRESS [E]', 'PRESS [E / Y]')
    : null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="z-30 pointer-events-none absolute inset-0 select-none overflow-hidden font-sans">
      {/* TOP CENTER: 3-Minute Survival Timer */}
      {isSurvivalTimerActive && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3.5 rounded-2xl border-2 border-red-600/90 bg-black/90 px-6 py-2.5 shadow-[0_0_35px_rgba(220,38,38,0.6)] backdrop-blur-md z-40">
          <Timer className="h-7 w-7 text-red-500 animate-pulse" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black tracking-widest text-red-400 uppercase">3-MIN SURVIVAL TIMER</span>
            <span className="font-mono text-3xl font-black tracking-widest text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]">
              {formatTime(survivalTimer)}
            </span>
          </div>
          <div className="hidden sm:flex flex-col border-l border-slate-800 pl-3.5 text-left">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">+5000 PTS REWARD</span>
            <span className="text-[9px] font-medium text-slate-400">SURVIVE 03:00 ONSLAUGHT</span>
          </div>
        </div>
      )}

      {/* Giant Victory Banner Popup */}
      {survivalVictoryBanner && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center animate-bounce z-50 pointer-events-none">
          <div className="rounded-3xl border-4 border-yellow-400 bg-black/95 px-12 py-8 shadow-[0_0_80px_rgba(250,204,21,0.95)] backdrop-blur-md">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Sparkles className="h-10 w-10 text-yellow-400 animate-spin" />
              <h1 className="text-5xl font-black uppercase tracking-widest text-yellow-300 drop-shadow-[0_0_40px_rgba(250,204,21,1)]">
                VICTORY! YOU SURVIVED THE ONSLAUGHT!
              </h1>
              <Sparkles className="h-10 w-10 text-yellow-400 animate-spin" />
            </div>
            <p className="text-4xl font-black tracking-wider text-amber-400 uppercase drop-shadow-[0_0_20px_rgba(251,191,36,0.9)]">
              +5000 BONUS POINTS
            </p>
            <p className="mt-3 text-xs font-bold tracking-widest text-slate-300 uppercase">
              RESUMING NORMAL ZOMBIE WAVES IN 5 SECONDS...
            </p>
          </div>
        </div>
      )}

      {/* Giant Red Text Prompt: PLEASURE TO KILL ENABLED! */}
      {thrashBannerMessage && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center animate-bounce z-50 pointer-events-none">
          <div className="rounded-2xl border-2 border-red-600 bg-black/95 px-10 py-6 shadow-[0_0_60px_rgba(220,38,38,0.95)] backdrop-blur-md">
            <h1 className="text-6xl font-black uppercase tracking-widest text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,1)] animate-pulse">
              {thrashBannerMessage}
            </h1>
            <p className="mt-2 text-sm font-bold tracking-widest text-rose-300 uppercase">
              THRASH METAL WAVE ACTIVATED &bull; ZOMBIES +30% TEMPO
            </p>
          </div>
        </div>
      )}
      {/* Blood Damage Screen Vignette */}
      {healthPercent < 100 && (
        <div
          className="absolute inset-0 bg-radial from-transparent via-red-950/40 to-red-900/80 transition-opacity duration-300"
          style={{ opacity: (1 - healthPercent / 100) * 0.9 }}
        />
      )}

      {/* Crosshair & Hitmarker */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Center Crosshairs */}
          <div className="h-2 w-2 rounded-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.9)]" />

          {/* Hitmarker X Animation */}
          {hitmarker && hitmarker.active && (
            <div className="absolute animate-ping">
              <Crosshair
                className={`h-9 w-9 ${
                  hitmarker.isHeadshot ? 'text-yellow-400 stroke-[3]' : 'text-red-500 stroke-[2.5]'
                }`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Score Popups (+100, +10 HIT, +150 Headshot) */}
      {scorePopups.map((popup) => (
        <div
          key={popup.id}
          className="absolute font-black tracking-wider text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-bounce text-xl"
          style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
        >
          {popup.text}
        </div>
      ))}

      {/* Interact Prompt Banner ([E / Y] to Buy/Rebuild) */}
      {formattedPrompt && (
        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-yellow-500/70 bg-black/90 px-6 py-3.5 text-center backdrop-blur-md shadow-[0_0_25px_rgba(234,179,8,0.35)]">
          <p className="text-sm font-black tracking-widest text-yellow-400 uppercase drop-shadow">
            {formattedPrompt}
          </p>
        </div>
      )}

      {/* Round Change Banner */}
      {roundMessage && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center animate-pulse">
          <h1 className="text-5xl font-black uppercase tracking-widest text-red-600 drop-shadow-[0_0_25px_rgba(220,38,38,0.9)]">
            {roundMessage}
          </h1>
        </div>
      )}

      {/* TOP LEFT: Quick Controls Guide (Keyboard & Mouse + Xbox Controller) */}
      <div className="absolute top-6 left-6 flex flex-col gap-1.5">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-black/80 px-4 py-2.5 backdrop-blur-md text-xs text-slate-300 shadow-lg">
          <MousePointer className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold text-white">L-Click:</span> Shoot
          <span className="mx-0.5 text-slate-600">|</span>
          <Keyboard className="h-4 w-4 text-amber-400" />
          <span className="font-semibold text-white">R:</span> Reload
          <span className="mx-0.5 text-slate-600">|</span>
          <span className="font-semibold text-white">E:</span> Buy
        </div>

        {/* Xbox Controller Row */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-800/90 bg-black/80 px-3.5 py-1.5 backdrop-blur-md text-[11px] text-slate-300 shadow-md">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <Gamepad2 className="h-3.5 w-3.5" />
            <span>Xbox:</span>
          </div>
          <span className="font-semibold text-white">RT:</span> Shoot
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-white">X:</span> Reload
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-white">Y:</span> Buy
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-white">A:</span> Jump
          {hasGamepad && (
            <span className="ml-1 inline-flex items-center rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-black text-emerald-400 border border-emerald-500/40 animate-pulse">
              CONNECTED
            </span>
          )}
        </div>

        {/* Cassette Tape Easter Egg Tracker Row */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-black/80 px-3.5 py-1.5 backdrop-blur-md text-[11px] text-slate-300 shadow-md">
          <Radio className={`h-3.5 w-3.5 ${thrashMode ? 'text-red-500 animate-pulse' : 'text-rose-400'}`} />
          <span className="font-bold text-white">Red Cassettes:</span>
          <span className={`font-mono font-black ${thrashMode ? 'text-red-400' : 'text-amber-400'}`}>
            {collectedCassettesCount}/3
          </span>
          {thrashMode && (
            <span className="ml-1 inline-flex items-center rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-black text-red-400 border border-red-500/40 animate-pulse">
              THRASH ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* TOP RIGHT: Minimap Radar & Kills/Headshots Counter */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-2.5">
        {/* Tactical Minimap Radar */}
        <Minimap
          playerPosition={playerPosition}
          playerYaw={playerYaw}
          zombies={zombies}
          activeMysteryBox={activeMysteryBox}
          perks={perks}
          barricades={barricades}
        />

        {/* Kills & Headshots Counter */}
        <div className="flex items-center gap-5 rounded-xl border border-slate-800 bg-black/80 px-3.5 py-2 text-slate-300 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2">
            <Skull className="h-4 w-4 text-red-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kills</span>
            <span className="font-mono text-base font-black text-white">{stats.kills}</span>
          </div>
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-yellow-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Headshots</span>
            <span className="font-mono text-base font-black text-white">{stats.headshots}</span>
          </div>
        </div>

        {/* Music Attribute Corner Popup: Tribute to the German Thrash Gods */}
        {thrashMode && (
          <div className="flex items-center gap-2 rounded-xl border border-red-600/80 bg-red-950/90 px-3.5 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse">
            <Disc className="h-4 w-4 text-red-400 animate-spin" />
            <span className="text-xs font-black tracking-wider text-rose-200">
              Music Attribute: Tribute to the German Thrash Gods.
            </span>
          </div>
        )}
      </div>

      {/* BOTTOM LEFT: Health Bar, Round Counter, & Points Bar */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-3">
        {/* HEALTH BAR */}
        <div className="flex flex-col gap-1 rounded-xl border border-red-900/60 bg-black/80 p-3.5 backdrop-blur-md shadow-[0_0_15px_rgba(185,28,28,0.2)] w-72">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5 text-red-500">
              <Heart className="h-4 w-4 fill-red-500/30 text-red-500 animate-pulse" />
              <span>HEALTH</span>
            </div>
            <span className="font-mono text-sm text-white">
              {Math.ceil(health)} / {maxHealth}
            </span>
          </div>
          {/* Health Bar Track */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                healthPercent > 50
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                  : healthPercent > 25
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                  : 'bg-gradient-to-r from-red-700 to-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]'
              }`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        </div>

        {/* POINTS DISPLAY & ROUND COUNTER */}
        <div className="flex items-center gap-4 rounded-xl border border-yellow-500/40 bg-black/80 p-3.5 backdrop-blur-md shadow-[0_0_15px_rgba(234,179,8,0.15)] w-72">
          {/* Round Counter Badge */}
          <div className="flex flex-col items-center justify-center border-r border-slate-800 pr-4">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-red-600">
              ROUND
            </span>
            <div className="font-serif text-3xl font-black text-red-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
              {stats.round <= 4 ? '|'.repeat(stats.round) : stats.round}
            </div>
          </div>

          {/* Points Meter */}
          <div className="flex flex-1 flex-col justify-center gap-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-yellow-500">
              <Coins className="h-4 w-4 text-yellow-400" />
              <span>POINTS</span>
            </div>
            <span className="font-mono text-2xl font-black text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">
              {stats.score.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM CENTER: Perks Bar & Widow's Wine Charges */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2.5">
        {perks.map((perkId) => {
          const perk = PERK_MACHINES.find((p) => p.id === perkId);
          if (!perk) return null;
          return (
            <div
              key={perkId}
              className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-yellow-400/80 bg-black/85 shadow-[0_0_15px_rgba(234,179,8,0.4)] backdrop-blur-md"
              title={perk.name}
            >
              {perkId === 'juggernog' && <Shield className="h-6 w-6 text-red-500" />}
              {perkId === 'speedcola' && <Zap className="h-6 w-6 text-emerald-400" />}
              {perkId === 'doubletap' && <Flame className="h-6 w-6 text-amber-400" />}
              {perkId === 'quickrevive' && <RefreshCw className="h-6 w-6 text-cyan-400" />}
              {perkId === 'staminup' && <Footprints className="h-6 w-6 text-orange-400" />}
              {perkId === 'widowswine' && (
                <div className="relative flex items-center justify-center">
                  <Bug className="h-6 w-6 text-rose-300" />
                  <span className="absolute -bottom-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white border border-black">
                    {widowCharges}
                  </span>
                </div>
              )}
              {perkId === 'mulekick' && <Layers className="h-6 w-6 text-teal-400" />}
              {perkId === 'electriccherry' && <Sparkles className="h-6 w-6 text-indigo-400" />}
              {perkId === 'deadshot' && <Target className="h-6 w-6 text-amber-300" />}
            </div>
          );
        })}
      </div>

      {/* BOTTOM RIGHT: Weapon & Ammo Bar with Mule Kick Slots */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 rounded-xl border border-slate-800 bg-black/85 p-3.5 backdrop-blur-md shadow-lg w-80">
        {/* Inventory Weapon Slots (1, 2, 3) */}
        {inventory.length > 0 && (
          <div className="flex items-center gap-1.5 w-full pb-1 border-b border-slate-800/80">
            {inventory.map((w, idx) => {
              const isSelected = w.id === currentWeapon.id;
              return (
                <div
                  key={`${w.id}-${idx}`}
                  className={`flex-1 flex items-center justify-between px-2 py-1 rounded border text-[10px] font-bold uppercase transition-all ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'border-slate-800 bg-slate-900/40 text-slate-500'
                  }`}
                >
                  <span className="font-mono text-slate-400">[{idx + 1}]</span>
                  <span className="truncate max-w-[65px]">{w.name.split(' ')[0]}</span>
                  {w.isPackAPunched && <span className="text-[9px] text-purple-400 font-black">PaP</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Weapon Name & Pack-A-Punch Tag */}
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            WEAPON
          </span>
          <div className="flex items-center gap-2">
            {currentWeapon.isPackAPunched && (
              <span className="rounded bg-purple-950/80 px-2 py-0.5 text-[10px] font-black tracking-widest text-purple-300 border border-purple-500/50 uppercase">
                PaP
              </span>
            )}
            <span className="text-sm font-bold tracking-wider text-white uppercase">
              {currentWeapon.name}
            </span>
          </div>
        </div>

        {/* Reloading Status or Ammo Digits */}
        {isReloading ? (
          <div className="animate-pulse font-mono text-xl font-bold tracking-widest text-yellow-500 py-1">
            RELOADING...
          </div>
        ) : (
          <div className="flex items-baseline justify-between w-full font-mono">
            <span className="text-xs text-slate-400 font-sans uppercase font-bold">AMMO</span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-4xl font-black ${
                  currentWeapon.currentClip === 0
                    ? 'text-red-500 animate-pulse'
                    : currentWeapon.currentClip < currentWeapon.clipSize * 0.25
                    ? 'text-yellow-500'
                    : 'text-white'
                }`}
              >
                {currentWeapon.currentClip}
              </span>
              <span className="text-lg font-bold text-slate-600">/</span>
              <span className="text-xl font-bold text-slate-400">
                {currentWeapon.currentReserve}
              </span>
            </div>
          </div>
        )}

        {/* AMMO BAR */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              isReloading
                ? 'bg-yellow-500 animate-pulse'
                : clipPercent > 30
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                : clipPercent > 0
                ? 'bg-gradient-to-r from-amber-600 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                : 'bg-red-700'
            }`}
            style={{ width: `${isReloading ? 100 : clipPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

