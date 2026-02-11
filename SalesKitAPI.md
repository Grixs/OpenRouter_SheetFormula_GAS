# SalesKit (Merk) API – Kompletní dokumentace pro Google Sheets

## 📋 Co je SalesKit / Merk API?

SalesKit využívá **Merk API** (api.merk.cz) – nejkomplexnější databázi firem v ČR a SR. Podle IČO, DIČ nebo názvu firmy získáte přes **100 datových polí** včetně kontaktů, financí, jednatelů a dalších údajů.

---

## 🚀 Syntaxe funkce

```
=saleskit(typ_dotazu; hodnota; [response_field]; [country_code])
```

| Parametr | Popis | Povinný | Výchozí |
|---|---|---|---|
| `typ_dotazu` | Typ vyhledávání: `"ičo"`, `"dič"`, `"name"` | ✅ | – |
| `hodnota` | IČO, DIČ nebo název firmy | ✅ | – |
| `response_field` | Které pole vrátit (viz tabulka níže) | ❌ | `summary` |
| `country_code` | Země: `"cz"` nebo `"sk"` | ❌ | `cz` |

> **Poznámka:** V českém Google Sheets se parametry oddělují **středníkem** (`;`), v anglickém **čárkou** (`,`).

---

## 🎯 Praktické příklady pro obchodníka

### 1. Zjistit název firmy podle IČO
```
=saleskit("ičo"; "28159128"; "name")
→ 4shop s.r.o.
```

### 2. Zjistit DIČ firmy
```
=saleskit("ičo"; "28159128"; "vatno")
→ CZ28159128
```

### 3. Zjistit adresu firmy
```
=saleskit("ičo"; "28159128"; "address.municipality")
→ Tábor
```

### 4. Zjistit ulici a PSČ
```
=saleskit("ičo"; "28159128"; "address.street_fixed")
→ Kpt. Jaroše

=saleskit("ičo"; "28159128"; "address.postal_code")
→ 39003
```

### 5. Zjistit kompletní adresu (řádky)
```
=saleskit("ičo"; "28159128"; "address.lines")
→ Kpt. Jaroše 2385, 39003 Tábor
```

### 6. Zjistit obor podnikání
```
=saleskit("ičo"; "28159128"; "industry")
→ {"id":"J","text":"Informační a komunikační činnosti"}

=saleskit("ičo"; "28159128"; "industry_text")
→ Informační a komunikační činnosti
```

### 7. Zjistit obrat firmy
```
=saleskit("ičo"; "28159128"; "turnover")
→ {"id":"...","text":"1 500 000 000 Kč a více"}

=saleskit("ičo"; "28159128"; "turnover_text")
→ 1 500 000 000 Kč a více
```

### 8. Zjistit velikost firmy (počet zaměstnanců)
```
=saleskit("ičo"; "28159128"; "magnitude")
→ {"id":"...","text":"10 000 a více zam."}

=saleskit("ičo"; "28159128"; "magnitude_text")
→ 10 000 a více zam.
```

### 9. Zjistit zda je firma aktivní
```
=saleskit("ičo"; "28159128"; "is_active")
→ true
```

### 10. Zjistit datum založení
```
=saleskit("ičo"; "28159128"; "estab_date")
→ 2012-08-17T00:00:00
```

### 11. Zjistit e-maily firmy
```
=saleskit("ičo"; "28159128"; "emails")
→ info@firma.cz, obchod@firma.cz
```

### 12. Zjistit telefony
```
=saleskit("ičo"; "28159128"; "phones")
→ +420 123 456 789
```

### 13. Zjistit bankovní účty
```
=saleskit("ičo"; "28159128"; "bank_accounts")
→ [{"account_number":"2500294673","bank_code":"2010"}]
```

### 14. Zjistit zda je plátce DPH
```
=saleskit("ičo"; "28159128"; "is_vatpayer")
→ true
```

### 15. Zjistit nespolehlivého plátce DPH
```
=saleskit("ičo"; "28159128"; "is_unreliable_vatpayer")
→ false
```

### 16. Zjistit rating firmy
```
=saleskit("ičo"; "28159128"; "company_index")
→ {"id":"...","text":"A"}

=saleskit("ičo"; "28159128"; "company_index_text")
→ A
```

### 17. Zjistit zisk firmy
```
=saleskit("ičo"; "28159128"; "profit_text")
→ 5 000 000 Kč
```

### 18. Zjistit EBIDTA
```
=saleskit("ičo"; "28159128"; "ebidta_text")
→ 10 000 000 Kč
```

### 19. Zjistit datovou schránku
```
=saleskit("ičo"; "28159128"; "databox_ids")
→ a75jmvg
```

### 20. Zjistit region a kraj
```
=saleskit("ičo"; "28159128"; "address.region.text")
→ Jihočeský kraj

=saleskit("ičo"; "28159128"; "address.county.text")
→ Tábor
```

### 21. Kompletní souhrn (summary)
```
=saleskit("ičo"; "28159128")
→ 4shop s.r.o. | 28159128 | CZ28159128 | info@firma.cz | 1 500 000 Kč | Tábor
```

### 22. Vyhledání podle DIČ
```
=saleskit("dič"; "CZ28159128"; "name")
→ 4shop s.r.o.
```

### 23. Slovenská firma
```
=saleskit("ičo"; "35763469"; "name"; "sk")
→ Slovenská firma s.r.o.
```

---

## 📊 Kompletní seznam dostupných polí (response_field)

### Základní identifikace
| Pole | Popis | Typ |
|---|---|---|
| `name` | Název firmy | string |
| `regno` | IČO (číslo) | number |
| `regno_str` | IČO (string s leading zeros) | string |
| `vatno` | DIČ (CZ/SK prefix) | string |
| `taxno` | Daňové číslo | string |
| `databox_ids` | ID datových schránek | array |
| `salutation` | Oslovení firmy (vokativ) | string |
| `link` | Odkaz na Merk.cz | string |

### Stav firmy
| Pole | Popis | Typ |
|---|---|---|
| `is_active` | Je firma aktivní? | boolean |
| `estab_date` | Datum založení | datetime |
| `closing_date` | Datum zániku | datetime |
| `status` | Stav firmy (objekt) | object |
| `status_text` | Stav firmy (text) | string |
| `legal_form` | Právní forma (objekt) | object |
| `legal_form_text` | Právní forma (text) | string |

### Adresa
| Pole | Popis | Typ |
|---|---|---|
| `address.street_fixed` | Ulice | string |
| `address.number` | Číslo popisné | string |
| `address.municipality` | Město | string |
| `address.municipality_part` | Část města | string |
| `address.postal_code` | PSČ | string |
| `address.country_code` | Kód země | string |
| `address.region.text` | Kraj | string |
| `address.county.text` | Okres | string |
| `address.lines` | Kompletní adresa (řádky) | array |
| `gps.lat` | GPS šířka | number |
| `gps.lon` | GPS délka | number |

### Ekonomické údaje
| Pole | Popis | Typ |
|---|---|---|
| `turnover` | Obrat (objekt) | object |
| `turnover_text` | Obrat (text) | string |
| `magnitude` | Velikost firmy (objekt) | object |
| `magnitude_text` | Velikost firmy (text) | string |
| `profit` | Zisk (objekt) | object |
| `profit_text` | Zisk (text) | string |
| `ebidta` | EBIDTA (objekt) | object |
| `ebidta_text` | EBIDTA (text) | string |
| `company_index` | Rating firmy (objekt) | object |
| `company_index_text` | Rating firmy (text) | string |

### DPH a daně
| Pole | Popis | Typ |
|---|---|---|
| `is_vatpayer` | Plátce DPH? | boolean |
| `vat_registration_type` | Typ registrace DPH | boolean |
| `vat_registration_date` | Datum registrace DPH | datetime |
| `is_unreliable_vatpayer` | Nespolehlivý plátce? | boolean |
| `unreliable_vatpayer_since` | Od kdy nespolehlivý | datetime |
| `vzp_debt` | Dluh u VZP | decimal |

### Kontakty
| Pole | Popis | Typ |
|---|---|---|
| `emails` | E-maily (array) | array |
| `phones` | Telefony (array) | array |
| `mobiles` | Mobily (array) | array |
| `webs` | Webové stránky (array) | array |

### Osoby a orgány
| Pole | Popis | Typ |
|---|---|---|
| `body` | Osoby spojené s firmou | object |

### Obor podnikání
| Pole | Popis | Typ |
|---|---|---|
| `industry` | Hlavní obor NACE 2008 (objekt) | object |
| `industry_text` | Hlavní obor (text) | string |
| `industry_code` | Hlavní obor (kód) | string |
| `industry2025` | Hlavní obor NACE 2025 | object |
| `secondary_industries` | Vedlejší obory | array |
| `owning_type` | Typ vlastnictví | object |

### Další
| Pole | Popis | Typ |
|---|---|---|
| `bank_accounts` | Bankovní účty | array |
| `court` | Rejstříkový soud | object |
| `business_premises_count` | Počet provozoven | integer |
| `active_licenses_count` | Počet aktivních licencí | integer |

---

## 🔧 Nastavení

### 1. Nastavení API klíče
1. Zaregistrujte se na [merk.cz](https://merk.cz)
2. V dashboardu přejděte na **Connection (Napojení)**
3. Zkopírujte API klíč
4. V Google Sheets: **SalesKit → Nastavit API klíč**
5. Zadejte heslo a API klíč

### 2. Autorizace
API používá `Authorization: Token {api_key}` header.

### 3. Limity
- **60 požadavků za minutu** pro company endpoint
- **600 požadavků za minutu** pro search endpoint
- Funkce má vestavěné 2s zpoždění mezi voláními

---

## 💡 Tipy pro obchodníka

### Hromadné doplnění dat
Máte sloupec s IČO? Stačí přetáhnout vzorec:

| A (IČO) | B (Název) | C (Město) | D (Obor) |
|---|---|---|---|
| 28159128 | `=saleskit("ičo";A2;"name")` | `=saleskit("ičo";A2;"address.municipality")` | `=saleskit("ičo";A2;"industry_text")` |
| 25679629 | `=saleskit("ičo";A3;"name")` | `=saleskit("ičo";A3;"address.municipality")` | `=saleskit("ičo";A3;"industry_text")` |

### Ověření plátce DPH
```
=saleskit("ičo"; A2; "is_vatpayer")
```

### Kontrola nespolehlivého plátce
```
=IF(saleskit("ičo"; A2; "is_unreliable_vatpayer")="true"; "⚠️ NESPOLEHLIVÝ"; "✅ OK")
```

### Zjištění zda firma existuje
```
=IF(saleskit("ičo"; A2; "is_active")="true"; "Aktivní"; "Neaktivní/Neexistuje")
```

---

## ⚠️ Řešení problémů

| Problém | Příčina | Řešení |
|---|---|---|
| Prázdná hodnota | API klíč není nastaven | Menu SalesKit → Nastavit API klíč |
| `CHYBA: API klíč není nastaven` | Chybí API klíč | Nastavte klíč přes menu |
| `CHYBA: Neplatný API klíč (401)` | Špatný klíč | Zkontrolujte klíč v Merk dashboardu |
| `CHYBA: Přístup odepřen (403)` | Expirovaný účet | Obnovte předplatné na merk.cz |
| `CHYBA: Firma nebyla nalezena` | IČO neexistuje | Zkontrolujte IČO |
| Pomalé načítání | Rate limiting | Funkce má 2s delay, je to normální |

---

## 📝 Poznámky k API

- API vrací data jako **pole (array)** – funkce automaticky bere první prvek
- Pole jako `turnover`, `magnitude`, `industry` jsou **objekty** s podpoli `id` a `text`
- Pro získání textové hodnoty použijte alias s `_text` (např. `turnover_text`)
- Vnořené objekty se přistupují tečkovou notací (např. `address.municipality`)
- Kontakty (`emails`, `phones`, `mobiles`) jsou pole objektů s hodnocením (scored)
