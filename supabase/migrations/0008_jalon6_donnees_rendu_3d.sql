-- Jalon 6 (couche données) — préparation du rendu 3D temps réel.
-- Voir docs/DECISIONS.md §4 (journal du Jalon 6) et §8 (direction
-- artistique, décidée avec Adrien hors de cette session) pour le
-- raisonnement complet. Le portage du rendu lui-même (Three.js) est un
-- jalon séparé ("Jalon 6bis") — ce fichier ne prépare que les données :
-- géo/fuseau des pays, record de population (jamais de destruction
-- visuelle), nouveaux seuils de niveau, infrastructure des villes de
-- test.

-- ---------------------------------------------------------------------
-- Géo et fuseau horaire des pays — pour positionner le soleil à l'heure
-- réelle du pays de la ville (§8). Nullable : certains territoires
-- ISO 3166-1 n'ont pas de coordonnées ou de fuseau exploitables (ex.
-- Antarctique) et resteront sans lumière réaliste tant qu'aucune ville
-- n'y est fondée.
-- ---------------------------------------------------------------------
alter table public.countries
  add column latitude numeric,
  add column longitude numeric,
  add column fuseau_horaire text;

-- Généré à partir des paquets world-countries (coordonnées) et
-- moment-timezone (fuseaux par pays), avec une liste de fuseaux
-- "de la capitale" pour les pays multi-fuseaux les plus courants (sinon
-- moment-timezone renvoie le premier fuseau par ordre alphabétique, pas
-- forcément celui de la capitale — voir docs/DECISIONS.md §4, Jalon 6).
update public.countries set latitude = 12.5, longitude = -69.96666666, fuseau_horaire = 'America/Aruba' where id = 'AW';
update public.countries set latitude = 33, longitude = 65, fuseau_horaire = 'Asia/Kabul' where id = 'AF';
update public.countries set latitude = -12.5, longitude = 18.5, fuseau_horaire = 'Africa/Lagos' where id = 'AO';
update public.countries set latitude = 18.25, longitude = -63.16666666, fuseau_horaire = 'America/Anguilla' where id = 'AI';
update public.countries set latitude = 60.116667, longitude = 19.9, fuseau_horaire = 'Europe/Helsinki' where id = 'AX';
update public.countries set latitude = 41, longitude = 20, fuseau_horaire = 'Europe/Tirane' where id = 'AL';
update public.countries set latitude = 42.5, longitude = 1.5, fuseau_horaire = 'Europe/Andorra' where id = 'AD';
update public.countries set latitude = 24, longitude = 54, fuseau_horaire = 'Asia/Dubai' where id = 'AE';
update public.countries set latitude = -34, longitude = -64, fuseau_horaire = 'America/Argentina/Buenos_Aires' where id = 'AR';
update public.countries set latitude = 40, longitude = 45, fuseau_horaire = 'Asia/Yerevan' where id = 'AM';
update public.countries set latitude = -14.33333333, longitude = -170, fuseau_horaire = 'Pacific/Pago_Pago' where id = 'AS';
update public.countries set latitude = -90, longitude = 0, fuseau_horaire = 'Antarctica/Casey' where id = 'AQ';
update public.countries set latitude = -49.25, longitude = 69.167, fuseau_horaire = 'Asia/Dubai' where id = 'TF';
update public.countries set latitude = 17.05, longitude = -61.8, fuseau_horaire = 'America/Antigua' where id = 'AG';
update public.countries set latitude = -27, longitude = 133, fuseau_horaire = 'Australia/Sydney' where id = 'AU';
update public.countries set latitude = 47.33333333, longitude = 13.33333333, fuseau_horaire = 'Europe/Vienna' where id = 'AT';
update public.countries set latitude = 40.5, longitude = 47.5, fuseau_horaire = 'Asia/Baku' where id = 'AZ';
update public.countries set latitude = -3.5, longitude = 30, fuseau_horaire = 'Africa/Bujumbura' where id = 'BI';
update public.countries set latitude = 50.83333333, longitude = 4, fuseau_horaire = 'Europe/Brussels' where id = 'BE';
update public.countries set latitude = 9.5, longitude = 2.25, fuseau_horaire = 'Africa/Lagos' where id = 'BJ';
update public.countries set latitude = 13, longitude = -2, fuseau_horaire = 'Africa/Abidjan' where id = 'BF';
update public.countries set latitude = 24, longitude = 90, fuseau_horaire = 'Asia/Dhaka' where id = 'BD';
update public.countries set latitude = 43, longitude = 25, fuseau_horaire = 'Europe/Sofia' where id = 'BG';
update public.countries set latitude = 26, longitude = 50.55, fuseau_horaire = 'Asia/Bahrain' where id = 'BH';
update public.countries set latitude = 24.25, longitude = -76, fuseau_horaire = 'America/Nassau' where id = 'BS';
update public.countries set latitude = 44, longitude = 18, fuseau_horaire = 'Europe/Belgrade' where id = 'BA';
update public.countries set latitude = 18.5, longitude = -63.41666666, fuseau_horaire = 'America/Puerto_Rico' where id = 'BL';
update public.countries set latitude = -15.95, longitude = -5.72, fuseau_horaire = 'Africa/Abidjan' where id = 'SH';
update public.countries set latitude = 53, longitude = 28, fuseau_horaire = 'Europe/Minsk' where id = 'BY';
update public.countries set latitude = 17.25, longitude = -88.75, fuseau_horaire = 'America/Belize' where id = 'BZ';
update public.countries set latitude = 32.33333333, longitude = -64.75, fuseau_horaire = 'Atlantic/Bermuda' where id = 'BM';
update public.countries set latitude = -17, longitude = -65, fuseau_horaire = 'America/La_Paz' where id = 'BO';
update public.countries set latitude = 12.18, longitude = -68.25, fuseau_horaire = 'America/Kralendijk' where id = 'BQ';
update public.countries set latitude = -10, longitude = -55, fuseau_horaire = 'America/Sao_Paulo' where id = 'BR';
update public.countries set latitude = 13.16666666, longitude = -59.53333333, fuseau_horaire = 'America/Barbados' where id = 'BB';
update public.countries set latitude = 4.5, longitude = 114.66666666, fuseau_horaire = 'Asia/Brunei' where id = 'BN';
update public.countries set latitude = 27.5, longitude = 90.5, fuseau_horaire = 'Asia/Thimphu' where id = 'BT';
update public.countries set latitude = -22, longitude = 24, fuseau_horaire = 'Africa/Gaborone' where id = 'BW';
update public.countries set latitude = 7, longitude = 21, fuseau_horaire = 'Africa/Bangui' where id = 'CF';
update public.countries set latitude = 60, longitude = -95, fuseau_horaire = 'America/Toronto' where id = 'CA';
update public.countries set latitude = -12.5, longitude = 96.83333333, fuseau_horaire = 'Asia/Yangon' where id = 'CC';
update public.countries set latitude = 47, longitude = 8, fuseau_horaire = 'Europe/Zurich' where id = 'CH';
update public.countries set latitude = -30, longitude = -71, fuseau_horaire = 'America/Santiago' where id = 'CL';
update public.countries set latitude = 35, longitude = 105, fuseau_horaire = 'Asia/Shanghai' where id = 'CN';
update public.countries set latitude = 8, longitude = -5, fuseau_horaire = 'Africa/Abidjan' where id = 'CI';
update public.countries set latitude = 6, longitude = 12, fuseau_horaire = 'Africa/Douala' where id = 'CM';
update public.countries set latitude = 0, longitude = 25, fuseau_horaire = 'Africa/Kinshasa' where id = 'CD';
update public.countries set latitude = -1, longitude = 15, fuseau_horaire = 'Africa/Brazzaville' where id = 'CG';
update public.countries set latitude = -21.23333333, longitude = -159.76666666, fuseau_horaire = 'Pacific/Rarotonga' where id = 'CK';
update public.countries set latitude = 4, longitude = -72, fuseau_horaire = 'America/Bogota' where id = 'CO';
update public.countries set latitude = -12.16666666, longitude = 44.25, fuseau_horaire = 'Africa/Nairobi' where id = 'KM';
update public.countries set latitude = 16, longitude = -24, fuseau_horaire = 'Atlantic/Cape_Verde' where id = 'CV';
update public.countries set latitude = 10, longitude = -84, fuseau_horaire = 'America/Costa_Rica' where id = 'CR';
update public.countries set latitude = 21.5, longitude = -80, fuseau_horaire = 'America/Havana' where id = 'CU';
update public.countries set latitude = 12.116667, longitude = -68.933333, fuseau_horaire = 'America/Curacao' where id = 'CW';
update public.countries set latitude = -10.5, longitude = 105.66666666, fuseau_horaire = 'Asia/Bangkok' where id = 'CX';
update public.countries set latitude = 19.5, longitude = -80.5, fuseau_horaire = 'America/Cayman' where id = 'KY';
update public.countries set latitude = 35, longitude = 33, fuseau_horaire = 'Asia/Famagusta' where id = 'CY';
update public.countries set latitude = 49.75, longitude = 15.5, fuseau_horaire = 'Europe/Prague' where id = 'CZ';
update public.countries set latitude = 51, longitude = 9, fuseau_horaire = 'Europe/Berlin' where id = 'DE';
update public.countries set latitude = 11.5, longitude = 43, fuseau_horaire = 'Africa/Djibouti' where id = 'DJ';
update public.countries set latitude = 15.41666666, longitude = -61.33333333, fuseau_horaire = 'America/Dominica' where id = 'DM';
update public.countries set latitude = 56, longitude = 10, fuseau_horaire = 'Europe/Berlin' where id = 'DK';
update public.countries set latitude = 19, longitude = -70.66666666, fuseau_horaire = 'America/Santo_Domingo' where id = 'DO';
update public.countries set latitude = 28, longitude = 3, fuseau_horaire = 'Africa/Algiers' where id = 'DZ';
update public.countries set latitude = -2, longitude = -77.5, fuseau_horaire = 'America/Guayaquil' where id = 'EC';
update public.countries set latitude = 27, longitude = 30, fuseau_horaire = 'Africa/Cairo' where id = 'EG';
update public.countries set latitude = 15, longitude = 39, fuseau_horaire = 'Africa/Asmara' where id = 'ER';
update public.countries set latitude = 24.5, longitude = -13, fuseau_horaire = 'Africa/El_Aaiun' where id = 'EH';
update public.countries set latitude = 40, longitude = -4, fuseau_horaire = 'Europe/Madrid' where id = 'ES';
update public.countries set latitude = 59, longitude = 26, fuseau_horaire = 'Europe/Tallinn' where id = 'EE';
update public.countries set latitude = 8, longitude = 38, fuseau_horaire = 'Africa/Addis_Ababa' where id = 'ET';
update public.countries set latitude = 64, longitude = 26, fuseau_horaire = 'Europe/Helsinki' where id = 'FI';
update public.countries set latitude = -18, longitude = 175, fuseau_horaire = 'Pacific/Fiji' where id = 'FJ';
update public.countries set latitude = -51.75, longitude = -59, fuseau_horaire = 'Atlantic/Stanley' where id = 'FK';
update public.countries set latitude = 46, longitude = 2, fuseau_horaire = 'Europe/Paris' where id = 'FR';
update public.countries set latitude = 62, longitude = -7, fuseau_horaire = 'Atlantic/Faroe' where id = 'FO';
update public.countries set latitude = 6.91666666, longitude = 158.25, fuseau_horaire = 'Pacific/Chuuk' where id = 'FM';
update public.countries set latitude = -1, longitude = 11.75, fuseau_horaire = 'Africa/Lagos' where id = 'GA';
update public.countries set latitude = 54, longitude = -2, fuseau_horaire = 'Europe/London' where id = 'GB';
update public.countries set latitude = 42, longitude = 43.5, fuseau_horaire = 'Asia/Tbilisi' where id = 'GE';
update public.countries set latitude = 49.46666666, longitude = -2.58333333, fuseau_horaire = 'Europe/Guernsey' where id = 'GG';
update public.countries set latitude = 8, longitude = -2, fuseau_horaire = 'Africa/Abidjan' where id = 'GH';
update public.countries set latitude = 36.13333333, longitude = -5.35, fuseau_horaire = 'Europe/Gibraltar' where id = 'GI';
update public.countries set latitude = 11, longitude = -10, fuseau_horaire = 'Africa/Abidjan' where id = 'GN';
update public.countries set latitude = 16.25, longitude = -61.583333, fuseau_horaire = 'America/Guadeloupe' where id = 'GP';
update public.countries set latitude = 13.46666666, longitude = -16.56666666, fuseau_horaire = 'Africa/Abidjan' where id = 'GM';
update public.countries set latitude = 12, longitude = -15, fuseau_horaire = 'Africa/Bissau' where id = 'GW';
update public.countries set latitude = 2, longitude = 10, fuseau_horaire = 'Africa/Lagos' where id = 'GQ';
update public.countries set latitude = 39, longitude = 22, fuseau_horaire = 'Europe/Athens' where id = 'GR';
update public.countries set latitude = 12.11666666, longitude = -61.66666666, fuseau_horaire = 'America/Grenada' where id = 'GD';
update public.countries set latitude = 72, longitude = -40, fuseau_horaire = 'America/Danmarkshavn' where id = 'GL';
update public.countries set latitude = 15.5, longitude = -90.25, fuseau_horaire = 'America/Guatemala' where id = 'GT';
update public.countries set latitude = 4, longitude = -53, fuseau_horaire = 'America/Cayenne' where id = 'GF';
update public.countries set latitude = 13.46666666, longitude = 144.78333333, fuseau_horaire = 'Pacific/Guam' where id = 'GU';
update public.countries set latitude = 5, longitude = -59, fuseau_horaire = 'America/Guyana' where id = 'GY';
update public.countries set latitude = 22.267, longitude = 114.188, fuseau_horaire = 'Asia/Hong_Kong' where id = 'HK';
update public.countries set latitude = 15, longitude = -86.5, fuseau_horaire = 'America/Tegucigalpa' where id = 'HN';
update public.countries set latitude = 45.16666666, longitude = 15.5, fuseau_horaire = 'Europe/Belgrade' where id = 'HR';
update public.countries set latitude = 19, longitude = -72.41666666, fuseau_horaire = 'America/Port-au-Prince' where id = 'HT';
update public.countries set latitude = 47, longitude = 20, fuseau_horaire = 'Europe/Budapest' where id = 'HU';
update public.countries set latitude = -5, longitude = 120, fuseau_horaire = 'Asia/Jakarta' where id = 'ID';
update public.countries set latitude = 54.25, longitude = -4.5, fuseau_horaire = 'Europe/Isle_of_Man' where id = 'IM';
update public.countries set latitude = 20, longitude = 77, fuseau_horaire = 'Asia/Kolkata' where id = 'IN';
update public.countries set latitude = -6, longitude = 71.5, fuseau_horaire = 'Indian/Chagos' where id = 'IO';
update public.countries set latitude = 53, longitude = -8, fuseau_horaire = 'Europe/Dublin' where id = 'IE';
update public.countries set latitude = 32, longitude = 53, fuseau_horaire = 'Asia/Tehran' where id = 'IR';
update public.countries set latitude = 33, longitude = 44, fuseau_horaire = 'Asia/Baghdad' where id = 'IQ';
update public.countries set latitude = 65, longitude = -18, fuseau_horaire = 'Africa/Abidjan' where id = 'IS';
update public.countries set latitude = 31.47, longitude = 35.13, fuseau_horaire = 'Asia/Jerusalem' where id = 'IL';
update public.countries set latitude = 42.83333333, longitude = 12.83333333, fuseau_horaire = 'Europe/Rome' where id = 'IT';
update public.countries set latitude = 18.25, longitude = -77.5, fuseau_horaire = 'America/Jamaica' where id = 'JM';
update public.countries set latitude = 49.25, longitude = -2.16666666, fuseau_horaire = 'Europe/Jersey' where id = 'JE';
update public.countries set latitude = 31, longitude = 36, fuseau_horaire = 'Asia/Amman' where id = 'JO';
update public.countries set latitude = 36, longitude = 138, fuseau_horaire = 'Asia/Tokyo' where id = 'JP';
update public.countries set latitude = 48, longitude = 68, fuseau_horaire = 'Asia/Almaty' where id = 'KZ';
update public.countries set latitude = 1, longitude = 38, fuseau_horaire = 'Africa/Nairobi' where id = 'KE';
update public.countries set latitude = 41, longitude = 75, fuseau_horaire = 'Asia/Bishkek' where id = 'KG';
update public.countries set latitude = 13, longitude = 105, fuseau_horaire = 'Asia/Bangkok' where id = 'KH';
update public.countries set latitude = 1.41666666, longitude = 173, fuseau_horaire = 'Pacific/Kanton' where id = 'KI';
update public.countries set latitude = 17.33333333, longitude = -62.75, fuseau_horaire = 'America/Puerto_Rico' where id = 'KN';
update public.countries set latitude = 37, longitude = 127.5, fuseau_horaire = 'Asia/Seoul' where id = 'KR';
update public.countries set latitude = 29.5, longitude = 45.75, fuseau_horaire = 'Asia/Kuwait' where id = 'KW';
update public.countries set latitude = 18, longitude = 105, fuseau_horaire = 'Asia/Bangkok' where id = 'LA';
update public.countries set latitude = 33.83333333, longitude = 35.83333333, fuseau_horaire = 'Asia/Beirut' where id = 'LB';
update public.countries set latitude = 6.5, longitude = -9.5, fuseau_horaire = 'Africa/Monrovia' where id = 'LR';
update public.countries set latitude = 25, longitude = 17, fuseau_horaire = 'Africa/Tripoli' where id = 'LY';
update public.countries set latitude = 13.88333333, longitude = -60.96666666, fuseau_horaire = 'America/Puerto_Rico' where id = 'LC';
update public.countries set latitude = 47.26666666, longitude = 9.53333333, fuseau_horaire = 'Europe/Vaduz' where id = 'LI';
update public.countries set latitude = 7, longitude = 81, fuseau_horaire = 'Asia/Colombo' where id = 'LK';
update public.countries set latitude = -29.5, longitude = 28.5, fuseau_horaire = 'Africa/Johannesburg' where id = 'LS';
update public.countries set latitude = 56, longitude = 24, fuseau_horaire = 'Europe/Vilnius' where id = 'LT';
update public.countries set latitude = 49.75, longitude = 6.16666666, fuseau_horaire = 'Europe/Brussels' where id = 'LU';
update public.countries set latitude = 57, longitude = 25, fuseau_horaire = 'Europe/Riga' where id = 'LV';
update public.countries set latitude = 22.16666666, longitude = 113.55, fuseau_horaire = 'Asia/Macau' where id = 'MO';
update public.countries set latitude = 18.08333333, longitude = -63.95, fuseau_horaire = 'America/Marigot' where id = 'MF';
update public.countries set latitude = 32, longitude = -5, fuseau_horaire = 'Africa/Casablanca' where id = 'MA';
update public.countries set latitude = 43.73333333, longitude = 7.4, fuseau_horaire = 'Europe/Monaco' where id = 'MC';
update public.countries set latitude = 47, longitude = 29, fuseau_horaire = 'Europe/Chisinau' where id = 'MD';
update public.countries set latitude = -20, longitude = 47, fuseau_horaire = 'Africa/Nairobi' where id = 'MG';
update public.countries set latitude = 3.25, longitude = 73, fuseau_horaire = 'Indian/Maldives' where id = 'MV';
update public.countries set latitude = 23, longitude = -102, fuseau_horaire = 'America/Mexico_City' where id = 'MX';
update public.countries set latitude = 9, longitude = 168, fuseau_horaire = 'Pacific/Kwajalein' where id = 'MH';
update public.countries set latitude = 41.83333333, longitude = 22, fuseau_horaire = 'Europe/Belgrade' where id = 'MK';
update public.countries set latitude = 17, longitude = -4, fuseau_horaire = 'Africa/Abidjan' where id = 'ML';
update public.countries set latitude = 35.83333333, longitude = 14.58333333, fuseau_horaire = 'Europe/Malta' where id = 'MT';
update public.countries set latitude = 22, longitude = 98, fuseau_horaire = 'Asia/Yangon' where id = 'MM';
update public.countries set latitude = 42.5, longitude = 19.3, fuseau_horaire = 'Europe/Belgrade' where id = 'ME';
update public.countries set latitude = 46, longitude = 105, fuseau_horaire = 'Asia/Ulaanbaatar' where id = 'MN';
update public.countries set latitude = 15.2, longitude = 145.75, fuseau_horaire = 'Pacific/Guam' where id = 'MP';
update public.countries set latitude = -18.25, longitude = 35, fuseau_horaire = 'Africa/Maputo' where id = 'MZ';
update public.countries set latitude = 20, longitude = -12, fuseau_horaire = 'Africa/Abidjan' where id = 'MR';
update public.countries set latitude = 16.75, longitude = -62.2, fuseau_horaire = 'America/Montserrat' where id = 'MS';
update public.countries set latitude = 14.666667, longitude = -61, fuseau_horaire = 'America/Martinique' where id = 'MQ';
update public.countries set latitude = -20.28333333, longitude = 57.55, fuseau_horaire = 'Indian/Mauritius' where id = 'MU';
update public.countries set latitude = -13.5, longitude = 34, fuseau_horaire = 'Africa/Blantyre' where id = 'MW';
update public.countries set latitude = 2.5, longitude = 112.5, fuseau_horaire = 'Asia/Kuala_Lumpur' where id = 'MY';
update public.countries set latitude = -12.83333333, longitude = 45.16666666, fuseau_horaire = 'Africa/Nairobi' where id = 'YT';
update public.countries set latitude = -22, longitude = 17, fuseau_horaire = 'Africa/Windhoek' where id = 'NA';
update public.countries set latitude = -21.5, longitude = 165.5, fuseau_horaire = 'Pacific/Noumea' where id = 'NC';
update public.countries set latitude = 16, longitude = 8, fuseau_horaire = 'Africa/Lagos' where id = 'NE';
update public.countries set latitude = -29.03333333, longitude = 167.95, fuseau_horaire = 'Pacific/Norfolk' where id = 'NF';
update public.countries set latitude = 10, longitude = 8, fuseau_horaire = 'Africa/Lagos' where id = 'NG';
update public.countries set latitude = 13, longitude = -85, fuseau_horaire = 'America/Managua' where id = 'NI';
update public.countries set latitude = -19.03333333, longitude = -169.86666666, fuseau_horaire = 'Pacific/Niue' where id = 'NU';
update public.countries set latitude = 52.5, longitude = 5.75, fuseau_horaire = 'Europe/Amsterdam' where id = 'NL';
update public.countries set latitude = 62, longitude = 10, fuseau_horaire = 'Europe/Berlin' where id = 'NO';
update public.countries set latitude = 28, longitude = 84, fuseau_horaire = 'Asia/Kathmandu' where id = 'NP';
update public.countries set latitude = -0.53333333, longitude = 166.91666666, fuseau_horaire = 'Pacific/Nauru' where id = 'NR';
update public.countries set latitude = -41, longitude = 174, fuseau_horaire = 'Pacific/Auckland' where id = 'NZ';
update public.countries set latitude = 21, longitude = 57, fuseau_horaire = 'Asia/Dubai' where id = 'OM';
update public.countries set latitude = 30, longitude = 70, fuseau_horaire = 'Asia/Karachi' where id = 'PK';
update public.countries set latitude = 9, longitude = -80, fuseau_horaire = 'America/Panama' where id = 'PA';
update public.countries set latitude = -25.06666666, longitude = -130.1, fuseau_horaire = 'Pacific/Pitcairn' where id = 'PN';
update public.countries set latitude = -10, longitude = -76, fuseau_horaire = 'America/Lima' where id = 'PE';
update public.countries set latitude = 13, longitude = 122, fuseau_horaire = 'Asia/Manila' where id = 'PH';
update public.countries set latitude = 7.5, longitude = 134.5, fuseau_horaire = 'Pacific/Palau' where id = 'PW';
update public.countries set latitude = -6, longitude = 147, fuseau_horaire = 'Pacific/Bougainville' where id = 'PG';
update public.countries set latitude = 52, longitude = 20, fuseau_horaire = 'Europe/Warsaw' where id = 'PL';
update public.countries set latitude = 18.25, longitude = -66.5, fuseau_horaire = 'America/Puerto_Rico' where id = 'PR';
update public.countries set latitude = 40, longitude = 127, fuseau_horaire = 'Asia/Pyongyang' where id = 'KP';
update public.countries set latitude = 39.5, longitude = -8, fuseau_horaire = 'Europe/Lisbon' where id = 'PT';
update public.countries set latitude = -23, longitude = -58, fuseau_horaire = 'America/Asuncion' where id = 'PY';
update public.countries set latitude = 31.9, longitude = 35.2, fuseau_horaire = 'Asia/Gaza' where id = 'PS';
update public.countries set latitude = -15, longitude = -140, fuseau_horaire = 'Pacific/Tahiti' where id = 'PF';
update public.countries set latitude = 25.5, longitude = 51.25, fuseau_horaire = 'Asia/Qatar' where id = 'QA';
update public.countries set latitude = -21.15, longitude = 55.5, fuseau_horaire = 'Asia/Dubai' where id = 'RE';
update public.countries set latitude = 46, longitude = 25, fuseau_horaire = 'Europe/Bucharest' where id = 'RO';
update public.countries set latitude = 60, longitude = 100, fuseau_horaire = 'Europe/Moscow' where id = 'RU';
update public.countries set latitude = -2, longitude = 30, fuseau_horaire = 'Africa/Kigali' where id = 'RW';
update public.countries set latitude = 25, longitude = 45, fuseau_horaire = 'Asia/Riyadh' where id = 'SA';
update public.countries set latitude = 15, longitude = 30, fuseau_horaire = 'Africa/Khartoum' where id = 'SD';
update public.countries set latitude = 14, longitude = -14, fuseau_horaire = 'Africa/Abidjan' where id = 'SN';
update public.countries set latitude = 1.36666666, longitude = 103.8, fuseau_horaire = 'Asia/Singapore' where id = 'SG';
update public.countries set latitude = -54.5, longitude = -37, fuseau_horaire = 'Atlantic/South_Georgia' where id = 'GS';
update public.countries set latitude = 78, longitude = 20, fuseau_horaire = 'Arctic/Longyearbyen' where id = 'SJ';
update public.countries set latitude = -8, longitude = 159, fuseau_horaire = 'Pacific/Guadalcanal' where id = 'SB';
update public.countries set latitude = 8.5, longitude = -11.5, fuseau_horaire = 'Africa/Abidjan' where id = 'SL';
update public.countries set latitude = 13.83333333, longitude = -88.91666666, fuseau_horaire = 'America/El_Salvador' where id = 'SV';
update public.countries set latitude = 43.76666666, longitude = 12.41666666, fuseau_horaire = 'Europe/Rome' where id = 'SM';
update public.countries set latitude = 10, longitude = 49, fuseau_horaire = 'Africa/Mogadishu' where id = 'SO';
update public.countries set latitude = 46.83333333, longitude = -56.33333333, fuseau_horaire = 'America/Miquelon' where id = 'PM';
update public.countries set latitude = 44, longitude = 21, fuseau_horaire = 'Europe/Belgrade' where id = 'RS';
update public.countries set latitude = 7, longitude = 30, fuseau_horaire = 'Africa/Juba' where id = 'SS';
update public.countries set latitude = 1, longitude = 7, fuseau_horaire = 'Africa/Sao_Tome' where id = 'ST';
update public.countries set latitude = 4, longitude = -56, fuseau_horaire = 'America/Paramaribo' where id = 'SR';
update public.countries set latitude = 48.66666666, longitude = 19.5, fuseau_horaire = 'Europe/Bratislava' where id = 'SK';
update public.countries set latitude = 46.11666666, longitude = 14.81666666, fuseau_horaire = 'Europe/Belgrade' where id = 'SI';
update public.countries set latitude = 62, longitude = 15, fuseau_horaire = 'Europe/Berlin' where id = 'SE';
update public.countries set latitude = -26.5, longitude = 31.5, fuseau_horaire = 'Africa/Johannesburg' where id = 'SZ';
update public.countries set latitude = 18.033333, longitude = -63.05, fuseau_horaire = 'America/Lower_Princes' where id = 'SX';
update public.countries set latitude = -4.58333333, longitude = 55.66666666, fuseau_horaire = 'Asia/Dubai' where id = 'SC';
update public.countries set latitude = 35, longitude = 38, fuseau_horaire = 'Asia/Damascus' where id = 'SY';
update public.countries set latitude = 21.75, longitude = -71.58333333, fuseau_horaire = 'America/Grand_Turk' where id = 'TC';
update public.countries set latitude = 15, longitude = 19, fuseau_horaire = 'Africa/Ndjamena' where id = 'TD';
update public.countries set latitude = 8, longitude = 1.16666666, fuseau_horaire = 'Africa/Abidjan' where id = 'TG';
update public.countries set latitude = 15, longitude = 100, fuseau_horaire = 'Asia/Bangkok' where id = 'TH';
update public.countries set latitude = 39, longitude = 71, fuseau_horaire = 'Asia/Dushanbe' where id = 'TJ';
update public.countries set latitude = -9, longitude = -172, fuseau_horaire = 'Pacific/Fakaofo' where id = 'TK';
update public.countries set latitude = 40, longitude = 60, fuseau_horaire = 'Asia/Ashgabat' where id = 'TM';
update public.countries set latitude = -8.83333333, longitude = 125.91666666, fuseau_horaire = 'Asia/Dili' where id = 'TL';
update public.countries set latitude = -20, longitude = -175, fuseau_horaire = 'Pacific/Tongatapu' where id = 'TO';
update public.countries set latitude = 11, longitude = -61, fuseau_horaire = 'America/Port_of_Spain' where id = 'TT';
update public.countries set latitude = 34, longitude = 9, fuseau_horaire = 'Africa/Tunis' where id = 'TN';
update public.countries set latitude = 39, longitude = 35, fuseau_horaire = 'Europe/Istanbul' where id = 'TR';
update public.countries set latitude = -8, longitude = 178, fuseau_horaire = 'Pacific/Funafuti' where id = 'TV';
update public.countries set latitude = 23.5, longitude = 121, fuseau_horaire = 'Asia/Taipei' where id = 'TW';
update public.countries set latitude = -6, longitude = 35, fuseau_horaire = 'Africa/Dar_es_Salaam' where id = 'TZ';
update public.countries set latitude = 1, longitude = 32, fuseau_horaire = 'Africa/Kampala' where id = 'UG';
update public.countries set latitude = 49, longitude = 32, fuseau_horaire = 'Europe/Kyiv' where id = 'UA';
update public.countries set latitude = 19.3, longitude = 166.633333, fuseau_horaire = 'Pacific/Midway' where id = 'UM';
update public.countries set latitude = -33, longitude = -56, fuseau_horaire = 'America/Montevideo' where id = 'UY';
update public.countries set latitude = 38, longitude = -97, fuseau_horaire = 'America/New_York' where id = 'US';
update public.countries set latitude = 41, longitude = 64, fuseau_horaire = 'Asia/Samarkand' where id = 'UZ';
update public.countries set latitude = 41.9, longitude = 12.45, fuseau_horaire = 'Europe/Rome' where id = 'VA';
update public.countries set latitude = 13.25, longitude = -61.2, fuseau_horaire = 'America/Puerto_Rico' where id = 'VC';
update public.countries set latitude = 8, longitude = -66, fuseau_horaire = 'America/Caracas' where id = 'VE';
update public.countries set latitude = 18.431383, longitude = -64.62305, fuseau_horaire = 'America/Puerto_Rico' where id = 'VG';
update public.countries set latitude = 18.35, longitude = -64.933333, fuseau_horaire = 'America/Puerto_Rico' where id = 'VI';
update public.countries set latitude = 16.16666666, longitude = 107.83333333, fuseau_horaire = 'Asia/Bangkok' where id = 'VN';
update public.countries set latitude = -16, longitude = 167, fuseau_horaire = 'Pacific/Efate' where id = 'VU';
update public.countries set latitude = -13.3, longitude = -176.2, fuseau_horaire = 'Pacific/Tarawa' where id = 'WF';
update public.countries set latitude = -13.58333333, longitude = -172.33333333, fuseau_horaire = 'Pacific/Apia' where id = 'WS';
update public.countries set latitude = 15, longitude = 48, fuseau_horaire = 'Asia/Aden' where id = 'YE';
update public.countries set latitude = -29, longitude = 24, fuseau_horaire = 'Africa/Johannesburg' where id = 'ZA';
update public.countries set latitude = -15, longitude = 30, fuseau_horaire = 'Africa/Lusaka' where id = 'ZM';
update public.countries set latitude = -20, longitude = 30, fuseau_horaire = 'Africa/Harare' where id = 'ZW';

-- ---------------------------------------------------------------------
-- population_max : le plus haut niveau de population jamais atteint.
-- Le niveau visuel (et, plus tard, le rendu 3D) se base dessus, jamais
-- sur la population du moment — une contamination (Jalon 4) fait
-- baisser la population affichée sans jamais faire "disparaître" de
-- bâtiments (cahier des charges §1 point 4, "pas de destruction
-- permanente"). Décision d'Adrien (docs/DECISIONS.md §10 point 11,
-- reco initiale de Claude chat), confirmée pour ce jalon.
-- ---------------------------------------------------------------------
alter table public.cities
  add column population_max integer not null default 1
    check (population_max >= population);

update public.cities set population_max = population;

-- ---------------------------------------------------------------------
-- is_test : villes/joueurs de test (docs/GUIDE-METHODE.md, section "Les
-- villes de test") — jamais en production, chargées uniquement en dev
-- et recette par scripts/charger-villes-test.mjs. Le pseudo doit être
-- préfixé "test_" quand is_test est vrai, pour qu'on les reconnaisse
-- d'un coup d'œil dans les données et les captures d'écran.
-- ---------------------------------------------------------------------
alter table public.users
  add column is_test boolean not null default false,
  add constraint users_is_test_pseudo_prefixe
    check (not is_test or pseudo like 'test\_%' escape '\');

alter table public.cities
  add column is_test boolean not null default false;

-- ---------------------------------------------------------------------
-- Nouveaux seuils de niveau (Métropole = 100 000 habitants — décision
-- d'Adrien, docs/DECISIONS.md §8 et §10 point 10), en remplacement des
-- seuils provisoires 5/15/30/60/120 choisis au Jalon 2 pour être
-- visibles avec une poignée de joueurs de test. Mise à jour en écho de
-- src/lib/game/niveauVille.ts (SEUILS_NIVEAU).
-- ---------------------------------------------------------------------
create or replace function public.population_vers_niveau(p_population integer)
returns integer
language sql
immutable
as $$
  select case
    when p_population >= 100000 then 5 -- Métropole
    when p_population >= 40000  then 4 -- Grande ville
    when p_population >= 15000  then 3 -- Ville
    when p_population >= 5000   then 2 -- Bourg
    when p_population >= 1000   then 1 -- Village
    else 0                              -- Hameau
  end;
$$;

-- Recalcule le niveau de toutes les villes existantes avec les
-- nouveaux seuils (sans quoi elles garderaient un niveau calculé avec
-- les anciens seuils jusqu'à leur prochaine visite/attaque).
update public.cities set niveau = public.population_vers_niveau(population_max);

-- ---------------------------------------------------------------------
-- visiter_ville (Jalon 2) redéfinie : met aussi à jour population_max,
-- et calcule niveau à partir de population_max (jamais de la
-- population instantanée).
-- ---------------------------------------------------------------------
create or replace function public.visiter_ville(
  p_visiteur_id uuid,
  p_ville_id uuid
)
returns public.cities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_ville public.cities;
begin
  if auth.uid() is not null and auth.uid() <> p_visiteur_id then
    raise exception 'visiter_ville: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select owner_id into v_owner_id from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'visiter_ville: ville introuvable' using errcode = 'P0004';
  end if;
  if v_owner_id = p_visiteur_id then
    raise exception 'visiter_ville: impossible de visiter sa propre ville' using errcode = 'P0005';
  end if;

  insert into public.visites (visiteur_id, ville_id) values (p_visiteur_id, p_ville_id);

  update public.cities
    set population = population + 1,
        population_max = greatest(population_max, population + 1),
        niveau = public.population_vers_niveau(greatest(population_max, population + 1))
    where id = p_ville_id
    returning * into v_ville;

  return v_ville;
end;
$$;

-- ---------------------------------------------------------------------
-- lancer_action_antiville (Jalon 4) redéfinie : la contamination réduit
-- population mais ne touche jamais population_max, et le niveau reste
-- calculé sur population_max — donc une contamination fait baisser le
-- chiffre affiché sans jamais faire régresser le niveau visuel de la
-- ville.
-- ---------------------------------------------------------------------
create or replace function public.lancer_action_antiville(
  p_attaquant_id uuid,
  p_ville_id uuid,
  p_type_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_population_avant integer;
  v_population_max_avant integer;
  v_jour date := (now() at time zone 'utc')::date;
  v_nb_aujourdhui integer;
  v_nb_recent integer;
  v_multiplicateur numeric;
  v_perte integer;
  v_ville public.cities;
begin
  if p_type_action not in ('greve', 'contamination', 'propagande') then
    raise exception 'lancer_action_antiville: type d''action invalide : %', p_type_action
      using errcode = 'P0006';
  end if;

  if auth.uid() is not null and auth.uid() <> p_attaquant_id then
    raise exception 'lancer_action_antiville: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select owner_id, population, population_max
    into v_owner_id, v_population_avant, v_population_max_avant
    from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'lancer_action_antiville: ville introuvable' using errcode = 'P0004';
  end if;
  if v_owner_id = p_attaquant_id then
    raise exception 'lancer_action_antiville: impossible de s''attaquer soi-même'
      using errcode = 'P0005';
  end if;

  select count(*) into v_nb_aujourdhui
    from public.actions_antiville
    where attaquant_id = p_attaquant_id and jour = v_jour;

  if v_nb_aujourdhui >= 3 then
    raise exception 'lancer_action_antiville: quota quotidien d''actions AntiVille atteint (3)'
      using errcode = 'P0001';
  end if;

  select count(*) into v_nb_recent
    from public.actions_antiville
    where attaquant_id = p_attaquant_id
      and ville_id = p_ville_id
      and created_at >= now() - interval '24 hours';

  if v_nb_recent >= 2 then
    raise exception 'lancer_action_antiville: protection anti-harcèlement active sur cette ville'
      using errcode = 'P0003';
  end if;

  v_multiplicateur := case when v_nb_recent = 0 then 1.0 else 0.5 end;

  insert into public.actions_antiville (attaquant_id, ville_id, type_action)
  values (p_attaquant_id, p_ville_id, p_type_action);

  if p_type_action = 'contamination' then
    v_perte := floor(greatest(v_population_avant * 0.10, 1) * v_multiplicateur);
    -- population_max et niveau ne bougent pas : la ville ne perd jamais
    -- de bâtiments visuellement.
    update public.cities
      set population = greatest(population - v_perte, 1)
      where id = p_ville_id
      returning * into v_ville;

  elsif p_type_action = 'propagande' then
    update public.cities
      set influence = greatest(influence - floor(2 * v_multiplicateur), 0)
      where id = p_ville_id
      returning * into v_ville;

  else -- greve
    update public.cities
      set greve_jusqua = now() + (interval '24 hours' * v_multiplicateur)
      where id = p_ville_id
      returning * into v_ville;
  end if;

  return jsonb_build_object(
    'ville', to_jsonb(v_ville),
    'effet_reduit', v_multiplicateur < 1.0
  );
end;
$$;

-- ---------------------------------------------------------------------
-- reclamer_bonus_jumelages (Jalon 5) redéfinie : met aussi à jour
-- population_max et niveau pour les deux villes.
-- ---------------------------------------------------------------------
create or replace function public.reclamer_bonus_jumelages(p_joueur_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma_ville_id uuid;
  v_jour date := (now() at time zone 'utc')::date;
  v_jumelage record;
  v_autre_ville_id uuid;
  v_autre_owner_id uuid;
  v_moi_actif boolean;
  v_autre_actif boolean;
  v_nb_bonus_accordes integer := 0;
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'reclamer_bonus_jumelages: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select city_id into v_ma_ville_id from public.users where id = p_joueur_id;
  if v_ma_ville_id is null then
    return jsonb_build_object('bonus_accordes', 0);
  end if;

  v_moi_actif := exists(
    select 1 from public.visites where visiteur_id = p_joueur_id and jour = v_jour
    union all
    select 1 from public.actions_influence where joueur_id = p_joueur_id and jour = v_jour
    union all
    select 1 from public.actions_antiville where attaquant_id = p_joueur_id and jour = v_jour
  );

  if not v_moi_actif then
    return jsonb_build_object('bonus_accordes', 0);
  end if;

  for v_jumelage in
    select * from public.jumelages
    where statut = 'actif'
      and (ville_proposante_id = v_ma_ville_id or ville_ciblee_id = v_ma_ville_id)
  loop
    v_autre_ville_id := case
      when v_jumelage.ville_proposante_id = v_ma_ville_id then v_jumelage.ville_ciblee_id
      else v_jumelage.ville_proposante_id
    end;

    select owner_id into v_autre_owner_id from public.cities where id = v_autre_ville_id;

    v_autre_actif := exists(
      select 1 from public.visites where visiteur_id = v_autre_owner_id and jour = v_jour
      union all
      select 1 from public.actions_influence where joueur_id = v_autre_owner_id and jour = v_jour
      union all
      select 1 from public.actions_antiville where attaquant_id = v_autre_owner_id and jour = v_jour
    );

    if not v_autre_actif then
      continue;
    end if;

    begin
      insert into public.jumelage_bonus (jumelage_id, jour) values (v_jumelage.id, v_jour);
    exception when unique_violation then
      continue; -- déjà accordé aujourd'hui pour ce jumelage
    end;

    update public.cities
      set population = population + 1,
          population_max = greatest(population_max, population + 1),
          niveau = public.population_vers_niveau(greatest(population_max, population + 1))
      where id = v_ma_ville_id;
    update public.cities
      set population = population + 1,
          population_max = greatest(population_max, population + 1),
          niveau = public.population_vers_niveau(greatest(population_max, population + 1))
      where id = v_autre_ville_id;
    v_nb_bonus_accordes := v_nb_bonus_accordes + 1;
  end loop;

  return jsonb_build_object('bonus_accordes', v_nb_bonus_accordes);
end;
$$;
