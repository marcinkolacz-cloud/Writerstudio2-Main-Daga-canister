import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookStats, useBooks, useOverallStats } from "@/hooks/useBackend";
import { BarChart3, BookOpen, FileText, Layers } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function StatCard({
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
    <Card className="bg-card border-border shadow-subtle transition-smooth hover:shadow-elevated">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-body">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-20" />
          ) : (
            <p className="text-2xl font-display font-semibold text-foreground">
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BookStatsRow({
  book,
  index,
}: {
  book: { id: bigint; title: string };
  index: number;
}) {
  const { data: stats, isLoading } = useBookStats(book.id.toString());

  return (
    <div
      data-ocid={`statistics.book_row.item.${index + 1}`}
      className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-smooth hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-medium text-foreground">
          {book.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          ID: {book.id.toString()}
        </p>
      </div>
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        {isLoading ? (
          <>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">
                {Number(stats?.totalWords ?? 0).toLocaleString()}
              </span>{" "}
              słów
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-chart-4" />
              <span className="font-medium text-foreground">
                {Number(stats?.totalChars ?? 0).toLocaleString()}
              </span>{" "}
              znaków
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-chart-2" />
              <span className="font-medium text-foreground">
                {Number(stats?.chapterCount ?? 0).toLocaleString()}
              </span>{" "}
              rozdz.
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-chart-3" />
              <span className="font-medium text-foreground">
                {Number(stats?.avgWordsPerChapter ?? 0).toLocaleString()}
              </span>{" "}
              śr./rozdz.
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function StatisticsPage() {
  const { data: overall, isLoading: overallLoading } = useOverallStats();
  const { data: books, isLoading: booksLoading } = useBooks();

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

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Statystyki pisarskie
        </h1>
        <p className="mt-1 text-muted-foreground">
          Podsumowanie Twoich książek i postępów
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Książki"
          value={Number(overall?.totalBooks ?? 0).toLocaleString()}
          icon={<BookOpen className="h-6 w-6" />}
          loading={overallLoading}
        />
        <StatCard
          label="Słowa"
          value={Number(overall?.totalWords ?? 0).toLocaleString()}
          icon={<FileText className="h-6 w-6" />}
          loading={overallLoading}
        />
        <StatCard
          label="Rozdziały"
          value={Number(overall?.totalChapters ?? 0).toLocaleString()}
          icon={<Layers className="h-6 w-6" />}
          loading={overallLoading}
        />
      </section>

      {books && books.length > 0 && (
        <section>
          <Card className="bg-card border-border shadow-subtle">
            <CardHeader>
              <CardTitle className="font-display text-lg text-foreground">
                Liczba słów na książkę
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                {chartLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="oklch(var(--border))"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fill: "oklch(var(--muted-foreground))",
                          fontSize: 12,
                        }}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{
                          fill: "oklch(var(--muted-foreground))",
                          fontSize: 12,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(var(--card))",
                          border: "1px solid oklch(var(--border))",
                          borderRadius: "var(--radius)",
                          color: "oklch(var(--foreground))",
                        }}
                        formatter={(value: number) => [
                          `${value.toLocaleString()} słów`,
                          "Słowa",
                        ]}
                      />
                      <Bar
                        dataKey="words"
                        fill="oklch(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-display font-semibold text-foreground">
          Szczegóły książek
        </h2>
        {booksLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={`skeleton-${i + 1}`} className="h-16 w-full" />
            ))}
          </div>
        ) : books && books.length > 0 ? (
          <div className="space-y-3">
            {books.map((book, i) => (
              <BookStatsRow key={book.id.toString()} book={book} index={i} />
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
      </section>
    </div>
  );
}
