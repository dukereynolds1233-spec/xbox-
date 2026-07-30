import React from 'react';
import { GameStats } from '../../types';
import { Play, RotateCcw, Volume2, VolumeX, Eye, Shield, Crosshair, Skull } from 'lucide-react';

interface StartOverlayProps {
  onStart: () => void;
}

export const StartOverlay: React.FC<StartOverlayProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="flex max-w-lg flex-col items-center rounded-2xl border border-red-900/50 bg-slate-950 p-8 text-center shadow-[0_0_50px_rgba(220,38,38,0.25)]">
        <h1 className="text-4xl font-black tracking-widest text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] uppercase">
          BLACK OPS ZOMBIES
        </h1>
        <p className="mt-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          3D First-Person Shooter Prototype
        </p>

        {/* Controls Instructions */}
        <div className="mt-6 grid w-full grid-cols-2 gap-3 text-left text-xs text-slate-300">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <span className="font-bold text-yellow-400">WASD</span> : Move Player
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <span className="font-bold text-yellow-400">Mouse</span> : Look Around
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <span className="font-bold text-yellow-400">Left Click</span> : Shoot Weapon
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <span className="font-bold text-yellow-400">R Key</span> : Reload Clip
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <span className="font-bold text-yellow-400">E Key</span> : Buy Wall Guns / Perks
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <span className="font-bold text-yellow-400">Shift</span> : Sprint Movement
          </div>
        </div>

        <button
          onClick={onStart}
          className="mt-8 flex items-center gap-3 rounded-xl bg-red-700 px-8 py-4 font-black tracking-wider text-white transition-all hover:bg-red-600 hover:shadow-[0_0_25px_rgba(220,38,38,0.8)] cursor-pointer uppercase"
        >
          <Play className="h-5 w-5 fill-current" />
          CLICK TO LOCK POINTER & PLAY
        </button>
      </div>
    </div>
  );
};

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  sensitivity: number;
  setSensitivity: (sens: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  stats: GameStats;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  sensitivity,
  setSensitivity,
  isMuted,
  setIsMuted,
  stats,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="flex max-w-md flex-col items-center rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center text-slate-100 shadow-2xl">
        <h2 className="text-3xl font-black tracking-widest text-red-600 uppercase">GAME PAUSED</h2>

        {/* Current Round Stats */}
        <div className="mt-6 grid w-full grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs">
          <div>
            <p className="text-slate-400">SURVIVED ROUND</p>
            <p className="text-xl font-bold text-yellow-400">{stats.round}</p>
          </div>
          <div>
            <p className="text-slate-400">TOTAL KILLS</p>
            <p className="text-xl font-bold text-white">{stats.kills}</p>
          </div>
          <div>
            <p className="text-slate-400">HEADSHOTS</p>
            <p className="text-xl font-bold text-white">{stats.headshots}</p>
          </div>
          <div>
            <p className="text-slate-400">TOTAL POINTS</p>
            <p className="text-xl font-bold text-yellow-400">{stats.totalPointsEarned}</p>
          </div>
        </div>

        {/* Settings Sliders */}
        <div className="mt-6 flex w-full flex-col gap-4 text-left text-xs">
          <div>
            <div className="flex justify-between font-bold text-slate-300">
              <span>MOUSE SENSITIVITY</span>
              <span>{sensitivity.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="mt-2 w-full accent-red-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300">GAME AUDIO</span>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 cursor-pointer"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
              {isMuted ? 'MUTED' : 'ENABLED'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex w-full flex-col gap-3">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-700 py-3 font-bold text-white hover:bg-red-600 transition-all cursor-pointer uppercase"
          >
            <Play className="h-4 w-4 fill-current" />
            RESUME GAME
          </button>
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-3 font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer uppercase"
          >
            <RotateCcw className="h-4 w-4" />
            RESTART MISSION
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverProps {
  stats: GameStats;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverProps> = ({ stats, onRestart }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-950/90 backdrop-blur-lg">
      <div className="flex max-w-lg flex-col items-center rounded-2xl border border-red-800 bg-black/90 p-8 text-center text-slate-100 shadow-[0_0_60px_rgba(220,38,38,0.5)]">
        <h1 className="text-5xl font-black tracking-widest text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.9)] uppercase">
          YOU DIED
        </h1>
        <p className="mt-2 text-sm font-bold tracking-widest text-slate-300 uppercase">
          YOU SURVIVED {stats.round} ROUNDS
        </p>

        <div className="mt-8 grid w-full grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm">
          <div className="flex flex-col items-center">
            <Skull className="h-6 w-6 text-red-500" />
            <span className="mt-1 text-xs text-slate-400">TOTAL KILLS</span>
            <span className="text-2xl font-black text-white">{stats.kills}</span>
          </div>
          <div className="flex flex-col items-center">
            <Crosshair className="h-6 w-6 text-yellow-500" />
            <span className="mt-1 text-xs text-slate-400">HEADSHOTS</span>
            <span className="text-2xl font-black text-white">{stats.headshots}</span>
          </div>
          <div className="flex flex-col items-center">
            <Shield className="h-6 w-6 text-cyan-400" />
            <span className="mt-1 text-xs text-slate-400">ROUNDS SURVIVED</span>
            <span className="text-2xl font-black text-yellow-400">{stats.round}</span>
          </div>
          <div className="flex flex-col items-center">
            <Eye className="h-6 w-6 text-emerald-400" />
            <span className="mt-1 text-xs text-slate-400">POINTS EARNED</span>
            <span className="text-2xl font-black text-yellow-400">{stats.totalPointsEarned}</span>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="mt-8 flex items-center gap-3 rounded-xl bg-red-700 px-8 py-4 font-black tracking-wider text-white transition-all hover:bg-red-600 hover:shadow-[0_0_30px_rgba(220,38,38,0.9)] cursor-pointer uppercase"
        >
          <RotateCcw className="h-5 w-5" />
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};
