// =================== FIRECRAWL API KONFIGURACE ===================
/**
 * FIRECRAWL API INTEGRACE PRO GOOGLE SHEETS
 *
 * Funkce:
 * =firecrawl(prompt, [endpoint], [target], [model], [formats], [limit], [options_json], [password], [response_field])
 *
 * Poznámka k menu:
 * V projektu již existují jiné onOpen() funkce. Aby nedošlo ke kolizi,
 * použijte funkci addFirecrawlMenu() a zavolejte ji z hlavního onOpen().
 */

// Bezpečnostní heslo (POVINNÉ ZMĚNIT!)
const FIRECRAWL_CONFIG_PASSWORD = 'VAŠE_SILNÉ_HESLO_ZDE'; // ⚠️ ZMĚŇTE TOTO HESLO!

// API konfigurace
const FIRECRAWL_API_BASE_URL = 'https://api.firecrawl.dev/v2';

// Výchozí parametry
const FIRECRAWL_DEFAULT_ENDPOINT = 'agent';
const FIRECRAWL_DEFAULT_MODEL = 'spark-1-mini';
const FIRECRAWL_DEFAULT_FORMATS = ['markdown'];
const FIRECRAWL_DEFAULT_LIMIT = 5;

// Omezení pro vstupy
const FIRECRAWL_MAX_PROMPT_LENGTH = 8000;
const FIRECRAWL_MAX_TARGET_LENGTH = 2000;

// Logování
const FIRECRAWL_ENABLE_LOGGING = true;
const FIRECRAWL_LOG_SHEET_NAME = 'Log_Firecrawl';

// Rate limiting
const FIRECRAWL_REQUEST_DELAY_MS = 2000;

// =================== HLAVNÍ FUNKCE ===================

/**
 * Hlavní funkce pro volání Firecrawl API z Google Sheets
 *
 * @param {string} prompt - Prompt, query nebo instrukce (POVINNÉ)
 * @param {string} endpoint - agent | scrape | search | crawl | map (výchozí: agent)
 * @param {string} target - URL pro scrape/crawl/map (povinné pro tyto endpointy)
 * @param {string} model - Model Firecrawl (výchozí: spark-1-mini)
 * @param {string} formats - Formáty výstupu (např. "markdown,html,json")
 * @param {number} limit - Limit výsledků (výchozí: 5)
 * @param {string} options_json - JSON string pro pokročilé parametry
 * @param {string} password - Konfigurační heslo (používá se jen pro nastavení klíče)
 * @param {string} response_field - Pole, které se má vrátit (např. "data", "sources")
 * @return {string} Odpověď z Firecrawl nebo chybová hláška
 * @customfunction
 */
function firecrawl(prompt, endpoint, target, model, formats, limit, options_json, password, response_field) {
  try {
    const validation = validateFirecrawlParameters(prompt, endpoint, target, model, formats, limit, options_json);
    if (!validation.valid) {
      return `CHYBA: ${validation.error}`;
    }

    const finalEndpoint = (endpoint && String(endpoint).trim()) || FIRECRAWL_DEFAULT_ENDPOINT;
    const finalModel = (model && String(model).trim()) || FIRECRAWL_DEFAULT_MODEL;
    const finalFormats = parseFormats(formats);
    const finalLimit = limit !== undefined && limit !== null && limit !== '' ? Number(limit) : FIRECRAWL_DEFAULT_LIMIT;
    const finalOptions = parseOptionsJson(options_json);

    const apiKey = getFirecrawlApiKey(password);
    if (!apiKey) {
      return 'CHYBA: Firecrawl API klíč není nastaven. Použijte menu Firecrawl → Nastavit API klíč.';
    }

    Utilities.sleep(FIRECRAWL_REQUEST_DELAY_MS);

    const response = callFirecrawlAPI(apiKey, finalEndpoint, prompt, target, finalModel, finalFormats, finalLimit, finalOptions);
    return formatFirecrawlResponse(finalEndpoint, response, response_field);
  } catch (error) {
    const errorMsg = `Neočekávaná chyba: ${error.message}`;
    logFirecrawlError(errorMsg, endpoint, target, prompt);
    return `CHYBA: ${errorMsg}`;
  }
}

/**
 * Načtení výsledku asynchronního agent běhu podle ID
 *
 * @param {string} job_id - ID úlohy z odpovědi agent endpointu
 * @param {string} response_field - Pole, které se má vrátit (např. "data", "sources")
 * @param {string} password - Konfigurační heslo (nepovinné, jen pro kompatibilitu)
 * @return {string} Odpověď z Firecrawl nebo chybová hláška
 * @customfunction
 */
function firecrawl_status(job_id, response_field, password) {
  try {
    if (!job_id || String(job_id).trim() === '') {
      return 'CHYBA: job_id je povinný.';
    }

    const apiKey = getFirecrawlApiKey(password);
    if (!apiKey) {
      return 'CHYBA: Firecrawl API klíč není nastaven. Použijte menu Firecrawl → Nastavit API klíč.';
    }

    const response = callFirecrawlStatusAPI(apiKey, String(job_id));
    return formatFirecrawlResponse('agent', response, response_field);
  } catch (error) {
    const errorMsg = `Neočekávaná chyba: ${error.message}`;
    logFirecrawlError(errorMsg, 'agent_status', job_id, '');
    return `CHYBA: ${errorMsg}`;
  }
}

// =================== VALIDACE PARAMETRŮ ===================

function validateFirecrawlParameters(prompt, endpoint, target, model, formats, limit, options_json) {
  if (prompt === undefined || prompt === null || String(prompt).trim() === '') {
    return { valid: false, error: 'Prompt je povinný.' };
  }

  if (String(prompt).length > FIRECRAWL_MAX_PROMPT_LENGTH) {
    return { valid: false, error: `Prompt je příliš dlouhý (max ${FIRECRAWL_MAX_PROMPT_LENGTH} znaků).` };
  }

  if (target && String(target).length > FIRECRAWL_MAX_TARGET_LENGTH) {
    return { valid: false, error: `Target URL je příliš dlouhá (max ${FIRECRAWL_MAX_TARGET_LENGTH} znaků).` };
  }

  const finalEndpoint = (endpoint && String(endpoint).trim()) || FIRECRAWL_DEFAULT_ENDPOINT;
  const allowedEndpoints = ['agent', 'scrape', 'search', 'crawl', 'map'];
  if (!allowedEndpoints.includes(finalEndpoint)) {
    return { valid: false, error: `Neplatný endpoint. Povolené: ${allowedEndpoints.join(', ')}` };
  }

  if (['scrape', 'crawl', 'map'].includes(finalEndpoint)) {
    if (!target || String(target).trim() === '') {
      return { valid: false, error: `Endpoint "${finalEndpoint}" vyžaduje target URL.` };
    }
  }

  if (limit !== undefined && limit !== null && limit !== '') {
    const num = Number(limit);
    if (isNaN(num) || num < 1 || num > 1000) {
      return { valid: false, error: 'Limit musí být číslo mezi 1 a 1000.' };
    }
  }

  if (options_json) {
    try {
      JSON.parse(String(options_json));
    } catch (error) {
      return { valid: false, error: 'options_json není platný JSON.' };
    }
  }

  return { valid: true };
}

// =================== API KLÍČ MANAGEMENT ===================

function getFirecrawlApiKey(password) {
  const properties = PropertiesService.getScriptProperties();
  const storedKey = properties.getProperty('FIRECRAWL_API_KEY');
  if (!storedKey) {
    return null;
  }
  return storedKey;
}

function setFirecrawlApiKey(password, apiKey) {
  if (password !== FIRECRAWL_CONFIG_PASSWORD) {
    throw new Error('Neplatné heslo.');
  }

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API klíč nemůže být prázdný.');
  }

  const trimmedKey = apiKey.trim();
  if (!trimmedKey.startsWith('fc-')) {
    throw new Error('Neplatný formát API klíče. Firecrawl klíče začínají "fc-".');
  }

  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('FIRECRAWL_API_KEY', trimmedKey);
  return 'Firecrawl API klíč byl úspěšně nastaven.';
}

// =================== API VOLÁNÍ ===================

function callFirecrawlAPI(apiKey, endpoint, prompt, target, model, formats, limit, options) {
  const url = `${FIRECRAWL_API_BASE_URL}/${endpoint}`;
  const payload = buildFirecrawlPayload(endpoint, prompt, target, model, formats, limit, options);

  const requestOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, requestOptions);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode === 200) {
    return JSON.parse(responseText);
  }

  if (responseCode === 401) {
    logFirecrawlError('Neplatný API klíč', endpoint, target, prompt);
    throw new Error('Neplatný Firecrawl API klíč. Zkontrolujte nastavení.');
  }

  if (responseCode === 429) {
    logFirecrawlError('Překročena kvóta API', endpoint, target, prompt);
    throw new Error('Překročena kvóta API. Zkuste to později.');
  }

  let apiError = responseText;
  try {
    const errorData = JSON.parse(responseText);
    apiError = errorData.error?.message || errorData.message || responseText;
  } catch (error) {
    // keep raw response
  }

  logFirecrawlError(`HTTP ${responseCode}: ${apiError}`, endpoint, target, prompt);
  throw new Error(`API vrátilo chybu ${responseCode}: ${apiError}`);
}

function callFirecrawlStatusAPI(apiKey, jobId) {
  const url = `${FIRECRAWL_API_BASE_URL}/agent/${encodeURIComponent(jobId)}`;
  const requestOptions = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, requestOptions);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode === 200) {
    return JSON.parse(responseText);
  }

  if (responseCode === 401) {
    logFirecrawlError('Neplatný API klíč', 'agent_status', jobId, '');
    throw new Error('Neplatný Firecrawl API klíč. Zkontrolujte nastavení.');
  }

  let apiError = responseText;
  try {
    const errorData = JSON.parse(responseText);
    apiError = errorData.error?.message || errorData.message || responseText;
  } catch (error) {
    // keep raw response
  }

  logFirecrawlError(`HTTP ${responseCode}: ${apiError}`, 'agent_status', jobId, '');
  throw new Error(`API vrátilo chybu ${responseCode}: ${apiError}`);
}

function buildFirecrawlPayload(endpoint, prompt, target, model, formats, limit, options) {
  const base = {};
  if (options && typeof options === 'object') {
    Object.keys(options).forEach((key) => {
      base[key] = options[key];
    });
  }

  switch (endpoint) {
    case 'agent':
      return mergeFirecrawlOptions(
        {
          prompt: String(prompt),
          model: model
        },
        base
      );
    case 'scrape':
      return mergeFirecrawlOptions(
        {
          url: String(target),
          formats: formats,
          prompt: String(prompt),
          model: model
        },
        base
      );
    case 'search':
      return mergeFirecrawlOptions(
        {
          query: String(prompt),
          limit: limit,
          scrape_options: {
            formats: formats
          }
        },
        base
      );
    case 'crawl':
      return mergeFirecrawlOptions(
        {
          url: String(target),
          limit: limit
        },
        base
      );
    case 'map':
      return mergeFirecrawlOptions(
        {
          url: String(target),
          limit: limit
        },
        base
      );
    default:
      return base;
  }
}

function mergeFirecrawlOptions(base, options) {
  const merged = Object.assign({}, base);
  Object.keys(options || {}).forEach((key) => {
    if (key === 'scrape_options' && typeof options[key] === 'object') {
      merged.scrape_options = Object.assign({}, merged.scrape_options || {}, options[key]);
      return;
    }
    merged[key] = options[key];
  });
  return merged;
}

// =================== RESPONSE PARSING ===================

function formatFirecrawlResponse(endpoint, responseJson, responseField) {
  if (!responseJson) {
    return 'CHYBA: Prázdná odpověď.';
  }

  const data = responseJson.data !== undefined ? responseJson.data : responseJson;

  if (responseField && String(responseField).trim() !== '') {
    const fieldValue = getFieldByPath(data, String(responseField));
    return stringifyField(fieldValue);
  }

  if (endpoint === 'agent') {
    const result = data.result || data.answer || data.text || data.output;
    if (result) {
      const sources = data.sources || data.citations;
      return appendSources(String(result), sources);
    }
  }

  if (endpoint === 'scrape') {
    if (data.markdown) {
      return String(data.markdown);
    }
    if (data.html) {
      return String(data.html);
    }
    if (data.json) {
      return stringifyField(data.json);
    }
  }

  if (Array.isArray(data)) {
    return formatList(data);
  }

  if (data && typeof data === 'object') {
    return stringifyField(data);
  }

  return String(data);
}

function stringifyField(value) {
  if (value === undefined || value === null) {
    return 'CHYBA: Požadované pole nebylo nalezeno.';
  }
  if (Array.isArray(value)) {
    return formatList(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function appendSources(text, sources) {
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return text;
  }
  const formattedSources = sources
    .map((item, index) => {
      if (typeof item === 'string') {
        return `${index + 1}. ${item}`;
      }
      if (item.url) {
        return `${index + 1}. ${item.url}`;
      }
      return `${index + 1}. ${JSON.stringify(item)}`;
    })
    .join('\n');
  return `${text}\n\n📚 Zdroje:\n${formattedSources}`;
}

function formatList(items) {
  return items
    .map((item, index) => {
      if (typeof item === 'string') {
        return `${index + 1}. ${item}`;
      }
      if (item && typeof item === 'object') {
        const title = item.title || item.name || item.page_title || item.heading;
        const url = item.url || item.link || item.href;
        if (title && url) {
          return `${index + 1}. ${title} — ${url}`;
        }
        if (url) {
          return `${index + 1}. ${url}`;
        }
        return `${index + 1}. ${JSON.stringify(item)}`;
      }
      return `${index + 1}. ${String(item)}`;
    })
    .join('\n');
}

function getFieldByPath(obj, path) {
  if (!obj || !path) {
    return undefined;
  }
  const parts = String(path).split('.').map((part) => part.trim()).filter(Boolean);
  return parts.reduce((current, part) => (current ? current[part] : undefined), obj);
}

// =================== UTILITIES ===================

function parseFormats(formats) {
  if (!formats || String(formats).trim() === '') {
    return FIRECRAWL_DEFAULT_FORMATS.slice();
  }
  if (Array.isArray(formats)) {
    return formats.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(formats)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionsJson(optionsJson) {
  if (!optionsJson || String(optionsJson).trim() === '') {
    return null;
  }
  try {
    return JSON.parse(String(optionsJson));
  } catch (error) {
    return null;
  }
}

// =================== LOGOVÁNÍ ===================

function logFirecrawlError(errorMessage, endpoint, target, prompt) {
  if (!FIRECRAWL_ENABLE_LOGGING) {
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(FIRECRAWL_LOG_SHEET_NAME);

    if (!logSheet) {
      logSheet = ss.insertSheet(FIRECRAWL_LOG_SHEET_NAME);
      logSheet.appendRow(['Timestamp', 'Chyba', 'Endpoint', 'Target', 'Délka promptu', 'Uživatel']);
      logSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }

    const timestamp = new Date();
    const promptLength = prompt ? String(prompt).length : 0;
    const user = Session.getActiveUser().getEmail();

    logSheet.appendRow([
      timestamp,
      errorMessage,
      endpoint || 'N/A',
      target || 'N/A',
      promptLength,
      user
    ]);

    if (logSheet.getLastRow() > 1001) {
      logSheet.deleteRows(2, logSheet.getLastRow() - 1001);
    }
  } catch (error) {
    Logger.log(`Chyba při logování Firecrawl: ${error.message}`);
  }
}

// =================== UI FUNKCE ===================

function addFirecrawlMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Firecrawl')
    .addItem('Nastavit API klíč', 'showSetFirecrawlApiKeyDialog')
    .addSeparator()
    .addItem('Zobrazit log', 'showFirecrawlLog')
    .addItem('Vymazat log', 'clearFirecrawlLog')
    .addSeparator()
    .addItem('Nápověda', 'showFirecrawlHelp')
    .addItem('Příklady', 'showFirecrawlExamples')
    .addToUi();
}

function showSetFirecrawlApiKeyDialog() {
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
        <h2>Nastavení Firecrawl API klíče</h2>
        <p>Zadejte konfigurační heslo a váš Firecrawl API klíč:</p>

        <label for="password">Heslo:</label>
        <input type="password" id="password" placeholder="Vaše konfigurační heslo">

        <label for="apiKey">API klíč:</label>
        <input type="password" id="apiKey" placeholder="fc-...">

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
              .setFirecrawlApiKey(password, apiKey);
          }
        </script>
      </body>
    </html>
  `)
    .setWidth(420)
    .setHeight(320);

  SpreadsheetApp.getUi().showModalDialog(html, 'Nastavení Firecrawl API klíče');
}

function showFirecrawlLog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(FIRECRAWL_LOG_SHEET_NAME);
  if (!logSheet) {
    SpreadsheetApp.getUi().alert('Log neexistuje. Zatím nedošlo k žádným chybám.');
    return;
  }
  ss.setActiveSheet(logSheet);
}

function clearFirecrawlLog() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Vymazat log',
    'Opravdu chcete vymazat všechny záznamy v Firecrawl logu?',
    ui.ButtonSet.YES_NO
  );
  if (response === ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(FIRECRAWL_LOG_SHEET_NAME);
    if (logSheet) {
      ss.deleteSheet(logSheet);
      ui.alert('Log byl úspěšně vymazán.');
    } else {
      ui.alert('Log neexistuje.');
    }
  }
}

function showFirecrawlHelp() {
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
        <h2>Nápověda - Firecrawl API</h2>

        <h3>Syntaxe funkce:</h3>
        <code>=firecrawl(prompt, [endpoint], [target], [model], [formats], [limit], [options_json], [password], [response_field])</code>

        <h3>Parametry:</h3>
        <table>
          <tr>
            <th>Parametr</th>
            <th>Popis</th>
            <th>Výchozí</th>
          </tr>
          <tr>
            <td>prompt</td>
            <td>Prompt nebo query (povinné)</td>
            <td>-</td>
          </tr>
          <tr>
            <td>endpoint</td>
            <td>agent | scrape | search | crawl | map</td>
            <td>agent</td>
          </tr>
          <tr>
            <td>target</td>
            <td>URL pro scrape/crawl/map</td>
            <td>-</td>
          </tr>
          <tr>
            <td>model</td>
            <td>Model Firecrawl</td>
            <td>spark-1-mini</td>
          </tr>
          <tr>
            <td>formats</td>
            <td>Výstupní formáty (markdown, html, json)</td>
            <td>markdown</td>
          </tr>
          <tr>
            <td>limit</td>
            <td>Limit výsledků</td>
            <td>5</td>
          </tr>
          <tr>
            <td>options_json</td>
            <td>Pokročilé parametry jako JSON string</td>
            <td>-</td>
          </tr>
          <tr>
            <td>response_field</td>
            <td>Pole z odpovědi (např. sources)</td>
            <td>-</td>
          </tr>
        </table>

        <h3>Příklady:</h3>
        <div class="example">
          <code>=firecrawl("Najdi endpointy Firecrawl", "agent", , "spark-1-mini", "markdown")</code>
        </div>
        <div class="example">
          <code>=firecrawl("Extract title", "scrape", "https://firecrawl.dev", , "json")</code>
        </div>
      </body>
    </html>
  `)
    .setWidth(700)
    .setHeight(600);

  SpreadsheetApp.getUi().showModalDialog(html, 'Firecrawl - Nápověda');
}

function showFirecrawlExamples() {
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
        </style>
      </head>
      <body>
        <h2>Firecrawl - Příklady použití</h2>
        <div class="example">
          <code>=firecrawl("Najdi pořadatele eventu WebExpo", "agent")</code>
        </div>
        <div class="example">
          <code>=firecrawl("Najdi CEO", "scrape", "https://firma.cz/about")</code>
        </div>
        <div class="example">
          <code>=firecrawl("AI news", "search", , , "markdown", 3)</code>
        </div>
      </body>
    </html>
  `)
    .setWidth(600)
    .setHeight(500);

  SpreadsheetApp.getUi().showModalDialog(html, 'Firecrawl - Příklady');
}
