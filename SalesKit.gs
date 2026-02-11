// =================== SALESKIT (MERK) API KONFIGURACE ===================
/**
 * SALESKIT (MERK) API INTEGRACE PRO GOOGLE SHEETS
 *
 * Funkce:
 * =saleskit(typ_dotazu, hodnota, [response_field], [country_code], [password], [options_json])
 *
 * Podporované typy dotazu: ico/ičo, dic/dič, name/název, email, address/adresa, person/jednatel
 *
 * Poznámka k menu:
 * V projektu existují jiné onOpen() funkce. Aby nedošlo ke kolizi,
 * použijte funkci addSalesKitMenu() a zavolejte ji z hlavního onOpen().
 */

// Bezpečnostní heslo (POVINNÉ ZMĚNIT!)
const SALESKIT_CONFIG_PASSWORD = 'VAŠE_SILNÉ_HESLO_ZDE'; // ⚠️ ZMĚŇTE TOTO HESLO!

// API konfigurace
const SALESKIT_API_BASE_URL = 'https://api.merk.cz';

// Výchozí parametry
const SALESKIT_DEFAULT_RESPONSE_FIELD = 'summary';
const SALESKIT_DEFAULT_COUNTRY_CODE = 'cz';
const SALESKIT_REQUEST_DELAY_MS = 2000;

// Logování
const SALESKIT_ENABLE_LOGGING = true;
const SALESKIT_LOG_SHEET_NAME = 'Log_SalesKit';

// =================== HLAVNÍ FUNKCE ===================

/**
 * Hlavní funkce pro volání SalesKit (Merk) API z Google Sheets
 *
 * POUŽITÍ:
 * =saleskit("ičo", "28159128")                           → vrátí summary
 * =saleskit("ičo", "28159128", "name")                   → vrátí název firmy
 * =saleskit("ičo", "28159128", "name", "cz")             → vrátí název firmy (CZ)
 * =saleskit("name", "Acme s.r.o.", "regno", "cz")        → vyhledá podle názvu
 *
 * @param {string} typ_dotazu - ico/ičo, dic/dič, name/název, email, address/adresa
 * @param {string} hodnota - hodnota pro vyhledání (IČO, DIČ, název, email)
 * @param {string} response_field - pole, které se má vrátit (default: summary)
 * @param {string} country_code - cz nebo sk (default: cz)
 * @return {string} Výsledek nebo chybová hláška
 * @customfunction
 */
function saleskit(typ_dotazu, hodnota, response_field, country_code) {
  try {
    // Logování vstupu pro debugging
    Logger.log(`=== SALESKIT VOLÁNÍ ===`);
    Logger.log(`typ_dotazu: ${typ_dotazu}`);
    Logger.log(`hodnota: ${hodnota}`);
    Logger.log(`response_field: ${response_field}`);
    Logger.log(`country_code: ${country_code}`);
    
    const validation = validateSalesKitParameters(typ_dotazu, hodnota, response_field, country_code, null);
    if (!validation.valid) {
      Logger.log(`Validace selhala: ${validation.error}`);
      return `CHYBA: ${validation.error}`;
    }

    const apiKey = getSalesKitApiKey(null);
    if (!apiKey) {
      Logger.log('API klíč není nastaven');
      return 'CHYBA: SalesKit API klíč není nastaven. Použijte menu SalesKit → Nastavit API klíč.';
    }
    Logger.log(`API klíč nalezen: ${apiKey.substring(0, 10)}...`);

    const finalType = normalizeSalesKitType(typ_dotazu);
    const finalResponseField = (response_field && String(response_field).trim()) || SALESKIT_DEFAULT_RESPONSE_FIELD;
    const finalCountryCode = (country_code && String(country_code).trim().toLowerCase()) || SALESKIT_DEFAULT_COUNTRY_CODE;

    Logger.log(`Normalizovaný typ: ${finalType}`);
    Logger.log(`Response field: ${finalResponseField}`);
    Logger.log(`Country code: ${finalCountryCode}`);

    // Zpoždění pro rate limiting - pouze pokud není test
    if (SALESKIT_REQUEST_DELAY_MS > 0) {
      Utilities.sleep(SALESKIT_REQUEST_DELAY_MS);
    }

    let companyData;
    if (['ico', 'dic', 'person', 'jednatel'].includes(finalType)) {
      Logger.log('Přímé volání /company/');
      const params = buildCompanyParams(finalType, hodnota, finalCountryCode, {});
      Logger.log(`Parametry: ${JSON.stringify(params)}`);
      companyData = callSalesKitAPI(apiKey, '/company/', params);
      Logger.log(`Získaná data: ${companyData ? 'ANO' : 'NE (null)'}`);
    } else {
      Logger.log('Volání přes /search/');
      const searchParams = buildSearchParams(finalType, hodnota, finalCountryCode, {});
      Logger.log(`Search parametry: ${JSON.stringify(searchParams)}`);
      const searchData = callSalesKitAPI(apiKey, '/search/', searchParams);
      const first = pickFirstCompany(searchData);
      if (!first) {
        Logger.log('Firma nebyla nalezena ve výsledcích vyhledávání');
        return 'CHYBA: Firma nebyla nalezena.';
      }
      const followRegno = first.regno || first.ico || first.ic || null;
      const followVatno = first.vatno || first.dic || null;
      if (followRegno || followVatno) {
        const params = buildCompanyParams(followRegno ? 'ico' : 'dic', followRegno || followVatno, finalCountryCode, {});
        companyData = callSalesKitAPI(apiKey, '/company/', params);
      } else {
        companyData = first;
      }
    }

    if (!companyData) {
      Logger.log('companyData je null - firma nebyla nalezena');
      return 'CHYBA: Firma nebyla nalezena (API vrátilo prázdnou odpověď).';
    }

    const result = formatSalesKitResponse(companyData, finalResponseField);
    Logger.log(`Výsledek: ${result}`);
    return result;
  } catch (error) {
    const errorMsg = `Neočekávaná chyba: ${error.message}`;
    Logger.log(`CHYBA: ${errorMsg}`);
    Logger.log(`Stack: ${error.stack}`);
    logSalesKitError(errorMsg, typ_dotazu, hodnota);
    return `CHYBA: ${errorMsg}`;
  }
}

// =================== VALIDACE PARAMETRŮ ===================

function validateSalesKitParameters(typ_dotazu, hodnota, response_field, country_code, options_json) {
  if (!typ_dotazu || String(typ_dotazu).trim() === '') {
    return { valid: false, error: 'typ_dotazu je povinný.' };
  }

  if (hodnota === undefined || hodnota === null || String(hodnota).trim() === '') {
    return { valid: false, error: 'hodnota je povinná.' };
  }

  const normalized = normalizeSalesKitType(typ_dotazu);
  const allowed = ['ico', 'dic', 'name', 'email', 'address', 'person', 'jednatel'];
  if (!allowed.includes(normalized)) {
    return { valid: false, error: `Neplatný typ_dotazu. Povolené: ${allowed.join(', ')}` };
  }

  if (country_code && !['cz', 'sk'].includes(String(country_code).toLowerCase().trim())) {
    return { valid: false, error: 'country_code musí být "cz" nebo "sk".' };
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

function normalizeSalesKitType(value) {
  const raw = String(value).toLowerCase().trim();
  if (raw === 'ičo') return 'ico';
  if (raw === 'dič') return 'dic';
  if (raw === 'název') return 'name';
  if (raw === 'e-mail') return 'email';
  if (raw === 'adresa') return 'address';
  if (raw === 'jednatel') return 'jednatel';
  return raw;
}

// =================== API KLÍČ MANAGEMENT ===================

function getSalesKitApiKey(password) {
  const properties = PropertiesService.getScriptProperties();
  const storedKey = properties.getProperty('SALESKIT_API_KEY');
  if (!storedKey) {
    return null;
  }
  return storedKey;
}

function setSalesKitApiKey(password, apiKey) {
  if (password !== SALESKIT_CONFIG_PASSWORD) {
    throw new Error('Neplatné heslo.');
  }

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API klíč nemůže být prázdný.');
  }

  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('SALESKIT_API_KEY', apiKey.trim());
  return 'SalesKit API klíč byl úspěšně nastaven.';
}

// =================== API VOLÁNÍ ===================

function callSalesKitAPI(apiKey, path, params) {
  const query = buildQueryString(params || {});
  const url = `${SALESKIT_API_BASE_URL}${path}${query ? `?${query}` : ''}`;

  Logger.log(`API URL: ${url}`);
  Logger.log(`API Headers: Authorization: Token ${apiKey.substring(0, 10)}...`);

  const options = {
    method: 'get',
    headers: {
      'Authorization': `Token ${apiKey}`
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  Logger.log(`API Response Code: ${responseCode}`);
  Logger.log(`API Response Length: ${responseText.length} znaků`);
  if (responseText.length > 0 && responseText.length < 500) {
    Logger.log(`API Response Body: ${responseText}`);
  }

  if (responseCode === 200) {
    Logger.log('API vrátilo úspěšnou odpověď (200)');
    const parsed = JSON.parse(responseText);
    
    // Merk API vrací POLE (array) s jedním prvkem, ne objekt!
    // Např: [{"regno":28159128,"name":"4shop s.r.o.",...}]
    if (Array.isArray(parsed)) {
      Logger.log(`API vrátilo pole s ${parsed.length} prvky - bereme první`);
      if (parsed.length === 0) {
        return null;
      }
      return parsed[0];
    }
    
    return parsed;
  }

  if (responseCode === 204) {
    Logger.log('API vrátilo 204 - firma nenalezena');
    return null;
  }

  if (responseCode === 401) {
    Logger.log('API vrátilo 401 - neplatný API klíč');
    logSalesKitError('Neplatný API klíč', path, JSON.stringify(params));
    throw new Error('Neplatný API klíč (401). Zkontrolujte nastavení.');
  }

  if (responseCode === 403) {
    Logger.log('API vrátilo 403 - přístup odepřen');
    logSalesKitError('Přístup odepřen (403)', path, JSON.stringify(params));
    throw new Error('Přístup odepřen (403). Expirovaný účet nebo vyčerpaný limit.');
  }

  if (responseCode === 429) {
    Logger.log('API vrátilo 429 - rate limit');
    logSalesKitError('Překročena kvóta API', path, JSON.stringify(params));
    throw new Error('Překročena kvóta API (429). Zkuste to později.');
  }

  let apiError = responseText;
  try {
    const errorData = JSON.parse(responseText);
    apiError = errorData.error?.message || errorData.message || responseText;
  } catch (error) {
    // keep raw response
  }

  Logger.log(`API vrátilo chybu: ${responseCode} - ${apiError.substring(0, 200)}`);
  logSalesKitError(`HTTP ${responseCode}: ${apiError}`, path, JSON.stringify(params));
  throw new Error(`API chyba ${responseCode}: ${apiError}`);
}

function buildCompanyParams(type, value, countryCode, options) {
  const params = Object.assign({}, options || {});
  params.country_code = params.country_code || countryCode;
  
  const cleanValue = String(value).trim();
  
  if (type === 'dic') {
    // DIČ musí být ve formátu CZ12345678 nebo SK12345678
    if (/^\d+$/.test(cleanValue)) {
      // Jen čísla - přidáme prefix země
      params.vatno = countryCode.toUpperCase() + cleanValue;
    } else {
      params.vatno = cleanValue;
    }
  } else {
    // IČO - odstraníme leading zeros pokud jsou
    params.regno = cleanValue;
  }
  
  Logger.log(`buildCompanyParams: type=${type}, value=${cleanValue}, params=${JSON.stringify(params)}`);
  return params;
}

function buildSearchParams(type, value, countryCode, options) {
  const params = Object.assign({}, options || {});
  params.country_code = params.country_code || countryCode;

  if (type === 'name') {
    params.name = String(value).trim();
  } else if (type === 'email') {
    params.email = String(value).trim();
  } else if (type === 'address') {
    params.address = String(value).trim();
  } else {
    params.query = String(value).trim();
  }

  return params;
}

function buildQueryString(params) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

function parseSalesKitOptions(options_json) {
  if (!options_json || String(options_json).trim() === '') {
    return {};
  }
  try {
    return JSON.parse(String(options_json));
  } catch (error) {
    return {};
  }
}

// =================== RESPONSE PARSING ===================

function formatSalesKitResponse(data, responseField) {
  if (!data) {
    return 'CHYBA: Firma nebyla nalezena.';
  }

  Logger.log(`formatSalesKitResponse: responseField=${responseField}`);
  Logger.log(`formatSalesKitResponse: data keys=${Object.keys(data).join(', ')}`);

  if (responseField === 'summary') {
    return buildSalesKitSummary(data);
  }

  // Speciální zkratky pro vnořené objekty
  const fieldAliases = {
    'turnover_text': 'turnover.text',
    'turnover_id': 'turnover.id',
    'magnitude_text': 'magnitude.text',
    'magnitude_id': 'magnitude.id',
    'industry_text': 'industry.text',
    'industry_code': 'industry.code',
    'legal_form_text': 'legal_form.text',
    'address_city': 'address.city',
    'address_street': 'address.street',
    'address_zip': 'address.zip',
    'company_index_text': 'company_index.text',
    'profit_text': 'profit.text',
    'ebidta_text': 'ebidta.text',
    'status_text': 'status.text',
  };

  const resolvedField = fieldAliases[responseField] || responseField;
  const fieldValue = getSalesKitFieldByPath(data, resolvedField);
  
  // Pokud je výsledek objekt s polem "text", vrátíme text
  if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
    if (fieldValue.text) return String(fieldValue.text);
    if (fieldValue.name) return String(fieldValue.name);
  }
  
  return stringifySalesKitField(fieldValue);
}

function buildSalesKitSummary(data) {
  const name = data.name || '';
  const regno = data.regno || data.regno_str || '';
  const vatno = data.vatno || '';
  
  // turnover a magnitude jsou objekty s polem "text"
  const turnover = (data.turnover && data.turnover.text) || '';
  const city = (data.address && data.address.city) || '';
  const email = pickFirstContact(data.emails);

  const parts = [name, regno, vatno, email, turnover, city].filter(Boolean);
  return parts.join(' | ');
}

function pickFirstCompany(searchData) {
  if (!searchData) {
    return null;
  }

  if (Array.isArray(searchData) && searchData.length > 0) {
    return searchData[0];
  }

  if (Array.isArray(searchData.results) && searchData.results.length > 0) {
    return searchData.results[0];
  }

  if (Array.isArray(searchData.data) && searchData.data.length > 0) {
    return searchData.data[0];
  }

  if (searchData.data && typeof searchData.data === 'object') {
    return searchData.data;
  }

  return null;
}

function getSalesKitFieldByPath(obj, path) {
  if (!obj || !path) {
    return undefined;
  }
  const parts = String(path).split('.').map((part) => part.trim()).filter(Boolean);
  return parts.reduce((current, part) => (current ? current[part] : undefined), obj);
}

function stringifySalesKitField(value) {
  if (value === undefined || value === null) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function pickFirstContact(value) {
  if (!value) {
    return '';
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    const first = value[0];
    if (first && typeof first === 'object') {
      // Merk API vrací EmailScored objekty s polem "email" nebo PhoneScored s "phone"
      return first.email || first.phone || first.value || first.text || JSON.stringify(first);
    }
    return String(first);
  }
  if (typeof value === 'object') {
    return value.email || value.phone || value.value || value.text || JSON.stringify(value);
  }
  return String(value);
}

// =================== LOGOVÁNÍ ===================

function logSalesKitError(errorMessage, context, value) {
  if (!SALESKIT_ENABLE_LOGGING) {
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(SALESKIT_LOG_SHEET_NAME);

    if (!logSheet) {
      logSheet = ss.insertSheet(SALESKIT_LOG_SHEET_NAME);
      logSheet.appendRow(['Timestamp', 'Chyba', 'Context', 'Value', 'Uživatel']);
      logSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }

    const timestamp = new Date();
    const user = Session.getActiveUser().getEmail();
    logSheet.appendRow([timestamp, errorMessage, context || 'N/A', value || 'N/A', user]);

    if (logSheet.getLastRow() > 1001) {
      logSheet.deleteRows(2, logSheet.getLastRow() - 1001);
    }
  } catch (error) {
    Logger.log(`Chyba při logování SalesKit: ${error.message}`);
  }
}

// =================== UI FUNKCE ===================

function addSalesKitMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('SalesKit')
    .addItem('Nastavit API klíč', 'showSetSalesKitApiKeyDialog')
    .addSeparator()
    .addItem('Zobrazit log', 'showSalesKitLog')
    .addItem('Vymazat log', 'clearSalesKitLog')
    .addSeparator()
    .addItem('Nápověda', 'showSalesKitHelp')
    .addToUi();
}

function showSetSalesKitApiKeyDialog() {
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
        <h2>Nastavení SalesKit API klíče</h2>
        <p>Zadejte konfigurační heslo a váš SalesKit (Merk) API klíč:</p>

        <label for="password">Heslo:</label>
        <input type="password" id="password" placeholder="Vaše konfigurační heslo">

        <label for="apiKey">API klíč:</label>
        <input type="password" id="apiKey" placeholder="Token ...">

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
              .setSalesKitApiKey(password, apiKey);
          }
        </script>
      </body>
    </html>
  `)
    .setWidth(420)
    .setHeight(320);

  SpreadsheetApp.getUi().showModalDialog(html, 'Nastavení SalesKit API klíče');
}

function showSalesKitLog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SALESKIT_LOG_SHEET_NAME);
  if (!logSheet) {
    SpreadsheetApp.getUi().alert('Log neexistuje. Zatím nedošlo k žádným chybám.');
    return;
  }
  ss.setActiveSheet(logSheet);
}

function clearSalesKitLog() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Vymazat log',
    'Opravdu chcete vymazat všechny záznamy v SalesKit logu?',
    ui.ButtonSet.YES_NO
  );
  if (response === ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(SALESKIT_LOG_SHEET_NAME);
    if (logSheet) {
      ss.deleteSheet(logSheet);
      ui.alert('Log byl úspěšně vymazán.');
    } else {
      ui.alert('Log neexistuje.');
    }
  }
}

function showSalesKitHelp() {
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
        <h2>Nápověda - SalesKit (Merk) API</h2>

        <h3>Syntaxe funkce:</h3>
        <code>=saleskit(typ_dotazu, hodnota, [response_field], [country_code], [password], [options_json])</code>

        <h3>Parametry:</h3>
        <table>
          <tr>
            <th>Parametr</th>
            <th>Popis</th>
            <th>Výchozí</th>
          </tr>
          <tr>
            <td>typ_dotazu</td>
            <td>ico/ičo, dic/dič, name/název, email, address/adresa</td>
            <td>ico</td>
          </tr>
          <tr>
            <td>hodnota</td>
            <td>Hodnota pro vyhledání (IČO/DIČ/název/email)</td>
            <td>-</td>
          </tr>
          <tr>
            <td>response_field</td>
            <td>Pole z odpovědi (např. name, vatno, turnover)</td>
            <td>summary</td>
          </tr>
          <tr>
            <td>country_code</td>
            <td>cz nebo sk</td>
            <td>cz</td>
          </tr>
          <tr>
            <td>options_json</td>
            <td>Pokročilé parametry jako JSON string</td>
            <td>-</td>
          </tr>
        </table>

        <h3>Příklady:</h3>
        <div class="example">
          <code>=saleskit("ičo"; "12345678"; "name")</code>
        </div>
        <div class="example">
          <code>=saleskit("name"; "Acme s.r.o."; "regno")</code>
        </div>
      </body>
    </html>
  `)
    .setWidth(700)
    .setHeight(600);

  SpreadsheetApp.getUi().showModalDialog(html, 'SalesKit - Nápověda');
}

// =================== TESTOVACÍ FUNKCE ===================

/**
 * DIAGNOSTICKÁ FUNKCE - spusťte z Apps Script editoru
 * Simuluje přesně to, co dělá =saleskit("ičo", "28159128", "name", "cz") v buňce
 */
function diagnostikaSalesKit() {
  Logger.log('========================================');
  Logger.log('DIAGNOSTIKA SALESKIT');
  Logger.log('========================================');
  Logger.log('');
  
  // 1) Test API klíče
  Logger.log('--- KROK 1: API KLÍČ ---');
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('SALESKIT_API_KEY');
  if (!apiKey) {
    Logger.log('❌ API klíč NENÍ nastaven v PropertiesService!');
    Logger.log('Řešení: Spusťte funkci nastavSalesKitKlic() nebo použijte menu.');
    return;
  }
  Logger.log(`✅ API klíč nalezen: ${apiKey.substring(0, 10)}...`);
  Logger.log('');
  
  // 2) Simulace volání saleskit("ičo", "28159128", "name", "cz")
  Logger.log('--- KROK 2: SIMULACE VOLÁNÍ Z BUŇKY ---');
  Logger.log('Simuluji: =saleskit("ičo", "28159128", "name", "cz")');
  Logger.log('');
  
  const result = saleskit("ičo", "28159128", "name", "cz");
  Logger.log(`Výsledek funkce saleskit(): "${result}"`);
  Logger.log(`Typ výsledku: ${typeof result}`);
  Logger.log(`Délka výsledku: ${result ? String(result).length : 0}`);
  Logger.log('');
  
  // 3) Přímé volání API bez saleskit() funkce
  Logger.log('--- KROK 3: PŘÍMÉ VOLÁNÍ API ---');
  const url = `https://api.merk.cz/company/?regno=28159128&country_code=cz`;
  Logger.log(`URL: ${url}`);
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    const body = response.getContentText();
    const headers = response.getHeaders();
    
    Logger.log(`HTTP kód: ${code}`);
    Logger.log(`Content-Type: ${headers['Content-Type'] || 'N/A'}`);
    Logger.log(`Délka odpovědi: ${body.length} znaků`);
    Logger.log('');
    
    if (code === 200 && body) {
      Logger.log('✅ API FUNGUJE!');
      Logger.log('');
      
      try {
        const data = JSON.parse(body);
        Logger.log(`Název firmy: ${data.name || 'N/A'}`);
        Logger.log(`IČO: ${data.regno || 'N/A'}`);
        Logger.log(`DIČ: ${data.vatno || 'N/A'}`);
        Logger.log('');
        Logger.log('--- KOMPLETNÍ JSON (prvních 2000 znaků) ---');
        Logger.log(JSON.stringify(data, null, 2).substring(0, 2000));
      } catch (e) {
        Logger.log('Odpověď není JSON:');
        Logger.log(body.substring(0, 500));
      }
    } else if (code === 204) {
      Logger.log('❌ HTTP 204 - Firma nenalezena');
      Logger.log('API vrátilo prázdnou odpověď - IČO nebylo nalezeno v databázi.');
      Logger.log('');
      Logger.log('Zkusím jiné IČO (00006458 = ČEZ)...');
      
      // Zkusíme jiné IČO
      const url2 = `https://api.merk.cz/company/?regno=00006458&country_code=cz`;
      const response2 = UrlFetchApp.fetch(url2, {
        method: 'get',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        },
        muteHttpExceptions: true
      });
      
      const code2 = response2.getResponseCode();
      const body2 = response2.getContentText();
      Logger.log(`HTTP kód pro ČEZ: ${code2}`);
      Logger.log(`Délka odpovědi: ${body2.length} znaků`);
      
      if (code2 === 200 && body2) {
        Logger.log('✅ ČEZ nalezen! API funguje, problém je s IČO 28159128.');
        const data2 = JSON.parse(body2);
        Logger.log(`Název: ${data2.name || 'N/A'}`);
      } else if (code2 === 204) {
        Logger.log('❌ Ani ČEZ nenalezen. Problém je v API endpointu nebo klíči.');
        Logger.log('');
        Logger.log('Zkouším alternativní URL formáty...');
        
        // Zkusíme alternativní formáty
        const alternativeUrls = [
          `https://api.merk.cz/company/28159128/`,
          `https://api.merk.cz/company/28159128/?country_code=cz`,
          `https://api.merk.cz/search/?query=28159128&country_code=cz`,
          `https://api.merk.cz/company/?ico=28159128&country_code=cz`,
        ];
        
        for (const altUrl of alternativeUrls) {
          Logger.log(`Zkouším: ${altUrl}`);
          const altResponse = UrlFetchApp.fetch(altUrl, {
            method: 'get',
            headers: { 'Authorization': `Token ${apiKey}` },
            muteHttpExceptions: true
          });
          const altCode = altResponse.getResponseCode();
          const altBody = altResponse.getContentText();
          Logger.log(`  → HTTP ${altCode}, délka: ${altBody.length}`);
          if (altCode === 200 && altBody.length > 0) {
            Logger.log(`  ✅ TATO URL FUNGUJE!`);
            Logger.log(`  Odpověď: ${altBody.substring(0, 300)}`);
            break;
          }
          Utilities.sleep(300);
        }
      }
    } else {
      Logger.log(`❌ HTTP ${code}`);
      Logger.log(`Odpověď: ${body.substring(0, 500)}`);
    }
    
  } catch (error) {
    Logger.log(`❌ Výjimka: ${error.message}`);
    Logger.log(`Stack: ${error.stack}`);
  }
  
  Logger.log('');
  Logger.log('========================================');
  Logger.log('KONEC DIAGNOSTIKY');
  Logger.log('========================================');
}

/**
 * Pomocná funkce pro rychlé nastavení API klíče
 * Odkomentujte a vyplňte svůj klíč, pak spusťte
 */
function nastavSalesKitKlic() {
  const properties = PropertiesService.getScriptProperties();
  // Odkomentujte a vyplňte svůj API klíč:
  // properties.setProperty('SALESKIT_API_KEY', 'VÁŠ_API_KLÍČ_ZDE');
  
  const key = properties.getProperty('SALESKIT_API_KEY');
  if (key) {
    Logger.log(`✅ API klíč je nastaven: ${key.substring(0, 10)}...`);
  } else {
    Logger.log('❌ API klíč NENÍ nastaven. Odkomentujte řádek výše a vyplňte klíč.');
  }
}

/**
 * Test různých variant API endpointů a parametrů
 */
function testMerkAPIVariants() {
  Logger.log('========================================');
  Logger.log('MERK API - TEST VÍCE VARIANT');
  Logger.log('========================================');
  Logger.log('');
  
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('SALESKIT_API_KEY');
  
  if (!apiKey) {
    Logger.log('❌ API klíč není nastaven!');
    return;
  }
  
  Logger.log(`✅ API klíč: ${apiKey.substring(0, 10)}...`);
  Logger.log('');
  
  const ico = '28159128';
  const countryCode = 'cz';
  
  // Varianty URL a parametrů k otestování
  const variants = [
    {
      name: 'Variant 1: /company/ s regno',
      url: `https://api.merk.cz/company/?regno=${ico}&country_code=${countryCode}`,
      headers: { 'Authorization': `Token ${apiKey}` }
    },
    {
      name: 'Variant 2: /company/ s ico',
      url: `https://api.merk.cz/company/?ico=${ico}&country_code=${countryCode}`,
      headers: { 'Authorization': `Token ${apiKey}` }
    },
    {
      name: 'Variant 3: /company/ s ic',
      url: `https://api.merk.cz/company/?ic=${ico}&country_code=${countryCode}`,
      headers: { 'Authorization': `Token ${apiKey}` }
    },
    {
      name: 'Variant 4: /company/{ico}/',
      url: `https://api.merk.cz/company/${ico}/`,
      headers: { 'Authorization': `Token ${apiKey}` }
    },
    {
      name: 'Variant 5: /company/{ico}/?country_code=cz',
      url: `https://api.merk.cz/company/${ico}/?country_code=${countryCode}`,
      headers: { 'Authorization': `Token ${apiKey}` }
    },
    {
      name: 'Variant 6: /search/ s regno',
      url: `https://api.merk.cz/search/?regno=${ico}&country_code=${countryCode}`,
      headers: { 'Authorization': `Token ${apiKey}` }
    },
    {
      name: 'Variant 7: /search/ s query',
      url: `https://api.merk.cz/search/?query=${ico}&country_code=${countryCode}`,
      headers: { 'Authorization': `Token ${apiKey}` }
    },
    {
      name: 'Variant 8: Bearer token',
      url: `https://api.merk.cz/company/?regno=${ico}&country_code=${countryCode}`,
      headers: { 'Authorization': `Bearer ${apiKey}` }
    },
    {
      name: 'Variant 9: X-API-Key header',
      url: `https://api.merk.cz/company/?regno=${ico}&country_code=${countryCode}`,
      headers: { 'X-API-Key': apiKey }
    },
    {
      name: 'Variant 10: api.merk.cz/v1/company/',
      url: `https://api.merk.cz/v1/company/?regno=${ico}&country_code=${countryCode}`,
      headers: { 'Authorization': `Token ${apiKey}` }
    }
  ];
  
  let found = false;
  
  for (const variant of variants) {
    Logger.log(`--- ${variant.name} ---`);
    Logger.log(`URL: ${variant.url}`);
    
    try {
      const response = UrlFetchApp.fetch(variant.url, {
        method: 'get',
        headers: variant.headers,
        muteHttpExceptions: true
      });
      
      const code = response.getResponseCode();
      const body = response.getContentText();
      
      Logger.log(`HTTP: ${code}`);
      
      if (code === 200 && body) {
        Logger.log('✅ ÚSPĚCH! Tato varianta funguje!');
        Logger.log(`Odpověď (prvních 500 znaků): ${body.substring(0, 500)}`);
        found = true;
        
        // Zkusíme parsovat
        try {
          const data = JSON.parse(body);
          Logger.log('');
          Logger.log('--- PARSOVANÁ DATA ---');
          Logger.log(`Název: ${data.name || data.data?.name || 'N/A'}`);
          Logger.log(`IČO: ${data.regno || data.ico || data.data?.regno || 'N/A'}`);
        } catch (e) {
          Logger.log('(Nelze parsovat jako JSON)');
        }
        
        break;
      } else if (code === 204) {
        Logger.log('❌ 204 - Firma nenalezena');
      } else if (code === 401) {
        Logger.log('❌ 401 - Neplatný API klíč nebo špatný formát autorizace');
      } else if (code === 404) {
        Logger.log('❌ 404 - Endpoint neexistuje');
      } else {
        Logger.log(`Odpověď: ${body.substring(0, 200)}`);
      }
      
    } catch (e) {
      Logger.log(`❌ Chyba: ${e.message}`);
    }
    
    Logger.log('');
    
    // Pauza mezi požadavky
    Utilities.sleep(500);
  }
  
  if (!found) {
    Logger.log('========================================');
    Logger.log('❌ ŽÁDNÁ VARIANTA NEFUNGOVALA');
    Logger.log('');
    Logger.log('Doporučení:');
    Logger.log('1. Zkontrolujte dokumentaci na https://api.merk.cz/docs/');
    Logger.log('2. Ověřte, zda je API klíč aktivní');
    Logger.log('3. Zkontrolujte, zda máte správná oprávnění');
    Logger.log('4. Zkuste jiný IČO (např. 00006458 pro ČEZ)');
    Logger.log('========================================');
  }
}

function testSalesKitAPI() {
  Logger.log('========================================');
  Logger.log('SALESKIT (MERK) API - TEST');
  Logger.log('========================================');
  Logger.log('');
  
  const testIco = '28159128';
  const testCountry = 'cz';
  
  // 1) Kontrola API klíče
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('SALESKIT_API_KEY');
  
  if (!apiKey) {
    Logger.log('❌ CHYBA: API klíč není nastaven!');
    Logger.log('Řešení: Spusťte funkci nastavSalesKitKlic()');
    Logger.log('========================================');
    return;
  }
  Logger.log(`✅ API klíč: ${apiKey.substring(0, 10)}...`);
  Logger.log('');
  
  // 2) Kontrola vstupů
  Logger.log('--- VSTUPY ---');
  Logger.log(`IČO: ${testIco}`);
  Logger.log(`Země: ${testCountry}`);
  Logger.log('');
  
  // 3) Sestavení URL
  const url = `${SALESKIT_API_BASE_URL}/company/?regno=${encodeURIComponent(testIco)}&country_code=${encodeURIComponent(testCountry)}`;
  Logger.log('--- URL POŽADAVEK ---');
  Logger.log(url);
  Logger.log('');
  
  // 4) Volání API
  Logger.log('--- VOLÁNÍ API ---');
  try {
    const startTime = new Date().getTime();
    
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    
    const code = response.getResponseCode();
    const body = response.getContentText();
    
    Logger.log(`HTTP kód: ${code}`);
    Logger.log(`Doba trvání: ${duration} ms`);
    Logger.log('');
    
    // 5) Analýza odpovědi
    Logger.log('--- ODPOVĚĎ ---');
    
    if (code === 200) {
      Logger.log('✅ ÚSPĚCH - API vrátilo data');
      Logger.log('');
      
      try {
        const data = JSON.parse(body);
        
        // Výpis základních polí
        Logger.log('--- NALEZENÁ DATA ---');
        Logger.log(`Název: ${data.name || 'N/A'}`);
        Logger.log(`IČO: ${data.regno || 'N/A'}`);
        Logger.log(`DIČ: ${data.vatno || 'N/A'}`);
        Logger.log(`Právní forma: ${data.legal_form || 'N/A'}`);
        Logger.log(`Datum založení: ${data.estab_date || 'N/A'}`);
        Logger.log('');
        
        // Adresa
        if (data.address) {
          Logger.log('--- ADRESA ---');
          Logger.log(`Ulice: ${data.address.street || 'N/A'}`);
          Logger.log(`Město: ${data.address.city || 'N/A'}`);
          Logger.log(`PSČ: ${data.address.zip || 'N/A'}`);
          Logger.log(`Země: ${data.address.country || 'N/A'}`);
          Logger.log('');
        }
        
        // Kontakty
        Logger.log('--- KONTAKTY ---');
        Logger.log(`E-maily: ${stringifySalesKitField(data.emails) || 'N/A'}`);
        Logger.log(`Telefony: ${stringifySalesKitField(data.phones) || 'N/A'}`);
        Logger.log(`Mobily: ${stringifySalesKitField(data.mobiles) || 'N/A'}`);
        Logger.log(`Weby: ${stringifySalesKitField(data.webs) || 'N/A'}`);
        Logger.log('');
        
        // Ekonomika
        Logger.log('--- EKONOMIKA ---');
        Logger.log(`Obrat: ${data.turnover || 'N/A'}`);
        Logger.log(`EBITDA: ${data.ebitda || 'N/A'}`);
        Logger.log(`EBIT: ${data.ebit || 'N/A'}`);
        Logger.log(`Rating: ${data.company_index || 'N/A'}`);
        Logger.log('');
        
        // Jednatelé
        if (data.body && Array.isArray(data.body)) {
          Logger.log('--- JEDNATELÉ / ORGÁNY ---');
          data.body.forEach((person, index) => {
            Logger.log(`${index + 1}. ${person.name || person.full_name || 'N/A'}`);
            Logger.log(`   Funkce: ${person.function || person.role || 'N/A'}`);
            if (person.emails && person.emails.length > 0) {
              Logger.log(`   E-mail: ${stringifySalesKitField(person.emails)}`);
            }
          });
          Logger.log('');
        }
        
        // Kompletní JSON (zkráceně)
        Logger.log('--- KOMPLETNÍ JSON (prvních 1000 znaků) ---');
        Logger.log(body.substring(0, 1000));
        if (body.length > 1000) {
          Logger.log(`... (celkem ${body.length} znaků)`);
        }
        
      } catch (parseError) {
        Logger.log(`❌ Chyba při parsování JSON: ${parseError.message}`);
        Logger.log(`Raw odpověď: ${body.substring(0, 500)}`);
      }
      
    } else if (code === 204) {
      Logger.log('❌ FIRMA NENALEZENA');
      Logger.log('');
      Logger.log('Možné příčiny:');
      Logger.log('- IČO neexistuje');
      Logger.log('- Špatný formát IČO (musí být 8 číslic pro CZ)');
      Logger.log('- Špatný country_code (musí být "cz" nebo "sk")');
      
    } else if (code === 401) {
      Logger.log('❌ NEPLATNÝ API KLÍČ');
      Logger.log('');
      Logger.log('Řešení:');
      Logger.log('- Zkontrolujte API klíč v Merk dashboardu');
      Logger.log('- Vygenerujte nový klíč na https://api.merk.cz');
      
    } else if (code === 403) {
      Logger.log('❌ PŘÍSTUP ODMÍTNUT');
      Logger.log('');
      Logger.log('Možné příčiny:');
      Logger.log('- Expirovaný účet');
      Logger.log('- Vyčerpaný limit API volání');
      Logger.log('- Nedostatečná oprávnění');
      
    } else if (code === 404) {
      Logger.log('❌ ENDPOINT NEEXISTUJE');
      Logger.log('');
      Logger.log('Možné příčiny:');
      Logger.log('- Špatná URL adresa API');
      Logger.log('- Zkontrolujte dokumentaci: https://api.merk.cz/docs/');
      
    } else if (code === 429) {
      Logger.log('❌ RATE LIMIT PŘEKROČEN');
      Logger.log('');
      Logger.log('Řešení:');
      Logger.log('- Počkejte několik sekund');
      Logger.log('- Snižte frekvenci volání');
      
    } else {
      Logger.log(`❌ NEOČEKÁVANÝ HTTP KÓD: ${code}`);
      Logger.log('');
      Logger.log('Odpověď serveru:');
      Logger.log(body.substring(0, 500));
    }
    
  } catch (error) {
    Logger.log('');
    Logger.log('❌ VÝJIMKA PŘI VOLÁNÍ API');
    Logger.log(`Chyba: ${error.message}`);
    Logger.log(`Stack: ${error.stack}`);
  }
  
  Logger.log('');
  Logger.log('========================================');
  Logger.log('KONEC TESTU');
  Logger.log('========================================');
}


/**
 * Vypíše kompletní JSON odpověď z Merk API pro dané IČO
 * 
 * @param {string} ico - IČO firmy (8 číslic pro CZ, 8 číslic pro SK)
 * @param {string} countryCode - 'cz' nebo 'sk' (default: 'cz')
 * @return {string} Kompletní JSON odpověď nebo chybová hláška
 * @customfunction
 */
function getMerkRawJSON(ico, countryCode) {
  // Získání API klíče
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('SALESKIT_API_KEY');
  
  if (!apiKey) {
    return 'CHYBA: API klíč není nastaven. Spusťte SalesKit → Nastavit API klíč';
  }
  
  // Validace IČO
  if (!ico || String(ico).trim() === '') {
    return 'CHYBA: IČO je povinné';
  }
  
  const cleanIco = String(ico).trim();
  const country = (countryCode && String(countryCode).trim().toLowerCase()) || 'cz';
  
  // Sestavení URL
  const url = `https://api.merk.cz/company/?regno=${encodeURIComponent(cleanIco)}&country_code=${encodeURIComponent(country)}`;
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    const body = response.getContentText();
    
    if (code === 200 && body) {
      // Formátovaný JSON s odsazením
      const data = JSON.parse(body);
      return JSON.stringify(data, null, 2);
    } else if (code === 204) {
      return `CHYBA: Firma s IČO ${cleanIco} nebyla nalezena (HTTP 204)`;
    } else if (code === 401) {
      return 'CHYBA: Neplatný API klíč (HTTP 401)';
    } else if (code === 403) {
      return 'CHYBA: Přístup odepřen - zkontrolujte oprávnění (HTTP 403)';
    } else if (code === 404) {
      return 'CHYBA: API endpoint neexistuje (HTTP 404)';
    } else if (code === 429) {
      return 'CHYBA: Rate limit překročen - zkuste později (HTTP 429)';
    } else {
      return `CHYBA: HTTP ${code} - ${body.substring(0, 200)}`;
    }
    
  } catch (error) {
    return `CHYBA: ${error.message}`;
  }
}

/**
 * Vypíše seznam všech dostupných polí v JSON odpovědi
 * 
 * @param {string} ico - IČO firmy
 * @param {string} countryCode - 'cz' nebo 'sk' (default: 'cz')
 * @return {string} Seznam polí nebo chybová hláška
 * @customfunction
 */
function getMerkFields(ico, countryCode) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('SALESKIT_API_KEY');
  
  if (!apiKey) {
    return 'CHYBA: API klíč není nastaven';
  }
  
  const cleanIco = String(ico).trim();
  const country = (countryCode && String(countryCode).trim().toLowerCase()) || 'cz';
  const url = `https://api.merk.cz/company/?regno=${encodeURIComponent(cleanIco)}&country_code=${encodeURIComponent(country)}`;
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    const code = response.getResponseCode();
    const body = response.getContentText();
    
    if (code === 200 && body) {
      const data = JSON.parse(body);
      const fields = listAllFields(data, '');
      return fields.join('\n');
    } else {
      return `CHYBA: HTTP ${code}`;
    }
    
  } catch (error) {
    return `CHYBA: ${error.message}`;
  }
}

/**
 * Rekurzivně vypíše všechny cesty k polím v objektu
 */
function listAllFields(obj, prefix) {
  const fields = [];
  
  if (!obj || typeof obj !== 'object') {
    return fields;
  }
  
  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (value === null) {
      fields.push(`${path}: null`);
    } else if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object') {
        fields.push(`${path}[] (array of objects)`);
        // Vypíšeme i pole z prvního prvku
        const subFields = listAllFields(value[0], `${path}[]`);
        fields.push(...subFields);
      } else {
        fields.push(`${path}: [${typeof (value[0])}]`);
      }
    } else if (typeof value === 'object') {
      fields.push(`${path}: (object)`);
      const subFields = listAllFields(value, path);
      fields.push(...subFields);
    } else {
      fields.push(`${path}: ${typeof value}`);
    }
  }
  
  return fields;
}
