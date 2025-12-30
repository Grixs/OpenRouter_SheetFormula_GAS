# Google Apps Script pro OpenRouter API

## 1. Úvod

Tento dokument popisuje vývoj a použití Google Apps Script (GAS) pro integraci OpenRouter API do Google Sheets. Skript umožňuje přímé volání AI modelů prostřednictvím vlastní funkce v buňkách tabulky.

## 2. Přehled funkcí

- **Hlavní funkce**: `=open_router()` pro volání z buněk Google Sheets
- **Konfigurace**: Centrální nastavení API klíče a parametrů
- **Bezpečnost**: Ochrana heslem a bezpečné ukládání API klíče
- **Logování**: Záznam chyb a problémů
- **Validace**: Kontrola vstupních parametrů a ošetření chyb

## 3. Architektura a struktura

### 3.1. Součásti skriptu

```
OpenRouter_Google_Sheets/
│
├── Konfigurační sekce (na začátku skriptu)
├── Hlavní funkce open_router()
├── Pomocné funkce:
│   ├── validateParameters()
│   ├── getOpenRouterApiKey()
│   ├── callOpenRouterAPI()
│   ├── logError()
│   └── setOpenRouterApiKey()
├── UI funkce:
│   ├── onOpen()
│   ├── showSetApiKeyDialog()
│   ├── showLog()
│   ├── clearLog()
│   └── showHelp()
└── Logovací systém
```

### 3.2. Tok dat

1. Uživatel zavolá funkci `=open_router()` v buňce
2. Skript validuje parametry a heslo
3. Získá API klíč z úložiště
4. Sestaví požadavek na OpenRouter API
5. Zpracuje odpověď a vrátí výsledek
6. V případě chyby zapíše do logu a vrátí informativní hlášku

## 4. Podrobné nastavení

### 4.1. Konfigurační konstanty

```javascript
// =================== KONFIGURACE ===================
// API konfigurace
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Bezpečnostní heslo (změňte při nasazení)
const CONFIG_PASSWORD = 'VAŠE_SILNÉ_HESLO_ZDE'; // POVINNÉ NASTAVIT

// Výchozí parametry modelů
const DEFAULT_MODEL = 'meta-llama/llama-4-scout';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2048;

// Seznam povolených modelů (pro validaci)
const ALLOWED_MODELS = [
    'meta-llama/llama-4-scout',
    'openai/gpt-3.5-turbo',
    'openai/gpt-4',
    'openai/gpt-4-turbo',
    'anthropic/claude-2',
    'anthropic/claude-3-opus',
    'anthropic/claude-3-sonnet',
    'google/gemini-pro',
    'google/gemini-1.5-pro'
];

// Omezení pro vstupy
const MAX_SYSTEM_PROMPT_LENGTH = 1000;   // znaků
const MAX_USER_PROMPT_LENGTH = 4000;     // znaků

// Logování
const ENABLE_LOGGING = true;
const LOG_SHEET_NAME = 'Log_OpenRouter';

// Rate limiting
const MAX_REQUESTS_PER_MINUTE = 30;
const REQUEST_DELAY_MS = 2000; // 2 sekundy mezi požadavky
// =================== KONFIGURACE KONEC ===================
```

### 4.2. Bezpečnostní opatření

**DŮLEŽITÉ**: Před nasazením změňte:

- `CONFIG_PASSWORD` - použijte silné unikátní heslo
- Neukládejte API klíč přímo v kódu
- Používejte PropertiesService pro citlivá data

## 5. Hlavní funkce open_router()

### 5.1. Syntaxe

```javascript
=open_router(system_prompt, user_prompt, model, temperature, max_tokens, password)
```

### 5.2. Parametry

| Parametr | Typ | Povinnost | Popis | Výchozí hodnota |
|----------|-----|-----------|-------|-----------------|
| system_prompt | string | Ne | Systémová instrukce pro model | - |
| user_prompt | string | Ano* | Uživatelský prompt | - |
| model | string | Ano | Identifikátor modelu | meta-llama/llama-4-scout |
| temperature | number | Ne | Kreativita (0-2) | 0.7 |
| max_tokens | number | Ne | Max. délka odpovědi | 2048 |
| password | string | Ano** | Konfigurační heslo | - |

*Poznámka: Je třeba zadat buď system_prompt nebo user_prompt  
**Poznámka: Heslo je povinné při prvním použití nebo změně API klíče

### 5.3. Příklady použití

```javascript
// Základní použití
=open_router("Jsi užitečný asistent.", "Napiš 3 věty o Praze.", "meta-llama/llama-4-scout", 0.7, 300, "mojeHeslo")

// Bez system_prompt
=open_router(, "Přelož 'Hello world' do češtiny.", "openai/gpt-3.5-turbo", 0.5, , "mojeHeslo")

// Pouze s system_prompt
=open_router("Odpovídej vždy česky a stručně.", , "meta-llama/llama-4-scout", , , "mojeHeslo")

// S proměnnými z buněk
=open_router("Napiš popis:", A1, B1, C1, D1, "mojeHeslo")
```

## 6. Implementační detaily

### 6.1. Validace parametrů

Funkce `validateParameters()` kontroluje:

- **Přítomnost promptu**: Alespoň jeden prompt musí být zadán
- **Délku textu**: System prompt ≤ 1000 znaků, User prompt ≤ 4000 znaků
- **Platnost modelu**: Model musí být v seznamu ALLOWED_MODELS
- **Rozsah temperature**: 0-2
- **Rozsah max_tokens**: 1-8000
- **Heslo**: Musí odpovídat CONFIG_PASSWORD (pokud je vyžadováno)

### 6.2. Správa API klíče

**Metody uložení:**

- PropertiesService (doporučeno) - šifrované úložiště Google
- Proměnná v kódu (nedoporučeno pro produkci)

**Bezpečnostní postup:**

```javascript
// Nastavení klíče (jednorázově)
setOpenRouterApiKey("mojeHeslo", "sk-...API_KLÍČ...")

// Získání klíče (automatické)
const apiKey = getOpenRouterApiKey(password);
```

### 6.3. Komunikace s OpenRouter API

**Požadavek:**

```javascript
{
  "model": "vybraný-model",
  "messages": [
    {"role": "system", "content": "system_prompt"},
    {"role": "user", "content": "user_prompt"}
  ],
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**Odpověď:**

```javascript
{
  "choices": [{
    "message": {
      "content": "text odpovědi"
    }
  }]
}
```

### 6.4. Zpracování chyb

**Typy zachycených chyb:**

- **Validační chyby**: Špatné parametry
- **API chyby**: Selhání komunikace s OpenRouter
- **Kvótové chyby**: Překročení limitů
- **Autorizační chyby**: Neplatný API klíč nebo heslo
- **Síťové chyby**: Problémy s připojením

**Uživatelské hlášky (v češtině):**

- "CHYBA: Musíte zadat alespoň jeden prompt."
- "CHYBA: Neplatný model. Zkontrolujte název."
- "CHYBA: API klíč není nastaven. Použijte menu OpenRouter → Nastavit API klíč."
- "CHYBA: Překročena kvóta API. Zkuste to později."

## 7. Uživatelské rozhraní

### 7.1. Vlastní menu

Po otevření tabulky se vytvoří menu "OpenRouter" s možnostmi:

- **Nastavit API klíč**: Dialog pro zadání nového API klíče
- **Zobrazit log**: Otevře list s logem chyb
- **Vymazat log**: Smazání logovacího listu
- **Nápověda**: Zobrazení dokumentace

### 7.2. Logovací systém

**Struktura logu:**

| Timestamp | Chyba | Model | Délka promptů | Uživatel |
|-----------|-------|-------|---------------|----------|

**Konfigurace logování:**

- Povoleno/vypnuto přes `ENABLE_LOGGING`
- Maximálně 1000 záznamů (automatické mazání)
- Samostatný list `Log_OpenRouter`

## 8. Omezení a doporučení

### 8.1. Omezení Google Apps Script

| Limit | Hodnota | Dopad na skript |
|-------|---------|-----------------|
| Doba běhu | 6 minut | Dlouhé odpovědi mohou být přerušeny |
| UrlFetch | 20K/den | Omezení počtu volání API |
| Velikost odpovědi | 50 MB | Velké odpovědi mohou být oříznuty |
| PropertiesService | 500 KB | Dostatek pro API klíče a cache |

### 8.2. Omezení OpenRouter API

- **Rate limiting**: Liší se podle modelu a tarifu
- **Token limits**: Každý model má vlastní limity
- **Cena**: Některé modely jsou placené
- **Dostupnost**: Modely mohou být dočasně nedostupné

### 8.3. Doporučení pro použití

**Pro dávkové zpracování:**

- Přidejte `Utilities.sleep(2000)` mezi volání
- Implementujte pokročilý error handling
- Ukládejte výsledky do cache

**Pro produkční použití:**

- Použijte vlastní API endpoint pro lepší kontrolu
- Implementujte queue systém pro požadavky
- Přidejte monitoring a alerting

## 9. Nasazení a údržba

### 9.1. Krok za krokem

**1. Vytvoření skriptu:**

```bash
# V Google Sheets: Rozšíření → Apps Script
# Vložit celý kód z Code.gs a uložit
```

**2. Nastavení konfigurace:**

- Změnit `CONFIG_PASSWORD`
- Upravit `ALLOWED_MODELS` podle potřeb
- Nastavit výchozí parametry

**3. Autorizace:**

- První spuštění vyžaduje autorizaci
- Udělit potřebná oprávnění

**4. Nastavení API klíče:**

- Otevřít menu OpenRouter → Nastavit API klíč
- Zadání hesla a API klíče

### 9.4. Jak změnit API klíč

Pokud potřebujete změnit existující API klíč (např. z bezpečnostních důvodů nebo při přechodu na jiný účet):

**Metoda 1: Přes UI menu (doporučeno)**

1. Otevřete Google Sheets s nainstalovaným skriptem
2. V horním menu klikněte na **OpenRouter**
3. Vyberte **Nastavit API klíč**
4. V dialogu zadejte:
   - **Heslo**: Vaše konfigurační heslo (nastavené v `CONFIG_PASSWORD`)
   - **API klíč**: Nový OpenRouter API klíč (začíná `sk-or-v1-...`)
5. Klikněte na **Uložit**
6. Po úspěšném uložení se dialog automaticky zavře

**Metoda 2: Přes Apps Script konzoli**

1. Otevřete **Rozšíření → Apps Script**
2. V editoru otevřete konzoli (Ctrl+Enter nebo View → Logs)
3. Spusťte následující kód:

```javascript
function changeApiKey() {
  setOpenRouterApiKey("VAŠE_HESLO", "sk-or-v1-NOVÝ_API_KLÍČ");
}
```

4. Spusťte funkci `changeApiKey()`

**Metoda 3: Manuální smazání a nové nastavení**

1. Otevřete **Rozšíření → Apps Script**
2. V editoru spusťte:

```javascript
function deleteApiKey() {
  PropertiesService.getScriptProperties().deleteProperty('OPENROUTER_API_KEY');
  Logger.log('API klíč byl smazán');
}
```

3. Poté nastavte nový klíč přes UI menu (Metoda 1)

**Důležité poznámky:**

- ⚠️ API klíč je uložen v **PropertiesService**, ne přímo v kódu skriptu
- 🔒 Klíč je sdílený pro všechny uživatele tabulky
- 🔄 Po změně klíče není nutné restartovat tabulku
- ✅ Změna je okamžitá a platí pro všechna další volání

### 9.5. Jak přidat vlastní modely z OpenRouter

OpenRouter nabízí stovky AI modelů. Pro přidání nových modelů (např. DeepSeek, Mistral, atd.):

**Krok 1: Najděte identifikátor modelu**

1. Navštivte [https://openrouter.ai/models](https://openrouter.ai/models)
2. Vyberte model, který chcete použít
3. Zkopírujte jeho identifikátor (např. `deepseek/deepseek-chat`, `mistralai/mistral-7b-instruct`)

**Krok 2: Přidejte model do konfigurace**

1. Otevřete **Rozšíření → Apps Script**
2. V souboru [`Code.gs`](Code.gs:14) najděte sekci `ALLOWED_MODELS` (řádek ~14)
3. Přidejte nový model do seznamu:

```javascript
const ALLOWED_MODELS = [
  'meta-llama/llama-4-scout',
  'openai/gpt-3.5-turbo',
  'openai/gpt-4',
  'openai/gpt-4-turbo',
  'anthropic/claude-2',
  'anthropic/claude-3-opus',
  'anthropic/claude-3-sonnet',
  'google/gemini-pro',
  'google/gemini-1.5-pro',
  // Nově přidané modely
  'deepseek/deepseek-chat',
  'deepseek/deepseek-coder',
  'mistralai/mistral-7b-instruct',
  'mistralai/mixtral-8x7b-instruct',
  'meta-llama/llama-3.1-70b-instruct',
  'qwen/qwen-2.5-72b-instruct'
];
```

4. Uložte skript (Ctrl+S nebo File → Save)

**Krok 3: (Volitelné) Změňte výchozí model**

Pokud chcete používat nový model jako výchozí:

```javascript
const DEFAULT_MODEL = 'deepseek/deepseek-chat'; // Změňte na váš preferovaný model
```

**Příklady populárních modelů:**

| Model | Identifikátor | Popis |
|-------|---------------|-------|
| DeepSeek Chat | `deepseek/deepseek-chat` | Výkonný čínský model |
| DeepSeek Coder | `deepseek/deepseek-coder` | Specializovaný na kód |
| Mistral 7B | `mistralai/mistral-7b-instruct` | Rychlý a efektivní |
| Mixtral 8x7B | `mistralai/mixtral-8x7b-instruct` | Mixture of Experts |
| Llama 3.1 70B | `meta-llama/llama-3.1-70b-instruct` | Velký Llama model |
| Qwen 2.5 72B | `qwen/qwen-2.5-72b-instruct` | Alibaba model |
| Claude 3.5 Sonnet | `anthropic/claude-3.5-sonnet` | Nejnovější Claude |
| GPT-4o | `openai/gpt-4o` | Nejnovější GPT-4 |

**Použití nového modelu v tabulce:**

```javascript
// Použití DeepSeek
=open_router("Jsi asistent", "Vysvětli kvantovou fyziku", "deepseek/deepseek-chat", 0.7, 500, "heslo")

// Použití Mistral
=open_router(, "Napiš Python funkci", "mistralai/mistral-7b-instruct", 0.5, 1000, "heslo")
```

**Tip pro hromadné přidání:**

Pokud chcete povolit všechny modely bez validace, můžete upravit funkci `validateParameters()`:

```javascript
// Zakomentujte kontrolu modelu
// if (model && !ALLOWED_MODELS.includes(model)) {
//   return { valid: false, error: `Neplatný model...` };
// }
```

⚠️ **Varování**: Bez validace můžete zadat neexistující model, což způsobí chybu API.

### 9.2. Testování

**Testovací případy:**

1. **Základní funkčnost:**
```javascript
=open_router(, "Test", "meta-llama/llama-4-scout", 0.7, 50, "heslo")
```

2. **Chybové stavy:**
   - Špatné heslo
   - Neplatný model
   - Prázdný prompt
   - Překročení délky

3. **Hraniční hodnoty:**
   - Temperature = 0 a 2
   - Max_tokens = 1 a 8000
   - Prázdné a maximálně dlouhé prompty

### 9.3. Monitorování

- **Kontrola logů**: Pravidelně kontrolovat chyby
- **Využití kvót**: Sledovat spotřebu UrlFetch
- **Výkon**: Doba odpovědi a úspěšnost volání

## 10. Řešení problémů

### 10.1. Časté problémy

| Problém | Příčina | Řešení |
|---------|---------|--------|
| "CHYBA: API klíč není nastaven" | Klíč nebyl uložen | Použít menu pro nastavení |
| "CHYBA: Neplatné heslo" | Špatné heslo | Kontrola CONFIG_PASSWORD |
| Prázdná odpověď | Síťový problém | Zkontrolovat internetové připojení |
| Pomalá odpověď | Vytížení modelu | Zvýšit timeout nebo změnit model |
| Přerušení skriptu | Překročení času | Snížit max_tokens |

### 10.2. Debugování

**1. Povolit podrobné logování:**

```javascript
const ENABLE_LOGGING = true;
const DEBUG_MODE = true;
```

**2. Kontrola PropertiesService:**

```javascript
// V konzoli Apps Script
PropertiesService.getScriptProperties().getProperties();
```

**3. Testování API přímo:**

```javascript
// Testovací funkce
function testOpenRouterAPI() {
  // Přímé volání API
}
```

## 11. Rozšíření a přizpůsobení

### 11.1. Přidání nových modelů

**Přidat do ALLOWED_MODELS:**

```javascript
const ALLOWED_MODELS = [
  ...stávající modely,
  'nový/model/identifier'
];
```

**Aktualizovat výchozí hodnoty:**

```javascript
const DEFAULT_MODEL = 'nový/model/identifier';
```

### 11.2. Cache systém

```javascript
// Přidat cache pro opakované dotazy
const ENABLE_CACHE = true;
const CACHE_DURATION = 3600; // sekundy

function getCachedResponse(prompt, model) {
  // Implementace cache
}
```

### 11.3. Rozšíření parametrů

```javascript
// Přidat nové parametry
=open_router_extended(
  system_prompt,
  user_prompt,
  model,
  temperature,
  max_tokens,
  top_p,
  frequency_penalty,
  presence_penalty,
  password
)
```

## 12. Bezpečnostní doporučení

### 12.1. Důležité zásady

**Nikdy nesdílet heslo:**

- Každý uživatel má vlastní heslo
- Heslo pravidelně měnit

**Ochrana API klíče:**

- Používat pouze PropertiesService
- Omezit přístup k tabulce
- Pravidelně rotovat klíče

**Omezení přístupu:**

- Pouze důvěryhodní uživatelé
- Sledování používání

### 12.2. Audit a logování

**Kompletní audit trail:**

- Kdo, kdy a jaké volání provedl
- Spotřeba tokenů a náklady
- Chybové stavy a výpadky

**Alerting:**

- Neobvyklé aktivity
- Překročení limitů
- Autorizační selhání

## 13. Přílohy

### 13.1. Kompletní kód skriptu

Viz samostatný soubor [`Code.gs`](Code.gs)

### 13.2. Ukázková tabulka

**Příklad struktury tabulky:**

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| System Prompt | User Prompt | Model | Temperature | Max Tokens | Výsledek |
| Jsi asistent | Napiš o Praze | meta-llama/llama-4-scout | 0.7 | 300 | =open_router(A2,B2,C2,D2,E2,"heslo") |

### 13.3. Získání OpenRouter API klíče

1. Navštivte [https://openrouter.ai](https://openrouter.ai)
2. Vytvořte účet nebo se přihlaste
3. Přejděte do sekce API Keys
4. Vygenerujte nový API klíč
5. Zkopírujte klíč (začíná `sk-or-v1-...`)
6. Použijte menu v Google Sheets pro nastavení klíče

## 14. Často kladené otázky (FAQ)

### Základní použití

#### Q: Jak získám OpenRouter API klíč?
**A:** Navštivte [openrouter.ai](https://openrouter.ai), vytvořte účet a vygenerujte API klíč v sekci API Keys. Klíč začíná `sk-or-v1-...`

#### Q: Je použití OpenRouter zdarma?
**A:** OpenRouter nabízí různé modely - některé jsou zdarma (např. některé Llama modely), jiné jsou placené (GPT-4, Claude). Zkontrolujte aktuální ceny na [openrouter.ai/models](https://openrouter.ai/models).

#### Q: Jak často mohu volat API?
**A:** Skript má vestavěné rate limiting (2 sekundy mezi požadavky). Limity se liší podle vašeho tarifu na OpenRouter. Google Apps Script má limit 20 000 UrlFetch volání denně.

#### Q: Co dělat, když funkce vrací chybu?
**A:** Zkontrolujte log pomocí menu **OpenRouter → Zobrazit log**. Tam najdete detailní informace o chybě včetně času, typu chyby a použitého modelu.

#### Q: Funguje to offline?
**A:** Ne, skript vyžaduje internetové připojení pro komunikaci s OpenRouter API.

### Bezpečnost a API klíč

#### Q: Kde je uložený můj API klíč?
**A:** API klíč je bezpečně uložený v **Google PropertiesService**, což je šifrované úložiště Google. **Není uložený přímo v kódu skriptu** ani v buňkách tabulky. To znamená:
- ✅ Klíč je šifrovaný a chráněný Google infrastrukturou
- ✅ Není viditelný v historii verzí
- ✅ Není přístupný přes View → Version history
- ✅ Je sdílený pro všechny uživatele tabulky (ne individuální)

#### Q: Jak změním API klíč?
**A:** Existují 3 metody:

**Metoda 1 (nejjednodušší):**
1. Menu **OpenRouter → Nastavit API klíč**
2. Zadejte heslo a nový API klíč
3. Klikněte Uložit

**Metoda 2 (přes konzoli):**
```javascript
function changeKey() {
  setOpenRouterApiKey("HESLO", "sk-or-v1-NOVÝ_KLÍČ");
}
```

**Metoda 3 (kompletní reset):**
```javascript
function resetKey() {
  PropertiesService.getScriptProperties().deleteProperty('OPENROUTER_API_KEY');
}
```

Viz detailní návod v sekci [9.4. Jak změnit API klíč](#94-jak-změnit-api-klíč).

#### Q: Je můj API klíč v bezpečí?
**A:** Ano, pokud dodržujete bezpečnostní pravidla:
- ✅ API klíč je v šifrovaném PropertiesService
- ✅ Není viditelný v kódu ani buňkách
- ✅ Chráněný konfiguračním heslem
- ⚠️ Sdílejte tabulku pouze s důvěryhodnými uživateli
- ⚠️ Pravidelně měňte heslo a rotujte API klíče
- ⚠️ Sledujte využití na OpenRouter dashboardu

#### Q: Může někdo ukrást můj API klíč z tabulky?
**A:** Ne, pokud:
- Klíč je uložený v PropertiesService (ne v kódu)
- Máte silné konfigurační heslo
- Omezíte přístup k tabulce

**Rizika:**
- ⚠️ Kdokoliv s přístupem k Apps Script editoru může spustit funkci pro získání klíče
- ⚠️ Uživatelé s přístupem k tabulce mohou používat API (spotřebovávat vaše kredity)

**Doporučení:**
- Používejte Google Sheets oprávnění (View only vs. Edit)
- Sledujte využití API na OpenRouter
- Nastavte limity na OpenRouter účtu

#### Q: Jak změním heslo?
**A:**
1. Otevřete **Rozšíření → Apps Script**
2. Změňte hodnotu `CONFIG_PASSWORD` na řádku 6
3. Uložte skript
4. Znovu nastavte API klíč s novým heslem (menu → Nastavit API klíč)

**Důležité:** Po změně hesla musíte znovu nastavit API klíč!

#### Q: Co se stane, když někdo uhodne moje heslo?
**A:** S heslem může:
- Změnit API klíč
- Používat API (spotřebovávat vaše kredity)

**Ochrana:**
- Používejte silné heslo (min. 16 znaků, kombinace písmen, čísel, symbolů)
- Nesdílejte heslo
- Pravidelně měňte heslo
- Sledujte log chyb a neobvyklé aktivity

### Modely a přizpůsobení

#### Q: Mohu používat jiné AI modely?
**A:** Ano! OpenRouter podporuje stovky modelů. Stačí přidat identifikátor modelu do seznamu `ALLOWED_MODELS` v konfiguraci. Viz detailní návod v sekci [9.5. Jak přidat vlastní modely](#95-jak-přidat-vlastní-modely-z-openrouter).

#### Q: Jak přidám DeepSeek nebo jiný nový model?
**A:**
1. Najděte identifikátor na [openrouter.ai/models](https://openrouter.ai/models)
2. Přidejte do `ALLOWED_MODELS` v [`Code.gs`](Code.gs:14):
```javascript
const ALLOWED_MODELS = [
  ...existující modely,
  'deepseek/deepseek-chat',
  'deepseek/deepseek-coder'
];
```
3. Uložte a použijte: `=open_router(, "prompt", "deepseek/deepseek-chat", ...)`

#### Q: Který model je nejlepší?
**A:** Záleží na použití:
- **Rychlost + cena**: `mistralai/mistral-7b-instruct`, `meta-llama/llama-3.1-8b-instruct`
- **Kvalita**: `openai/gpt-4`, `anthropic/claude-3.5-sonnet`
- **Kód**: `deepseek/deepseek-coder`, `openai/gpt-4`
- **Čeština**: `openai/gpt-4`, `anthropic/claude-3-opus`
- **Zdarma**: `meta-llama/llama-4-scout`, některé Llama modely

### Sdílení a spolupráce

#### Q: Mohu sdílet tabulku s ostatními?
**A:** Ano, ale mějte na paměti:
- ✅ API klíč je sdílený pro všechny uživatele
- ✅ Všichni spotřebovávají vaše OpenRouter kredity
- ⚠️ Každý musí znát konfigurační heslo pro použití funkce
- ⚠️ Uživatelé s přístupem k Apps Script mohou vidět kód

**Doporučení pro týmy:**
- Vytvořte týmový OpenRouter účet
- Nastavte limity na OpenRouter
- Používejte View-only přístup pro běžné uživatele
- Sledujte využití v logu

#### Q: Může každý uživatel mít vlastní API klíč?
**A:** Ne, aktuální implementace používá jeden sdílený klíč. Pro individuální klíče byste museli upravit skript:

```javascript
// Příklad: Individuální klíče podle emailu
function getOpenRouterApiKey(password) {
  const userEmail = Session.getActiveUser().getEmail();
  const properties = PropertiesService.getUserProperties();
  return properties.getProperty(`API_KEY_${userEmail}`);
}
```

### Výkon a limity

#### Q: Proč je odpověď pomalá?
**A:** Možné příčiny:
- Model je vytížený (zkuste jiný model)
- Velký `max_tokens` (snižte na 500-1000)
- Síťové zpoždění
- Rate limiting (2 sekundy mezi požadavky)

#### Q: Kolik volání mohu udělat denně?
**A:** Limity:
- **Google Apps Script**: 20 000 UrlFetch volání/den
- **OpenRouter**: Závisí na vašem tarifu a modelu
- **Skript**: Rate limiting 2 sekundy mezi požadavky = max ~43 200 volání/den (teoreticky)

#### Q: Můžu zpracovat 1000 řádků najednou?
**A:** Ano, ale:
- ⚠️ Bude to trvat dlouho (2 sekundy × 1000 = ~33 minut)
- ⚠️ Google Apps Script má limit 6 minut běhu
- ✅ Doporučení: Zpracovávejte po dávkách (50-100 řádků)
- ✅ Nebo použijte vlastní skript s `Utilities.sleep()` a pokračováním

### Řešení problémů

#### Q: Funkce vrací "#ERROR!" nebo "#NAME?"
**A:**
- `#NAME?` = Funkce není rozpoznána → Zkontrolujte, zda je skript uložený a autorizovaný
- `#ERROR!` = Chyba ve funkci → Zkontrolujte log (menu → Zobrazit log)

#### Q: "CHYBA: API klíč není nastaven"
**A:** API klíč nebyl uložen. Použijte menu **OpenRouter → Nastavit API klíč**.

#### Q: "CHYBA: Neplatné heslo"
**A:** Heslo v buňce neodpovídá `CONFIG_PASSWORD` v kódu. Zkontrolujte řádek 6 v [`Code.gs`](Code.gs:6).

#### Q: "CHYBA: Překročena kvóta API"
**A:**
- Vyčerpali jste kredity na OpenRouter
- Nebo jste překročili rate limit
- Řešení: Počkejte nebo dobijte kredity na openrouter.ai

## 15. Changelog

### Verze 1.0.0 (2024)
- Iniciální vydání
- Základní funkce `open_router()`
- Validace parametrů
- Logovací systém
- UI menu s dialogy
- Bezpečné ukládání API klíče
- Podpora 9 AI modelů

## 16. Licence a podpora

### Licence
Tento skript je poskytován "jak je" bez jakýchkoliv záruk. Můžete jej volně používat a upravovat pro své potřeby.

### Podpora
Pro otázky a problémy:
- Zkontrolujte dokumentaci výše
- Prohlédněte si log chyb v tabulce
- Ověřte nastavení API klíče a hesla

## Závěrečné poznámky

Tento skript poskytuje komplexní řešení pro integraci OpenRouter API do Google Sheets. Je navržen jako robustní, bezpečný a rozšiřitelný nástroj pro práci s AI modely přímo z tabulkového procesoru.

**Klíčové vlastnosti:**

✅ Jednoduché použití přes funkci v buňkách  
✅ Komplexní ošetření chyb a logování  
✅ Bezpečné ukládání citlivých dat  
✅ Snadné přizpůsobení a rozšíření  

**Doporučení pro vývojáře:**

1. Důkladně otestujte všechny funkce
2. Nastavte správná bezpečnostní opatření
3. Dokumentujte změny a úpravy
4. Sledujte využití a optimalizujte výkon

Tento skript poskytuje solidní základ pro integraci AI do Google Sheets a může sloužit jako výchozí bod pro pokročilejší implementace specifických potřeb uživatelů.

---

**Vytvořeno pro Google Apps Script**  
**Kompatibilní s OpenRouter API v1**  
**Dokumentace v češtině**
