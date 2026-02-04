# Plán vývoje vylepšení V2

## Přehled funkcí

| Funkce | Proveditelnost | Obtížnost | Priorita |
|--------|---------------|-----------|----------|
| Caching 3 hodiny | ✅ Ano | 🟡 Střední | 🟢 Vysoká |
| Logování rate limitů | ✅ Ano | 🟢 Nízká | 🟡 Střední |
| Extrakce přes jina.ai | ✅ Ano | 🟢 Nízká | 🟡 Střední |
| ChatGPT/Perplexity | ✅ Ano | 🟡 Střední | 🟢 Vysoká |

---

## 1. Caching odpovědí (3 hodiny)

**Cíl:** Uložit odpovědi na 3 hodiny pro opakované dotazy.

**Implementace:**
- Cache key založený na parametrech: `model + hash(prompt)`
- Uložení: `PropertiesService` (500 KB limit) s vlastní expirací
- Refresh: parametr `force_refresh=true` nebo menu "Vymazat cache"

**Omezení:** CacheService má max 10 minut → PropertiesService s vlastní expirací.

---

## 2. Logování rate limitů

**Cíl:** Zobrazit zbývající požadavky z OpenRouter API.

**Implementace:**
- Parsovat HTTP hlavičky: `X-RateLimit-Remaining`, `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Zobrazení: nový list "Quota_Info" nebo dialogu

**Omezení:** OpenRouter nemusí vracet všechny hlavičky.

---

## 3. Extrakce přes jina.ai

**Cíl:** Extrakce obsahu z URL pro použití v AI funkcích.

**Implementace:**
- Nová funkce: `=jina_extract(url)`
- API: `https://r.jina.ai/http://URL`
- Kombinace: `=open_router(jina_extract(A1), "Shrni...", ...)`

**Omezení:** Více API klíčů.

---

## 4. Rozšíření na ChatGPT a Perplexity

### 4.1 Přehled

**Cíl:** Umožnit uživatelům volat přímo ChatGPT a Perplexity API bez OpenRouter.

**Výhody:**
- Přímý přístup k nejnovějším modelům (GPT-4o, GPT-4o-mini, Perplexity Sonar)
- Potenciálně nižší ceny při přímém volání
- Nezávislost na OpenRouter dostupnosti
- Možnost využít specifické funkce jednotlivých providerů

---

### 4.2 Funkce pro ChatGPT

#### Syntaxe
```javascript
=chatgpt(user_prompt, [system_prompt], [model], [temperature], [max_tokens], [password])
```

#### Parametry

| Parametr | Typ | Povinnost | Popis | Výchozí hodnota |
|----------|-----|-----------|-------|-----------------|
| user_prompt | string | Ano | Váš dotaz nebo instrukce | - |
| system_prompt | string | Ne | Systémová instrukce pro model | - |
| model | string | Ne | Identifikátor modelu | gpt-4o-mini |
| temperature | number | Ne | Kreativita (0-2) | 0.7 |
| max_tokens | number | Ne | Max. délka odpovědi | 2048 |
| password | string | Ano* | Konfigurační heslo | - |

*Heslo je povinné při prvním použití nebo změně API klíče

#### Dostupné modely

| Model | Identifikátor | Popis | Cena |
|-------|---------------|-------|------|
| GPT-4o | `gpt-4o` | Nejnovější multimodální model | $$$ |
| GPT-4o mini | `gpt-4o-mini` | Rychlý a levný | $ |
| GPT-4 Turbo | `gpt-4-turbo` | Výkonný model | $$$ |
| GPT-3.5 Turbo | `gpt-3.5-turbo` | Rychlý a levný | $ |

#### Příklady použití

```javascript
// Základní použití
=chatgpt("Napiš 3 věty o Praze", , "gpt-4o-mini", , , "mojeHeslo")

// Se system promptem
=chatgpt("Přelož do angličtiny: Dobrý den", "Jsi profesionální překladatel", "gpt-4o", 0.5, 100, "mojeHeslo")

// S odkazy na buňky
=chatgpt(A1, B1, C1, D1, E1, "mojeHeslo")

// Kreativní psaní
=chatgpt("Napiš krátkou báseň o moři", "Jsi básník", "gpt-4o", 1.5, 500, "mojeHeslo")
```

#### API konfigurace

- **API URL:** `https://api.openai.com/v1/chat/completions`
- **Autorizace:** `Bearer sk-...` (OpenAI API klíč)
- **Formát požadavku:** OpenAI Chat Completions API
- **Rate limity:** Závisí na vašem tarifu (Tier 1-5)

---

### 4.3 Funkce pro Perplexity

#### Syntaxe
```javascript
=perplexity(user_prompt, [system_prompt], [model], [temperature], [max_tokens], [password])
```

#### Parametry

| Parametr | Typ | Povinnost | Popis | Výchozí hodnota |
|----------|-----|-----------|-------|-----------------|
| user_prompt | string | Ano | Váš dotaz nebo instrukce | - |
| system_prompt | string | Ne | Systémová instrukce pro model | - |
| model | string | Ne | Identifikátor modelu | sonar |
| temperature | number | Ne | Kreativita (0-2) | 0.7 |
| max_tokens | number | Ne | Max. délka odpovědi | 2048 |
| password | string | Ano* | Konfigurační heslo | - |

*Heslo je povinné při prvním použití nebo změně API klíče

#### Dostupné modely

| Model | Identifikátor | Popis | Speciální funkce |
|-------|---------------|-------|------------------|
| Sonar | `sonar` | Základní model s vyhledáváním | ✅ Online vyhledávání |
| Sonar Pro | `sonar-pro` | Pokročilý model | ✅ Online vyhledávání |
| Sonar Reasoning | `sonar-reasoning` | Model pro složité úlohy | ✅ Online vyhledávání |

#### Příklady použití

```javascript
// Základní použití - vyhledávání aktuálních informací
=perplexity("Jaké jsou nejnovější zprávy o AI?", , "sonar", , , "mojeHeslo")

// Výzkum s citacemi
=perplexity("Vysvětli kvantovou fyziku", "Odpovídej vědecky s citacemi", "sonar-pro", 0.5, 1000, "mojeHeslo")

// Aktuální data
=perplexity("Jaké je dnes počasí v Praze?", , "sonar", , , "mojeHeslo")

// Složité úlohy
=perplexity("Analyzuj ekonomické dopady AI", "Jsi ekonomický analytik", "sonar-reasoning", 0.7, 2000, "mojeHeslo")
```

#### API konfigurace

- **API URL:** `https://api.perplexity.ai/chat/completions`
- **Autorizace:** `Bearer pplx-...` (Perplexity API klíč)
- **Formát požadavku:** OpenAI-kompatibilní API
- **Speciální funkce:** Automatické online vyhledávání a citace

---

### 4.4 Univerzální funkce (volitelné)

Pro pokročilé uživatele můžeme vytvořit univerzální funkci:

#### Syntaxe
```javascript
=ai_call(provider, user_prompt, [system_prompt], [model], [temperature], [max_tokens], [password])
```

#### Parametry

| Parametr | Typ | Povinnost | Popis | Příklady |
|----------|-----|-----------|-------|----------|
| provider | string | Ano | Poskytovatel AI | "openrouter", "chatgpt", "perplexity" |
| user_prompt | string | Ano | Váš dotaz | "Napiš báseň" |
| system_prompt | string | Ne | Systémová instrukce | "Jsi básník" |
| model | string | Ne | Model | "gpt-4o", "sonar" |
| temperature | number | Ne | Kreativita (0-2) | 0.7 |
| max_tokens | number | Ne | Max. délka | 2048 |
| password | string | Ano* | Heslo | "mojeHeslo" |

#### Příklady použití

```javascript
// OpenRouter
=ai_call("openrouter", "Ahoj", , "meta-llama/llama-4-scout", , , "heslo")

// ChatGPT
=ai_call("chatgpt", "Ahoj", , "gpt-4o-mini", , , "heslo")

// Perplexity
=ai_call("perplexity", "Jaké jsou novinky?", , "sonar", , , "heslo")
```

---

### 4.5 Správa API klíčů

#### Nastavení přes menu

Menu **OpenRouter** se rozšíří na **AI Providers**:

```
AI Providers
├── Nastavit OpenRouter API klíč
├── Nastavit ChatGPT API klíč
├── Nastavit Perplexity API klíč
├── Zobrazit aktivní providery
├── Zobrazit log
└── Nápověda
```

#### Uložení klíčů

Každý provider má vlastní klíč v PropertiesService:
- `OPENROUTER_API_KEY`
- `OPENAI_API_KEY`
- `PERPLEXITY_API_KEY`

---

### 4.6 Porovnání providerů

| Vlastnost | OpenRouter | ChatGPT | Perplexity |
|-----------|-----------|---------|------------|
| Počet modelů | 100+ | 4 | 3 |
| Online vyhledávání | ❌ | ❌ | ✅ |
| Cena | Různá | $$-$$$ | $$-$$$ |
| Rychlost | Střední | Rychlá | Rychlá |
| Citace zdrojů | ❌ | ❌ | ✅ |
| Multimodální | ✅ (některé) | ✅ | ❌ |

---

### 4.7 Kdy použít který provider?

#### OpenRouter
- ✅ Chcete vyzkoušet různé modely
- ✅ Potřebujete specifický open-source model
- ✅ Chcete jeden API klíč pro všechny modely

#### ChatGPT
- ✅ Potřebujete nejnovější GPT modely
- ✅ Chcete nejrychlejší odpovědi
- ✅ Pracujete s multimodálními úlohami (obrázky)

#### Perplexity
- ✅ Potřebujete aktuální informace z internetu
- ✅ Chcete citace a zdroje
- ✅ Děláte výzkum nebo fact-checking

---

### 4.8 Implementační detaily

#### Architektura

```
Uživatel volá funkci
    ↓
Detekce providera (chatgpt/perplexity/openrouter)
    ↓
Získání správného API klíče
    ↓
Sestavení požadavku podle API providera
    ↓
Volání API
    ↓
Zpracování odpovědi
    ↓
Vrácení výsledku do buňky
```

#### Společné funkce

- `validateParameters()` - validace vstupů
- `getApiKey(provider)` - získání API klíče
- `callAIProvider(provider, params)` - univerzální volání
- `logError(provider, error)` - logování chyb

#### Specifické funkce

- `callOpenRouterAPI()` - stávající implementace
- `callOpenAIAPI()` - nová pro ChatGPT
- `callPerplexityAPI()` - nová pro Perplexity

---

### 4.9 Migrace a zpětná kompatibilita

**Důležité:** Stávající funkce `=open_router()` zůstane beze změny!

Nové funkce jsou **doplňkové**:
- ✅ `=open_router()` - funguje stejně jako doteď
- ✅ `=chatgpt()` - nová funkce
- ✅ `=perplexity()` - nová funkce
- ✅ `=ai_call()` - nová univerzální funkce (volitelné)

---

## 5. Doporučená struktura souborů v Google Apps Script

### 5.1 Přehled struktury

**Doporučení:** Rozdělit kód do **4 souborů** pro lepší organizaci a údržbu:

```
Google Apps Script Project
├── Config.gs          (Společná konfigurace)
├── OpenRouter.gs      (OpenRouter implementace)
├── ChatGPT.gs         (ChatGPT implementace)
├── Perplexity.gs      (Perplexity implementace)
└── Utils.gs           (Sdílené utility funkce)
```

---

### 5.2 Config.gs - Společná konfigurace

**Účel:** Centrální místo pro všechny konfigurační konstanty.

```javascript
// =================== SPOLEČNÁ KONFIGURACE ===================

// Bezpečnostní heslo (změňte při nasazení)
const CONFIG_PASSWORD = 'VAŠE_SILNÉ_HESLO_ZDE'; // POVINNÉ NASTAVIT

// Logování
const ENABLE_LOGGING = true;
const LOG_SHEET_NAME = 'Log_AI_Providers';

// Rate limiting
const REQUEST_DELAY_MS = 2000; // 2 sekundy mezi požadavky

// Cache konfigurace
const ENABLE_CACHE = true;
const CACHE_DURATION_HOURS = 3;

// Omezení pro vstupy (společné pro všechny providery)
const MAX_SYSTEM_PROMPT_LENGTH = 1000;
const MAX_USER_PROMPT_LENGTH = 4000;

// =================== OPENROUTER KONFIGURACE ===================
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_DEFAULT_MODEL = 'meta-llama/llama-4-scout';
const OPENROUTER_DEFAULT_TEMPERATURE = 0.7;
const OPENROUTER_DEFAULT_MAX_TOKENS = 2048;

const OPENROUTER_ALLOWED_MODELS = [
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

// =================== CHATGPT KONFIGURACE ===================
const CHATGPT_API_URL = 'https://api.openai.com/v1/chat/completions';
const CHATGPT_DEFAULT_MODEL = 'gpt-4o-mini';
const CHATGPT_DEFAULT_TEMPERATURE = 0.7;
const CHATGPT_DEFAULT_MAX_TOKENS = 2048;

const CHATGPT_ALLOWED_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo'
];

// =================== PERPLEXITY KONFIGURACE ===================
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_DEFAULT_MODEL = 'sonar';
const PERPLEXITY_DEFAULT_TEMPERATURE = 0.7;
const PERPLEXITY_DEFAULT_MAX_TOKENS = 2048;

const PERPLEXITY_ALLOWED_MODELS = [
  'sonar',
  'sonar-pro',
  'sonar-reasoning'
];
```

**Výhody:**
- ✅ Všechny konstanty na jednom místě
- ✅ Snadná změna výchozích hodnot
- ✅ Přehledné pro údržbu

---

### 5.3 OpenRouter.gs - OpenRouter implementace

**Účel:** Veškerá logika pro OpenRouter API.

```javascript
/**
 * Hlavní funkce pro volání OpenRouter API
 * @customfunction
 */
function open_router(system_prompt, user_prompt, model, temperature, max_tokens, password) {
  try {
    // Validace parametrů
    const validation = validateParameters(system_prompt, user_prompt, model, temperature, max_tokens, password);
    if (!validation.valid) {
      return `CHYBA: ${validation.error}`;
    }

    // Nastavení výchozích hodnot
    const finalModel = model || OPENROUTER_DEFAULT_MODEL;
    const finalTemperature = temperature !== undefined && temperature !== null && temperature !== '' 
      ? temperature 
      : OPENROUTER_DEFAULT_TEMPERATURE;
    const finalMaxTokens = max_tokens !== undefined && max_tokens !== null && max_tokens !== '' 
      ? max_tokens 
      : OPENROUTER_DEFAULT_MAX_TOKENS;

    // Získání API klíče
    const apiKey = getApiKey('OPENROUTER');
    if (!apiKey) {
      return 'CHYBA: OpenRouter API klíč není nastaven.';
    }

    // Kontrola cache
    if (ENABLE_CACHE) {
      const cachedResponse = getCachedResponse('openrouter', finalModel, system_prompt, user_prompt);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Přidání zpoždění pro rate limiting
    Utilities.sleep(REQUEST_DELAY_MS);

    // Volání API
    const response = callOpenRouterAPI(apiKey, system_prompt, user_prompt, finalModel, finalTemperature, finalMaxTokens);
    
    // Uložení do cache
    if (ENABLE_CACHE && response) {
      setCachedResponse('openrouter', finalModel, system_prompt, user_prompt, response);
    }

    return response;

  } catch (error) {
    const errorMsg = `Neočekávaná chyba: ${error.message}`;
    logError('openrouter', errorMsg, model, system_prompt, user_prompt);
    return `CHYBA: ${errorMsg}`;
  }
}

/**
 * Volání OpenRouter API
 */
function callOpenRouterAPI(apiKey, system_prompt, user_prompt, model, temperature, max_tokens) {
  // ... stávající implementace ...
}
```

**Výhody:**
- ✅ Izolovaná logika pro OpenRouter
- ✅ Snadné testování
- ✅ Nezávislé na ostatních providerech

---

### 5.4 ChatGPT.gs - ChatGPT implementace

**Účel:** Veškerá logika pro ChatGPT (OpenAI) API.

```javascript
/**
 * Hlavní funkce pro volání ChatGPT API
 * @customfunction
 */
function chatgpt(user_prompt, system_prompt, model, temperature, max_tokens, password) {
  try {
    // Validace parametrů
    const validation = validateChatGPTParameters(user_prompt, system_prompt, model, temperature, max_tokens, password);
    if (!validation.valid) {
      return `CHYBA: ${validation.error}`;
    }

    // Nastavení výchozích hodnot
    const finalModel = model || CHATGPT_DEFAULT_MODEL;
    const finalTemperature = temperature !== undefined && temperature !== null && temperature !== '' 
      ? temperature 
      : CHATGPT_DEFAULT_TEMPERATURE;
    const finalMaxTokens = max_tokens !== undefined && max_tokens !== null && max_tokens !== '' 
      ? max_tokens 
      : CHATGPT_DEFAULT_MAX_TOKENS;

    // Získání API klíče
    const apiKey = getApiKey('OPENAI');
    if (!apiKey) {
      return 'CHYBA: ChatGPT API klíč není nastaven.';
    }

    // Kontrola cache
    if (ENABLE_CACHE) {
      const cachedResponse = getCachedResponse('chatgpt', finalModel, system_prompt, user_prompt);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Přidání zpoždění pro rate limiting
    Utilities.sleep(REQUEST_DELAY_MS);

    // Volání API
    const response = callChatGPTAPI(apiKey, user_prompt, system_prompt, finalModel, finalTemperature, finalMaxTokens);
    
    // Uložení do cache
    if (ENABLE_CACHE && response) {
      setCachedResponse('chatgpt', finalModel, system_prompt, user_prompt, response);
    }

    return response;

  } catch (error) {
    const errorMsg = `Neočekávaná chyba: ${error.message}`;
    logError('chatgpt', errorMsg, model, system_prompt, user_prompt);
    return `CHYBA: ${errorMsg}`;
  }
}

/**
 * Validace parametrů pro ChatGPT
 */
function validateChatGPTParameters(user_prompt, system_prompt, model, temperature, max_tokens, password) {
  // Kontrola, zda je zadán alespoň user_prompt
  if (!user_prompt || user_prompt === '') {
    return { valid: false, error: 'User prompt je povinný.' };
  }

  // Kontrola modelu
  if (model && !CHATGPT_ALLOWED_MODELS.includes(model)) {
    return { valid: false, error: `Neplatný model. Povolené: ${CHATGPT_ALLOWED_MODELS.join(', ')}` };
  }

  // Kontrola temperature
  if (temperature !== undefined && temperature !== null && temperature !== '') {
    const temp = Number(temperature);
    if (isNaN(temp) || temp < 0 || temp > 2) {
      return { valid: false, error: 'Temperature musí být číslo mezi 0 a 2.' };
    }
  }

  // Kontrola max_tokens
  if (max_tokens !== undefined && max_tokens !== null && max_tokens !== '') {
    const tokens = Number(max_tokens);
    if (isNaN(tokens) || tokens < 1 || tokens > 16000) {
      return { valid: false, error: 'Max_tokens musí být číslo mezi 1 a 16000.' };
    }
  }

  return { valid: true };
}

/**
 * Volání ChatGPT API
 */
function callChatGPTAPI(apiKey, user_prompt, system_prompt, model, temperature, max_tokens) {
  try {
    // Sestavení zpráv
    const messages = [];
    
    if (system_prompt !== undefined && system_prompt !== null && system_prompt !== '') {
      messages.push({
        role: 'system',
        content: String(system_prompt)
      });
    }
    
    messages.push({
      role: 'user',
      content: String(user_prompt)
    });

    // Sestavení požadavku
    const payload = {
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    // Volání API
    const response = UrlFetchApp.fetch(CHATGPT_API_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    // Zpracování odpovědi
    if (responseCode === 200) {
      const jsonResponse = JSON.parse(responseText);
      
      if (jsonResponse.choices && jsonResponse.choices.length > 0) {
        return jsonResponse.choices[0].message.content;
      } else {
        throw new Error('API vrátilo prázdnou odpověď.');
      }
    } else if (responseCode === 401) {
      logError('chatgpt', 'Neplatný API klíč', model, system_prompt, user_prompt);
      return 'CHYBA: Neplatný ChatGPT API klíč.';
    } else if (responseCode === 429) {
      logError('chatgpt', 'Překročena kvóta API', model, system_prompt, user_prompt);
      return 'CHYBA: Překročena kvóta API. Zkuste to později.';
    } else {
      logError('chatgpt', `HTTP ${responseCode}: ${responseText}`, model, system_prompt, user_prompt);
      return `CHYBA: API vrátilo chybu ${responseCode}.`;
    }

  } catch (error) {
    logError('chatgpt', `Chyba při volání API: ${error.message}`, model, system_prompt, user_prompt);
    throw error;
  }
}
```

**Výhody:**
- ✅ Samostatná implementace pro ChatGPT
- ✅ Vlastní validace parametrů
- ✅ Nezávislé na OpenRouter

---

### 5.5 Perplexity.gs - Perplexity implementace

**Účel:** Veškerá logika pro Perplexity API.

```javascript
/**
 * Hlavní funkce pro volání Perplexity API
 * @customfunction
 */
function perplexity(user_prompt, system_prompt, model, temperature, max_tokens, password) {
  try {
    // Validace parametrů
    const validation = validatePerplexityParameters(user_prompt, system_prompt, model, temperature, max_tokens, password);
    if (!validation.valid) {
      return `CHYBA: ${validation.error}`;
    }

    // Nastavení výchozích hodnot
    const finalModel = model || PERPLEXITY_DEFAULT_MODEL;
    const finalTemperature = temperature !== undefined && temperature !== null && temperature !== '' 
      ? temperature 
      : PERPLEXITY_DEFAULT_TEMPERATURE;
    const finalMaxTokens = max_tokens !== undefined && max_tokens !== null && max_tokens !== '' 
      ? max_tokens 
      : PERPLEXITY_DEFAULT_MAX_TOKENS;

    // Získání API klíče
    const apiKey = getApiKey('PERPLEXITY');
    if (!apiKey) {
      return 'CHYBA: Perplexity API klíč není nastaven.';
    }

    // Kontrola cache
    if (ENABLE_CACHE) {
      const cachedResponse = getCachedResponse('perplexity', finalModel, system_prompt, user_prompt);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Přidání zpoždění pro rate limiting
    Utilities.sleep(REQUEST_DELAY_MS);

    // Volání API
    const response = callPerplexityAPI(apiKey, user_prompt, system_prompt, finalModel, finalTemperature, finalMaxTokens);
    
    // Uložení do cache
    if (ENABLE_CACHE && response) {
      setCachedResponse('perplexity', finalModel, system_prompt, user_prompt, response);
    }

    return response;

  } catch (error) {
    const errorMsg = `Neočekávaná chyba: ${error.message}`;
    logError('perplexity', errorMsg, model, system_prompt, user_prompt);
    return `CHYBA: ${errorMsg}`;
  }
}

/**
 * Validace parametrů pro Perplexity
 */
function validatePerplexityParameters(user_prompt, system_prompt, model, temperature, max_tokens, password) {
  // Kontrola, zda je zadán alespoň user_prompt
  if (!user_prompt || user_prompt === '') {
    return { valid: false, error: 'User prompt je povinný.' };
  }

  // Kontrola modelu
  if (model && !PERPLEXITY_ALLOWED_MODELS.includes(model)) {
    return { valid: false, error: `Neplatný model. Povolené: ${PERPLEXITY_ALLOWED_MODELS.join(', ')}` };
  }

  // Kontrola temperature
  if (temperature !== undefined && temperature !== null && temperature !== '') {
    const temp = Number(temperature);
    if (isNaN(temp) || temp < 0 || temp > 2) {
      return { valid: false, error: 'Temperature musí být číslo mezi 0 a 2.' };
    }
  }

  // Kontrola max_tokens
  if (max_tokens !== undefined && max_tokens !== null && max_tokens !== '') {
    const tokens = Number(max_tokens);
    if (isNaN(tokens) || tokens < 1 || tokens > 8000) {
      return { valid: false, error: 'Max_tokens musí být číslo mezi 1 a 8000.' };
    }
  }

  return { valid: true };
}

/**
 * Volání Perplexity API
 */
function callPerplexityAPI(apiKey, user_prompt, system_prompt, model, temperature, max_tokens) {
  try {
    // Sestavení zpráv
    const messages = [];
    
    if (system_prompt !== undefined && system_prompt !== null && system_prompt !== '') {
      messages.push({
        role: 'system',
        content: String(system_prompt)
      });
    }
    
    messages.push({
      role: 'user',
      content: String(user_prompt)
    });

    // Sestavení požadavku
    const payload = {
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    // Volání API
    const response = UrlFetchApp.fetch(PERPLEXITY_API_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    // Zpracování odpovědi
    if (responseCode === 200) {
      const jsonResponse = JSON.parse(responseText);
      
      if (jsonResponse.choices && jsonResponse.choices.length > 0) {
        // Perplexity může vracet citace - můžeme je přidat
        let content = jsonResponse.choices[0].message.content;
        
        // Pokud jsou dostupné citace, přidáme je
        if (jsonResponse.citations && jsonResponse.citations.length > 0) {
          content += '\n\nZdroje:\n' + jsonResponse.citations.join('\n');
        }
        
        return content;
      } else {
        throw new Error('API vrátilo prázdnou odpověď.');
      }
    } else if (responseCode === 401) {
      logError('perplexity', 'Neplatný API klíč', model, system_prompt, user_prompt);
      return 'CHYBA: Neplatný Perplexity API klíč.';
    } else if (responseCode === 429) {
      logError('perplexity', 'Překročena kvóta API', model, system_prompt, user_prompt);
      return 'CHYBA: Překročena kvóta API. Zkuste to později.';
    } else {
      logError('perplexity', `HTTP ${responseCode}: ${responseText}`, model, system_prompt, user_prompt);
      return `CHYBA: API vrátilo chybu ${responseCode}.`;
    }

  } catch (error) {
    logError('perplexity', `Chyba při volání API: ${error.message}`, model, system_prompt, user_prompt);
    throw error;
  }
}
```

**Výhody:**
- ✅ Samostatná implementace pro Perplexity
- ✅ Podpora citací a zdrojů
- ✅ Nezávislé na ostatních providerech

---

### 5.6 Utils.gs - Sdílené utility funkce

**Účel:** Společné funkce používané všemi providery.

```javascript
// =================== SPRÁVA API KLÍČŮ ===================

/**
 * Získání API klíče podle providera
 */
function getApiKey(provider) {
  const properties = PropertiesService.getScriptProperties();
  const keyMap = {
    'OPENROUTER': 'OPENROUTER_API_KEY',
    'OPENAI': 'OPENAI_API_KEY',
    'PERPLEXITY': 'PERPLEXITY_API_KEY'
  };
  
  const keyName = keyMap[provider];
  if (!keyName) {
    throw new Error(`Neznámý provider: ${provider}`);
  }
  
  return properties.getProperty(keyName);
}

/**
 * Nastavení API klíče
 */
function setApiKey(provider, password, apiKey) {
  // Kontrola hesla
  if (password !== CONFIG_PASSWORD) {
    throw new Error('Neplatné heslo.');
  }

  // Validace API klíče
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API klíč nemůže být prázdný.');
  }

  const keyMap = {
    'OPENROUTER': 'OPENROUTER_API_KEY',
    'OPENAI': 'OPENAI_API_KEY',
    'PERPLEXITY': 'PERPLEXITY_API_KEY'
  };
  
  const keyName = keyMap[provider];
  if (!keyName) {
    throw new Error(`Neznámý provider: ${provider}`);
  }

  // Uložení do PropertiesService
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(keyName, apiKey.trim());
  
  return `${provider} API klíč byl úspěšně nastaven.`;
}

// =================== CACHE SYSTÉM ===================

/**
 * Získání odpovědi z cache
 */
function getCachedResponse(provider, model, system_prompt, user_prompt) {
  if (!ENABLE_CACHE) return null;
  
  try {
    const cacheKey = generateCacheKey(provider, model, system_prompt, user_prompt);
    const properties = PropertiesService.getScriptProperties();
    const cachedData = properties.getProperty(cacheKey);
    
    if (!cachedData) return null;
    
    const data = JSON.parse(cachedData);
    const now = new Date().getTime();
    
    // Kontrola expirace
    if (now > data.expires) {
      properties.deleteProperty(cacheKey);
      return null;
    }
    
    return data.response;
  } catch (error) {
    Logger.log(`Chyba při čtení cache: ${error.message}`);
    return null;
  }
}

/**
 * Uložení odpovědi do cache
 */
function setCachedResponse(provider, model, system_prompt, user_prompt, response) {
  if (!ENABLE_CACHE) return;
  
  try {
    const cacheKey = generateCacheKey(provider, model, system_prompt, user_prompt);
    const now = new Date().getTime();
    const expires = now + (CACHE_DURATION_HOURS * 60 * 60 * 1000);
    
    const cacheData = {
      response: response,
      timestamp: now,
      expires: expires
    };
    
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    Logger.log(`Chyba při ukládání do cache: ${error.message}`);
  }
}

/**
 * Generování cache klíče
 */
function generateCacheKey(provider, model, system_prompt, user_prompt) {
  const content = `${provider}_${model}_${system_prompt}_${user_prompt}`;
  // Jednoduchý hash (pro produkci použít lepší hash funkci)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `cache_${Math.abs(hash)}`;
}

/**
 * Vymazání celé cache
 */
function clearCache() {
  const properties = PropertiesService.getScriptProperties();
  const allProperties = properties.getProperties();
  
  let count = 0;
  for (const key in allProperties) {
    if (key.startsWith('cache_')) {
      properties.deleteProperty(key);
      count++;
    }
  }
  
  return `Vymazáno ${count} položek z cache.`;
}

// =================== LOGOVÁNÍ ===================

/**
 * Logování chyb
 */
function logError(provider, errorMessage, model, system_prompt, user_prompt) {
  if (!ENABLE_LOGGING) return;

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    
    // Vytvoření logovacího listu, pokud neexistuje
    if (!logSheet) {
      logSheet = ss.insertSheet(LOG_SHEET_NAME);
      logSheet.appendRow(['Timestamp', 'Provider', 'Chyba', 'Model', 'Délka System Prompt', 'Délka User Prompt', 'Uživatel']);
      logSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    }

    // Přidání záznamu
    const timestamp = new Date();
    const systemPromptLength = system_prompt ? String(system_prompt).length : 0;
    const userPromptLength = user_prompt ? String(user_prompt).length : 0;
    const user = Session.getActiveUser().getEmail();

    logSheet.appendRow([
      timestamp,
      provider,
      errorMessage,
      model || 'N/A',
      systemPromptLength,
      userPromptLength,
      user
    ]);

    // Omezení počtu záznamů (max 1000)
    if (logSheet.getLastRow() > 1001) {
      logSheet.deleteRows(2, logSheet.getLastRow() - 1001);
    }

  } catch (error) {
    Logger.log(`Chyba při logování: ${error.message}`);
  }
}

// =================== UI FUNKCE ===================

/**
 * Vytvoření vlastního menu při otevření tabulky
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('AI Providers')
    .addItem('Nastavit OpenRouter API klíč', 'showSetOpenRouterApiKeyDialog')
    .addItem('Nastavit ChatGPT API klíč', 'showSetChatGPTApiKeyDialog')
    .addItem('Nastavit Perplexity API klíč', 'showSetPerplexityApiKeyDialog')
    .addSeparator()
    .addItem('Zobrazit aktivní providery', 'showActiveProviders')
    .addSeparator()
    .addItem('Vymazat cache', 'clearCacheDialog')
    .addItem('Zobrazit log', 'showLog')
    .addItem('Vymazat log', 'clearLogDialog')
    .addSeparator()
    .addItem('Nápověda', 'showHelp')
    .addToUi();
}

/**
 * Dialog pro zobrazení aktivních providerů
 */
function showActiveProviders() {
  const properties = PropertiesService.getScriptProperties();
  const providers = ['OPENROUTER', 'OPENAI', 'PERPLEXITY'];
  
  let message = 'Stav API klíčů:\n\n';
  
  providers.forEach(provider => {
    const key = getApiKey(provider);
    const status = key ? '✅ Nastaven' : '❌ Nenastaven';
    message += `${provider}: ${status}\n`;
  });
  
  SpreadsheetApp.getUi().alert('Aktivní providery', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Dialog pro vymazání cache
 */
function clearCacheDialog() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Vymazat cache',
    'Opravdu chcete vymazat všechny uložené odpovědi z cache?',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    const result = clearCache();
    ui.alert('Cache vymazána', result, ui.ButtonSet.OK);
  }
}

// ... další UI funkce (showSetOpenRouterApiKeyDialog, showSetChatGPTApiKeyDialog, atd.)
```

**Výhody:**
- ✅ Sdílené funkce na jednom místě
- ✅ Žádná duplikace kódu
- ✅ Snadná údržba

---

### 5.7 Výhody rozdělení do souborů

| Výhoda | Popis |
|--------|-------|
| **Organizace** | Každý provider má vlastní soubor |
| **Údržba** | Snadné najít a upravit kód |
| **Testování** | Lze testovat každý provider samostatně |
| **Škálovatelnost** | Snadné přidat další providery |
| **Čitelnost** | Kratší soubory, přehlednější kód |
| **Týmová práce** | Více lidí může pracovat na různých souborech |

---

### 5.8 Nevýhody a řešení

| Nevýhoda | Řešení |
|----------|--------|
| Více souborů | Google Apps Script podporuje více souborů v projektu |
| Sdílené konstanty | Použít Config.gs pro všechny konstanty |
| Duplikace kódu | Použít Utils.gs pro sdílené funkce |
| Složitější navigace | Dobré pojmenování souborů a komentáře |

---

### 5.9 Alternativní struktura (jednodušší)

Pokud preferujete jednodušší strukturu, můžete použít **2 soubory**:

```
Google Apps Script Project
├── Code.gs            (Všechny funkce a konfigurace)
└── UI.gs              (Pouze UI funkce a menu)
```

**Výhody:**
- ✅ Jednodušší struktura
- ✅ Méně souborů

**Nevýhody:**
- ❌ Code.gs bude velmi dlouhý (1000+ řádků)
- ❌ Horší přehlednost
- ❌ Těžší údržba

---

## Doporučené pořadí implementace

1. **Caching** - nejvyšší ROI, úspora nákladů
2. **ChatGPT funkce** - vysoká poptávka, střední obtížnost
3. **Logování rate limitů** - jednoduché, užitečné
4. **Perplexity funkce** - unikátní funkce (online search)
5. **Extrakce přes jina.ai** - doplňková funkčnost

---

## Omezení Google Apps Script

| Limit | Hodnota | Dopad |
|-------|---------|-------|
| UrlFetch | 20 000/den | Limit celkových volání |
| CacheService | 10 minut max | Nutné použít PropertiesService |
| PropertiesService | 500 KB max | Omezená cache kapacita |
| Doba běhu | 6 minut max | Limit pro dávkové operace |

---

## Získání API klíčů

### ChatGPT (OpenAI)
1. Navštivte [platform.openai.com](https://platform.openai.com)
2. Vytvořte účet nebo se přihlaste
3. Přejděte do **API keys**
4. Klikněte **Create new secret key**
5. Zkopírujte klíč (začíná `sk-...`)

### Perplexity
1. Navštivte [perplexity.ai](https://www.perplexity.ai)
2. Vytvořte účet nebo se přihlaste
3. Přejděte do **Settings → API**
4. Vygenerujte nový API klíč
5. Zkopírujte klíč (začíná `pplx-...`)

---

## Cenové srovnání (orientační)

| Provider | Model | Cena za 1M tokenů (vstup) | Cena za 1M tokenů (výstup) |
|----------|-------|---------------------------|----------------------------|
| OpenAI | GPT-4o | $2.50 | $10.00 |
| OpenAI | GPT-4o-mini | $0.15 | $0.60 |
| OpenAI | GPT-3.5-turbo | $0.50 | $1.50 |
| Perplexity | Sonar | $1.00 | $1.00 |
| Perplexity | Sonar Pro | $3.00 | $15.00 |
| OpenRouter | Různé | $0.00 - $30.00 | $0.00 - $30.00 |

*Ceny se mohou měnit, vždy zkontrolujte aktuální ceník na webu providera.*
