# 🚀 SalesKit – Průvodce pro obchodníka

## Co je SalesKit?

SalesKit je funkce v Google Sheets, která ti podle **IČO, DIČ nebo názvu firmy** okamžitě doplní údaje o firmě – kontakty, obrat, adresu, jednatele a desítky dalších informací. Stačí napsat vzorec do buňky a data se načtou automaticky z databáze Merk (nejkomplexnější databáze firem v ČR a SR).

---

## Jak to funguje?

```
=saleskit("ičo"; "28159128"; "name")
→ 4shop s.r.o.
```

| Parametr | Co tam napsat | Příklad |
|---|---|---|
| 1. typ dotazu | `"ičo"` nebo `"dič"` | `"ičo"` |
| 2. hodnota | IČO nebo DIČ firmy | `"28159128"` |
| 3. co chci zjistit | Název pole (viz příklady) | `"name"` |
| 4. země (volitelné) | `"cz"` nebo `"sk"` | `"cz"` |

---

## 51 praktických příkladů pro obchodníka

### 📇 ZÁKLADNÍ IDENTIFIKACE FIRMY

#### 1. Zjistit název firmy podle IČO
**Kdy:** Mám IČO z faktury a potřebuji ověřit, o jakou firmu jde.
```
=saleskit("ičo"; A2; "name")
```
**Výstup:** `4shop s.r.o.`

#### 2. Zjistit DIČ firmy podle IČO
**Kdy:** Potřebuji DIČ pro fakturu nebo smlouvu.
```
=saleskit("ičo"; A2; "vatno")
```
**Výstup:** `CZ28159128`

#### 3. Zjistit IČO jako text s nulami
**Kdy:** Potřebuji IČO ve formátu s leading zeros pro úřední dokumenty.
```
=saleskit("ičo"; A2; "regno_str")
```
**Výstup:** `28159128`

#### 4. Zjistit datovou schránku firmy
**Kdy:** Potřebuji poslat úřední dokument přes datovou schránku.
```
=saleskit("ičo"; A2; "databox_ids")
```
**Výstup:** `a75jmvg`

#### 5. Zjistit odkaz na profil firmy na Merk.cz
**Kdy:** Chci si firmu prohlédnout detailněji na webu.
```
=saleskit("ičo"; A2; "link")
```
**Výstup:** `https://merk.cz/firma/28159128`

---

### 📍 ADRESA A LOKACE

#### 6. Zjistit město sídla firmy
**Kdy:** Plánuji obchodní schůzku a potřebuji vědět, kde firma sídlí.
```
=saleskit("ičo"; A2; "address.municipality")
```
**Výstup:** `Tábor`

#### 7. Zjistit ulici sídla
**Kdy:** Potřebuji přesnou adresu pro navigaci nebo dopis.
```
=saleskit("ičo"; A2; "address.street_fixed")
```
**Výstup:** `Kpt. Jaroše`

#### 8. Zjistit PSČ
**Kdy:** Vyplňuji adresu na obálku nebo do CRM.
```
=saleskit("ičo"; A2; "address.postal_code")
```
**Výstup:** `39003`

#### 9. Zjistit kompletní adresu na jeden řádek
**Kdy:** Potřebuji celou adresu najednou pro e-mail nebo nabídku.
```
=saleskit("ičo"; A2; "address.lines")
```
**Výstup:** `Kpt. Jaroše 2385, 39003 Tábor`

#### 10. Zjistit kraj firmy
**Kdy:** Segmentuji firmy podle regionů pro obchodní teritoria.
```
=saleskit("ičo"; A2; "address.region.text")
```
**Výstup:** `Jihočeský kraj`

#### 11. Zjistit okres firmy
**Kdy:** Potřebuji přesnější geografické zařazení.
```
=saleskit("ičo"; A2; "address.county.text")
```
**Výstup:** `Tábor`

#### 12. Zjistit GPS souřadnice
**Kdy:** Plánuji trasu pro obchodní návštěvy.
```
=saleskit("ičo"; A2; "gps.lat")
```
**Výstup:** `49.4192810059`

---

### 📞 KONTAKTY

#### 13. Zjistit e-mail firmy
**Kdy:** Chci poslat obchodní nabídku e-mailem.
```
=saleskit("ičo"; A2; "emails")
```
**Výstup:** `info@firma.cz, obchod@firma.cz`

#### 14. Zjistit telefon firmy
**Kdy:** Chci zavolat a domluvit schůzku.
```
=saleskit("ičo"; A2; "phones")
```
**Výstup:** `+420 381 123 456`

#### 15. Zjistit mobil
**Kdy:** Potřebuji přímý kontakt na jednatele.
```
=saleskit("ičo"; A2; "mobiles")
```
**Výstup:** `+420 602 123 456`

#### 16. Zjistit web firmy
**Kdy:** Chci si prohlédnout web firmy před schůzkou.
```
=saleskit("ičo"; A2; "webs")
```
**Výstup:** `www.firma.cz`

---

### 💰 EKONOMICKÉ ÚDAJE

#### 17. Zjistit obrat firmy (textově)
**Kdy:** Chci vědět, jak velká firma je z hlediska tržeb – abych věděl, jakou nabídku připravit.
```
=saleskit("ičo"; A2; "turnover_text")
```
**Výstup:** `1 500 000 000 Kč a více`

#### 18. Zjistit velikost firmy (počet zaměstnanců)
**Kdy:** Potřebuji vědět, kolik má firma zaměstnanců pro sizing nabídky.
```
=saleskit("ičo"; A2; "magnitude_text")
```
**Výstup:** `10 000 a více zam.`

#### 19. Zjistit zisk firmy
**Kdy:** Chci vědět, zda je firma zisková – indikátor platební schopnosti.
```
=saleskit("ičo"; A2; "profit_text")
```
**Výstup:** `5 000 000 Kč`

#### 20. Zjistit EBIDTA
**Kdy:** Potřebuji finanční ukazatel pro kvalifikaci leadu.
```
=saleskit("ičo"; A2; "ebidta_text")
```
**Výstup:** `10 000 000 Kč`

#### 21. Zjistit rating firmy
**Kdy:** Chci vědět, jak je firma hodnocená – riziko nesplacení.
```
=saleskit("ičo"; A2; "company_index_text")
```
**Výstup:** `A`

---

### 🏢 STAV A PRÁVNÍ FORMA

#### 22. Zjistit zda je firma aktivní
**Kdy:** Ověřuji, zda firma stále existuje, než ji oslovím.
```
=saleskit("ičo"; A2; "is_active")
```
**Výstup:** `true`

#### 23. Zjistit právní formu
**Kdy:** Potřebuji vědět, zda je to s.r.o., a.s., OSVČ atd.
```
=saleskit("ičo"; A2; "legal_form_text")
```
**Výstup:** `Společnost s ručením omezeným`

#### 24. Zjistit datum založení firmy
**Kdy:** Chci vědět, jak dlouho firma funguje – starší = stabilnější.
```
=saleskit("ičo"; A2; "estab_date")
```
**Výstup:** `2012-08-17T00:00:00`

#### 25. Zjistit stav firmy
**Kdy:** Kontroluji, zda firma není v likvidaci nebo insolvenci.
```
=saleskit("ičo"; A2; "status_text")
```
**Výstup:** `Aktivní`

---

### 🧾 DPH A DANĚ

#### 26. Zjistit zda je plátce DPH
**Kdy:** Potřebuji vědět pro fakturaci – s DPH nebo bez.
```
=saleskit("ičo"; A2; "is_vatpayer")
```
**Výstup:** `true`

#### 27. Zjistit nespolehlivého plátce DPH
**Kdy:** Ověřuji riziko – nespolehlivý plátce = ručení za DPH.
```
=saleskit("ičo"; A2; "is_unreliable_vatpayer")
```
**Výstup:** `false`

#### 28. Zjistit datum registrace k DPH
**Kdy:** Potřebuji pro smlouvu nebo audit.
```
=saleskit("ičo"; A2; "vat_registration_date")
```
**Výstup:** `2012-09-01T00:00:00`

#### 29. Zjistit dluh u VZP
**Kdy:** Kontroluji finanční zdraví firmy – dluh u pojišťovny = varování.
```
=saleskit("ičo"; A2; "vzp_debt")
```
**Výstup:** `0` (žádný dluh)

---

### 🏭 OBOR PODNIKÁNÍ

#### 30. Zjistit hlavní obor podnikání
**Kdy:** Potřebuji vědět, čím se firma zabývá, abych přizpůsobil nabídku.
```
=saleskit("ičo"; A2; "industry_text")
```
**Výstup:** `Informační a komunikační činnosti`

#### 31. Zjistit kód oboru (NACE)
**Kdy:** Filtruji firmy podle oborů pro cílený prospecting.
```
=saleskit("ičo"; A2; "industry_code")
```
**Výstup:** `J`

#### 32. Zjistit vedlejší obory
**Kdy:** Chci vědět, co dalšího firma dělá – příležitost pro cross-sell.
```
=saleskit("ičo"; A2; "secondary_industries")
```
**Výstup:** `Výroba, obchod a služby..., Zprostředkování velkoobchodu...`

#### 33. Zjistit typ vlastnictví
**Kdy:** Rozlišuji státní vs. soukromé firmy pro strategii oslovení.
```
=saleskit("ičo"; A2; "owning_type")
```
**Výstup:** `{"id":"2","text":"Soukromé"}`

---

### 🏦 BANKOVNÍ ÚDAJE

#### 34. Zjistit bankovní účet firmy
**Kdy:** Potřebuji číslo účtu pro platbu nebo ověření.
```
=saleskit("ičo"; A2; "bank_accounts")
```
**Výstup:** `[{"account_number":"2500294673","bank_code":"2010"}]`

---

### 👥 OSOBY A JEDNATELÉ

#### 35. Zjistit osoby spojené s firmou
**Kdy:** Hledám jméno jednatele nebo kontaktní osoby pro oslovení.
```
=saleskit("ičo"; A2; "body")
```
**Výstup:** `{"statutory":[{"name":"Jan Novák","function":"jednatel"}],...}`

---

### 📊 PROVOZOVNY A LICENCE

#### 36. Zjistit počet provozoven
**Kdy:** Chci vědět, kolik poboček firma má – větší firma = větší deal.
```
=saleskit("ičo"; A2; "business_premises_count")
```
**Výstup:** `3`

#### 37. Zjistit počet aktivních licencí
**Kdy:** Indikátor rozsahu podnikání.
```
=saleskit("ičo"; A2; "active_licenses_count")
```
**Výstup:** `5`

---

### 🔍 VYHLEDÁVÁNÍ PODLE DIČ

#### 38. Najít firmu podle DIČ
**Kdy:** Mám DIČ z faktury a potřebuji zjistit název firmy.
```
=saleskit("dič"; "CZ28159128"; "name")
```
**Výstup:** `4shop s.r.o.`

#### 39. Najít adresu podle DIČ
**Kdy:** Potřebuji adresu firmy, ale mám jen DIČ.
```
=saleskit("dič"; "CZ28159128"; "address.lines")
```
**Výstup:** `Kpt. Jaroše 2385, 39003 Tábor`

---

### 🇸🇰 SLOVENSKÉ FIRMY

#### 40. Zjistit název slovenské firmy
**Kdy:** Pracuji se slovenským trhem.
```
=saleskit("ičo"; "35763469"; "name"; "sk")
```
**Výstup:** `Slovenská firma s.r.o.`

#### 41. Zjistit adresu slovenské firmy
**Kdy:** Potřebuji adresu pro slovenského klienta.
```
=saleskit("ičo"; "35763469"; "address.municipality"; "sk")
```
**Výstup:** `Bratislava`

---

### 📋 KOMPLETNÍ SOUHRN

#### 42. Získat kompletní souhrn firmy
**Kdy:** Chci rychlý přehled o firmě na jeden řádek.
```
=saleskit("ičo"; A2)
```
**Výstup:** `4shop s.r.o. | 28159128 | CZ28159128 | info@firma.cz | 1 500 000 Kč | Tábor`

---

### 🧠 POKROČILÉ POUŽITÍ V TABULCE

#### 43. Hromadné doplnění názvů firem
**Kdy:** Mám 100 IČO a potřebuji ke všem doplnit názvy.
```
Sloupec A: IČO
Sloupec B: =saleskit("ičo"; A2; "name")
→ Přetáhni vzorec dolů na všechny řádky
```

#### 44. Automatická kontrola aktivity firmy
**Kdy:** Čistím databázi kontaktů – odstraňuji neaktivní firmy.
```
=IF(saleskit("ičo"; A2; "is_active")="true"; "✅ Aktivní"; "❌ Neaktivní")
```
**Výstup:** `✅ Aktivní`

#### 45. Kontrola nespolehlivého plátce DPH
**Kdy:** Před uzavřením smlouvy ověřuji riziko ručení za DPH.
```
=IF(saleskit("ičo"; A2; "is_unreliable_vatpayer")="true"; "⚠️ POZOR - nespolehlivý plátce!"; "✅ OK")
```
**Výstup:** `✅ OK`

#### 46. Segmentace podle obratu
**Kdy:** Rozděluji firmy na malé/střední/velké pro prioritizaci.
```
=saleskit("ičo"; A2; "turnover_text")
```
Pak filtruji podle hodnoty obratu.

#### 47. Segmentace podle regionu
**Kdy:** Rozděluji firmy podle krajů pro obchodní teritoria.
```
=saleskit("ičo"; A2; "address.region.text")
```
**Výstup:** `Jihočeský kraj`

#### 48. Příprava na cold call – kompletní brief
**Kdy:** Před telefonátem si chci rychle zjistit vše o firmě.
```
Buňka B2: =saleskit("ičo"; A2; "name")           → Název
Buňka C2: =saleskit("ičo"; A2; "industry_text")   → Obor
Buňka D2: =saleskit("ičo"; A2; "magnitude_text")  → Velikost
Buňka E2: =saleskit("ičo"; A2; "phones")          → Telefon
Buňka F2: =saleskit("ičo"; A2; "address.municipality") → Město
```

#### 49. Ověření firmy před podpisem smlouvy
**Kdy:** Due diligence – kontroluji základní údaje před spoluprací.
```
Buňka B2: =saleskit("ičo"; A2; "is_active")                → Aktivní?
Buňka C2: =saleskit("ičo"; A2; "is_unreliable_vatpayer")   → Nespolehlivý plátce?
Buňka D2: =saleskit("ičo"; A2; "vzp_debt")                 → Dluh VZP
Buňka E2: =saleskit("ičo"; A2; "company_index_text")       → Rating
Buňka F2: =saleskit("ičo"; A2; "estab_date")               → Datum založení
```

#### 50. Export kontaktů pro e-mail kampaň
**Kdy:** Připravuji seznam firem pro hromadný e-mailing.
```
Buňka A: IČO
Buňka B: =saleskit("ičo"; A2; "name")              → Název
Buňka C: =saleskit("ičo"; A2; "emails")            → E-mail
Buňka D: =saleskit("ičo"; A2; "salutation")        → Oslovení
Buňka E: =saleskit("ičo"; A2; "industry_text")     → Obor
```

#### 51. Kompletní CRM karta firmy
**Kdy:** Vytvářím kompletní profil firmy pro CRM import.
```
B2: =saleskit("ičo"; A2; "name")                    → Název
C2: =saleskit("ičo"; A2; "vatno")                   → DIČ
D2: =saleskit("ičo"; A2; "address.lines")           → Adresa
E2: =saleskit("ičo"; A2; "address.municipality")    → Město
F2: =saleskit("ičo"; A2; "address.region.text")     → Kraj
G2: =saleskit("ičo"; A2; "emails")                  → E-mail
H2: =saleskit("ičo"; A2; "phones")                  → Telefon
I2: =saleskit("ičo"; A2; "webs")                    → Web
J2: =saleskit("ičo"; A2; "industry_text")           → Obor
K2: =saleskit("ičo"; A2; "turnover_text")           → Obrat
L2: =saleskit("ičo"; A2; "magnitude_text")          → Velikost
M2: =saleskit("ičo"; A2; "company_index_text")      → Rating
N2: =saleskit("ičo"; A2; "is_active")               → Aktivní
O2: =saleskit("ičo"; A2; "estab_date")              → Založení
```

---

## 📊 Přehled všech dostupných polí

### Základní údaje
| Pole | Co vrátí | Příklad výstupu |
|---|---|---|
| `name` | Název firmy | `4shop s.r.o.` |
| `regno` | IČO (číslo) | `28159128` |
| `regno_str` | IČO (text) | `28159128` |
| `vatno` | DIČ | `CZ28159128` |
| `databox_ids` | Datová schránka | `a75jmvg` |
| `link` | Odkaz na Merk.cz | `https://merk.cz/...` |
| `salutation` | Oslovení (vokativ) | `4shop s.r.o.` |

### Adresa
| Pole | Co vrátí | Příklad výstupu |
|---|---|---|
| `address.street_fixed` | Ulice | `Kpt. Jaroše` |
| `address.number` | Číslo popisné | `2385` |
| `address.municipality` | Město | `Tábor` |
| `address.postal_code` | PSČ | `39003` |
| `address.region.text` | Kraj | `Jihočeský kraj` |
| `address.county.text` | Okres | `Tábor` |
| `address.lines` | Celá adresa | `Kpt. Jaroše 2385, 39003 Tábor` |
| `gps.lat` | GPS šířka | `49.419` |
| `gps.lon` | GPS délka | `14.646` |

### Kontakty
| Pole | Co vrátí | Příklad výstupu |
|---|---|---|
| `emails` | E-maily | `info@firma.cz` |
| `phones` | Telefony | `+420 381 123 456` |
| `mobiles` | Mobily | `+420 602 123 456` |
| `webs` | Weby | `www.firma.cz` |

### Ekonomika
| Pole | Co vrátí | Příklad výstupu |
|---|---|---|
| `turnover_text` | Obrat | `1 500 000 000 Kč a více` |
| `magnitude_text` | Velikost (zaměstnanci) | `10 000 a více zam.` |
| `profit_text` | Zisk | `5 000 000 Kč` |
| `ebidta_text` | EBIDTA | `10 000 000 Kč` |
| `company_index_text` | Rating | `A` |

### Stav firmy
| Pole | Co vrátí | Příklad výstupu |
|---|---|---|
| `is_active` | Je aktivní? | `true` |
| `estab_date` | Datum založení | `2012-08-17` |
| `status_text` | Stav | `Aktivní` |
| `legal_form_text` | Právní forma | `Společnost s ručením omezeným` |

### DPH
| Pole | Co vrátí | Příklad výstupu |
|---|---|---|
| `is_vatpayer` | Plátce DPH? | `true` |
| `is_unreliable_vatpayer` | Nespolehlivý plátce? | `false` |
| `vzp_debt` | Dluh u VZP | `0` |

### Obor
| Pole | Co vrátí | Příklad výstupu |
|---|---|---|
| `industry_text` | Hlavní obor | `Informační a komunikační činnosti` |
| `industry_code` | Kód oboru | `J` |
| `secondary_industries` | Vedlejší obory | `Výroba, obchod...` |

### Ostatní
| Pole | Co vrátí | Příklad výstupu |
|---|---|---|
| `body` | Jednatelé a osoby | `{"statutory":[...]}` |
| `bank_accounts` | Bankovní účty | `[{"account_number":"..."}]` |
| `business_premises_count` | Počet provozoven | `3` |
| `active_licenses_count` | Počet licencí | `5` |

---

## ⚠️ Časté problémy a řešení

| Problém | Příčina | Řešení |
|---|---|---|
| Prázdná buňka | API klíč není nastaven | Menu **SalesKit → Nastavit API klíč** |
| `CHYBA: typ_dotazu je povinný` | Chybí první parametr | Přidejte `"ičo"` jako první parametr |
| `CHYBA: Firma nebyla nalezena` | IČO neexistuje v databázi | Zkontrolujte IČO |
| `CHYBA: Neplatný API klíč (401)` | Špatný API klíč | Zkontrolujte klíč v Merk dashboardu |
| `CHYBA: Přístup odepřen (403)` | Expirovaný účet | Obnovte předplatné na merk.cz |
| Pomalé načítání | Rate limiting (2s delay) | Je to normální, počkejte |
| `N/A` u kontaktů | Firma nemá veřejné kontakty | Zkuste jiný zdroj |

---

## 🔧 Nastavení (jednorázové)

1. **Zaregistrujte se** na [merk.cz](https://merk.cz) (zdarma)
2. **Získejte API klíč** v dashboardu → Connection (Napojení)
3. **V Google Sheets** klikněte na menu **SalesKit → Nastavit API klíč**
4. **Zadejte heslo** a **API klíč**
5. **Hotovo!** Můžete používat `=saleskit(...)` ve všech buňkách

---

## 💡 Tipy

- **Přetahujte vzorce dolů** – stačí napsat vzorec jednou a přetáhnout na všechny řádky
- **Používejte reference na buňky** – místo `"28159128"` napište `A2` (odkaz na buňku s IČO)
- **Pole s `_text`** – pro objekty jako obrat, velikost, obor použijte alias s `_text` (např. `turnover_text`)
- **Tečková notace** – pro vnořené objekty použijte tečku (např. `address.municipality`)
- **Limit 60 požadavků/min** – při hromadném zpracování počítejte s 2s delay na buňku
