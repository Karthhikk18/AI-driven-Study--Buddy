import React, { useMemo } from 'react';
import { Flame, TrendingUp, Target } from 'lucide-react';

interface StudyHeatmapProps {
  sessions?: { date: string; count: number }[];
}

function generateDemoSessions() {
  const sessions: { date: string; count: number }[] = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    // Generate realistic study pattern — more active on weekdays
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const rand = Math.random();
    let count = 0;
    if (rand > (isWeekend ? 0.65 : 0.35)) {
      count = Math.floor(Math.random() * (isWeekend ? 3 : 6)) + 1;
    }
    // Simulate exam week bursts
    if (i < 7 || (i > 30 && i < 37)) count = Math.min(8, count + Math.floor(Math.random() * 4));
    sessions.push({ date: dateStr, count });
  }
  return sessions;
}

const CELL_SIZE = 14;
const CELL_GAP = 3;
const WEEKS = 13;
const DAYS_PER_WEEK = 7;

function getIntensityClass(count: number): string {
  if (count === 0) return 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800';
  if (count <= 1) return 'bg-emerald-200 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-800';
  if (count <= 3) return 'bg-emerald-400 dark:bg-emerald-700 border-emerald-500 dark:border-emerald-600';
  if (count <= 5) return 'bg-emerald-500 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-400';
  return 'bg-emerald-600 dark:bg-emerald-400 border-emerald-700 dark:border-emerald-300';
}

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({ sessions: propSessions }) => {
  const sessions = useMemo(() => propSessions || generateDemoSessions(), [propSessions]);
  const sessionMap = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => { map[s.date] = s.count; });
    return map;
  }, [sessions]);

  // Build 13×7 grid (91 days, starting from Sunday)
  const today = new Date();
  const cells: { date: string; count: number; isToday: boolean; isFuture: boolean }[] = [];

  // Find the most recent Sunday
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (WEEKS * DAYS_PER_WEEK - 1));

  for (let i = 0; i < WEEKS * DAYS_PER_WEEK; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    cells.push({
      date: dateStr,
      count: sessionMap[dateStr] || 0,
      isToday: dateStr === todayStr,
      isFuture: d > today,
    });
  }

  // Stats
  const totalSessions = sessions.reduce((a, b) => a + b.count, 0);
  const activeDays = sessions.filter((s) => s.count > 0).length;
  let currentStreak = 0;
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].count > 0) currentStreak++;
    else break;
  }

  const monthLabels: { label: string; colIndex: number }[] = [];
  for (let week = 0; week < WEEKS; week++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + week * 7);
    if (d.getDate() <= 7) {
      monthLabels.push({
        label: d.toLocaleDateString('en', { month: 'short' }),
        colIndex: week,
      });
    }
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-black dark:text-white">Study Activity Heatmap</h3>
          <p className="text-[10px] text-zinc-500 font-semibold">Last 90 days of study sessions</p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5 text-amber-500">
            <Flame className="w-4 h-4" />
            <span className="font-extrabold">{currentStreak} day streak</span>
          </div>
          <div className="flex items-center space-x-1.5 text-emerald-500">
            <TrendingUp className="w-4 h-4" />
            <span className="font-bold">{activeDays} active days</span>
          </div>
          <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400">
            <Target className="w-4 h-4" />
            <span className="font-bold">{totalSessions} total sessions</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex space-x-1" style={{ minWidth: WEEKS * (CELL_SIZE + CELL_GAP) + 40 }}>
          {/* Day labels */}
          <div className="flex flex-col justify-between py-5 pr-1" style={{ gap: CELL_GAP }}>
            {dayLabels.map((day, i) => (
              <div key={day} className="text-[9px] font-bold text-zinc-400 text-right" style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px` }}>
                {i % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div>
            {/* Month labels */}
            <div className="flex mb-1" style={{ gap: CELL_GAP }}>
              {Array.from({ length: WEEKS }).map((_, weekIdx) => {
                const label = monthLabels.find((m) => m.colIndex === weekIdx);
                return (
                  <div key={weekIdx} style={{ width: CELL_SIZE }} className="text-[9px] font-bold text-zinc-400 truncate">
                    {label?.label || ''}
                  </div>
                );
              })}
            </div>

            {/* Cells */}
            <div className="flex" style={{ gap: CELL_GAP }}>
              {Array.from({ length: WEEKS }).map((_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col" style={{ gap: CELL_GAP }}>
                  {Array.from({ length: DAYS_PER_WEEK }).map((_, dayIdx) => {
                    const cellIdx = weekIdx * DAYS_PER_WEEK + dayIdx;
                    const cell = cells[cellIdx];
                    if (!cell) return <div key={dayIdx} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
                    return (
                      <div
                        key={dayIdx}
                        title={`${cell.date}: ${cell.count} session${cell.count !== 1 ? 's' : ''}`}
                        className={`rounded-sm border transition-all duration-150 hover:scale-125 hover:z-10 relative cursor-default ${
                          cell.isFuture
                            ? 'bg-transparent border-transparent'
                            : cell.isToday
                            ? 'ring-2 ring-black dark:ring-white ' + getIntensityClass(cell.count)
                            : getIntensityClass(cell.count)
                        }`}
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end space-x-1.5 mt-2">
              <span className="text-[9px] text-zinc-400 font-semibold">Less</span>
              {[0, 1, 3, 5, 7].map((v) => (
                <div
                  key={v}
                  className={`rounded-sm border ${getIntensityClass(v)}`}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                />
              ))}
              <span className="text-[9px] text-zinc-400 font-semibold">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
