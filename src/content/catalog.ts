export type CatalogCategory =
  | 'baustein'
  | 'pflanze'
  | 'tier'
  | 'gebaeude'
  | 'fahrzeug'
  | 'deko'
  | 'hat'
  | 'cape'
  | 'backpack'
  | 'hopEffect';

export interface CatalogItem {
  id: string;
  name: string;
  category: CatalogCategory;
  price: number;
  primaryHex: string;
  secondaryHex: string;
  shape:
    | 'block'
    | 'flower'
    | 'tree'
    | 'bush'
    | 'sheep'
    | 'duck'
    | 'dog'
    | 'cat'
    | 'frog'
    | 'house'
    | 'tower'
    | 'windmill'
    | 'bridge'
    | 'car'
    | 'train'
    | 'boat'
    | 'balloon'
    | 'lamp'
    | 'bench'
    | 'fountain'
    | 'flag'
    | 'hat'
    | 'crown'
    | 'cap'
    | 'cape'
    | 'backpack'
    | 'effect';
  description: string;
}

export interface AlbumSticker {
  id: string;
  seriesId: string;
  title: string;
  fact: string;
  primaryHex: string;
  secondaryHex: string;
  motif: string;
  imageUrl: string;
}

export interface AlbumSeries {
  id: string;
  title: string;
  subtitle: string;
  accentHex: string;
  surfaceHex: string;
  stickers: AlbumSticker[];
}

export interface PuzzlePicture {
  id: string;
  title: string;
  category: string;
  description: string;
  piecesCount: number;
}

// 48 Catalog Items (Fixed transparent prices 10–280 coins per Spec 7.2)
export const CATALOG_ITEMS: CatalogItem[] = [
  // Bausteine (8)
  { id: 'block_grass', name: 'Wiesenklotz', category: 'baustein', price: 10, primaryHex: '#4ADE80', secondaryHex: '#16A34A', shape: 'block', description: 'Ein frischer grüner Wiesenstein.' },
  { id: 'block_wood', name: 'Holzklotz', category: 'baustein', price: 12, primaryHex: '#D97706', secondaryHex: '#92400E', shape: 'block', description: 'Warmer Eichenstein zum Bauen.' },
  { id: 'block_stone', name: 'Felsklotz', category: 'baustein', price: 14, primaryHex: '#94A3B8', secondaryHex: '#475569', shape: 'block', description: 'Stabiler grauer Burgstein.' },
  { id: 'block_water', name: 'Wasserklotz', category: 'baustein', price: 16, primaryHex: '#38BDF8', secondaryHex: '#0284C7', shape: 'block', description: 'Leuchtend blauer Teichstein.' },
  { id: 'block_sand', name: 'Sandklotz', category: 'baustein', price: 15, primaryHex: '#FDE047', secondaryHex: '#CA8A04', shape: 'block', description: 'Sonniger Strandklotz.' },
  { id: 'block_brick', name: 'Ziegelklotz', category: 'baustein', price: 18, primaryHex: '#FB7185', secondaryHex: '#BE123C', shape: 'block', description: 'Roter Backstein für Mauern.' },
  { id: 'block_crystal', name: 'Kristallklotz', category: 'baustein', price: 32, primaryHex: '#A78BFA', secondaryHex: '#6D28D9', shape: 'block', description: 'Glitzernder lila Schatzstein.' },
  { id: 'block_gold_tile', name: 'Goldfliese', category: 'baustein', price: 40, primaryHex: '#FBBF24', secondaryHex: '#B45309', shape: 'block', description: 'Edel glänzender Wegstein.' },

  // Pflanzen (6)
  { id: 'plant_daisy', name: 'Gänseblümchen', category: 'pflanze', price: 14, primaryHex: '#FEF08A', secondaryHex: '#22C55E', shape: 'flower', description: 'Wiegt sich fröhlich im Wind.' },
  { id: 'plant_tulip', name: 'Rote Tulpe', category: 'pflanze', price: 18, primaryHex: '#F43F5E', secondaryHex: '#16A34A', shape: 'flower', description: 'Leuchtet rot auf deiner Insel.' },
  { id: 'plant_oak', name: 'Klötzchen-Eiche', category: 'pflanze', price: 28, primaryHex: '#22C55E', secondaryHex: '#92400E', shape: 'tree', description: 'Spendet Schatten für dein Tier.' },
  { id: 'plant_pine', name: 'Tannenbaum', category: 'pflanze', price: 30, primaryHex: '#059669', secondaryHex: '#78350F', shape: 'tree', description: 'Eine bayerische Bergtanne.' },
  { id: 'plant_berry', name: 'Beerenbusch', category: 'pflanze', price: 22, primaryHex: '#10B981', secondaryHex: '#E11D48', shape: 'bush', description: 'Trägt kleine rote Beeren.' },
  { id: 'plant_sunflower', name: 'Sonnenblume', category: 'pflanze', price: 26, primaryHex: '#FACC15', secondaryHex: '#15803D', shape: 'flower', description: 'Strahlt höher als alle anderen.' },

  // Tiere (6)
  { id: 'animal_duck', name: 'Teich-Entchen', category: 'tier', price: 42, primaryHex: '#FACC15', secondaryHex: '#EA580C', shape: 'duck', description: 'Quakt leise am Wasser.' },
  { id: 'animal_sheep', name: 'Wollschaf', category: 'tier', price: 48, primaryHex: '#F8FAFC', secondaryHex: '#334155', shape: 'sheep', description: 'Kuschelig auf der grünen Wiese.' },
  { id: 'animal_frog', name: 'Laubfrosch', category: 'tier', price: 45, primaryHex: '#4ADE80', secondaryHex: '#15803D', shape: 'frog', description: 'Hüpft gern um die Wette.' },
  { id: 'animal_cat', name: 'Bauernhof-Katze', category: 'tier', price: 58, primaryHex: '#FB923C', secondaryHex: '#9A3412', shape: 'cat', description: 'Schnurrt neben dem Häuschen.' },
  { id: 'animal_dog', name: 'Hofhund Bello', category: 'tier', price: 65, primaryHex: '#D97706', secondaryHex: '#78350F', shape: 'dog', description: 'Passt auf alle Klötzchen auf.' },
  { id: 'animal_pony', name: 'Insel-Pony', category: 'tier', price: 78, primaryHex: '#B45309', secondaryHex: '#FDE68A', shape: 'sheep', description: 'Ein treuer Freund für weite Wege.' },

  // Gebäude & Teile (8)
  { id: 'build_hut', name: 'Holzhüttchen', category: 'gebaeude', price: 75, primaryHex: '#F59E0B', secondaryHex: '#78350F', shape: 'house', description: 'Ein gemütliches kleines Haus.' },
  { id: 'build_barn', name: 'Rote Scheune', category: 'gebaeude', price: 95, primaryHex: '#EF4444', secondaryHex: '#FFFFFF', shape: 'house', description: 'Platz für Heu und Tiere.' },
  { id: 'build_tower', name: 'Aussichtsturm', category: 'gebaeude', price: 110, primaryHex: '#64748B', secondaryHex: '#2563EB', shape: 'tower', description: 'Von hier sieht man alle 5 Welten.' },
  { id: 'build_windmill', name: 'Windmühle', category: 'gebaeude', price: 135, primaryHex: '#FDE047', secondaryHex: '#B45309', shape: 'windmill', description: 'Mit großen Klötzchen-Flügeln.' },
  { id: 'build_bridge', name: 'Bogenbrücke', category: 'gebaeude', price: 60, primaryHex: '#D97706', secondaryHex: '#0EA5E9', shape: 'bridge', description: 'Verbindet zwei Insel-Ufer.' },
  { id: 'build_bakery', name: 'Brezel-Bäckerei', category: 'gebaeude', price: 150, primaryHex: '#FBBF24', secondaryHex: '#9A3412', shape: 'house', description: 'Hier duftet es nach frischen Brezeln.' },
  { id: 'build_castle', name: 'Kleine Ritterburg', category: 'gebaeude', price: 220, primaryHex: '#8B5CF6', secondaryHex: '#4C1D95', shape: 'tower', description: 'Das große Meisterbauwerk der Insel.' },
  { id: 'build_observatory', name: 'Sternwarte', category: 'gebaeude', price: 240, primaryHex: '#1D4ED8', secondaryHex: '#FACC15', shape: 'tower', description: 'Zum Zählen der Sterne.' },

  // Fahrzeuge (5)
  { id: 'veh_cart', name: 'Bollerwagen', category: 'fahrzeug', price: 50, primaryHex: '#EF4444', secondaryHex: '#78350F', shape: 'car', description: 'Transportiert bunte Bausteine.' },
  { id: 'veh_boat', name: 'Segelboot', category: 'fahrzeug', price: 85, primaryHex: '#38BDF8', secondaryHex: '#FFFFFF', shape: 'boat', description: 'Schaukelt auf Wasserklötzchen.' },
  { id: 'veh_tractor', name: 'Wiesentraktor', category: 'fahrzeug', price: 115, primaryHex: '#16A34A', secondaryHex: '#1E293B', shape: 'car', description: 'Stark für schwere Steine.' },
  { id: 'veh_train', name: 'Zahlen-Lok', category: 'fahrzeug', price: 145, primaryHex: '#2563EB', secondaryHex: '#F43F5E', shape: 'train', description: 'Tuckert fröhlich über die Insel.' },
  { id: 'veh_balloon', name: 'Heißluftballon', category: 'fahrzeug', price: 190, primaryHex: '#EC4899', secondaryHex: '#FACC15', shape: 'balloon', description: 'Schwebt hoch über der Bauplatte.' },

  // Deko (5)
  { id: 'deco_lamp', name: 'Laterne', category: 'deko', price: 24, primaryHex: '#FDE047', secondaryHex: '#334155', shape: 'lamp', description: 'Leuchtet abends ganz warm.' },
  { id: 'deco_bench', name: 'Holzbank', category: 'deko', price: 25, primaryHex: '#B45309', secondaryHex: '#78350F', shape: 'bench', description: 'Zum Ausruhen nach dem Hüpfen.' },
  { id: 'deco_fountain', name: 'Brunnen', category: 'deko', price: 72, primaryHex: '#38BDF8', secondaryHex: '#94A3B8', shape: 'fountain', description: 'Plätschert kühl in der Mitte.' },
  { id: 'deco_flag', name: 'Wimpel-Fahne', category: 'deko', price: 28, primaryHex: '#E11D48', secondaryHex: '#F59E0B', shape: 'flag', description: 'Zeigt, wer hier baut!' },
  { id: 'deco_pavilion', name: 'Fest-Pavillon', category: 'deko', price: 120, primaryHex: '#F472B6', secondaryHex: '#FBBF24', shape: 'house', description: 'Für kleine Entdeckerfeste.' },

  // Tier-Accessoires: Hüte (4)
  { id: 'hat_cap', name: 'Entdecker-Mütze', category: 'hat', price: 35, primaryHex: '#2563EB', secondaryHex: '#93C5FD', shape: 'cap', description: 'Coole blaue Schirmmütze fürs Tier.' },
  { id: 'hat_straw', name: 'Sonnenhut', category: 'hat', price: 45, primaryHex: '#FDE047', secondaryHex: '#D97706', shape: 'hat', description: 'Schützt beim Sonnen auf der Insel.' },
  { id: 'hat_wizard', name: 'Zahlen-Zauberhut', category: 'hat', price: 90, primaryHex: '#7C3AED', secondaryHex: '#FACC15', shape: 'hat', description: 'Mit funkelnden Sternen.' },
  { id: 'hat_crown', name: 'Rechen-Krone', category: 'hat', price: 160, primaryHex: '#FBBF24', secondaryHex: '#B45309', shape: 'crown', description: 'Die goldene Krone für Rechenprofis.' },

  // Umhänge & Rucksäcke (4)
  { id: 'cape_hero', name: 'Roter Umhang', category: 'cape', price: 65, primaryHex: '#E11D48', secondaryHex: '#FB7185', shape: 'cape', description: 'Flattert bei jedem Sprung!' },
  { id: 'cape_star', name: 'Sternen-Umhang', category: 'cape', price: 125, primaryHex: '#1D4ED8', secondaryHex: '#FACC15', shape: 'cape', description: 'Nachtblau mit goldenem Saum.' },
  { id: 'pack_explorer', name: 'Forscher-Rucksack', category: 'backpack', price: 55, primaryHex: '#059669', secondaryHex: '#D97706', shape: 'backpack', description: 'Platz für kleine Schatzklötzchen.' },
  { id: 'pack_rocket', name: 'Düsen-Rucksack', category: 'backpack', price: 180, primaryHex: '#64748B', secondaryHex: '#F97316', shape: 'backpack', description: 'Sieht superschnell aus!' },

  // Hüpf-Effekte (2)
  { id: 'fx_sparkle', name: 'Glitzer-Spur', category: 'hopEffect', price: 95, primaryHex: '#FACC15', secondaryHex: '#38BDF8', shape: 'effect', description: 'Kleine Sterne glitzern beim Hüpfen.' },
  { id: 'fx_rainbow', name: 'Regenbogen-Staub', category: 'hopEffect', price: 260, primaryHex: '#EC4899', secondaryHex: '#22C55E', shape: 'effect', description: 'Bunte Klötzchen-Funken bei jedem Sprung!' },
];

const STICKER_EXPRESSIONS = [
  'Hallo!',
  'Jubel-Sprung',
  'Schlau geschaut',
  'Kicher-Spaß',
  'Daumen hoch',
  'Herzchen-Gruß',
  'Tanz-Runde',
  'Staun-Blick',
  'Pause & Snack',
  'Superstar',
  'Entdecker-Mut',
  'Freunde-Winken',
  'Glitzer-Laune',
  'Kuschel-Moment',
  'Flitz-Tempo',
  'Denker-Pause',
  'Rätsel-Fuchs',
  'Sonnenstrahl',
  'Zahlen-Profi',
  'Meister-Tanz',
  'Wunder-Fund',
  'Party-Hütchen',
  'Traum-Wolke',
  'Sternen-Griff',
  'Bunte Klötzchen',
  'Trommel-Wirbel',
  'Abenteuer-Start',
  'Geheim-Tipp',
  'Gute-Laune-Hüpfer',
  'Zauber-Trick',
  'Schlummer-Ruhe',
  'Kletter-Ass',
  'Rückenwind',
  'Schatz-Finder',
  'Kleine Pause',
  'Mut-Fänger',
  'Raketen-Start',
  'Lustiges Zwinkern',
  'Gold-Klötzchen',
  'Finale-Jubel',
  'Ehren-Sticker',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

interface GifPackSpec {
  id: string;
  idPrefix: string;
  folder: string;
  filePrefix: string;
  count: number;
  title: string;
  subtitle: string;
  characterNoun: string;
  accentHex: string;
  surfaceHex: string;
  facts: string[];
}

function buildGifSeries(spec: GifPackSpec): AlbumSeries {
  const stickers: AlbumSticker[] = [];
  for (let i = 1; i <= spec.count; i++) {
    const expr = STICKER_EXPRESSIONS[(i - 1) % STICKER_EXPRESSIONS.length];
    const fact = spec.facts[(i - 1) % spec.facts.length];
    stickers.push({
      id: `${spec.idPrefix}_${i}`,
      seriesId: spec.id,
      title: `${spec.characterNoun}: ${expr}`,
      fact,
      primaryHex: spec.accentHex,
      secondaryHex: '#334155',
      motif: spec.id,
      imageUrl: `/assets/stickers/${spec.folder}/${spec.filePrefix}-${pad2(i)}.gif`,
    });
  }
  return {
    id: spec.id,
    title: spec.title,
    subtitle: spec.subtitle,
    accentHex: spec.accentHex,
    surfaceHex: spec.surfaceHex,
    stickers,
  };
}

export const ALBUM_SERIES: AlbumSeries[] = [
  {
    id: 'panda',
    title: 'Freundliche Pandas',
    subtitle: '21 animierte Panda-Sticker für dein Album',
    accentHex: '#059669',
    surfaceHex: '#ECFDF5',
    stickers: [
      { id: 'st_pd_1', seriesId: 'panda', title: 'Hallo Panda!', fact: 'Große Pandas winken oft fröhlich, bevor sie sich in den Bambus setzen.', primaryHex: '#34D399', secondaryHex: '#065F46', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-01.gif' },
      { id: 'st_pd_2', seriesId: 'panda', title: 'Bambus-Schmaus', fact: 'Ein Panda futtert bis zu 12 Stunden am Tag frischen grünen Bambus.', primaryHex: '#10B981', secondaryHex: '#047857', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-02.gif' },
      { id: 'st_pd_3', seriesId: 'panda', title: 'Herz-Panda', fact: 'Pandas haben weiches schwarz-weißes Fell, das sie im Bergnebel wärmt.', primaryHex: '#FB7185', secondaryHex: '#E11D48', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-03.gif' },
      { id: 'st_pd_4', seriesId: 'panda', title: 'Jubel-Panda', fact: 'Kleine Pandas purzeln voller Freude gern rückwärts den Hang hinunter!', primaryHex: '#FBBF24', secondaryHex: '#B45309', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-04.gif' },
      { id: 'st_pd_5', seriesId: 'panda', title: 'Schlummer-Panda', fact: 'Nach einem langen Rechen-Tag macht der Panda ein gemütliches Nickerchen.', primaryHex: '#93C5FD', secondaryHex: '#1D4ED8', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-05.gif' },
      { id: 'st_pd_6', seriesId: 'panda', title: 'Staune-Panda', fact: 'Pandas erkennen viele Formen und Muster in ihrem Bambuswald sofort.', primaryHex: '#A78BFA', secondaryHex: '#6D28D9', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-06.gif' },
      { id: 'st_pd_7', seriesId: 'panda', title: 'Kicher-Panda', fact: 'Wenn Pandas spielen, geben sie leise blökende und kichernde Laute von sich.', primaryHex: '#FDE047', secondaryHex: '#CA8A04', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-07.gif' },
      { id: 'st_pd_8', seriesId: 'panda', title: 'Daumen-Hoch-Panda', fact: 'Pandas besitzen einen besonderen „Extra-Daumen“ an der Pfote zum Greifen!', primaryHex: '#22C55E', secondaryHex: '#15803D', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-08.gif' },
      { id: 'st_pd_9', seriesId: 'panda', title: 'Kuschel-Panda', fact: 'Panda-Babys sind bei der Geburt winzig – kleiner als ein Schulheft.', primaryHex: '#F472B6', secondaryHex: '#BE185D', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-09.gif' },
      { id: 'st_pd_10', seriesId: 'panda', title: 'Denker-Panda', fact: 'Mit Ruhe und einem klaren Kopf löst auch der Panda jede Zahl!', primaryHex: '#38BDF8', secondaryHex: '#0284C7', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-10.gif' },
      { id: 'st_pd_11', seriesId: 'panda', title: 'Tanz-Panda', fact: 'Rhythmus und gute Laune helfen sogar beim Zählen in Zehnerschritten!', primaryHex: '#F97316', secondaryHex: '#C2410C', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-11.gif' },
      { id: 'st_pd_12', seriesId: 'panda', title: 'Überraschungs-Panda', fact: 'Manchmal purzeln tolle neue Ideen schneller aus der Truhe als gedacht!', primaryHex: '#8B5CF6', secondaryHex: '#5B21B6', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-12.gif' },
      { id: 'st_pd_13', seriesId: 'panda', title: 'Teatime-Panda', fact: 'Nach fünf kniffligen Aufgaben schmeckt ein warmes Getränk gleich doppelt gut.', primaryHex: '#14B8A6', secondaryHex: '#0F766E', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-13.gif' },
      { id: 'st_pd_14', seriesId: 'panda', title: 'Leser-Panda', fact: 'Zahlen und Buchstaben lesen sich besonders leicht mit bunten Markierungen.', primaryHex: '#3B82F6', secondaryHex: '#1E40AF', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-14.gif' },
      { id: 'st_pd_15', seriesId: 'panda', title: 'Sternchen-Panda', fact: 'Wer konzentriert übt, sammelt blitzschnell drei funkelnde Sterne.', primaryHex: '#FACC15', secondaryHex: '#A16207', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-15.gif' },
      { id: 'st_pd_16', seriesId: 'panda', title: 'Kletter-Panda', fact: 'Große Pandas klettern mühelos hohe Bäume hinauf, um sich umzusehen.', primaryHex: '#16A34A', secondaryHex: '#14532D', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-16.gif' },
      { id: 'st_pd_17', seriesId: 'panda', title: 'Entdecker-Panda', fact: 'Auf der Suche nach neuen Wegen entdeckt man spannende Zahlenmuster.', primaryHex: '#0EA5E9', secondaryHex: '#0369A1', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-17.gif' },
      { id: 'st_pd_18', seriesId: 'panda', title: 'Blumen-Panda', fact: 'Zwischen hohen Bambushalmen blühen im Frühling bunte Bergblumen.', primaryHex: '#EC4899', secondaryHex: '#9D174D', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-18.gif' },
      { id: 'st_pd_19', seriesId: 'panda', title: 'Super-Panda', fact: 'Mit Mut und Ausdauer knacken kleine Entdecker auch die Zahlenmauer!', primaryHex: '#EF4444', secondaryHex: '#991B1B', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-19.gif' },
      { id: 'st_pd_20', seriesId: 'panda', title: 'Regenbogen-Panda', fact: 'Nach dem Üben strahlen alle Klötzchenfarben wie ein Regenbogen.', primaryHex: '#6366F1', secondaryHex: '#3730A3', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-20.gif' },
      { id: 'st_pd_21', seriesId: 'panda', title: 'Meister-Panda', fact: 'Du hast alle 21 Panda-Freunde auf deinem Abenteuer entdeckt!', primaryHex: '#F59E0B', secondaryHex: '#78350F', motif: 'panda', imageUrl: '/assets/stickers/FriendlyPanda/Friendly_Panda-21.gif' },
    ],
  },
  buildGifSeries({
    id: 'elephant',
    idPrefix: 'st_el',
    folder: 'WildElephant',
    filePrefix: 'WildElephant',
    count: 26,
    title: 'Wilder Elefant',
    subtitle: '26 fröhliche Elefanten-Sticker mit Rüssel-Spaß',
    characterNoun: 'Elefant',
    accentHex: '#0284C7',
    surfaceHex: '#F0F9FF',
    facts: [
      'Elefanten können mit ihrem Rüssel sogar winzige Erdnüsse aufheben!',
      'Elefanten merken sich Wasserstellen über viele Kilometer hinweg.',
      'Mit ihren großen Ohren fächeln sich Elefanten bei Hitze frische Luft zu.',
      'Elefanten begrüßen ihre Freunde gern mit verschlungenen Rüsseln.',
      'Ein junger Elefant springt voller Freude in jede kühle Pfütze.',
    ],
  }),
  buildGifSeries({
    id: 'pinguin',
    idPrefix: 'st_pg',
    folder: 'LittlePinguin',
    filePrefix: 'Little_Penguin',
    count: 20,
    title: 'Kleiner Pinguin',
    subtitle: '20 witzige Pinguin-Sticker aus dem Eis',
    characterNoun: 'Pinguin',
    accentHex: '#0EA5E9',
    surfaceHex: '#ECFEFF',
    facts: [
      'Pinguine können nicht fliegen, flitzen dafür aber pfeilschnell durchs Wasser!',
      'Auf dem Bauch rutschen Pinguine blitzschnell über glatten Schnee.',
      'Pinguine erkennen sich am Ruf unter hunderten Freunden sofort wieder.',
      'Ihr dichtes Federkleid hält im kalten Meer wunderbar trocken und warm.',
    ],
  }),
  buildGifSeries({
    id: 'cat2o',
    idPrefix: 'st_c2',
    folder: 'Cat2O',
    filePrefix: 'Cat2O',
    count: 30,
    title: 'Freche Katze Cat2O',
    subtitle: '30 quirlige Katzen-Sticker voller Ideen',
    characterNoun: 'Cat2O',
    accentHex: '#F97316',
    surfaceHex: '#FFF7ED',
    facts: [
      'Katzen landen dank ihres Gleichgewichts meistens ganz weich auf den Pfoten.',
      'Mit ihren Schnurrhaaren messen Katzen ab, ob sie durch eine Lücke passen.',
      'Wenn Katzen sich wohlfühlen, schnurren sie wie ein kleiner Motor.',
      'Katzen können fünfmal höher springen als sie selbst groß sind!',
    ],
  }),
  buildGifSeries({
    id: 'goose',
    idPrefix: 'st_gs',
    folder: 'FunkyGoose',
    filePrefix: 'FunkyGoose',
    count: 41,
    title: 'Funky Gans',
    subtitle: '41 verrückte Gänse-Sticker mit ganz viel Schwung',
    characterNoun: 'Funky Gans',
    accentHex: '#D97706',
    surfaceHex: '#FFFBEB',
    facts: [
      'Gänse fliegen im Herbst in einem großen V am Himmel – so sparen sie Kraft!',
      'Junge Gänseküken watscheln sofort neugierig hinter ihren Eltern her.',
      'Gänse haben wasserfeste Federn und lieben ein Bad im glitzernden See.',
      'Wenn eine Gans etwas entdeckt, schnattert sie fröhlich für alle anderen.',
    ],
  }),
  buildGifSeries({
    id: 'bear',
    idPrefix: 'st_br',
    folder: 'BearBoris',
    filePrefix: 'BearBoris',
    count: 20,
    title: 'Bär Boris',
    subtitle: '20 starke und gemütliche Bären-Sticker',
    characterNoun: 'Bär Boris',
    accentHex: '#92400E',
    surfaceHex: '#FEF3C7',
    facts: [
      'Bären riechen frische Waldbeeren schon aus sehr weiter Ferne.',
      'Im Winter kuscheln sich Bären gemütlich in ihre warme Höhle ein.',
      'Bären können erstaunlich gut klettern und lieben reifes Obst.',
      'Ein Bären-High-Five bringt gute Laune für die nächste Rechenrunde!',
    ],
  }),
  buildGifSeries({
    id: 'gorilla',
    idPrefix: 'st_hg',
    folder: 'HarryGorilla',
    filePrefix: 'HarryGorilla',
    count: 27,
    title: 'Harry Gorilla',
    subtitle: '27 bärenstarke Gorilla-Sticker',
    characterNoun: 'Harry',
    accentHex: '#4F46E5',
    surfaceHex: '#EEF2FF',
    facts: [
      'Gorillas bauen sich jeden Abend ein frisches gemütliches Schlafnest aus Blättern.',
      'Trotz ihrer großen Kraft sind Gorillas sanfte Pflanzenfresser.',
      'Gorillas trommeln manchmal spielerisch auf die Brust, um Hallo zu sagen.',
      'Jeder Gorilla hat ein ganz eigenes Nasenmuster – wie ein Fingerabdruck!',
    ],
  }),
  buildGifSeries({
    id: 'arachnid',
    idPrefix: 'st_ar',
    folder: 'Arachnid',
    filePrefix: 'Arachnid',
    count: 30,
    title: 'Kleine Netz-Spinne',
    subtitle: '30 niedliche Spinnen-Sticker mit acht flinken Beinen',
    characterNoun: 'Spinne',
    accentHex: '#7C3AED',
    surfaceHex: '#F5F3FF',
    facts: [
      'Mit acht flinken Beinen zählt die kleine Spinne blitzschnell bis acht!',
      'Spinnenseide ist federleicht und trotzdem reißfester als ein dünner Draht.',
      'Manche Spinnen weben jeden Morgen ein funkelndes neues Radnetz.',
      'Kleine Springspinnen können riesige Sätze über Blätter hinweg hüpfen.',
    ],
  }),
  buildGifSeries({
    id: 'owl',
    idPrefix: 'st_ow',
    folder: 'OwlDidi',
    filePrefix: 'OwledDidi',
    count: 24,
    title: 'Eule Didi',
    subtitle: '24 schlaue Eulen-Sticker für kluge Rechner',
    characterNoun: 'Eule Didi',
    accentHex: '#0D9488',
    surfaceHex: '#F0FDFA',
    facts: [
      'Eulen hören selbst das leiseste Rascheln im Laub mit ihren super Ohren.',
      'Ihre weichen Federn machen Eulen beim Fliegen fast völlig lautlos.',
      'Eulen können ihren Kopf weit herumdrehen, um alles genau zu beobachten.',
      'Wer wie Eule Didi genau hinschaut, entdeckt jeden Rechentrick sofort!',
    ],
  }),
  buildGifSeries({
    id: 'mimegirl',
    idPrefix: 'st_mg',
    folder: 'MimeGirl',
    filePrefix: 'MimeGirl',
    count: 20,
    title: 'Pantomime-Mädchen',
    subtitle: '20 lustige Theater-Sticker voller Gesten',
    characterNoun: 'MimeGirl',
    accentHex: '#EC4899',
    surfaceHex: '#FDF2F8',
    facts: [
      'Beim Pantomime-Spiel erzählt man ganze Geschichten ohne ein einziges Wort!',
      'Mit Händen, Füßen und Gesicht lassen sich unsichtbare Wände zaubern.',
      'Zirkus- und Theaterkünstler üben jeden Tag lustige Bewegungen und Sprünge.',
      'Manchmal hilft eine kleine Handbewegung sogar beim Rechnen im Kopf!',
    ],
  }),
  buildGifSeries({
    id: 'catcula',
    idPrefix: 'st_cc',
    folder: 'Catcula',
    filePrefix: 'CatculaO',
    count: 10,
    title: 'Grusel-Katze Catcula',
    subtitle: '10 lustige kleine Nacht-Katzen-Sticker',
    characterNoun: 'Catcula',
    accentHex: '#6D28D9',
    surfaceHex: '#FAF5FF',
    facts: [
      'Katzenaugen leuchten in der Dämmerung, weil sie Restlicht super einfangen.',
      'Mit kleinem Umhang sieht Catcula eher niedlich als gruselig aus!',
      'Nachts schleichen kleine Samtpfoten ganz leise über den Dachboden.',
      'Auch kleine Nachtschwärmer lieben süße Überraschungen aus der Truhe.',
    ],
  }),
  buildGifSeries({
    id: 'hamster',
    idPrefix: 'st_hb',
    folder: 'HamsterBernard',
    filePrefix: 'HamsterBernard',
    count: 25,
    title: 'Hamster Bernard',
    subtitle: '25 wuselige Hamster-Sticker mit dicken Backen',
    characterNoun: 'Bernard',
    accentHex: '#EA580C',
    surfaceHex: '#FFF7ED',
    facts: [
      'In seinen dehnbaren Backentaschen trägt ein Hamster viele Körner auf einmal!',
      'Hamster sind echte Baumeister und graben lange gemütliche Gänge.',
      'Abends wird Bernard hellwach und flitzt voller Energie durch sein Rad.',
      'Mit flinken Pfötchen putzt sich der Hamster sein glänzendes Fell blitzblank.',
    ],
  }),
  buildGifSeries({
    id: 'dachshund',
    idPrefix: 'st_dh',
    folder: 'Dachshund',
    filePrefix: 'veterok_dachshund',
    count: 34,
    title: 'Dackel-Freund',
    subtitle: '34 treue bayerische Dackel-Sticker',
    characterNoun: 'Dackel',
    accentHex: '#B45309',
    surfaceHex: '#FEF3C7',
    facts: [
      'Der Dackel ist ein echter Klassiker in Bayern und hat ein superfeines Näschen!',
      'Trotz kurzer Beine flitzt ein fröhlicher Dackel überraschend schnell los.',
      'Dackel lieben ausgiebige Schnüffel-Spaziergänge durch Wald und Wiese.',
      'Mit Schlappohren und wedelndem Schwanz freut sich der Dackel über jeden Punkt!',
    ],
  }),
  buildGifSeries({
    id: 'thefood',
    idPrefix: 'st_tf',
    folder: 'TheFood',
    filePrefix: 'TheFoods',
    count: 25,
    title: 'Lustiges Essen',
    subtitle: '25 quirlige Snack-Sticker mit fröhlichen Gesichtern',
    characterNoun: 'Snack-Freund',
    accentHex: '#E11D48',
    surfaceHex: '#FFF1F2',
    facts: [
      'Ein leckeres Frühstück gibt Energie für spannende Rechenabenteuer!',
      'Ob Obst, Kuchen oder Pizza – geteilt durch Zwei wird alles gerecht geteilt.',
      'Beim Zählen von Beeren und Keksen übt man ganz nebenbei Plus und Minus.',
      'Manche Früchte wachsen auf Bäumen, andere dicht am sonnigen Boden.',
    ],
  }),
];

export const ALL_STICKERS: AlbumSticker[] = ALBUM_SERIES.flatMap((s) => s.stickers);

export const PUZZLE_PICTURES: PuzzlePicture[] = [
  {
    id: 'pz_racecar',
    title: 'Roter Rennwagen',
    category: 'Fahrzeuge',
    description: 'Ein blitzschneller Rennwagen flitzt über die sonnige Rennstrecke.',
    piecesCount: 6,
  },
  {
    id: 'pz_firetruck',
    title: 'Feuerwehr im Einsatz',
    category: 'Fahrzeuge',
    description: 'Das rote Feuerwehrauto mit großer Drehleiter und fröhlichem Dalmatiner!',
    piecesCount: 6,
  },
  {
    id: 'pz_rocket',
    title: 'Ab ins Weltall!',
    category: 'Weltall',
    description: 'Eine bunte Rakete startet vorbei an Saturn, Mond und funkelnden Sternen.',
    piecesCount: 6,
  },
  {
    id: 'pz_astronaut_panda',
    title: 'Panda auf dem Mond',
    category: 'Weltall',
    description: 'Ein kleiner Astronauten-Panda winkt schwerelos neben seiner Kapsel.',
    piecesCount: 6,
  },
  {
    id: 'pz_dinosaurs',
    title: 'Dino-Tal',
    category: 'Tiere & Urzeit',
    description: 'Freundliche Dinosaurier spazieren unter Palmen vor einem kleinen Vulkan.',
    piecesCount: 6,
  },
  {
    id: 'pz_ocean_whale',
    title: 'Wunderwelt Meer',
    category: 'Tiere & Wasser',
    description: 'Blauwal, Delfine, Meeresschildkröte und Clownfish tanzen im Korallenriff.',
    piecesCount: 6,
  },
  {
    id: 'pz_safari',
    title: 'Sonnige Safari',
    category: 'Tiere',
    description: 'Löwenkind, Giraffe, Zebra und kleiner Elefant treffen sich am Wasserloch.',
    piecesCount: 6,
  },
  {
    id: 'pz_farm',
    title: 'Sonniger Bauernhof',
    category: 'Tiere',
    description: 'Roter Traktor, glückliche Kuh, Schaf und Schweinchen auf der Hofwiese.',
    piecesCount: 6,
  },
  {
    id: 'pz_castle',
    title: 'Ritterburg auf dem Berg',
    category: 'Abenteuer',
    description: 'Eine stolze Burg mit Wimpeln, Zugbrücke und einem freundlichen kleinen Drachen.',
    piecesCount: 6,
  },
  {
    id: 'pz_pirate',
    title: 'Schatzinsel-Segler',
    category: 'Abenteuer',
    description: 'Ein buntes Holzschiff ankert an einer Palmenbucht mit versteckter Truhe.',
    piecesCount: 6,
  },
  {
    id: 'pz_train',
    title: 'Alpen-Dampflok',
    category: 'Fahrzeuge',
    description: 'Die fröhliche Dampfeisenbahn tuckert über ein hohes Talviadukt in den Bergen.',
    piecesCount: 6,
  },
  {
    id: 'pz_construction',
    title: 'Große Baustelle',
    category: 'Fahrzeuge',
    description: 'Gelber Bagger, Kipplaster und Kran stapeln fleißig bunte Riesenklötzchen.',
    piecesCount: 6,
  },
  {
    id: 'pz_balloons',
    title: 'Ballon-Festival',
    category: 'Abenteuer',
    description: 'Viele bunte Heißluftballons schweben hoch über bunten Wiesen und Bergen.',
    piecesCount: 6,
  },
  {
    id: 'pz_treehouse',
    title: 'Baumhaus der Eichhörnchen',
    category: 'Natur & Tiere',
    description: 'Hoch oben in der großen Eiche wartet ein gemütliches Baumhaus mit Fernrohr.',
    piecesCount: 6,
  },
  {
    id: 'pz_soccer',
    title: 'Wald-Fußballspiel',
    category: 'Sport & Tiere',
    description: 'Fuchs, Hase und kleiner Bär spielen gemeinsam ein spannendes Tor-Match!',
    piecesCount: 6,
  },
];

export function findCatalogItem(id: string | null | undefined): CatalogItem | undefined {
  if (!id) return undefined;
  return CATALOG_ITEMS.find((i) => i.id === id);
}

export function findSticker(id: string | null | undefined): AlbumSticker | undefined {
  if (!id) return undefined;
  return ALL_STICKERS.find((s) => s.id === id);
}

export function findPuzzlePicture(id: string | null | undefined): PuzzlePicture | undefined {
  if (!id) return undefined;
  return PUZZLE_PICTURES.find((p) => p.id === id);
}
