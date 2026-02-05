# Firecrawl – Verze 2 (dokumentace a návrhy vylepšení)

## 1) Co je Firecrawl a jak funguje
Firecrawl je API pro web scraping/crawling navržené pro AI agenty. Umí stáhnout web, vyčistit obsah (odstraní JS/CSS/noise) a vrátit data ve formě vhodné pro LLM (např. markdown/JSON).

### Hlavní endpointy
- **/scrape** – jednorázové stažení konkrétní URL (HTML → markdown/JSON)
- **/crawl** – rekurzivní průchod webu (subdomény/sekce), vrátí seznam stránek
- **/map** – aplikace schématu na celý crawl (extrakce do JSON)
- **/agent** – agent, který sám naviguje a extrahuje dle instrukcí

V tomto projektu se volá přes funkci [`firecrawl()`](Firecrawl.gs:53), která posílá payload dle zvoleného endpointu (viz [`buildFirecrawlPayload()`](Firecrawl.gs:286)).

---

## 2) Novinka: `maxCredits` – limit útraty
Parametr `maxCredits` umožňuje omezit maximální spotřebu kreditů na jednu úlohu (typicky u `/agent`, často i u `/crawl`). Pokud úloha limit překročí, vrátí se chyba. Spotřebované kredity se nevrací.

### 2.1 Použití přes `options_json` (bez úprav kódu)
`options_json` se v kódu jen parsuje a přeposílá do payloadu, takže `maxCredits` stačí poslat jako JSON string.

**Příklad (agent):**
```
=firecrawl("Najdi název firmy, IČO, DIČ, kontakty", "agent", "https://example.cz", , , , "{""maxCredits"":50}")
```

**Příklad (crawl):**
```
=firecrawl("", "crawl", "https://example.cz", , , 100, "{""maxCredits"":50}")
```

### 2.2 Doporučené zjednodušení: defaultní `maxCredits`
Pokud chceš, aby byl limit nastaven automaticky bez psaní JSONu, přidej výchozí hodnotu do konfigurace a vlož ji do `finalOptions`.

**Návrh změn:**
1) Přidat konstantu (např. 200 kreditů):
```
const FIRECRAWL_DEFAULT_MAX_CREDITS = 200;
```

2) Po `parseOptionsJson()` doplnit default:
```
const finalOptions = parseOptionsJson(options_json) || {};
if (finalOptions.maxCredits === undefined || finalOptions.maxCredits === null || finalOptions.maxCredits === '') {
  finalOptions.maxCredits = FIRECRAWL_DEFAULT_MAX_CREDITS;
}
```

Pak stačí volat:
```
=firecrawl("Najdi název firmy, IČO, DIČ, kontakty", "agent", "https://example.cz")
```

---

## 3) Další návrhy na vylepšení skriptu (V2)

### 3.1 Přímý parametr `maxCredits` v `=firecrawl()`
**Přínos:** uživatel zadá jen číslo, bez JSON escapingu.

**Návrh:** přidat parametr do signatury `firecrawl()` a vložit do payloadu.

### 3.2 Validace `maxCredits`
**Přínos:** předejde se nechtěným chybám v API.

**Návrh:** kontrola, že `maxCredits` je kladné číslo.

### 3.3 Jednodušší práce s JSON v Sheets
**Přínos:** méně chyb při escapingu uvozovek.

**Návrh:** dokumentovat tři možnosti:
- zdvojené uvozovky v JSON stringu
- `CHAR(34)`
- odkaz na buňku s JSON

### 3.4 Cache výsledků (3 hodiny)
**Přínos:** úspora kreditů při opakovaných dotazech.

**Návrh:** použít `PropertiesService` s expirací (viz plán v [`vylepšeni_V2.md`](vylepšeni_V2.md:14)).

### 3.5 Logování rate limitů
**Přínos:** přehled o dostupných limitech.

**Návrh:** parsovat HTTP hlavičky (`X-RateLimit-Remaining`, `X-RateLimit-Reset`).

### 3.6 Volitelná podpora `schema` pro /map
**Přínos:** možnost extrakce strukturovaných dat.

**Návrh:** umožnit předat `schema` přes `options_json` a dokumentovat příklad.

### 3.7 Robustnější error handling
**Přínos:** lepší chybové hlášky pro uživatele.

**Návrh:** při `HTTP 400` zobrazit detailní `error.message` z API (pokud existuje).

### 3.8 Kombinace s extrakcí obsahu (jina.ai)
**Přínos:** jednoduchý “pre-scrape” mimo Firecrawl.

**Návrh:** doplnit jednoduchou funkci `=jina_extract(url)` a dokumentovat propojení.

---

## 4) Rychlé příklady použití

### Agent + defaultní `maxCredits`
```
=firecrawl("Najdi IČO a DIČ", "agent", "https://example.cz")
```

### Agent + explicitní `maxCredits`
```
=firecrawl("Najdi IČO a DIČ", "agent", "https://example.cz", , , , "{""maxCredits"":100}")
```

### Scrape + JSON výstup
```
=firecrawl("", "scrape", "https://example.cz", , "json")
```

---

## 5) Poznámky k implementaci v kódu
Payload se skládá v [`buildFirecrawlPayload()`](Firecrawl.gs:286). Vše z `options_json` se sloučí do payloadu pomocí [`mergeFirecrawlOptions()`](Firecrawl.gs:345), takže každý nový parametr v JSONu se automaticky propíše do API volání.
