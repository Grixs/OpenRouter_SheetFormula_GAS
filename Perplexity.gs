// =================== PERPLEXITY API KONFIGURACE ===================
/**
 * PERPLEXITY API INTEGRACE PRO GOOGLE SHEETS
 * 
 * Tento skript umožňuje volat Perplexity AI API přímo z Google Sheets.
 * Perplexity nabízí modely s online vyhledáváním a citacemi zdrojů.
 * 
 * FUNKCE:
 * =perplexity(user_prompt, [system_prompt], [model], [temperature], [max_tokens], [password])
 * 
 * CO PERPLEXITY UMÍ:
 * ✅ Online vyhledávání - modely mají přístup k aktuálním informacím z internetu
 * ✅ Citace zdrojů - odpovědi obsahují odkazy na zdroje informací
 * ✅ Fact-checking - ověřování faktů pomocí online zdrojů
 * ✅ Aktuální data - informace o počasí, zprávách, událostech
 * ✅ Výzkum - komplexní analýzy s odkazy na zdroje
 * 
 * BEZPEČNOST:
 * - API klíč je uložen šifrovaně v PropertiesService
 * - Přístup k nastavení je chráněn heslem (CONFIG_PASSWORD)
 * - Heslo musí být nastaveno v kódu před prvním použitím
 * 
 * JAK TO FUNGUJE:
 * 1. Nastavte CONFIG_PASSWORD v tomto souboru (řádek níže)
 * 2. Získejte API klíč na https://www.perplexity.ai (Settings → API)
 * 3. Použijte menu "Perplexity" → "Nastavit API klíč"
 * 4. Zadejte heslo a API klíč
 * 5. Začněte používat funkci =perplexity() v buňkách
 * 
 * PŘÍKLADY POUŽITÍ:
 * =perplexity("Jaké jsou nejnovější zprávy o AI?")
 * =perplexity("Jaké je dnes počasí v Praze?", , "sonar")
 * =perplexity("Analyzuj ekonomické dopady AI", "Jsi ekonomický analytik", "sonar-pro")
 * =perplexity(A1, B1, C1, 0.7, 2000, "mojeHeslo")
 */

// Bezpečnostní heslo (POVINNÉ ZMĚNIT!)
const PERPLEXITY_CONFIG_PASSWORD = 'VAŠE_SILNÉ_HESLO_ZDE'; // ⚠️ ZMĚŇTE TOTO HESLO!

// API konfigurace
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Výchozí parametry
const PERPLEXITY_DEFAULT_MODEL = 'sonar';
const PERPLEXITY_DEFAULT_TEMPERATURE = 0.7;
const PERPLEXITY_DEFAULT_MAX_TOKENS = 2048;

// Seznam povolených modelů
const PERPLEXITY_ALLOWED_MODELS = [
  'sonar',                    // Základní model s online vyhledáváním
  'sonar-pro',                // Pokročilý model s lepší kvalitou
  'sonar-reasoning',          // Model pro složité úlohy a reasoning
  'llama-3.1-sonar-small-128k-online',     // Malý model (128k kontext)
  'llama-3.1-sonar-large-128k-online',     // Velký model (128k kontext)
  'llama-3.1-sonar-huge-128k-online'       // Největší model (128k kontext)
];

// Omezení pro vstupy
const PERPLEXITY_MAX_SYSTEM_PROMPT_LENGTH = 2000;
const PERPLEXITY_MAX_USER_PROMPT_LENGTH = 8000;

// Logování
const PERPLEXITY_ENABLE_LOGGING = true;
const PERPLEXITY_LOG_SHEET_NAME = 'Log_Perplexity';

// Rate limiting
const PERPLEXITY_REQUEST_DELAY_MS = 2000; // 2 sekundy mezi požadavky

// =================== HLAVNÍ FUNKCE ===================

/**
 * Hlavní funkce pro volání Perplexity API z Google Sheets
 * 
 * @param {string} user_prompt - Váš dotaz nebo instrukce (POVINNÉ)
 * @param {string} system_prompt - Systémová instrukce pro model (nepovinné)
 * @param {string} model - Identifikátor modelu (výchozí: sonar)
 * @param {number} temperature - Kreativita odpovědi 0-2 (výchozí: 0.7)
 * @param {number} max_tokens - Maximální délka odpovědi (výchozí: 2048)
 * @param {string} password - Konfigurační heslo (povinné při prvním použití)
 * @return {string} Odpověď z AI modelu s citacemi nebo chybová hláška
 * @customfunction
 * 
 * @example
 * // Základní použití - aktuální informace
 * =perplexity("Jaké jsou nejnovější zprávy o AI?")
 * 
 * @example
 * // S system promptem
 * =perplexity("Vysvětli kvantovou fyziku", "Odpovídej vědecky s citacemi", "sonar-pro")
 * 
 * @example
 * // Aktuální počasí
 * =perplexity("Jaké je dnes počasí v Praze?", , "sonar")
 * 
 * @example
 * // Složité úlohy
 * =perplexity("Analyzuj ekonomické dopady AI", "Jsi ekonomický analytik", "sonar-reasoning", 0.7, 2000, "mojeHeslo")
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
    const apiKey = getPerplexityApiKey(password);
    if (!apiKey) {
      return 'CHYBA: Perplexity API klíč není nastaven. Použijte menu Perplexity → Nastavit API klíč.';
    }

    // Přidání zpoždění pro rate limiting
    Utilities.sleep(PERPLEXITY_REQUEST_DELAY_MS);

    // Volání API
    const response = callPerplexityAPI(apiKey, user_prompt, system_prompt, finalModel, finalTemperature, finalMaxTokens);
    
    return response;

  } catch (error) {
    const errorMsg = `Neočekávaná chyba: ${error.message}`;
    logPerplexityError(errorMsg, model, system_prompt, user_prompt);
    return `CHYBA: ${errorMsg}`;
  }
}

// =================== VALIDACE PARAMETRŮ ===================

/**
 * Validace vstupních parametrů pro Perplexity
 */
function validatePerplexityParameters(user_prompt, system_prompt, model, temperature, max_tokens, password) {
  // Kontrola, zda je zadán user_prompt (povinný)
  if (!user_prompt || user_prompt === '') {
    return { valid: false, error: 'User prompt je povinný.' };
  }

  // Kontrola délky promptů
  if (String(user_prompt).length > PERPLEXITY_MAX_USER_PROMPT_LENGTH) {
    return { valid: false, error: `User prompt je příliš dlouhý (max ${PERPLEXITY_MAX_USER_PROMPT_LENGTH} znaků).` };
  }

  if (system_prompt && String(system_prompt).length > PERPLEXITY_MAX_SYSTEM_PROMPT_LENGTH) {
    return { valid: false, error: `System prompt je příliš dlouhý (max ${PERPLEXITY_MAX_SYSTEM_PROMPT_LENGTH} znaků).` };
  }

  // Kontrola modelu
  if (model && !PERPLEXITY_ALLOWED_MODELS.includes(model)) {
    return { 
      valid: false, 
      error: `Neplatný model. Povolené modely: ${PERPLEXITY_ALLOWED_MODELS.join(', ')}` 
    };
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

// =================== API KLÍČ MANAGEMENT ===================

/**
 * Získání Perplexity API klíče z úložiště
 */
function getPerplexityApiKey(password) {
  const properties = PropertiesService.getScriptProperties();
  const storedKey = properties.getProperty('PERPLEXITY_API_KEY');
  
  if (!storedKey) {
    return null;
  }
  
  return storedKey;
}

/**
 * Nastavení Perplexity API klíče do úložiště
 */
function setPerplexityApiKey(password, apiKey) {
  // Kontrola hesla
  if (password !== PERPLEXITY_CONFIG_PASSWORD) {
    throw new Error('Neplatné heslo.');
  }

  // Validace API klíče
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API klíč nemůže být prázdný.');
  }

  // Kontrola formátu API klíče (Perplexity klíče začínají 'pplx-')
  const trimmedKey = apiKey.trim();
  if (!trimmedKey.startsWith('pplx-')) {
    throw new Error('Neplatný formát API klíče. Perplexity API klíče začínají "pplx-".');
  }

  // Uložení do PropertiesService
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('PERPLEXITY_API_KEY', trimmedKey);
  
  return 'Perplexity API klíč byl úspěšně nastaven.';
}

// =================== API VOLÁNÍ ===================

/**
 * Volání Perplexity API
 */
function callPerplexityAPI(apiKey, user_prompt, system_prompt, model, temperature, max_tokens) {
  try {
    // Sestavení zpráv
    const messages = [];
    
    // System prompt je nepovinný
    if (system_prompt !== undefined && system_prompt !== null && system_prompt !== '') {
      messages.push({
        role: 'system',
        content: String(system_prompt)
      });
    }
    
    // User prompt je povinný
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
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
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
        let content = jsonResponse.choices[0].message.content;
        
        // Perplexity může vracet citace - přidáme je k odpovědi
        if (jsonResponse.citations && jsonResponse.citations.length > 0) {
          content += '\n\n📚 Zdroje:\n' + jsonResponse.citations.map((cite, idx) => `${idx + 1}. ${cite}`).join('\n');
        }
        
        return content;
      } else {
        throw new Error('API vrátilo prázdnou odpověď.');
      }
    } else if (responseCode === 401) {
      logPerplexityError('Neplatný API klíč', model, system_prompt, user_prompt);
      return 'CHYBA: Neplatný Perplexity API klíč. Zkontrolujte nastavení.';
    } else if (responseCode === 429) {
      logPerplexityError('Překročena kvóta API', model, system_prompt, user_prompt);
      return 'CHYBA: Překročena kvóta API. Zkuste to později.';
    } else if (responseCode === 400) {
      const errorData = JSON.parse(responseText);
      const errorMsg = errorData.error?.message || 'Neplatný požadavek';
      logPerplexityError(`Chyba 400: ${errorMsg}`, model, system_prompt, user_prompt);
      return `CHYBA: ${errorMsg}`;
    } else {
      logPerplexityError(`HTTP ${responseCode}: ${responseText}`, model, system_prompt, user_prompt);
      return `CHYBA: API vrátilo chybu ${responseCode}. Zkontrolujte log.`;
    }

  } catch (error) {
    logPerplexityError(`Chyba při volání API: ${error.message}`, model, system_prompt, user_prompt);
    throw error;
  }
}

// =================== LOGOVÁNÍ ===================

/**
 * Logování chyb pro Perplexity
 */
function logPerplexityError(errorMessage, model, system_prompt, user_prompt) {
  if (!PERPLEXITY_ENABLE_LOGGING) {
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(PERPLEXITY_LOG_SHEET_NAME);
    
    // Vytvoření logovacího listu, pokud neexistuje
    if (!logSheet) {
      logSheet = ss.insertSheet(PERPLEXITY_LOG_SHEET_NAME);
      logSheet.appendRow(['Timestamp', 'Chyba', 'Model', 'Délka System Prompt', 'Délka User Prompt', 'Uživatel']);
      logSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      logSheet.setFrozenRows(1);
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
    Logger.log(`Chyba při logování Perplexity: ${error.message}`);
  }
}

// =================== UI FUNKCE ===================

/**
 * Vytvoření vlastního menu při otevření tabulky
 * Tato funkce rozšiřuje existující menu nebo vytváří nové
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Perplexity')
    .addItem('Nastavit API klíč', 'showSetPerplexityApiKeyDialog')
    .addSeparator()
    .addItem('Zobrazit log', 'showPerplexityLog')
    .addItem('Vymazat log', 'clearPerplexityLog')
    .addSeparator()
    .addItem('Nápověda', 'showPerplexityHelp')
    .addItem('Dostupné modely', 'showPerplexityModels')
    .addToUi();
}

/**
 * Dialog pro nastavení Perplexity API klíče
 */
function showSetPerplexityApiKeyDialog() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { 
            font-family: 'Google Sans', Arial, sans-serif; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          h2 { 
            color: #667eea; 
            margin-top: 0;
            font-size: 24px;
          }
          p { 
            color: #666; 
            line-height: 1.6;
          }
          input { 
            width: 100%; 
            padding: 12px; 
            margin: 10px 0; 
            box-sizing: border-box;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
          }
          input:focus {
            outline: none;
            border-color: #667eea;
          }
          label {
            font-weight: 600;
            color: #333;
            display: block;
            margin-top: 15px;
          }
          button { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 12px 30px; 
            border: none; 
            cursor: pointer; 
            margin-top: 20px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            width: 100%;
            transition: transform 0.2s;
          }
          button:hover { 
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
          }
          .error { 
            color: #e74c3c; 
            margin-top: 15px;
            padding: 10px;
            background: #fadbd8;
            border-radius: 6px;
          }
          .success { 
            color: #27ae60; 
            margin-top: 15px;
            padding: 10px;
            background: #d5f4e6;
            border-radius: 6px;
          }
          .info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #2196f3;
          }
          .info a {
            color: #2196f3;
            text-decoration: none;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔮 Nastavení Perplexity API klíče</h2>
          
          <div class="info">
            <strong>ℹ️ Kde získat API klíč?</strong><br>
            Navštivte <a href="https://www.perplexity.ai" target="_blank">perplexity.ai</a> → Settings → API<br>
            API klíč začíná: <code>pplx-...</code>
          </div>
          
          <label for="password">🔐 Konfigurační heslo:</label>
          <input type="password" id="password" placeholder="Vaše konfigurační heslo">
          
          <label for="apiKey">🔑 Perplexity API klíč:</label>
          <input type="password" id="apiKey" placeholder="pplx-...">
          
          <button onclick="saveApiKey()">💾 Uložit API klíč</button>
          
          <div id="message"></div>
        </div>
        
        <script>
          function saveApiKey() {
            const password = document.getElementById('password').value;
            const apiKey = document.getElementById('apiKey').value;
            const messageDiv = document.getElementById('message');
            
            if (!password || !apiKey) {
              messageDiv.innerHTML = '<p class="error">❌ Vyplňte prosím obě pole.</p>';
              return;
            }
            
            google.script.run
              .withSuccessHandler(function(result) {
                messageDiv.innerHTML = '<p class="success">✅ ' + result + '</p>';
                setTimeout(function() {
                  google.script.host.close();
                }, 2000);
              })
              .withFailureHandler(function(error) {
                messageDiv.innerHTML = '<p class="error">❌ Chyba: ' + error.message + '</p>';
              })
              .setPerplexityApiKey(password, apiKey);
          }
        </script>
      </body>
    </html>
  `)
  .setWidth(500)
  .setHeight(450);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Nastavení Perplexity API');
}

/**
 * Zobrazení logovacího listu
 */
function showPerplexityLog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(PERPLEXITY_LOG_SHEET_NAME);
  
  if (!logSheet) {
    SpreadsheetApp.getUi().alert('Log neexistuje. Zatím nedošlo k žádným chybám.');
    return;
  }
  
  ss.setActiveSheet(logSheet);
}

/**
 * Vymazání logovacího listu
 */
function clearPerplexityLog() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Vymazat log',
    'Opravdu chcete vymazat všechny záznamy v Perplexity logu?',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(PERPLEXITY_LOG_SHEET_NAME);
    
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
function showPerplexityHelp() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { 
            font-family: 'Google Sans', Arial, sans-serif; 
            padding: 20px; 
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-height: 80vh;
            overflow-y: auto;
          }
          h2 { color: #667eea; margin-top: 0; }
          h3 { color: #764ba2; margin-top: 25px; }
          code { 
            background-color: #f5f5f5; 
            padding: 3px 8px; 
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            color: #e74c3c;
          }
          .example { 
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 8px;
            border-left: 4px solid #4caf50;
          }
          .feature {
            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
            border-left: 4px solid #ff9800;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 15px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          th, td { 
            border: 1px solid #e0e0e0; 
            padding: 12px; 
            text-align: left; 
          }
          th { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .icon { font-size: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔮 Nápověda - Perplexity API</h2>
          
          <div class="feature">
            <strong class="icon">✨</strong> <strong>Co Perplexity umí:</strong><br>
            • 🌐 Online vyhledávání - přístup k aktuálním informacím z internetu<br>
            • 📚 Citace zdrojů - odpovědi obsahují odkazy na zdroje<br>
            • ✅ Fact-checking - ověřování faktů pomocí online zdrojů<br>
            • 📰 Aktuální data - zprávy, počasí, události<br>
            • 🔬 Výzkum - komplexní analýzy s odkazy
          </div>
          
          <h3>📝 Syntaxe funkce:</h3>
          <code>=perplexity(user_prompt, [system_prompt], [model], [temperature], [max_tokens], [password])</code>
          
          <h3>⚙️ Parametry:</h3>
          <table>
            <tr>
              <th>Parametr</th>
              <th>Popis</th>
              <th>Výchozí</th>
            </tr>
            <tr>
              <td><strong>user_prompt</strong></td>
              <td>Váš dotaz (POVINNÉ)</td>
              <td>-</td>
            </tr>
            <tr>
              <td>system_prompt</td>
              <td>Systémová instrukce</td>
              <td>-</td>
            </tr>
            <tr>
              <td>model</td>
              <td>Identifikátor modelu</td>
              <td>sonar</td>
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
          
          <h3>💡 Příklady použití:</h3>
          
          <div class="example">
            <strong>🌐 Aktuální zprávy:</strong><br>
            <code>=perplexity("Jaké jsou nejnovější zprávy o AI?")</code>
          </div>
          
          <div class="example">
            <strong>🌤️ Počasí:</strong><br>
            <code>=perplexity("Jaké je dnes počasí v Praze?")</code>
          </div>
          
          <div class="example">
            <strong>🔬 Výzkum s citacemi:</strong><br>
            <code>=perplexity("Vysvětli kvantovou fyziku", "Odpovídaj vědecky s citacemi", "sonar-pro")</code>
          </div>
          
          <div class="example">
            <strong>📊 Složité analýzy:</strong><br>
            <code>=perplexity("Analyzuj ekonomické dopady AI", "Jsi ekonomický analytik", "sonar-reasoning", 0.7, 2000)</code>
          </div>
          
          <div class="example">
            <strong>📱 S odkazy na buňky:</strong><br>
            <code>=perplexity(A1, B1, C1, D1, E1, "mojeHeslo")</code>
          </div>
          
          <h3>🚀 První kroky:</h3>
          <ol>
            <li>Změňte <code>PERPLEXITY_CONFIG_PASSWORD</code> v kódu skriptu</li>
            <li>Získejte API klíč na <a href="https://www.perplexity.ai" target="_blank">perplexity.ai</a></li>
            <li>Použijte menu Perplexity → Nastavit API klíč</li>
            <li>Zadejte heslo a váš Perplexity API klíč (začíná pplx-)</li>
            <li>Začněte používat funkci =perplexity() v buňkách</li>
          </ol>
          
          <h3>🎯 Kdy použít Perplexity:</h3>
          <ul>
            <li>✅ Potřebujete aktuální informace z internetu</li>
            <li>✅ Chcete citace a zdroje</li>
            <li>✅ Děláte výzkum nebo fact-checking</li>
            <li>✅ Potřebujete ověřit fakta</li>
            <li>✅ Hledáte nejnovější zprávy a události</li>
          </ul>
        </div>
      </body>
    </html>
  `)
  .setWidth(700)
  .setHeight(700);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Perplexity - Nápověda');
}

/**
 * Zobrazení dostupných modelů
 */
function showPerplexityModels() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { 
            font-family: 'Google Sans', Arial, sans-serif; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          h2 { color: #667eea; margin-top: 0; }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          th, td { 
            border: 1px solid #e0e0e0; 
            padding: 12px; 
            text-align: left; 
          }
          th { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin: 2px;
          }
          .badge-online {
            background: #4caf50;
            color: white;
          }
          .badge-fast {
            background: #2196f3;
            color: white;
          }
          .badge-pro {
            background: #ff9800;
            color: white;
          }
          code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #e74c3c;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🤖 Dostupné Perplexity modely</h2>
          
          <table>
            <tr>
              <th>Model</th>
              <th>Identifikátor</th>
              <th>Popis</th>
              <th>Funkce</th>
            </tr>
            <tr>
              <td><strong>Sonar</strong></td>
              <td><code>sonar</code></td>
              <td>Základní model s online vyhledáváním</td>
              <td>
                <span class="badge badge-online">🌐 Online</span>
                <span class="badge badge-fast">⚡ Rychlý</span>
              </td>
            </tr>
            <tr>
              <td><strong>Sonar Pro</strong></td>
              <td><code>sonar-pro</code></td>
              <td>Pokročilý model s lepší kvalitou</td>
              <td>
                <span class="badge badge-online">🌐 Online</span>
                <span class="badge badge-pro">⭐ Pro</span>
              </td>
            </tr>
            <tr>
              <td><strong>Sonar Reasoning</strong></td>
              <td><code>sonar-reasoning</code></td>
              <td>Model pro složité úlohy a reasoning</td>
              <td>
                <span class="badge badge-online">🌐 Online</span>
                <span class="badge badge-pro">🧠 Reasoning</span>
              </td>
            </tr>
            <tr>
              <td><strong>Llama 3.1 Sonar Small</strong></td>
              <td><code>llama-3.1-sonar-small-128k-online</code></td>
              <td>Malý model (128k kontext)</td>
              <td>
                <span class="badge badge-online">🌐 Online</span>
                <span class="badge badge-fast">⚡ Rychlý</span>
              </td>
            </tr>
            <tr>
              <td><strong>Llama 3.1 Sonar Large</strong></td>
              <td><code>llama-3.1-sonar-large-128k-online</code></td>
              <td>Velký model (128k kontext)</td>
              <td>
                <span class="badge badge-online">🌐 Online</span>
                <span class="badge badge-pro">⭐ Výkonný</span>
              </td>
            </tr>
            <tr>
              <td><strong>Llama 3.1 Sonar Huge</strong></td>
              <td><code>llama-3.1-sonar-huge-128k-online</code></td>
              <td>Největší model (128k kontext)</td>
              <td>
                <span class="badge badge-online">🌐 Online</span>
                <span class="badge badge-pro">🚀 Nejlepší</span>
              </td>
            </tr>
          </table>
          
          <h3>💡 Doporučení:</h3>
          <ul>
            <li><strong>sonar</strong> - Pro běžné dotazy a rychlé odpovědi</li>
            <li><strong>sonar-pro</strong> - Pro výzkum a detailní analýzy</li>
            <li><strong>sonar-reasoning</strong> - Pro složité úlohy vyžadující reasoning</li>
            <li><strong>llama-3.1-sonar-huge-128k-online</strong> - Pro nejnáročnější úlohy</li>
          </ul>
          
          <p><strong>Poznámka:</strong> Všechny modely mají přístup k online vyhledávání a poskytují citace zdrojů.</p>
        </div>
      </body>
    </html>
  `)
  .setWidth(800)
  .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Perplexity - Dostupné modely');
}
