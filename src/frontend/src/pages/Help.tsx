import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

type Section = { id: string; title: string; icon: string; body: string[] };

const sections: Section[] = [
  {
    id: "dashboard",
    icon: "🏠",
    title: "Dashboard",
    body: [
      "Lista wszystkich Twoich książek. Przycisk „+ Nowa książka” tworzy pustą książkę z tytułem — resztę (kontekst, postacie, rozdziały) uzupełniasz później.",
      "Dostęp do książek działa przez kody zaproszeń — jeśli ktoś ma udostępnić Ci książkę, potrzebujesz kodu od właściciela lub administratora.",
      "Kliknięcie w kafelek książki otwiera jej „Przegląd” (Book Overview) — stamtąd wchodzisz do konkretnych rozdziałów.",
    ],
  },
  {
    id: "book",
    icon: "📖",
    title: "Książka — Ustawienia i Postacie",
    body: [
      "Zakładka „Ustawienia” (Book Settings): tu wpisujesz kontekst książki, który AI wykorzystuje niemal w każdej analizie — tytuł, kategoria wiekowa, streszczenie autorskie, kluczowe informacje, motywy, styl pisarski. Im dokładniej to wypełnisz, tym trafniejsze będą propozycje AI w każdym trybie analizy.",
      "Zakładka „Postacie” (Book Characters): kartoteka bohaterów książki — pomocnicza baza, do której możesz zaglądać przy pisaniu, niezależna od analiz AI.",
      "Kontekst książki NIE jest wysyłany do trybu „Analiza badawcza” (patrz sekcja Analizy AI) — ten tryb celowo ignoruje kontekst literacki, żeby nie mieszał się z rzeczywistymi danymi badawczymi.",
    ],
  },
  {
    id: "chapters",
    icon: "📚",
    title: "Rozdziały",
    body: [
      "Lista rozdziałów widoczna w panelu bocznym po lewej, gdy jesteś w książce. Przeciąganie (uchwyt ⠿) zmienia kolejność rozdziałów.",
      "Kliknięcie w rozdział otwiera go w edytorze. Usunięte rozdziały trafiają do Kosza (patrz sekcja Kosz) — nie znikają bezpowrotnie od razu.",
    ],
  },
  {
    id: "editor",
    icon: "🖊️",
    title: "Panel edycji (edytor tekstu)",
    body: [
      "Górny pasek narzędzi edytora: Pogrubienie, Kursywa, Podkreślenie, Cofnij i Ponów — działają na zaznaczonym tekście, tak jak w standardowym edytorze tekstu.",
      "Wskaźnik zapisu przy tytule rozdziału pokazuje trzy stany: „Zapisano” (zielona kropka), „Zapisywanie...” (pomarańczowa, pulsująca) i „Niezapisane zmiany” (czerwona) — zapis jest automatyczny, nie trzeba klikać żadnego przycisku „Zapisz”.",
      "Linijka wcięć nad tekstem pozwala ustawić wcięcie akapitowe całego rozdziału — jedna wartość dla całego tekstu, nie per akapit.",
      "Zaznaczenie fragmentu tekstu i kliknięcie przycisku „Synonimy” w drugim rzędzie narzędzi pokazuje listę 5–8 synonimów dla zaznaczonego słowa (patrz sekcja Synonimy).",
    ],
  },
  {
    id: "annotations",
    icon: "🎨",
    title: "Adnotacje AI — jak działają kolorowe podświetlenia",
    body: [
      "Po uruchomieniu dowolnej analizy (patrz sekcja Analizy AI) fragmenty tekstu zostają podświetlone na kolor: czerwony, żółty, niebieski, pomarańczowy lub fioletowy — kolor zależy od trybu analizy i rodzaju uwagi, nie oznacza „ważności” w jednej uniwersalnej skali.",
      "Kliknięcie w podświetlony fragment otwiera dymek z wyjaśnieniem problemu i proponowaną poprawką. Jeśli analiza wygenerowała dwie alternatywne propozycje, zobaczysz dwa przyciski „Opcja 1” / „Opcja 2” zamiast jednego.",
      "Przycisk „Wstaw propozycję” podmienia oryginalny fragment na proponowany tekst — od razu w treści rozdziału. „Zostaw oryginał” zamyka dymek bez zmiany tekstu, ale zapamiętuje Twoją decyzję. „Wyślij do chatbota” przekazuje fragment i wyjaśnienie do panelu Kontekst/Czat, żeby przedyskutować go z AI zamiast automatycznie akceptować.",
      "Po zatwierdzeniu propozycji dymek pokazuje przycisk „Cofnij zmianę” — przywraca oryginalny tekst w dowolnym momencie, nawet po zapisaniu rozdziału. Znacznik „Zatwierdzone / Niezatwierdzone” na dole dymka pokazuje aktualny status danej adnotacji.",
      "Adnotacje z konkretnej analizy zostają zapisane i widoczne później w panelu „Historia” (patrz sekcja Historia analiz) — nie znikają po zamknięciu rozdziału.",
    ],
  },
  {
    id: "analysis",
    icon: "🤖",
    title: "Analizy AI — wszystkie tryby",
    body: [
      "U góry panelu narzędzi wybierasz dostawcę modelu (GPT lub Claude) oraz klucz API — klucz wpisujesz raz w Ustawieniach (ikona klucza), zapamiętywany jest lokalnie w przeglądarce, per dostawca.",
      "Listę trybów wybierasz z rozwijanego menu „AI”. Każdy tryb analizuje bieżący rozdział (poza „Spójność” i „Streszczenie”, które biorą pod uwagę całą książkę) i zwraca adnotacje opisane w sekcji Adnotacje AI.",
      "„Gramatyka i styl” — poprawki interpunkcji, gramatyki i stylu w bieżącym tekście, bez zmiany sensu zdań.",
      "„Kontekst (panel czatu)” — ta sama analiza gramatyczno-stylistyczna co wyżej, ale dodatkowo AI dostaje streszczenia wcześniejszych rozdziałów jako kontekst, więc wyłapuje też niespójności z tym, co już się wydarzyło w książce.",
      "„Dialogi” — ocena naturalności rozmów, czy każda postać ma swój unikalny sposób mówienia, czy tagi dialogowe („powiedział”, „zawołał”) nie są monotonne. Ten tryb zawsze proponuje przynajmniej kilka drobnych ulepszeń, nawet jeśli dialogi są już dobre.",
      "„Rozszerzenie sceny” — szuka zdań, które warto wzbogacić o szczegóły sensoryczne (wzrok, dźwięk, dotyk, zapach), opis otoczenia lub nastrój. Kluczowa zasada tego trybu: propozycje TYLKO dopisują nowy fragment do istniejącego zdania — nigdy nie przestawiają szyku ani nie podmieniają już napisanych słów. Jeśli fragment nie wymaga rozszerzenia, tryb go po prostu pomija zamiast wymyślać coś na siłę.",
      "„Emocja” — wyłapuje miejsca, gdzie emocja jest nazwana wprost („był zły”, „czuła smutek”) zamiast pokazana przez działanie, gesty czy reakcję ciała (zasada „show, don't tell”). Wszystkie adnotacje z tego trybu są zawsze w kolorze fioletowym.",
      "„Analiza spójności książki” — czyta wszystkie rozdziały naraz i szuka sprzeczności między nimi: inny kolor oczu postaci w różnych rozdziałach, nielogiczne skoki czasowe, zapomniane wątki, zmienne nazwy miejsc czy postaci. Wynik to czytelny raport tekstowy z odniesieniem do konkretnych rozdziałów, nie pojedyncze adnotacje w tekście.",
      "„Streszczenie książki” — trzy warianty do wyboru: Krótkie (3–5 zdań), Długie (kilka akapitów, wszystkie wątki i zakończenie) oraz Haki (5–7 chwytliwych zdań do promocji książki w social mediach).",
      "„Analiza badawcza” (Tryb Badawczy) — specjalny tryb dla tekstów niebeletrystycznych, np. dokumentacji badań naukowych/klinicznych. Model NIE generuje fikcji, nie uzupełnia brakujących danych własnymi domysłami i nie upiększa wniosków — sprawdza wyłącznie: niespójności wewnętrzne (sprzeczne liczby, daty), zgodność metodologii z wynikami i wnioskami, logikę statystyczną, terminologię medyczną i strukturę IMRAD. Limit tekstu to 16 000 znaków na analizę. Ten tryb jest wyraźnie oznaczony żółtym ostrzeżeniem nad wynikiem — jeśli go nie widzisz, nie jesteś w tym trybie.",
    ],
  },
  {
    id: "chat",
    icon: "💬",
    title: "Kontekst i czat z książką",
    body: [
      "Pływający panel czatu (przycisk „Kontekst”) to rozmowa z asystentem pisarskim, który zna kontekst książki, streszczenia dotychczasowych rozdziałów oraz streszczenia Waszych poprzednich rozmów o tej książce — nie zaczyna za każdym razem od zera.",
      "Możesz pisać zwykłym językiem — prośby o pomysły na fabułę, postacie, dialogi, rozwój wątków, albo wklejać tu fragmenty wysłane z dymka adnotacji przyciskiem „Wyślij do chatbota”.",
      "Po zamknięciu okna czatu rozmowa jest automatycznie streszczana (tylko wątek fabularny — bez uwag technicznych czy gramatycznych) i to streszczenie trafia do kontekstu kolejnych rozmów.",
    ],
  },
  {
    id: "comments",
    icon: "💭",
    title: "Komentarze",
    body: [
      "Zaznacz fragment tekstu i dodaj do niego komentarz — własną notatkę niezależną od adnotacji AI, np. przypomnienie „dopracować ten opis” albo pytanie do siebie na później.",
      "Wszystkie komentarze rozdziału widoczne są w panelu „Komentarze” z boku — kliknięcie komentarza podświetla powiązany fragment w tekście.",
    ],
  },
  {
    id: "lektor",
    icon: "🔊",
    title: "Lektor (odczyt na głos)",
    body: [
      "Funkcja odczytuje treść rozdziału na głos — przydatna, żeby usłyszeć tekst i wyłapać rzeczy, które w czytaniu wzrokiem umykają (nienaturalne zdania, powtórzenia).",
      "Lektor jest dostępny tylko przy dostawcy GPT — przy wybranym dostawcy Claude przycisk jest wyszarzony i nieaktywny.",
    ],
  },
  {
    id: "recordings",
    icon: "🎙️",
    title: "Nagrania",
    body: [
      "Panel nagrań przypisany do konkretnego rozdziału — miejsce na własne nagrania głosowe (np. dyktowane notatki, pomysły do sceny), przechowywane osobno dla każdego rozdziału.",
    ],
  },
  {
    id: "synonyms",
    icon: "🔤",
    title: "Synonimy",
    body: [
      "Zaznacz jedno słowo w tekście i kliknij „Synonimy” — AI zaproponuje 5–8 synonimów w kontekście języka literackiego, nie ogólnego słownika.",
      "Jeśli nic nie jest zaznaczone, panel pokaże przypomnienie „Zaznacz słowo, aby znaleźć synonimy” zamiast się otworzyć.",
    ],
  },
  {
    id: "history",
    icon: "🕘",
    title: "Historia analiz",
    body: [
      "Panel „Historia” pokazuje poprzednie analizy AI wykonane na danym rozdziale wraz z ich adnotacjami — możesz wrócić do starszej analizy i sprawdzić, które propozycje zostały wtedy zatwierdzone, a które odrzucone.",
    ],
  },
  {
    id: "settings",
    icon: "⚙️",
    title: "Ustawienia",
    body: [
      "Klucze API (GPT i Claude) — wpisujesz raz, zapamiętywane lokalnie w przeglądarce (per przeglądarka/urządzenie, nie w chmurze).",
      "„Własny system prompt AI” — pole tekstowe, w którym możesz dopisać własne, stałe instrukcje dla AI (np. „Pisz zawsze po polsku”, „Zachowaj styl noir”, „Unikaj słowa bardzo”). Ten tekst jest doklejany na końcu zapytania w większości trybów — patrz sekcja „Zachowania agenta” niżej, gdzie dokładnie i gdzie nie.",
      "Sekcja importu kopii zapasowej pozwala wczytać wcześniej wyeksportowaną książkę.",
    ],
  },
  {
    id: "other",
    icon: "📊",
    title: "Statystyki, Kosz i Admin",
    body: [
      "„Statystyki” pokazują liczby dot. Twoich książek i rozdziałów (np. liczbę słów, postęp pisania).",
      "„Kosz” przechowuje usunięte książki/rozdziały/komentarze/nagrania — stąd można je przywrócić, jeśli usunięcie było pomyłką.",
      "„Admin” (tarcza w panelu bocznym) widoczny jest tylko dla administratorów — zarządzanie dostępem, kodami zaproszeń i użytkownikami.",
    ],
  },
  {
    id: "agent",
    icon: "🧭",
    title: "Zachowania agenta i ukryte prompty — co jest wpisane w kodzie",
    body: [
      "To, co widzisz w interfejsie, to tylko połowa obrazu — każdy tryb analizy ma w kodzie własną, stałą „instrukcję systemową” (system prompt), której nie widzisz i nie edytujesz bezpośrednio. Ta sekcja tłumaczy, co jest tam zapisane na stałe, żebyś wiedział/a, czego się spodziewać.",
      "Wspólne zasady wpisane na stałe w trybach Gramatyka, Kontekst, Dialogi, Rozszerzenie sceny i Emocja (każda propozycja poprawki musi je spełniać): (1) propozycja musi mieć sens po wstawieniu w całe zdanie; (2) wyłącznie klasyczna interpunkcja — model NIE używa myślnika narracyjnego (—) w proponowanych poprawkach; (3) zmieniane jest tylko to, co jest błędem, nie całe zdanie; (4) model NIGDY nie wprowadza nowych postaci, sprawców ani faktów, których nie ma w oryginalnym tekście; (5) konstrukcja typu „miała wygięte ręce” to poprawna polska konstrukcja opisowa, nie strona bierna do poprawy — model ma jej nie ruszać; (6) każda propozycja jest przez model odczytywana ponownie jako całe zdanie przed zwróceniem — jeśli brzmi nienaturalnie, ma się sam poprawić.",
      "Tryb „Rozszerzenie sceny” ma dodatkowo twardy zakaz zmiany szyku zdania i podmieniania istniejących słów — wolno wyłącznie dopisywać nowy fragment do tego, co już jest napisane, i tylko tam, gdzie to naprawdę wzbogaca scenę (model ma nie szukać okazji do rozszerzenia na siłę).",
      "Tryb „Emocja” ma wpisane na stałe: wszystkie adnotacje z tej analizy muszą mieć kolor fioletowy — to nie przypadek ani ustawienie do zmiany w interfejsie.",
      "Tryb „Analiza spójności książki” i „Streszczenie książki” działają inaczej niż pozostałe — nie generują pojedynczych kolorowych adnotacji w tekście, tylko jeden zbiorczy raport/tekst na podstawie całej książki naraz.",
      "Tryb „Analiza badawcza” jest celowo najbardziej ograniczony: model ma zakaz generowania fikcji, uzupełniania brakujących danych domysłami i oceniania wartości naukowej odkryć — ocenia wyłącznie spójność logiczną i formalną. Ten tryb NIE dostaje kontekstu książki (żeby nie mieszał go z beletrystyką) i — w odróżnieniu od pozostałych trybów — NIE dokleja Twojego własnego system promptu z Ustawień.",
      "Twój „Własny system prompt AI” z Ustawień jest doklejany na końcu instrukcji w trybach: Gramatyka, Kontekst, Dialogi, Rozszerzenie sceny, Emocja, Spójność oraz w rozmowie na czacie — ale NIE w trybach Streszczenie i Analiza badawcza. Jeśli chcesz, żeby np. „unikaj słowa bardzo” działało wszędzie, pamiętaj że streszczenie i analiza badawcza tej instrukcji nie zobaczą.",
      "Czat (panel Kontekst) ma wpisaną rolę: „asystent pisarski, który pomaga w tworzeniu powieści, odpowiada na pytania, proponuje pomysły na fabułę, postacie, dialogi i rozwój wątków” oraz instrukcję, by odpowiadać konstruktywnie, konkretnie i inspirująco. Dostaje kontekst książki, streszczenia rozdziałów i streszczenia poprzednich rozmów — ale nie ma dostępu do panelu Admina ani do konfiguracji samej aplikacji.",
      "Żaden tryb analizy ani czat nie modyfikuje tekstu rozdziału samodzielnie — zawsze zwraca propozycję, którą Ty akceptujesz lub odrzucasz w dymku adnotacji (patrz sekcja Adnotacje AI). Model nigdy nie nadpisuje treści bez Twojego kliknięcia.",
    ],
  },
];

function highlight(text: string) {
  const parts = text.split(/(„[^”]+”)/g);
  return parts.map((part, i) =>
    part.startsWith("„") && part.endsWith("”") ? (
      <span key={i} className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-primary/10 text-primary font-medium text-[13px]">
        {part.slice(1, -1)}
      </span>
    ) : (
      part
    )
  );
}

export function HelpPage() {
  const navigate = useNavigate();
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const [query, setQuery] = useState("");
  const initialAnchor = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(initialAnchor ? [initialAnchor] : []));

  useEffect(() => {
    if (initialAnchor) {
      setTimeout(() => refs.current[initialAnchor]?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return sections;
    return sections.filter((s) => s.title.toLowerCase().includes(q) || s.body.some((p) => p.toLowerCase().includes(q)));
  }, [q]);

  useEffect(() => {
    if (q) setOpenIds(new Set(filtered.map((s) => s.id)));
  }, [q]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6 space-y-4">
      <div className="max-w-4xl mx-auto flex gap-6">
        <div className="hidden md:block w-52 shrink-0 sticky top-4 self-start space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">Spis treści</p>
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { setOpenIds((prev) => new Set(prev).add(s.id)); refs.current[s.id]?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
              className="block w-full text-left px-2 py-1 text-xs rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              data-ocid={`help.toc_link.${s.id}`}
            >
              {s.icon} {s.title}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold text-foreground">📚 Instrukcja obsługi WriterStudio</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Kliknij nagłówek sekcji, żeby ją rozwinąć/zwinąć. Ostatnia sekcja tłumaczy, co AI ma wpisane na stałe w kodzie.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard" })}
              className="shrink-0 text-xs px-3 py-1.5 rounded-md border border-border bg-background text-foreground hover:bg-muted"
              data-ocid="help.back_button"
            >
              ← Dashboard
            </button>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Szukaj (np. „emocja”, „lektor”, „prompt”)..."
            className="w-full px-3 py-2 text-sm rounded border border-border bg-card text-foreground"
            data-ocid="help.search_input"
          />
          {q && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">Brak wyników dla „{query}”.</p>
          )}

          <div className="space-y-3">
            {filtered.map((s) => {
              const isOpen = openIds.has(s.id);
              return (
                <div
                  key={s.id}
                  id={s.id}
                  ref={(el) => { refs.current[s.id] = el; }}
                  className={
                    "bg-card border rounded-lg scroll-mt-4 overflow-hidden " +
                    (initialAnchor === s.id ? "border-primary" : "border-border")
                  }
                >
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    className="w-full flex items-center justify-between gap-2 p-4 text-left hover:bg-accent/50"
                    data-ocid={`help.section_toggle.${s.id}`}
                  >
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <span>{s.icon}</span> {s.title}
                    </h2>
                    <span className="text-muted-foreground text-sm shrink-0">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <ul className="px-4 pb-4 space-y-2 list-disc list-outside ml-4">
                      {s.body.map((p, i) => (
                        <li key={i} className="text-sm text-muted-foreground leading-relaxed">{highlight(p)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
