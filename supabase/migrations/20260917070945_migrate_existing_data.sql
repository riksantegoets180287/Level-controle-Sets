/*
# Migrate existing data from JSON file into Supabase tables

## What this migration does
Inserts all existing data from the JSON file (data/database.json) into the newly created Supabase tables:
1. 1 admin user
2. 3 card sets (Level 1, Level 2, Level 3)
3. 29 card pairs across all 3 sets

## Data being inserted
- admin_users: digitalevaardigheden@summacollege.nl with existing password hash
- card_sets: "Terugblik Level 1", "Eindspel level 2", "Eindspel Level 3"
- card_pairs: 12 pairs for Level 1, 7 pairs for Level 2, 10 pairs for Level 3

## Notes
1. Uses ON CONFLICT DO NOTHING so re-running won't create duplicates
2. Preserves original IDs for backward compatibility
3. Timestamps use the original created_at/updated_at values from the JSON file
*/

INSERT INTO admin_users (id, email, password_hash, created_at)
VALUES (
  'ee03ebda-97b7-4db7-9444-d1749c0f7185',
  'digitalevaardigheden@summacollege.nl',
  '0059677b1d3ea79707f78f6270fa6652:842604625f6db0b090933623b2e57e624775a0734e9ea1e3f6b98357617e03955a6eb15fdc81991cd7b96574fa2177db079ec5ed387fc6e75920838a76768984',
  '2026-09-14T11:54:16.575Z'
)
ON CONFLICT (id) DO NOTHING;

-- Card sets
INSERT INTO card_sets (id, title, description, instructions, slug, is_active, created_at, updated_at)
VALUES
  ('level1-summa-set-id', 'Terugblik Level 1', 'Digitale Vaardigheden: programma''s, accounts en beveiliging van het Summa College.', 'Zoek een groen en een blauw kaartje dat bij elkaar hoort.', 'eindspel-level-1', true, '2026-09-14T12:00:00.000Z', '2026-09-14T13:07:07.566Z'),
  ('2ce9b90b-e91b-47b1-a334-b5ba3173cc7b', 'Eindspel level 2', '', 'Zoek een groen en een blauw kaartje dat bij elkaar hoort.', 'veiligheid-online', true, '2026-09-14T11:54:16.575Z', '2026-09-14T12:55:34.173Z'),
  ('4df89a43-b24b-45fe-a47e-d3d69d46d440', 'Eindspel Level 3', 'Documenten maken en opmaken: Word, PDF, opslaan, delen en letters.', 'Zoek een groen en een blauw kaartje dat bij elkaar hoort.', 'eindspel-level-3', true, '2026-09-14T13:04:16.308Z', '2026-09-14T13:10:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- Card pairs for Level 2 (set: 2ce9b90b...)
INSERT INTO card_pairs (id, set_id, card_a_text, card_b_text, sort_order, created_at, updated_at)
VALUES
  ('39ef1af0-0dad-4ad7-80c2-15c0d052a4ad', '2ce9b90b-e91b-47b1-a334-b5ba3173cc7b', 'Phishing', 'Een nepbericht (e-mail of sms) waarmee criminelen inloggegevens of geld proberen te stelen.', 1, '2026-09-14T12:55:34.173Z', '2026-09-14T12:55:34.173Z'),
  ('40539dcb-5e1f-471c-91ac-c0751320578c', '2ce9b90b-e91b-47b1-a334-b5ba3173cc7b', 'Tweestapsverificatie (2FA)', 'Extra beveiliging naast je wachtwoord, zoals een eenmalige code via sms of app.', 2, '2026-09-14T12:55:34.173Z', '2026-09-14T12:55:34.173Z'),
  ('a2b1628d-c68b-4119-a351-3ced79470543', '2ce9b90b-e91b-47b1-a334-b5ba3173cc7b', 'Sterk wachtwoord', 'Minimaal 12 tekens met hoofdletters, kleine letters, cijfers en speciale symbolen.', 3, '2026-09-14T12:55:34.173Z', '2026-09-14T12:55:34.173Z'),
  ('1dbbe710-32d4-4a87-8dc6-b644be798d7f', '2ce9b90b-e91b-47b1-a334-b5ba3173cc7b', 'AVG / GDPR', 'De Europese wet die streng beschermt hoe bedrijven en scholen omgaan met jouw persoonsgegevens.', 4, '2026-09-14T12:55:34.173Z', '2026-09-14T12:55:34.173Z'),
  ('851c98ef-834e-4f10-a2eb-de69d87f4c81', '2ce9b90b-e91b-47b1-a334-b5ba3173cc7b', 'Ransomware (Gijzelsoftware)', 'Kwaadaardig computerprogramma dat al je bestanden blokkeert en losgeld eist.', 5, '2026-09-14T12:55:34.173Z', '2026-09-14T12:55:34.173Z'),
  ('ae3b42da-e7ba-47b7-9dea-f6b55c6d2bec', '2ce9b90b-e91b-47b1-a334-b5ba3173cc7b', 'Wachtwoordmanager', 'Een digitale kluis die al je unieke wachtwoorden veilig bewaart en automatisch invult.', 6, '2026-09-14T12:55:34.173Z', '2026-09-14T12:55:34.173Z'),
  ('b781b8f2-c52d-47c8-8715-78cf9194e1d5', '2ce9b90b-e91b-47b1-a334-b5ba3173cc7b', 'Back-up maken', 'Een reservekopie van belangrijke school- en werkbestanden opslaan in de veilige cloud.', 7, '2026-09-14T12:55:34.173Z', '2026-09-14T12:55:34.173Z')
ON CONFLICT (id) DO NOTHING;

-- Card pairs for Level 3 (set: 4df89a43...)
INSERT INTO card_pairs (id, set_id, card_a_text, card_b_text, sort_order, created_at, updated_at)
VALUES
  ('1d1923df-fdc1-4993-b054-37abced351bb', '4df89a43-b24b-45fe-a47e-d3d69d46d440', 'Document', 'Een bestand met tekst, afbeeldingen of tabellen', 1, '2026-09-14T13:15:00.000Z', '2026-09-14T13:15:00.000Z'),
  ('3dde8d11-317f-4dae-90c8-5158114f5e11', '4df89a43-b24b-45fe-a47e-d3d69d46d440', 'Alinea', 'Een stukje tekst dat bij elkaar hoort', 2, '2026-09-14T13:15:00.000Z', '2026-09-14T13:15:00.000Z'),
  ('829a9c28-78d4-4101-8c28-06ac8b077a21', '4df89a43-b24b-45fe-a47e-d3d69d46d440', 'Opslaan', 'Je werk bewaren zodat je het later terug kunt vinden', 3, '2026-09-14T13:15:00.000Z', '2026-09-14T13:15:00.000Z'),
  ('11f7c462-66a2-4a8e-8f11-f527743d97d2', '4df89a43-b24b-45fe-a47e-d3d69d46d440', 'Arceren/Markeren', 'Tekst een kleur geven om deze extra duidelijk te maken', 4, '2026-09-14T13:15:00.000Z', '2026-09-14T13:15:00.000Z'),
  ('eb27146d-b901-4ed3-824a-02f92e7f4501', '4df89a43-b24b-45fe-a47e-d3d69d46d440', 'PDF', 'Een bestand dat er op elke computer bijna hetzelfde uitziet', 5, '2026-09-14T13:15:00.000Z', '2026-09-14T13:15:00.000Z'),
  ('44486428-43e4-4bb7-be1a-302abf0f8a0c', '4df89a43-b24b-45fe-a47e-d3d69d46d440', 'Word', 'Een programma waarmee je teksten en documenten maakt', 6, '2026-09-14T13:15:00.000Z', '2026-09-14T13:15:00.000Z'),
  ('b0f7f170-165a-4be8-932c-cb5df959e54c', '4df89a43-b24b-45fe-a47e-d3d69d46d440', 'OneDrive', 'Een online plek waar je bestanden kunt bewaren', 7, '2026-09-14T13:15:00.000Z', '2026-09-14T13:15:00.000Z'),
  ('pair-l3-08', '4df89a43-b24b-45fe-a47e-d3d69d46d440', 'Delen', 'Iemand anders toegang geven tot jouw bestand', 8, '2026-09-14T13:15:00.000Z', '2026-09-14T13:15:00.000Z'),
  ('pair-l3-09', '4df89a43-b24b-45fe-a47e-d3d69d46d440', 'Lettertype', 'De vorm en stijl van letters', 9, '2026-09-14T13:15:00.000Z', '2026-09-14T13:15:00.000Z'),
  ('pair-l3-10', '4df89a43-b24b-45fe-a47e-d3d69d46d440', 'Lettergrootte', 'Hoe groot of klein de letters zijn', 10, '2026-09-14T13:15:00.000Z', '2026-09-14T13:15:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- Card pairs for Level 1 (set: level1-summa-set-id)
INSERT INTO card_pairs (id, set_id, card_a_text, card_b_text, sort_order, created_at, updated_at)
VALUES
  ('pair-l1-01', 'level1-summa-set-id', 'Is het programma waar je (huis)werk kunt vinden en inleveren', 'Canvas', 1, '2026-09-14T13:07:07.566Z', '2026-09-14T13:07:07.566Z'),
  ('pair-l1-02', 'level1-summa-set-id', 'Is een plaatje van jouw gezicht', 'Avatar', 2, '2026-09-14T13:07:07.566Z', '2026-09-14T13:07:07.566Z'),
  ('pair-l1-03', 'level1-summa-set-id', 'Is het programma waarmee je plaatjes of posters maakt', 'Canva', 3, '2026-09-14T13:07:07.566Z', '2026-09-14T13:07:07.566Z'),
  ('pair-l1-04', 'level1-summa-set-id', 'Dit doe je op wachtwoord.summacollege.nl', 'Wachtwoord aanpassen', 4, '2026-09-14T13:07:07.566Z', '2026-09-14T13:07:07.566Z'),
  ('pair-l1-05', 'level1-summa-set-id', 'Hieraan kun je OneDrive herkennen', 'Blauw Wolkje', 5, '2026-09-14T13:07:07.566Z', '2026-09-14T13:07:07.566Z'),
  ('pair-l1-06', 'level1-summa-set-id', 'Is een keuzedeel waar je examen in kunt doen', 'Digitale Vaardigheden', 6, '2026-09-14T13:07:07.566Z', '2026-09-14T13:07:07.566Z'),
  ('pair-l1-07', 'level1-summa-set-id', 'Hier sla je jouw gemaakte werk op (opslaan)', 'OneDrive', 7, '2026-09-14T13:07:07.566Z', '2026-09-14T13:07:07.566Z'),
  ('pair-l1-08', 'level1-summa-set-id', 'Is als je een opdracht niet goed genoeg hebt gemaakt', 'Onvoldoende', 8, '2026-09-14T13:07:07.566Z', '2026-09-14T13:07:07.566Z'),
  ('pair-l1-09', 'level1-summa-set-id', 'Dit doe je met de WAVE ID app', 'MFA', 9, '2026-09-14T13:07:07.566Z', '2026-09-14T13:07:07.566Z'),
  ('pair-l1-10', 'level1-summa-set-id', 'Hiermee kun je een screenshot maken', 'Knipprogramma', 10, '2026-09-14T13:07:07.566Z', '2026-09-14T13:07:07.566Z'),
  ('pair-l1-11', 'level1-summa-set-id', 'Is een extra beveiliging van het Summa', 'Printen', 11, '2026-09-14T13:07:07.566Z', '2026-09-14T13:07:07.566Z'),
  ('pair-l1-12', 'level1-summa-set-id', 'Is een app waar je jouw rooster kunt kijken', 'Eduarte', 12, '2026-09-14T13:07:07.566Z', '2026-09-14T13:07:07.566Z')
ON CONFLICT (id) DO NOTHING;