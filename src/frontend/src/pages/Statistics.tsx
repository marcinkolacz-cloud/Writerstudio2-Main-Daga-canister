import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBookStats,
  useBooks,
  useOverallStats,
  useResetWritingStats,
} from "@/hooks/useBackend";
import {
  useGlobalWritingStats,
  useHourlyDistribution,
  useStatsByBook,
} from "@/hooks/useBackend";
import {
  BarChart3,
  BookOpen,
  Flame,
  FileText,
  Layers,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Legend, Line, LineChart } from "recharts";

const BOOK_ACCENT_CLASSES = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

function OverviewStat({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="flex flex-1 items-center gap-3 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-body">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-5 w-14" />
        ) : (
          <p className="text-lg font-display font-semibold text-foreground leading-tight">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function BookAccentCard({
  book,
  index,
}: {
  book: { id: bigint; title: string };
  index: number;
}) {
  const { data: stats, isLoading } = useBookStats(book.id.toString());
  const accentClass = BOOK_ACCENT_CLASSES[index % BOOK_ACCENT_CLASSES.length];

  return (
    <div
      data-ocid={`statistics.book_row.item.${index + 1}`}
      className="group relative overflow-hidden rounded-lg border border-border bg-card transition-smooth hover:shadow-elevated"
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${accentClass}`}
        aria-hidden="true"
      />
      <div className="flex items-center justify-between gap-4 p-4 pl-5">
        <p className="min-w-0 truncate font-display font-medium text-foreground">
          {book.title}
        </p>
        {isLoading ? (
          <Skeleton className="h-5 w-40 shrink-0" />
        ) : (
          <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="font-display font-semibold text-foreground">
                {Number(stats?.totalWords ?? 0).toLocaleString("pl-PL")}
              </span>
              słów
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <span className="font-display font-semibold text-foreground">
                {Number(stats?.chapterCount ?? 0).toLocaleString("pl-PL")}
              </span>
              rozdz.
            </span>
            <span className="hidden items-center gap-1 md:flex">
              <span className="font-display font-semibold text-foreground">
                {Number(stats?.avgWordsPerChapter ?? 0).toLocaleString("pl-PL")}
              </span>
              śr./rozdz.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultFromDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return isoDate(d);
}

function defaultToDate(): string {
  return isoDate(new Date());
}

export function StatisticsPage() {
  const { data: overall, isLoading: overallLoading } = useOverallStats();
  const { data: books, isLoading: booksLoading } = useBooks();

  const [statsScope, setStatsScope] = useState<"global" | "book">("global");
  const [selectedStatsBookId, setSelectedStatsBookId] = useState<string>("");
  const [fromDate, setFromDate] = useState(defaultFromDate());
  const [toDate, setToDate] = useState(defaultToDate());
  const [confirmingReset, setConfirmingReset] = useState(false);
  const resetStatsMutation = useResetWritingStats();

  const handleResetStats = async () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      setTimeout(() => setConfirmingReset(false), 4000);
      return;
    }
    setConfirmingReset(false);
    try {
      await resetStatsMutation.mutateAsync();
      toast.success("Statystyki zresetowane", {
        description: "Liczenie słów/aktywności zaczyna się od zera.",
      });
    } catch (err) {
      toast.error("Nie udało się zresetować statystyk", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  };

  const { data: globalStats, isLoading: globalStatsLoading } =
    useGlobalWritingStats(fromDate, toDate);
  const { data: bookScopedStats, isLoading: bookScopedStatsLoading } =
    useStatsByBook(selectedStatsBookId || "0", fromDate, toDate);

  const writingStatsData =
    statsScope === "global" ? globalStats : bookScopedStats;
  const writingStatsLoading =
    statsScope === "global" ? globalStatsLoading : bookScopedStatsLoading;

  const HEATMAP_WEEKS = 53;
  const heatmapToDate = defaultToDate();
  const heatmapFromDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - (HEATMAP_WEEKS * 7 - 1));
    return isoDate(d);
  })();

  const { data: heatmapGlobalStats, isLoading: heatmapGlobalLoading } =
    useGlobalWritingStats(heatmapFromDate, heatmapToDate);
  const { data: heatmapBookScopedStats, isLoading: heatmapBookScopedLoading } =
    useStatsByBook(selectedStatsBookId || "0", heatmapFromDate, heatmapToDate);

  const heatmapStatsData =
    statsScope === "global" ? heatmapGlobalStats : heatmapBookScopedStats;
  const heatmapLoading =
    statsScope === "global" ? heatmapGlobalLoading : heatmapBookScopedLoading;

  const byDateWords = (() => {
    const byDate = new Map<string, number>();
    for (const stat of heatmapStatsData ?? []) {
      const words = Number(stat.wordsAdded);
      byDate.set(stat.date, (byDate.get(stat.date) ?? 0) + words);
    }
    return byDate;
  })();

  // Align the grid to full weeks (Mon..Sun) like GitHub's contribution
  // calendar: find the Monday on/before the range start, and the Sunday
  // on/after the range end, so every column is a complete week.
  const gridStart = (() => {
    const d = new Date(heatmapFromDate);
    const dow = (d.getDay() + 6) % 7; // 0=Mon .. 6=Sun
    d.setDate(d.getDate() - dow);
    return d;
  })();
  const gridEnd = (() => {
    const d = new Date(heatmapToDate);
    const dow = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() + (6 - dow));
    return d;
  })();

  const heatmapWeeks: Array<Array<{ date: string; words: number; inRange: boolean }>> = (() => {
    const weeks: Array<Array<{ date: string; words: number; inRange: boolean }>> = [];
    let cursor = new Date(gridStart);
    let week: Array<{ date: string; words: number; inRange: boolean }> = [];
    while (cursor <= gridEnd) {
      const dateStr = isoDate(cursor);
      week.push({
        date: dateStr,
        words: byDateWords.get(dateStr) ?? 0,
        inRange: dateStr >= heatmapFromDate && dateStr <= heatmapToDate,
      });
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() + 1);
    }
    if (week.length > 0) weeks.push(week);
    return weeks;
  })();

  const monthLabels = (() => {
    const labels: Array<{ weekIndex: number; label: string }> = [];
    let lastMonth = -1;
    heatmapWeeks.forEach((week, i) => {
      const firstInRangeDay = week.find((d) => d.inRange);
      if (!firstInRangeDay) return;
      const month = new Date(firstInRangeDay.date).getMonth();
      if (month !== lastMonth) {
        labels.push({
          weekIndex: i,
          label: new Date(firstInRangeDay.date).toLocaleDateString("pl-PL", {
            month: "short",
          }),
        });
        lastMonth = month;
      }
    });
    return labels;
  })();

  const maxHeatmapWords = Math.max(
    1,
    ...heatmapWeeks.flatMap((w) => w.map((c) => c.words)),
  );

  const { currentStreak, bestStreak, wordsToday } = (() => {
    const today = defaultToDate();
    const sortedDates = Array.from(byDateWords.keys()).sort();
    let best = 0;
    let running = 0;
    let prevDate: string | null = null;
    for (const date of sortedDates) {
      if (byDateWords.get(date)! <= 0) continue;
      if (prevDate) {
        const prev = new Date(prevDate);
        prev.setDate(prev.getDate() + 1);
        if (isoDate(prev) === date) {
          running += 1;
        } else {
          running = 1;
        }
      } else {
        running = 1;
      }
      best = Math.max(best, running);
      prevDate = date;
    }

    let current = 0;
    const cursor = new Date(today);
    // A streak "counts" today only once today has words; otherwise it looks
    // back from yesterday so an unbroken streak isn't reset to 0 mid-day.
    if ((byDateWords.get(today) ?? 0) <= 0) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while ((byDateWords.get(isoDate(cursor)) ?? 0) > 0) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      currentStreak: current,
      bestStreak: best,
      wordsToday: byDateWords.get(today) ?? 0,
    };
  })();

  function heatmapIntensityClass(words: number, inRange: boolean): string {
    if (!inRange) return "bg-transparent";
    if (words === 0) return "bg-muted";
    const ratio = words / maxHeatmapWords;
    if (ratio < 0.25) return "bg-primary/25";
    if (ratio < 0.5) return "bg-primary/50";
    if (ratio < 0.75) return "bg-primary/75";
    return "bg-primary";
  }

  const { data: hourlyData, isLoading: hourlyLoading } =
    useHourlyDistribution();
  const hourlyChartData = Array.from({ length: 24 }, (_, h) => {
    const found = (hourlyData ?? []).find((s) => Number(s.hour) === h);
    return { hour: `${h}:00`, words: found ? Number(found.wordsAdded) : 0 };
  });

  const dailyChartData = (() => {
    const byDate = new Map<
      string,
      {
        date: string;
        wordsAdded: number;
        wordsRemoved: number;
        netWords: number;
        activeMinutes: number;
      }
    >();
    for (const stat of writingStatsData ?? []) {
      const existing = byDate.get(stat.date);
      const wordsAdded = Number(stat.wordsAdded);
      const wordsRemoved = Number(stat.wordsRemoved);
      const netWords = Number(stat.netWords);
      const activeMinutes = Number(stat.activeMinutes);
      if (existing) {
        existing.wordsAdded += wordsAdded;
        existing.wordsRemoved += wordsRemoved;
        existing.netWords += netWords;
        existing.activeMinutes += activeMinutes;
      } else {
        byDate.set(stat.date, {
          date: stat.date,
          wordsAdded,
          wordsRemoved,
          netWords,
          activeMinutes,
        });
      }
    }
    return Array.from(byDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        wpm:
          d.activeMinutes > 0 ? Math.round(d.wordsAdded / d.activeMinutes) : 0,
      }));
  })();

  const bookIds = books?.map((b) => b.id.toString()) ?? [];

  const bookStats1 = useBookStats(bookIds[0] ?? "");
  const bookStats2 = useBookStats(bookIds[1] ?? "");
  const bookStats3 = useBookStats(bookIds[2] ?? "");
  const bookStats4 = useBookStats(bookIds[3] ?? "");
  const bookStats5 = useBookStats(bookIds[4] ?? "");
  const bookStats6 = useBookStats(bookIds[5] ?? "");
  const bookStats7 = useBookStats(bookIds[6] ?? "");
  const bookStats8 = useBookStats(bookIds[7] ?? "");
  const bookStats9 = useBookStats(bookIds[8] ?? "");
  const bookStats10 = useBookStats(bookIds[9] ?? "");

  const bookStatsQueries = [
    bookStats1,
    bookStats2,
    bookStats3,
    bookStats4,
    bookStats5,
    bookStats6,
    bookStats7,
    bookStats8,
    bookStats9,
    bookStats10,
  ];

  const chartData =
    books?.map((b, i) => ({
      name: b.title,
      words: Number(bookStatsQueries[i]?.data?.totalWords ?? 0n),
    })) ?? [];

  const chartLoading = bookStatsQueries.some((q) => q.isLoading);

  const tooltipStyle = {
    backgroundColor: "oklch(var(--card))",
    border: "1px solid oklch(var(--border))",
    borderRadius: "var(--radius)",
    color: "oklch(var(--foreground))",
  };
  const axisTick = { fill: "oklch(var(--muted-foreground))", fontSize: 11 };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Statystyki pisarskie
          </h1>
          <p className="mt-1 text-muted-foreground">
            Podsumowanie Twoich książek i postępów
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetStats}
          disabled={resetStatsMutation.isPending}
          data-ocid="statistics.reset_stats_button"
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
            confirmingReset
              ? "border-destructive bg-destructive text-destructive-foreground"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {resetStatsMutation.isPending
            ? "Resetowanie..."
            : confirmingReset
              ? "Kliknij ponownie, aby potwierdzić"
              : "Resetuj statystyki"}
        </button>
      </div>

      {/* Hero: streak + today, the emotional anchor of the page */}
      <Card className="border-border bg-gradient-to-br from-primary/10 via-card to-card shadow-subtle overflow-hidden">
        <CardContent className="p-0">
          <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Flame className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">
                  Aktualna seria
                </p>
                {heatmapLoading ? (
                  <Skeleton className="mt-1 h-9 w-24" />
                ) : (
                  <p className="font-display text-4xl font-bold leading-none text-foreground">
                    {currentStreak}
                    <span className="ml-1.5 text-base font-medium text-muted-foreground">
                      {currentStreak === 1 ? "dzień" : "dni"}
                    </span>
                  </p>
                )}
                {!heatmapLoading && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Trophy className="h-3 w-3" />
                    Rekord: {bestStreak} {bestStreak === 1 ? "dzień" : "dni"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-chart-2/15 text-chart-2">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-body">
                  Napisane dziś
                </p>
                {heatmapLoading ? (
                  <Skeleton className="mt-1 h-9 w-24" />
                ) : (
                  <p className="font-display text-4xl font-bold leading-none text-foreground">
                    {wordsToday.toLocaleString("pl-PL")}
                    <span className="ml-1.5 text-base font-medium text-muted-foreground">
                      słów
                    </span>
                  </p>
                )}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Odśwież po zapisaniu rozdziału
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact overview strip */}
      <Card className="bg-card border-border shadow-subtle">
        <CardContent className="p-0">
          <div className="flex divide-x divide-border">
            <OverviewStat
              label="Książki"
              value={Number(overall?.totalBooks ?? 0).toLocaleString("pl-PL")}
              icon={<BookOpen className="h-4 w-4" />}
              loading={overallLoading}
            />
            <OverviewStat
              label="Słowa łącznie"
              value={Number(overall?.totalWords ?? 0).toLocaleString("pl-PL")}
              icon={<FileText className="h-4 w-4" />}
              loading={overallLoading}
            />
            <OverviewStat
              label="Rozdziały"
              value={Number(overall?.totalChapters ?? 0).toLocaleString("pl-PL")}
              icon={<Layers className="h-4 w-4" />}
              loading={overallLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Calendar — the signature element */}
      <Card className="bg-card border-border shadow-subtle">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-display text-lg text-foreground">
            Regularność pisania
          </CardTitle>
          <span className="text-xs text-muted-foreground">ostatni rok</span>
        </CardHeader>
        <CardContent>
          {heatmapLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="overflow-x-auto pb-2">
              <div
                className="inline-grid gap-[3px]"
                style={{
                  gridTemplateColumns: `auto repeat(${heatmapWeeks.length}, minmax(11px, 1fr))`,
                  gridTemplateRows: "14px repeat(7, minmax(11px, 1fr))",
                }}
                data-ocid="statistics.writing_stats.heatmap"
              >
                <div />
                {heatmapWeeks.map((_, weekIndex) => {
                  const found = monthLabels.find((m) => m.weekIndex === weekIndex);
                  return (
                    <div
                      key={`month-${weekIndex}`}
                      className="text-[10px] text-muted-foreground"
                    >
                      {found?.label ?? ""}
                    </div>
                  );
                })}

                {["Pon", "", "Śr", "", "Pt", "", "Nie"].map((label, dayOfWeek) => (
                  <Fragment key={`row-${dayOfWeek}`}>
                    <div className="pr-1.5 text-[10px] text-muted-foreground text-right leading-[11px]">
                      {label}
                    </div>
                    {heatmapWeeks.map((week, weekIndex) => {
                      const cell = week[dayOfWeek];
                      if (!cell) return <div key={`empty-${weekIndex}-${dayOfWeek}`} />;
                      return (
                        <div
                          key={cell.date}
                          title={`${cell.date}: ${cell.words.toLocaleString("pl-PL")} słów`}
                          className={`aspect-square rounded-sm ${heatmapIntensityClass(cell.words, cell.inRange)}`}
                        />
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Intensywność koloru = liczba słów dodanych danego dnia.</span>
            <span className="flex items-center gap-1">
              Mniej
              <span className="h-2.5 w-2.5 rounded-sm bg-muted" />
              <span className="h-2.5 w-2.5 rounded-sm bg-primary/25" />
              <span className="h-2.5 w-2.5 rounded-sm bg-primary/50" />
              <span className="h-2.5 w-2.5 rounded-sm bg-primary/75" />
              <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
              Więcej
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Books */}
      <div className="space-y-3">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Twoje książki
        </h2>
        {booksLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={`skeleton-${i + 1}`} className="h-14 w-full" />
            ))}
          </div>
        ) : books && books.length > 0 ? (
          <div className="space-y-2">
            {books.map((book, i) => (
              <BookAccentCard key={book.id.toString()} book={book} index={i} />
            ))}
          </div>
        ) : (
          <div
            data-ocid="statistics.empty_state"
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12"
          >
            <BookOpen className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">
              Nie masz jeszcze żadnych książek.
            </p>
          </div>
        )}
      </div>

      {/* Filters for the chart grid below */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Wykresy
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 items-center overflow-hidden rounded-md border border-border">
            <button
              type="button"
              className={`h-8 px-3 text-xs font-medium transition-colors ${statsScope === "global" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
              onClick={() => setStatsScope("global")}
              data-ocid="statistics.writing_stats.scope_global_button"
            >
              Wszystkie książki
            </button>
            <button
              type="button"
              className={`h-8 px-3 text-xs font-medium transition-colors ${statsScope === "book" ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
              onClick={() => setStatsScope("book")}
              data-ocid="statistics.writing_stats.scope_book_button"
            >
              Jedna książka
            </button>
          </div>
          {statsScope === "book" && (
            <select
              value={selectedStatsBookId}
              onChange={(e) => setSelectedStatsBookId(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
              data-ocid="statistics.writing_stats.book_select"
            >
              <option value="">Wybierz książkę</option>
              {(books ?? []).map((b) => (
                <option key={b.id.toString()} value={b.id.toString()}>
                  {b.title}
                </option>
              ))}
            </select>
          )}
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            data-ocid="statistics.writing_stats.from_date_input"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            data-ocid="statistics.writing_stats.to_date_input"
          />
        </div>
      </div>

      {/* Chart grid — 2 columns on desktop */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card border-border shadow-subtle">
          <CardHeader>
            <CardTitle className="font-display text-base text-foreground">
              Słowa napisane dziennie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {writingStatsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : dailyChartData.length === 0 ? (
                <div
                  className="flex h-full items-center justify-center text-sm text-muted-foreground"
                  data-ocid="statistics.writing_stats.empty_state"
                >
                  Brak danych o pisaniu w wybranym zakresie dat.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyChartData}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                    <XAxis dataKey="date" tick={axisTick} />
                    <YAxis tick={axisTick} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="wordsAdded"
                      name="Dodane słowa"
                      stroke="oklch(var(--chart-1))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="netWords"
                      name="Bilans netto"
                      stroke="oklch(var(--chart-2))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-subtle">
          <CardHeader>
            <CardTitle className="font-display text-base text-foreground">
              Tempo pisania (słowa/min)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {writingStatsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : dailyChartData.length === 0 ? (
                <div
                  className="flex h-full items-center justify-center text-sm text-muted-foreground"
                  data-ocid="statistics.writing_stats.wpm_empty_state"
                >
                  Brak danych o tempie pisania w wybranym zakresie dat.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyChartData}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                    <XAxis dataKey="date" tick={axisTick} />
                    <YAxis tick={axisTick} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [
                        `${value.toLocaleString("pl-PL")} słów/min`,
                        "Tempo",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="wpm"
                      name="Słowa na minutę"
                      stroke="oklch(var(--chart-3))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-subtle">
          <CardHeader>
            <CardTitle className="font-display text-base text-foreground">
              Słowa na książkę
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {chartLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={axisTick}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={axisTick} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [
                        `${value.toLocaleString("pl-PL")} słów`,
                        "Słowa",
                      ]}
                    />
                    <Bar dataKey="words" fill="oklch(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-subtle">
          <CardHeader>
            <CardTitle className="font-display text-base text-foreground">
              Kiedy piszesz (godziny)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {hourlyLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hourlyChartData}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                    <XAxis
                      dataKey="hour"
                      tick={{ ...axisTick, fontSize: 10 }}
                      interval={1}
                    />
                    <YAxis tick={axisTick} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [
                        `${value.toLocaleString("pl-PL")} słów`,
                        "Słowa",
                      ]}
                    />
                    <Bar dataKey="words" fill="oklch(var(--chart-4))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Suma słów o danej godzinie, cała historia.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
