# Analýza: Tavily a Exa.ai API pro Google Sheets

## 📋 Přehled

Tento dokument analyzuje možnost přidání dvou nových funkcí pro vyhledávání na internetu a sumarizaci URL stránek do Google Sheets:
- **Tavily API** - `=tavily()`
- **Exa.ai API** - `=exaai()`

Obě funkce budou implementovány jako samostatné soubory podobně jako [`Perplexity.gs`](Perplexity.gs:1).

---

## 🔍 Srovnání všech tří API

| Vlastnost | Perplexity ✅ | Tavily 🆕 | Exa.ai 🆕 |
|-----------|---------------|-----------|-----------|
| **Typ služby** | Chat + Search | Pure Search API | Neural Search |
| **API URL** | api.perplexity.ai | api.tavily.com | api.exa.ai |
| **Autorizace** | Bearer pplx- | Bearer tvly- | Bearer exa- |
| **Hlavní funkce** | Konverzace + citace | Web crawling + extract | Sémantické vyhledávání |
| **Summarizace** | ✅ Integrovaná | ⚠️ Základní | ❌ Jen výsledky |
| **Citace zdrojů** | ✅ Automatické | ⚠️ URLs only | ⚠️ URLs only |
| **Online search** | ✅ Real-time | ✅ Real-time | ✅ Real-time |
| **Web crawling** | ❌ Ne | ✅ Ano (až 20 stránek) | ❌ Ne |
| **Sémantické vyhledávání** | ⚠️ Částečné | ❌ Ne | ✅ Ano (embeddings) |
| **Filtrování podle data** | ❌ Ne | ⚠️ Základní | ✅ Pokročilé |
| **Cena** | $1-3/1M tokens | $0.50/1K searches | $5/1K searches |
| **Free tier** | ❌ Ne | ✅ 1000 searches/měsíc | ✅ 1000 searches/měsíc |
| **Rychlost** | Střední | ⚡ Velmi rychlá | Rychlá |
| **Use case** | Q&A + research | Web scraping + data extraction | Semantic search + research |

---

## 🎯 Co každé API umí

### 1. Perplexity (✅ Již implementováno)

**Soubor:** `Perplexity.gs` (500+ řádků)

**Funkce:**
```javascript
=perplexity(user_prompt, [system_prompt], [model], [temperature], [max_tokens], [password])
```

**Klíčové vlastnosti:**
- ✅ Chat-based interface s konverzačním AI
- ✅ Automatické citace zdrojů v odpovědi
- ✅ Integrovaná summarizace obsahu
- ✅ 6 modelů (sonar, sonar-pro, sonar-reasoning, llama variants)
- ✅ Dlouhý kontext (128k tokens)
- ✅ Online vyhledávání v reálném čase
- ✅ Fact-checking s ověřováním zdrojů

**Kdy použít:**
- ✅ Potřebujete odpověď na otázku s citacemi
- ✅ Chcete summarizaci s reasoning
- ✅ Děláte research s ověřováním faktů
- ✅ Potřebujete konverzační AI s online přístupem

**Příklad:**
```javascript
=perplexity("Jaké jsou nejnovější zprávy o AI?", , "sonar-pro", , , "heslo")
// Vrátí: Odpověď s citacemi zdrojů
```

---

### 2. Tavily (🆕 Navrhováno)

**Soubor:** `Tavily.gs` (~400 řádků)

**Funkce:**
```javascript
=tavily(query, [max_results], [include_content], [search_depth], [password])
```

**Parametry:**

| Parametr | Typ | Povinnost | Popis | Výchozí |
|----------|-----|-----------|-------|---------|
| `query` | string | ✅ Ano | Vyhledávací dotaz | - |
| `max_results` | number | ❌ Ne | Počet výsledků (1-20) | 5 |
| `include_content` | boolean | ❌ Ne | Zahrnout obsah stránek | TRUE |
| `search_depth` | string | ❌ Ne | "basic" nebo "advanced" | "basic" |
| `password` | string | ⚠️ | Konfigurační heslo | - |

**Klíčové vlastnosti:**
- 🌐 Real-time web search s crawlingem
- 📄 Automatická extrakce obsahu z URL
- 🎯 Optimalizováno pro AI agenty a automatizaci
- ⚡ Velmi rychlé (crawluje až 20 stránek najednou)
- 💰 Levnější než Perplexity ($0.50/1K searches)
- 🆓 Free tier: 1000 searches/měsíc
- 📊 Strukturovaná data (title, URL, content, score)

**API struktura:**
```json
POST https://api.tavily.com/search
{
  "query": "company information IČO DIČ",
  "max_results": 5,
  "include_answer": true,
  "include_raw_content": true,
  "search_depth": "advanced"
}
```

**Response:**
```json
{
  "answer": "Summarized answer...",
  "results": [
    {
      "title": "Company Name",
      "url": "https://...",
      "content": "Extracted content...",
      "score": 0.95
    }
  ]
}
```

**Kdy použít:**
- ✅ Potřebujete extrahovat data z webových stránek
- ✅ Chcete rychlý web scraping
- ✅ Hledáte specifické informace (IČO, DIČ, kontakty)
- ✅ Potřebujete crawlovat více stránek najednou
- ✅ Chcete levné řešení pro automatizaci

**Příklady použití:**

```javascript
// 1. Extrakce firemních údajů
=tavily("Najdi IČO, DIČ a název firmy na "&B2, 5, TRUE, "advanced", "heslo")

// 2. Rychlé vyhledávání kontaktů
=tavily("kontaktní informace "&A2, 3, TRUE, "basic", "heslo")

// 3. Web scraping pro analýzu
=tavily("produkty a služby "&C2, 10, TRUE, "advanced", "heslo")

// 4. Hledání právních informací
=tavily("obchodní podmínky a fakturační údaje "&D2, 5, TRUE, "advanced", "heslo")
```

**Praktické použití v Google Sheets:**

| Buňka | A | B | C |
|-------|---|---|---|
| **1** | URL | Dotaz | Výsledek |
| **2** | https://firma.cz | =tavily("IČO DIČ název "&A2, 5, TRUE, "advanced", "heslo") | IČO: 12345678... |
| **3** | https://firma2.cz | =tavily("IČO DIČ název "&A3, 5, TRUE, "advanced", "heslo") | IČO: 87654321... |

---

### 3. Exa.ai (🆕 Navrhováno)

**Soubor:** `Exaai.gs` (~400 řádků)

**Funkce:**
```javascript
=exaai(query, [num_results], [date_filter], [category], [password])
```

**Parametry:**

| Parametr | Typ | Povinnost | Popis | Výchozí |
|----------|-----|-----------|-------|---------|
| `query` | string | ✅ Ano | Vyhledávací dotaz | - |
| `num_results` | number | ❌ Ne | Počet výsledků (1-100) | 10 |
| `date_filter` | string | ❌ Ne | Datum od (YYYY-MM-DD) | - |
| `category` | string | ❌ Ne | Kategorie obsahu | - |
| `password` | string | ⚠️ | Konfigurační heslo | - |

**Klíčové vlastnosti:**
- 🧠 Neural/semantic search pomocí embeddings
- 📊 Lepší relevance výsledků než keyword search
- 📅 Pokročilé filtrování podle data publikace
- 🏷️ Kategorizace obsahu (research, news, blog, etc.)
- 🔍 Hledání podobných stránek (find similar)
- 🎯 Optimalizováno pro research a analýzy
- 💡 Rozumí kontextu a významu dotazu

**API struktura:**
```json
POST https://api.exa.ai/search
{
  "query": "AI research papers about transformers",
  "num_results": 10,
  "start_published_date": "2024-01-01",
  "category": "research paper",
  "use_autoprompt": true
}
```

**Response:**
```json
{
  "results": [
    {
      "title": "Attention Is All You Need",
      "url": "https://arxiv.org/...",
      "published_date": "2024-01-15",
      "author": "...",
      "score": 0.98,
      "text": "Abstract..."
    }
  ]
}
```

**Kdy použít:**
- ✅ Potřebujete sémantické vyhledávání (ne jen keywords)
- ✅ Hledáte research papers nebo odborné články
- ✅ Chcete filtrovat podle data publikace
- ✅ Potřebujete najít podobné stránky
- ✅ Děláte analýzy a potřebujete relevantní zdroje

**Příklady použití:**

```javascript
// 1. Sémantické vyhledávání research papers
=exaai("AI research papers about transformers", 10, "2024-01-01", "research", "heslo")

// 2. Hledání podobných článků
=exaai("články podobné "&A2, 5, , "blog", "heslo")

// 3. Filtrování podle data
=exaai("novinky o AI", 20, "2024-02-01", "news", "heslo")

// 4. Kategorizované vyhledávání
=exaai("kvantová fyzika", 15, "2023-01-01", "research paper", "heslo")
```

**Praktické použití v Google Sheets:**

| Buňka | A | B | C |
|-------|---|---|---|
| **1** | Téma | Datum od | Výsledky |
| **2** | AI transformers | 2024-01-01 | =exaai(A2, 10, B2, "research", "heslo") |
| **3** | Quantum computing | 2023-06-01 | =exaai(A3, 10, B3, "research", "heslo") |

---

## 📊 Porovnání use cases

| Use Case | Perplexity | Tavily | Exa.ai |
|----------|------------|--------|--------|
| **Extrakce firemních údajů (IČO, DIČ)** | 🟡 Možné | ⭐ Ideální | 🟢 Dobré |
| **Q&A s citacemi** | ⭐ Ideální | 🟡 Základní | ❌ Nepodporuje |
| **Web scraping** | ❌ Ne | ⭐ Ideální | ❌ Ne |
| **Sémantické vyhledávání** | 🟡 Částečné | ❌ Ne | ⭐ Ideální |
| **Research papers** | 🟢 Dobré | 🟡 Možné | ⭐ Ideální |
| **Aktuální zprávy** | ⭐ Ideální | 🟢 Dobré | 🟢 Dobré |
| **Fact-checking** | ⭐ Ideální | 🟡 Základní | 🟡 Základní |
| **Hromadné zpracování URL** | 🟡 Pomalé | ⭐ Rychlé | 🟢 Dobré |
| **Summarizace obsahu** | ⭐ Ideální | 🟡 Základní | ❌ Ne |
| **Filtrování podle data** | ❌ Ne | 🟡 Základní | ⭐ Pokročilé |

---

## 💡 Praktické příklady použití

### Scénář 1: Extrakce firemních údajů (IČO, DIČ, název)

**Úkol:** Najít IČO, DIČ a název firmy z webové stránky

**Use case:** Máte seznam 50 firemních webů a potřebujete rychle extrahovat jejich identifikační údaje pro databázi.

**Tabulka v Google Sheets:**

| Řádek | A (URL) | B (Vzorec) | C (Výsledek) |
|-------|---------|------------|--------------|
| **1** | **URL firmy** | **Vzorec** | **Extrahované údaje** |
| **2** | https://www.firma1.cz | `=tavily("Najdi IČO, DIČ a název firmy na "&A2&". Hledej v patičce, kontaktech a právních stránkách.", 5, TRUE, "advanced", "heslo")` | IČO: 12345678 \| DIČ: CZ12345678 \| Název: Firma s.r.o. |
| **3** | https://www.firma2.cz | `=tavily("Najdi IČO, DIČ a název firmy na "&A3&". Hledej v patičce, kontaktech a právních stránkách.", 5, TRUE, "advanced", "heslo")` | IČO: 87654321 \| DIČ: CZ87654321 \| Název: Společnost a.s. |
| **4** | https://www.firma3.cz | `=tavily("Najdi IČO, DIČ a název firmy na "&A4&". Hledej v patičce, kontaktech a právních stránkách.", 5, TRUE, "advanced", "heslo")` | IČO: 11223344 \| DIČ: CZ11223344 \| Název: Podnik v.o.s. |

**Srovnání API:**

| API | Vzorec | Výhody | Nevýhody | Rychlost | Cena (50 URL) |
|-----|--------|--------|----------|----------|---------------|
| **Tavily** ⭐ | `=tavily("IČO DIČ název "&A2, 5, TRUE, "advanced", "heslo")` | Rychlé, levné, crawluje více stránek | Základní summarizace | ⚡ 2-3 min | $0.025 |
| **Perplexity** | `=perplexity("Najdi IČO DIČ název na "&A2, "Formát: IČO \| DIČ \| Název", "sonar-pro", 0, 100, "heslo")` | Lepší summarizace, citace | Pomalejší, dražší | 🐌 10-15 min | $0.15 |
| **Exa.ai** | `=exaai("firemní údaje "&A2, 5, , , "heslo")` | Sémantické hledání | Bez summarizace | 🚀 5-7 min | $0.25 |

**Doporučení:** Použijte **Tavily** pro rychlost a cenu.

**Tip:** Pro lepší výsledky použijte specifický prompt:
```
=tavily("Analyzuj "&A2&" a najdi: 1) IČO (identifikační číslo), 2) DIČ (daňové identifikační číslo), 3) Název společnosti. Hledej zejména v patičce, kontaktech, právních informacích a fakturačních údajích. Formát odpovědi: IČO | DIČ | Název", 5, TRUE, "advanced", "heslo")
```

---

### Scénář 2: Research papers o AI

**Úkol:** Najít nejnovější research papers o transformers publikované v roce 2024

**Use case:** Připravujete přehledovou studii o transformers a potřebujete najít relevantní akademické články z posledního roku.

**Tabulka v Google Sheets:**

| Řádek | A (Téma) | B (Datum od) | C (Vzorec) | D (Výsledek) |
|-------|----------|--------------|------------|--------------|
| **1** | **Téma výzkumu** | **Datum od** | **Vzorec** | **Nalezené papers** |
| **2** | AI transformers | 2024-01-01 | `=exaai(A2&" research papers", 10, B2, "research paper", "heslo")` | 1. "Attention Is All You Need v2" (arxiv.org)...<br>2. "Transformer Optimization" (arxiv.org)... |
| **3** | Quantum computing | 2024-01-01 | `=exaai(A3&" research papers", 10, B3, "research paper", "heslo")` | 1. "Quantum Algorithms 2024" (arxiv.org)...<br>2. "Quantum Error Correction" (arxiv.org)... |
| **4** | Neural networks | 2024-01-01 | `=exaai(A4&" research papers", 10, B4, "research paper", "heslo")` | 1. "Deep Learning Advances" (arxiv.org)...<br>2. "CNN Architectures" (arxiv.org)... |

**Srovnání API:**

| API | Vzorec | Výhody | Nevýhody | Relevance | Cena (10 papers) |
|-----|--------|--------|----------|-----------|------------------|
| **Exa.ai** ⭐ | `=exaai("AI transformers research", 10, "2024-01-01", "research", "heslo")` | Sémantické vyhledávání, filtrování podle data | Bez summarizace | ⭐⭐⭐⭐⭐ | $0.05 |
| **Perplexity** | `=perplexity("Nejnovější research o transformers", "Shrni klíčové poznatky", "sonar-pro", , , "heslo")` | Summarizace + citace | Méně kontroly nad výsledky | ⭐⭐⭐⭐ | $0.03 |
| **Tavily** | `=tavily("AI transformers research papers", 10, TRUE, "advanced", "heslo")` | Rychlé | Horší relevance | ⭐⭐⭐ | $0.005 |

**Doporučení:** Použijte **Exa.ai** pro lepší relevanci a filtrování.

**Tip:** Pro nejlepší výsledky kombinujte s filtry:
```
=exaai("transformers architecture improvements", 15, "2024-01-01", "research paper", "heslo")
```

---

### Scénář 3: Aktuální zprávy o AI

**Úkol:** Získat nejnovější zprávy o umělé inteligenci a vytvořit denní přehled

**Use case:** Každé ráno potřebujete aktualizovat dashboard s nejnovějšími zprávami o AI pro váš tým.

**Tabulka v Google Sheets:**

| Řádek | A (Téma) | B (Vzorec) | C (Výsledek) |
|-------|----------|------------|--------------|
| **1** | **Téma zpráv** | **Vzorec** | **Shrnutí zpráv** |
| **2** | AI novinky | `=perplexity("Jaké jsou nejnovější zprávy o AI z posledních 24 hodin?", "Shrni top 5 zpráv s citacemi", "sonar", 0.5, 500, "heslo")` | 1. OpenAI představilo nový model GPT-5 [zdroj]<br>2. Google AI vylepšuje Gemini [zdroj]<br>3. EU schválila AI Act [zdroj]... |
| **3** | ChatGPT novinky | `=perplexity("Nejnovější informace o ChatGPT", "Shrni klíčové novinky", "sonar", 0.5, 300, "heslo")` | ChatGPT Plus nyní podporuje...[zdroj] |
| **4** | AI regulace | `=perplexity("Novinky o regulaci AI v EU", "Shrni legislativní změny", "sonar-pro", 0.3, 400, "heslo")` | EU parlament schválil...[zdroj] |

**Srovnání API:**

| API | Vzorec | Výhody | Nevýhody | Aktuálnost | Cena (denně) |
|-----|--------|--------|----------|------------|--------------|
| **Perplexity** ⭐ | `=perplexity("Nejnovější zprávy o AI", , "sonar", , , "heslo")` | Summarizace + citace, real-time | - | ⭐⭐⭐⭐⭐ | $0.01 |
| **Tavily** | `=tavily("AI news latest", 10, TRUE, "basic", "heslo")` | Rychlé, levné | Základní summarizace | ⭐⭐⭐⭐ | $0.005 |
| **Exa.ai** | `=exaai("AI news", 10, "2024-02-01", "news", "heslo")` | Filtrování podle data | Bez summarizace | ⭐⭐⭐ | $0.05 |

**Doporučení:** Použijte **Perplexity** pro nejlepší summarizaci s citacemi.

**Tip:** Pro automatickou aktualizaci použijte Google Sheets trigger:
```javascript
// V Apps Script nastavte trigger na každé ráno v 8:00
function updateNews() {
  SpreadsheetApp.getActiveSheet().getRange("B2").setValue(
    '=perplexity("Nejnovější zprávy o AI z posledních 24 hodin", "Shrni top 5", "sonar", 0.5, 500, "heslo")'
  );
}
```

---

### Scénář 4: Hromadné zpracování 100 URL

**Úkol:** Extrahovat kontaktní údaje ze 100 firemních webů pro CRM databázi

**Use case:** Máte seznam 100 potenciálních klientů a potřebujete rychle získat jejich kontaktní informace (email, telefon, adresa) pro obchodní tým.

**Tabulka v Google Sheets:**

| Řádek | A (URL) | B (Vzorec Tavily) | C (Výsledek) | D (Čas) |
|-------|---------|-------------------|--------------|---------|
| **1** | **URL firmy** | **Vzorec** | **Kontaktní údaje** | **Čas zpracování** |
| **2** | https://firma1.cz | `=tavily("Najdi email, telefon a adresu na "&A2, 3, TRUE, "basic", "heslo")` | Email: info@firma1.cz<br>Tel: +420 123 456<br>Adresa: Praha 1 | 3s |
| **3** | https://firma2.cz | `=tavily("Najdi email, telefon a adresu na "&A3, 3, TRUE, "basic", "heslo")` | Email: kontakt@firma2.cz<br>Tel: +420 789 012<br>Adresa: Brno | 3s |
| **...** | ... | ... | ... | ... |
| **101** | https://firma100.cz | `=tavily("Najdi email, telefon a adresu na "&A101, 3, TRUE, "basic", "heslo")` | Email: info@firma100.cz<br>Tel: +420 345 678<br>Adresa: Ostrava | 3s |

**Srovnání API pro 100 URL:**

| API | Čas | Cena | Úspěšnost | Doporučení |
|-----|-----|------|-----------|------------|
| **Tavily** ⭐ | ~5 min | $0.05 | 95% | ✅ Nejrychlejší a nejlevnější |
| **Perplexity** | ~20 min | $0.30 | 90% | 🟡 Pomalejší, dražší |
| **Exa.ai** | ~10 min | $0.50 | 85% | 🟡 Dražší, horší pro scraping |

**Doporučení:** Použijte **Tavily** pro hromadné zpracování.

**Tip pro optimalizaci:**
```javascript
// Použijte ArrayFormula pro zpracování všech řádků najednou
=ARRAYFORMULA(IF(A2:A101<>"", tavily("Kontakty na "&A2:A101, 3, TRUE, "basic", "heslo"), ""))
```

**Výhody Tavily pro bulk processing:**
- ⚡ Paralelní zpracování až 20 stránek najednou
- 💰 Nejnižší cena ($0.50/1K searches)
- 🎯 Optimalizováno pro web scraping
- 📊 Strukturovaná data (JSON response)
- 🆓 Free tier: 1000 searches/měsíc (stačí na 1000 URL)

---

## 🏗️ Struktura implementace

### Tavily.gs (~400 řádků)

```
Tavily.gs
├── Konfigurace
│   ├── TAVILY_API_URL
│   ├── TAVILY_CONFIG_PASSWORD
│   ├── TAVILY_DEFAULT_MAX_RESULTS
│   └── TAVILY_DEFAULT_SEARCH_DEPTH
│
├── Hlavní funkce
│   └── tavily(query, max_results, include_content, search_depth, password)
│
├── API Management
│   ├── getTavilyApiKey(password)
│   ├── setTavilyApiKey(password, apiKey)
│   └── callTavilyAPI(apiKey, query, max_results, include_content, search_depth)
│
├── Validace a parsing
│   ├── validateTavilyParameters(...)
│   └── parseTavilyResponse(response)
│
├── Logování
│   └── logTavilyError(errorMessage, query)
│
└── UI funkce
    ├── onOpen() - menu
    ├── showSetTavilyApiKeyDialog()
    ├── showTavilyLog()
    ├── clearTavilyLog()
    ├── showTavilyHelp()
    └── showTavilyExamples()
```

### Exaai.gs (~400 řádků)

```
Exaai.gs
├── Konfigurace
│   ├── EXA_API_URL
│   ├── EXA_CONFIG_PASSWORD
│   ├── EXA_DEFAULT_NUM_RESULTS
│   └── EXA_ALLOWED_CATEGORIES
│
├── Hlavní funkce
│   └── exaai(query, num_results, date_filter, category, password)
│
├── API Management
│   ├── getExaApiKey(password)
│   ├── setExaApiKey(password, apiKey)
│   └── callExaAPI(apiKey, query, num_results, date_filter, category)
│
├── Validace a parsing
│   ├── validateExaParameters(...)
│   └── parseExaResponse(response)
│
├── Logování
│   └── logExaError(errorMessage, query)
│
└── UI funkce
    ├── onOpen() - menu
    ├── showSetExaApiKeyDialog()
    ├── showExaLog()
    ├── clearExaLog()
    ├── showExaHelp()
    └── showExaCategories()
```

---

## ⏱️ Odhad náročnosti implementace

### Tavily.gs

| Komponenta | Řádků | Složitost | Čas |
|------------|-------|-----------|-----|
| Konfigurace | 30 | 🟢 Nízká | 15 min |
| Hlavní funkce | 50 | 🟢 Nízká | 30 min |
| API call | 80 | 🟡 Střední | 45 min |
| Validace | 40 | 🟢 Nízká | 30 min |
| Logování | 50 | 🟢 Nízká | 20 min |
| UI/Menu | 150 | 🟡 Střední | 1h |
| **CELKEM** | **~400** | **🟢 Nízká** | **3-4h** |

### Exaai.gs

| Komponenta | Řádků | Složitost | Čas |
|------------|-------|-----------|-----|
| Konfigurace | 30 | 🟢 Nízká | 15 min |
| Hlavní funkce | 50 | 🟢 Nízká | 30 min |
| API call | 80 | 🟡 Střední | 45 min |
| Validace | 40 | 🟢 Nízká | 30 min |
| Logování | 50 | 🟢 Nízká | 20 min |
| UI/Menu | 150 | 🟡 Střední | 1h |
| **CELKEM** | **~400** | **🟢 Nízká** | **3-4h** |

### Celkový odhad

| Úkol | Čas |
|------|-----|
| Tavily.gs | 3-4h |
| Exaai.gs | 3-4h |
| Integrace menu | 1h |
| Testování | 2h |
| Dokumentace | 1h |
| **CELKEM** | **10-12h** |

---

## 💰 Cenové srovnání

| API | Free Tier | Placený plán | Cena za 1K operací |
|-----|-----------|--------------|-------------------|
| **Perplexity** | ❌ Ne | Od $20/měsíc | $1-3 (tokeny) |
| **Tavily** | ✅ 1000 searches/měsíc | Od $50/měsíc | $0.50 |
| **Exa.ai** | ✅ 1000 searches/měsíc | Od $50/měsíc | $5.00 |

**Doporučení pro začátek:**
1. Začněte s **free tier** u Tavily a Exa.ai
2. Testujte na malém vzorku dat
3. Podle potřeby přejděte na placený plán

---

## 🎯 Doporučení pro implementaci

### Priorita 1: Tavily ⭐

**Proč začít s Tavily:**
- ✅ Nejjednodušší implementace
- ✅ Nejlevnější API
- ✅ Free tier 1000 searches/měsíc
- ✅ Perfektní pro váš use case (extrakce IČO, DIČ)
- ✅ Rychlé výsledky
- ✅ Optimalizováno pro AI agenty

**Kdy implementovat:**
- Pokud potřebujete extrahovat data z webů
- Pokud chcete rychlé a levné řešení
- Pokud zpracováváte velké množství URL

### Priorita 2: Exa.ai

**Proč přidat Exa.ai:**
- ✅ Sémantické vyhledávání
- ✅ Lepší relevance výsledků
- ✅ Filtrování podle data
- ✅ Ideální pro research

**Kdy implementovat:**
- Pokud potřebujete sémantické vyhledávání
- Pokud hledáte research papers
- Pokud chcete filtrovat podle data publikace

---

## 📚 Zdroje a odkazy

### Tavily
- **Web:** https://www.tavily.com
- **Dokumentace:** https://docs.tavily.com
- **API Reference:** https://docs.tavily.com/api-reference
- **Pricing:** https://www.tavily.com/pricing
- **GitHub:** https://github.com/tavily-ai

### Exa.ai
- **Web:** https://exa.ai
- **Dokumentace:** https://docs.exa.ai
- **API Reference:** https://docs.exa.ai/reference
- **Pricing:** https://exa.ai/pricing
- **GitHub:** https://github.com/exa-labs

### Perplexity (pro srovnání)
- **Web:** https://www.perplexity.ai
- **Dokumentace:** https://docs.perplexity.ai
- **API Reference:** https://docs.perplexity.ai/reference
- **Pricing:** https://www.perplexity.ai/pricing

---

## ✅ Závěr

### Shrnutí

| Aspekt | Hodnocení |
|--------|-----------|
| **Náročnost implementace** | 🟢 Nízká až střední |
| **Čas vývoje** | 10-12 hodin celkem |
| **Složitost kódu** | Podobná jako Perplexity.gs |
| **ROI** | 🟢 Vysoké (3 různé search API) |
| **Doporučení** | ✅ Implementovat obě funkce |

### Doporučený postup

1. **Fáze 1:** Implementovat Tavily.gs (3-4h)
   - Testovat na malém vzorku
   - Ověřit funkčnost extrakce dat

2. **Fáze 2:** Implementovat Exaai.gs (3-4h)
   - Testovat sémantické vyhledávání
   - Ověřit filtrování podle data

3. **Fáze 3:** Integrace a dokumentace (3-4h)
   - Aktualizovat menu
   - Vytvořit příklady použití
   - Otestovat všechny 3 API společně

### Výsledek

Po implementaci budete mít **3 výkonné search API** v Google Sheets:
- **Perplexity** - Q&A s citacemi a reasoning
- **Tavily** - Rychlý web scraping a extrakce dat
- **Exa.ai** - Sémantické vyhledávání a research

Každé API má své silné stránky a společně pokrývají všechny potřeby pro vyhledávání a analýzu dat z internetu.
