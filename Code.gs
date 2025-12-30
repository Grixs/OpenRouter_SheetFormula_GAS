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

/**
 * Hlavní funkce pro volání OpenRouter API z Google Sheets
 * 
 * @param {string} system_prompt - Systémová instrukce pro model (nepovinné)
 * @param {string} user_prompt - Uživatelský prompt (nepovinné, ale alespoň jeden prompt je nutný)
 * @param {string} model - Identifikátor modelu (výchozí: meta-llama/llama-4-scout)
 * @param {number} temperature - Kreativita odpovědi 0-2 (výchozí: 0.7)
 * @param {number} max_tokens - Maximální délka odpovědi (výchozí: 2048)
 * @param {string} password - Konfigurační heslo (povinné při prvním použití)
 * @return {string} Odpověď z AI modelu nebo chybová hláška
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
    const finalModel = model || DEFAULT_MODEL;
    const finalTemperature = temperature !== undefined && temperature !== null && temperature !== '' ? temperature : DEFAULT_TEMPERATURE;
    const finalMaxTokens = max_tokens !== undefined && max_tokens !== null && max_tokens !== '' ? max_tokens : DEFAULT_MAX_TOKENS;

    // Získání API klíče
    const apiKey = getOpenRouterApiKey(password);
    if (!apiKey) {
      return 'CHYBA: API klíč není nastaven. Použijte menu OpenRouter → Nastavit API klíč.';
    }

    // Přidání zpoždění pro rate limiting
    Utilities.sleep(REQUEST_DELAY_MS);

    // Volání API
    const response = callOpenRouterAPI(apiKey, system_prompt, user_prompt, finalModel, finalTemperature, finalMaxTokens);
    
    return response;

  } catch (error) {
    const errorMsg = `Neočekávaná chyba: ${error.message}`;
    logError(errorMsg, model, system_prompt, user_prompt);
    return `CHYBA: ${errorMsg}`;
  }
}

/**
 * Validace vstupních parametrů
 */
function validateParameters(system_prompt, user_prompt, model, temperature, max_tokens, password) {
  // Kontrola, zda je zadán alespoň jeden prompt
  const hasSystemPrompt = system_prompt !== undefined && system_prompt !== null && system_prompt !== '';
  const hasUserPrompt = user_prompt !== undefined && user_prompt !== null && user_prompt !== '';
  
  if (!hasSystemPrompt && !hasUserPrompt) {
    return { valid: false, error: 'Musíte zadat alespoň jeden prompt (system_prompt nebo user_prompt).' };
  }

  // Kontrola délky promptů
  if (hasSystemPrompt && String(system_prompt).length > MAX_SYSTEM_PROMPT_LENGTH) {
    return { valid: false, error: `System prompt je příliš dlouhý (max ${MAX_SYSTEM_PROMPT_LENGTH} znaků).` };
  }

  if (hasUserPrompt && String(user_prompt).length > MAX_USER_PROMPT_LENGTH) {
    return { valid: false, error: `User prompt je příliš dlouhý (max ${MAX_USER_PROMPT_LENGTH} znaků).` };
  }

  // Kontrola modelu
  if (model && !ALLOWED_MODELS.includes(model)) {
    return { valid: false, error: `Neplatný model. Povolené modely: ${ALLOWED_MODELS.join(', ')}` };
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
 * Získání API klíče z úložiště
 */
function getOpenRouterApiKey(password) {
  const properties = PropertiesService.getScriptProperties();
  const storedKey = properties.getProperty('OPENROUTER_API_KEY');
  
  if (!storedKey) {
    return null;
  }
  
  return storedKey;
}

/**
 * Nastavení API klíče do úložiště
 */
function setOpenRouterApiKey(password, apiKey) {
  // Kontrola hesla
  if (password !== CONFIG_PASSWORD) {
    throw new Error('Neplatné heslo.');
  }

  // Validace API klíče
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API klíč nemůže být prázdný.');
  }

  // Uložení do PropertiesService
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('OPENROUTER_API_KEY', apiKey.trim());
  
  return 'API klíč byl úspěšně nastaven.';
}

/**
 * Volání OpenRouter API
 */
function callOpenRouterAPI(apiKey, system_prompt, user_prompt, model, temperature, max_tokens) {
  try {
    // Sestavení zpráv
    const messages = [];
    
    if (system_prompt !== undefined && system_prompt !== null && system_prompt !== '') {
      messages.push({
        role: 'system',
        content: String(system_prompt)
      });
    }
    
    if (user_prompt !== undefined && user_prompt !== null && user_prompt !== '') {
      messages.push({
        role: 'user',
        content: String(user_prompt)
      });
    }

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
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sheets.google.com',
        'X-Title': 'Google Sheets OpenRouter Integration'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    // Volání API
    const response = UrlFetchApp.fetch(OPENROUTER_API_URL, options);
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
      logError('Neplatný API klíč', model, system_prompt, user_prompt);
      return 'CHYBA: Neplatný API klíč. Zkontrolujte nastavení.';
    } else if (responseCode === 429) {
      logError('Překročena kvóta API', model, system_prompt, user_prompt);
      return 'CHYBA: Překročena kvóta API. Zkuste to později.';
    } else if (responseCode === 400) {
      const errorData = JSON.parse(responseText);
      const errorMsg = errorData.error?.message || 'Neplatný požadavek';
      logError(`Chyba 400: ${errorMsg}`, model, system_prompt, user_prompt);
      return `CHYBA: ${errorMsg}`;
    } else {
      logError(`HTTP ${responseCode}: ${responseText}`, model, system_prompt, user_prompt);
      return `CHYBA: API vrátilo chybu ${responseCode}. Zkontrolujte log.`;
    }

  } catch (error) {
    logError(`Chyba při volání API: ${error.message}`, model, system_prompt, user_prompt);
    throw error;
  }
}

/**
 * Logování chyb
 */
function logError(errorMessage, model, system_prompt, user_prompt) {
  if (!ENABLE_LOGGING) {
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    
    // Vytvoření logovacího listu, pokud neexistuje
    if (!logSheet) {
      logSheet = ss.insertSheet(LOG_SHEET_NAME);
      logSheet.appendRow(['Timestamp', 'Chyba', 'Model', 'Délka System Prompt', 'Délka User Prompt', 'Uživatel']);
      logSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    }

    // Přidání záznamu
    const timestamp = new Date();
    const systemPromptLength = system_prompt ? String(system_prompt).length : 0;
    const userPromptLength = user_prompt ? String(user_prompt).length : 0;
    const user = Session.getActiveUser().getEmail();

    logSheet.appendRow([
      timestamp,
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
  ui.createMenu('OpenRouter')
    .addItem('Nastavit API klíč', 'showSetApiKeyDialog')
    .addSeparator()
    .addItem('Zobrazit log', 'showLog')
    .addItem('Vymazat log', 'clearLog')
    .addSeparator()
    .addItem('Nápověda', 'showHelp')
    .addToUi();
}

/**
 * Dialog pro nastavení API klíče
 */
function showSetApiKeyDialog() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          input { width: 100%; padding: 8px; margin: 10px 0; box-sizing: border-box; }
          button { background-color: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer; margin-top: 10px; }
          button:hover { background-color: #45a049; }
          .error { color: red; margin-top: 10px; }
          .success { color: green; margin-top: 10px; }
        </style>
      </head>
      <body>
        <h2>Nastavení OpenRouter API klíče</h2>
        <p>Zadejte konfigurační heslo a váš OpenRouter API klíč:</p>
        
        <label for="password">Heslo:</label>
        <input type="password" id="password" placeholder="Vaše konfigurační heslo">
        
        <label for="apiKey">API klíč:</label>
        <input type="password" id="apiKey" placeholder="sk-or-v1-...">
        
        <button onclick="saveApiKey()">Uložit</button>
        
        <div id="message"></div>
        
        <script>
          function saveApiKey() {
            const password = document.getElementById('password').value;
            const apiKey = document.getElementById('apiKey').value;
            const messageDiv = document.getElementById('message');
            
            if (!password || !apiKey) {
              messageDiv.innerHTML = '<p class="error">Vyplňte prosím obě pole.</p>';
              return;
            }
            
            google.script.run
              .withSuccessHandler(function(result) {
                messageDiv.innerHTML = '<p class="success">' + result + '</p>';
                setTimeout(function() {
                  google.script.host.close();
                }, 2000);
              })
              .withFailureHandler(function(error) {
                messageDiv.innerHTML = '<p class="error">Chyba: ' + error.message + '</p>';
              })
              .setOpenRouterApiKey(password, apiKey);
          }
        </script>
      </body>
    </html>
  `)
  .setWidth(400)
  .setHeight(300);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Nastavení API klíče');
}

/**
 * Zobrazení logovacího listu
 */
function showLog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  
  if (!logSheet) {
    SpreadsheetApp.getUi().alert('Log neexistuje. Zatím nedošlo k žádným chybám.');
    return;
  }
  
  ss.setActiveSheet(logSheet);
}

/**
 * Vymazání logovacího listu
 */
function clearLog() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Vymazat log',
    'Opravdu chcete vymazat všechny záznamy v logu?',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    
    if (logSheet) {
      ss.deleteSheet(logSheet);
      ui.alert('Log byl úspěšně vymazán.');
    } else {
      ui.alert('Log neexistuje.');
    }
  }
}

/**
 * Zobrazení nápovědy
 */
function showHelp() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
          h2 { color: #333; }
          code { background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
          .example { background-color: #e8f5e9; padding: 10px; margin: 10px 0; border-radius: 5px; }
          table { border-collapse: collapse; width: 100%; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
        </style>
      </head>
      <body>
        <h2>Nápověda - OpenRouter API</h2>
        
        <h3>Syntaxe funkce:</h3>
        <code>=open_router(system_prompt, user_prompt, model, temperature, max_tokens, password)</code>
        
        <h3>Parametry:</h3>
        <table>
          <tr>
            <th>Parametr</th>
            <th>Popis</th>
            <th>Výchozí</th>
          </tr>
          <tr>
            <td>system_prompt</td>
            <td>Systémová instrukce (nepovinné)</td>
            <td>-</td>
          </tr>
          <tr>
            <td>user_prompt</td>
            <td>Uživatelský prompt (nepovinné*)</td>
            <td>-</td>
          </tr>
          <tr>
            <td>model</td>
            <td>Identifikátor modelu</td>
            <td>meta-llama/llama-4-scout</td>
          </tr>
          <tr>
            <td>temperature</td>
            <td>Kreativita 0-2</td>
            <td>0.7</td>
          </tr>
          <tr>
            <td>max_tokens</td>
            <td>Max. délka odpovědi</td>
            <td>2048</td>
          </tr>
          <tr>
            <td>password</td>
            <td>Konfigurační heslo</td>
            <td>-</td>
          </tr>
        </table>
        <p><small>*Musíte zadat alespoň jeden z promptů (system nebo user)</small></p>
        
        <h3>Příklady použití:</h3>
        
        <div class="example">
          <strong>Základní použití:</strong><br>
          <code>=open_router("Jsi užitečný asistent.", "Napiš 3 věty o Praze.", "meta-llama/llama-4-scout", 0.7, 300, "mojeHeslo")</code>
        </div>
        
        <div class="example">
          <strong>Bez system_prompt:</strong><br>
          <code>=open_router(, "Přelož 'Hello world' do češtiny.", "openai/gpt-3.5-turbo", 0.5, , "mojeHeslo")</code>
        </div>
        
        <div class="example">
          <strong>S odkazy na buňky:</strong><br>
          <code>=open_router("Napiš popis:", A1, B1, C1, D1, "mojeHeslo")</code>
        </div>
        
        <h3>Dostupné modely:</h3>
        <ul>
          <li>meta-llama/llama-4-scout</li>
          <li>openai/gpt-3.5-turbo</li>
          <li>openai/gpt-4</li>
          <li>openai/gpt-4-turbo</li>
          <li>anthropic/claude-2</li>
          <li>anthropic/claude-3-opus</li>
          <li>anthropic/claude-3-sonnet</li>
          <li>google/gemini-pro</li>
          <li>google/gemini-1.5-pro</li>
        </ul>
        
        <h3>První kroky:</h3>
        <ol>
          <li>Změňte CONFIG_PASSWORD v kódu skriptu</li>
          <li>Použijte menu OpenRouter → Nastavit API klíč</li>
          <li>Zadejte heslo a váš OpenRouter API klíč</li>
          <li>Začněte používat funkci =open_router() v buňkách</li>
        </ol>
        
        <p><strong>Poznámka:</strong> Pro získání API klíče navštivte <a href="https://openrouter.ai" target="_blank">openrouter.ai</a></p>
      </body>
    </html>
  `)
  .setWidth(600)
  .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Nápověda');
}
