import pg from 'pg';

const { Client } = pg;

const DEMO_PREFIX = 'demo-wasl-';

const usd = amount => Math.round(amount * 100);
const lbp = amount => Math.round(amount * 90_000);

const tr = (en, fr, ar) => ({ en, fr, ar });

const item = ({
  name,
  description,
  usdPrice,
  localPrice,
  popular = false,
  isNew = false,
  spicy = false,
  promo = false,
  featured = false,
}) => ({
  name,
  description,
  priceUsdCents: usd(usdPrice),
  priceLbp: lbp(localPrice ?? usdPrice),
  isPopular: popular,
  isNew,
  isSpicy: spicy,
  isPromo: promo,
  isFeatured: featured,
});

const demoRestaurants = [
  {
    id: `${DEMO_PREFIX}cafe-bakery`,
    displayName: 'Wasl Demo - Morning Crumb Cafe',
    templateStyle: 'cafe',
    profile: 'cafe',
    orderingMode: 'pickup_delivery',
    primaryColor: '#6f4e37',
    accentColor: '#d9a441',
    themeMode: 'day',
    whatsapp: '+96170000001',
    address: 'Demo Street, Gemmayze, Beirut',
    hours: 'Mon-Sun 7:30 AM - 9:00 PM',
    instagram: 'https://instagram.com/wasl_demo_cafe',
    wifiName: 'MorningCrumb Guest',
    wifiPassword: 'demo-cafe',
    delivery: {
      enabled: true,
      pickup: true,
      feeUsd: 2,
      minimumUsd: 8,
      eta: '25-35 minutes',
      coverage: 'Demo delivery within nearby Beirut neighborhoods.',
    },
    qr: {
      mode: 'both',
      frame: '#6f4e37',
      foreground: '#3f2a1d',
      background: '#fffaf3',
      label: 'Scan for cafe menu',
      style: 'classic',
    },
    tables: [1, 2, 3, 4, 5, 6],
    categories: [
      {
        name: tr('Coffee Bar', 'Cafe', 'القهوة'),
        items: [
          item({ name: tr('House Espresso', 'Espresso maison', 'إسبريسو البيت'), description: tr('Short, bright espresso with caramel finish.', 'Espresso court et vif avec finale caramel.', 'إسبريسو قصير بنكهة كراميل خفيفة.'), usdPrice: 2.5, popular: true }),
          item({ name: tr('Iced Spanish Latte', 'Spanish latte glace', 'سبانش لاتيه مثلج'), description: tr('Cold milk, espresso, and lightly sweet cream.', 'Lait froid, espresso et crème légèrement sucrée.', 'حليب بارد مع إسبريسو وكريمة خفيفة.'), usdPrice: 4.5, popular: true, featured: true }),
          item({ name: tr('Cardamom Cappuccino', 'Cappuccino cardamome', 'كابتشينو هيل'), description: tr('Classic cappuccino with a gentle cardamom note.', 'Cappuccino classique avec une touche de cardamome.', 'كابتشينو كلاسيكي مع لمسة هيل.'), usdPrice: 4 }),
          item({ name: tr('Cold Brew Bottle', 'Cold brew bouteille', 'كولد برو'), description: tr('Slow-steeped coffee served chilled.', 'Cafe infuse lentement, servi froid.', 'قهوة منقوعة ببطء وتقدم باردة.'), usdPrice: 4.75, isNew: true }),
          item({ name: tr('Mocha Hazelnut', 'Mocha noisette', 'موكا بندق'), description: tr('Chocolate, espresso, steamed milk, and hazelnut.', 'Chocolat, espresso, lait mousse et noisette.', 'شوكولا وإسبريسو وحليب مع بندق.'), usdPrice: 4.75 }),
        ],
      },
      {
        name: tr('Bakery', 'Boulangerie', 'المخبوزات'),
        items: [
          item({ name: tr('Zaatar Croissant', 'Croissant zaatar', 'كرواسون زعتر'), description: tr('Buttery croissant with Lebanese zaatar.', 'Croissant beurre au zaatar libanais.', 'كرواسون بالزبدة والزعتر اللبناني.'), usdPrice: 3.75, popular: true }),
          item({ name: tr('Almond Pain Suisse', 'Pain suisse amande', 'بان سويس لوز'), description: tr('Flaky pastry with almond cream.', 'Pate feuilletee et crème amande.', 'عجينة مورقة مع كريمة اللوز.'), usdPrice: 4.25 }),
          item({ name: tr('Cheese Manoushe Bites', 'Bouchees manoushe fromage', 'مناقيش جبنة صغيرة'), description: tr('Mini baked cheese bites for sharing.', 'Mini bouchees au fromage a partager.', 'قطع جبنة صغيرة للمشاركة.'), usdPrice: 5.5, featured: true }),
          item({ name: tr('Chocolate Babka Slice', 'Part de babka chocolat', 'قطعة بابكا شوكولا'), description: tr('Soft braided loaf with dark chocolate.', 'Brioche tressee au chocolat noir.', 'خبز طري مضفر بالشوكولا الداكنة.'), usdPrice: 3.5 }),
          item({ name: tr('Rose Pistachio Cookie', 'Cookie rose pistache', 'كوكي ورد وفستق'), description: tr('Soft cookie with pistachio and rose water.', 'Cookie moelleux pistache et eau de rose.', 'كوكي طري بالفستق وماء الورد.'), usdPrice: 2.75, isNew: true }),
        ],
      },
      {
        name: tr('Breakfast Plates', 'Petits dejeuners', 'فطور'),
        items: [
          item({ name: tr('Labneh Toast', 'Toast labneh', 'توست لبنة'), description: tr('Sourdough, labneh, cucumber, mint, olive oil.', 'Pain au levain, labneh, concombre, menthe, huile olive.', 'خبز ساوردو مع لبنة وخيار ونعنع وزيت زيتون.'), usdPrice: 6.5 }),
          item({ name: tr('Eggs & Akkawi', 'Oeufs et akkawi', 'بيض وعكاوي'), description: tr('Soft eggs with akkawi cheese and herbs.', 'Oeufs moelleux avec akkawi et herbes.', 'بيض طري مع جبنة عكاوي وأعشاب.'), usdPrice: 7.5, popular: true }),
          item({ name: tr('Avocado Halloumi Tartine', 'Tartine avocat halloumi', 'تارتين أفوكادو وحلوم'), description: tr('Avocado, grilled halloumi, chili flakes.', 'Avocat, halloumi grille, piment doux.', 'أفوكادو وحلوم مشوي ورشة فلفل.'), usdPrice: 8.5, featured: true }),
          item({ name: tr('Granola Yogurt Bowl', 'Bol granola yaourt', 'وعاء غرانولا ولبن'), description: tr('Greek yogurt, honey, fruit, house granola.', 'Yaourt grec, miel, fruits, granola maison.', 'لبن يوناني وعسل وفاكهة وغرانولا.'), usdPrice: 6.75 }),
          item({ name: tr('Mini Brunch Board', 'Planche brunch mini', 'لوح برانش صغير'), description: tr('Cheese, olives, eggs, bread, and jam.', 'Fromage, olives, oeufs, pain et confiture.', 'جبنة وزيتون وبيض وخبز ومربى.'), usdPrice: 12.5, promo: true }),
        ],
      },
      {
        name: tr('Sandwiches', 'Sandwichs', 'ساندويشات'),
        items: [
          item({ name: tr('Turkey Emmental Croissant', 'Croissant dinde emmental', 'كرواسون حبش وإمنتال'), description: tr('Smoked turkey, emmental, mustard cream.', 'Dinde fumee, emmental, crème moutarde.', 'حبش مدخن وإمنتال وكريمة خردل.'), usdPrice: 7.25 }),
          item({ name: tr('Halloumi Pesto Focaccia', 'Focaccia halloumi pesto', 'فوكاتشا حلوم وبيستو'), description: tr('Grilled halloumi, basil pesto, tomato.', 'Halloumi grille, pesto basilic, tomate.', 'حلوم مشوي وبيستو ريحان وبندورة.'), usdPrice: 7.75, popular: true }),
          item({ name: tr('Tuna Lemon Ciabatta', 'Ciabatta thon citron', 'تونا وليمون'), description: tr('Tuna, lemon mayo, pickles, greens.', 'Thon, mayo citron, cornichons, salade.', 'تونا ومايونيز ليمون ومخلل وخضار.'), usdPrice: 7 }),
          item({ name: tr('Roast Veggie Wrap', 'Wrap legumes rotis', 'راب خضار مشوية'), description: tr('Seasonal vegetables, hummus, rocket.', 'Legumes de saison, houmous, roquette.', 'خضار موسمية وحمص وجرجير.'), usdPrice: 6.75 }),
          item({ name: tr('Chicken Tawouk Toastie', 'Toastie tawouk poulet', 'توستي دجاج طاووق'), description: tr('Tawouk chicken, garlic cream, pickles.', 'Poulet tawouk, crème ail, cornichons.', 'دجاج طاووق وكريمة ثوم ومخلل.'), usdPrice: 8.25, spicy: true }),
        ],
      },
      {
        name: tr('Fresh Drinks', 'Boissons fraiches', 'مشروبات باردة'),
        items: [
          item({ name: tr('Mint Lemonade', 'Citronnade menthe', 'ليموناضة بالنعنع'), description: tr('Fresh lemon, mint, crushed ice.', 'Citron frais, menthe, glace pilee.', 'ليمون طازج ونعنع وثلج مجروش.'), usdPrice: 4.25, popular: true }),
          item({ name: tr('Orange Blossom Iced Tea', 'The glace fleur oranger', 'شاي مثلج بزهر البرتقال'), description: tr('Black tea, orange blossom, citrus.', 'The noir, fleur oranger, agrumes.', 'شاي أسود وزهر البرتقال وحمضيات.'), usdPrice: 4 }),
          item({ name: tr('Strawberry Basil Soda', 'Soda fraise basilic', 'صودا فراولة وريحان'), description: tr('House syrup, basil, sparkling water.', 'Sirop maison, basilic, eau petillante.', 'شراب منزلي وريحان ومياه غازية.'), usdPrice: 4.5, isNew: true }),
          item({ name: tr('Pomegranate Spritz', 'Spritz grenade', 'سبرتز رمان'), description: tr('Pomegranate, lime, soda.', 'Grenade, citron vert, soda.', 'رمان وليمون أخضر وصودا.'), usdPrice: 4.75 }),
          item({ name: tr('Still Water', 'Eau plate', 'مياه'), description: tr('Local bottled water.', 'Eau locale en bouteille.', 'مياه محلية معبأة.'), usdPrice: 1.25 }),
        ],
      },
    ],
  },
  {
    id: `${DEMO_PREFIX}burger-snack`,
    displayName: 'Wasl Demo - Smash Stop',
    templateStyle: 'fast_food',
    profile: 'fast_food',
    orderingMode: 'pickup_delivery',
    primaryColor: '#b91c1c',
    accentColor: '#facc15',
    themeMode: 'day',
    whatsapp: '+96170000002',
    address: 'Demo Avenue, Mar Mikhael, Beirut',
    hours: 'Daily 12:00 PM - 12:00 AM',
    instagram: 'https://instagram.com/wasl_demo_smash',
    wifiName: 'SmashStop Guest',
    wifiPassword: 'demo-burger',
    delivery: {
      enabled: true,
      pickup: true,
      feeUsd: 2.5,
      minimumUsd: 10,
      eta: '30-40 minutes',
      coverage: 'Demo delivery within central Beirut.',
    },
    qr: {
      mode: 'both',
      frame: '#b91c1c',
      foreground: '#111827',
      background: '#fff7ed',
      label: 'Scan and order',
      style: 'modern',
    },
    tables: [1, 2, 3, 4, 5, 6, 7, 8],
    categories: [
      {
        name: tr('Smash Burgers', 'Smash burgers', 'برغر سماش'),
        items: [
          item({ name: tr('Classic Smash', 'Smash classique', 'سماش كلاسيك'), description: tr('Double patty, American cheese, pickles, house sauce.', 'Double steak, cheddar, cornichons, sauce maison.', 'قطعتان لحم وجبنة ومخلل وصوص البيت.'), usdPrice: 9.5, popular: true, featured: true }),
          item({ name: tr('Spicy Jalapeno Smash', 'Smash jalapeno epice', 'سماش هلابينو حار'), description: tr('Double patty, jalapenos, chili mayo.', 'Double steak, jalapenos, mayo piment.', 'برغر مزدوج مع هلابينو ومايونيز حار.'), usdPrice: 10.5, spicy: true, popular: true }),
          item({ name: tr('Mushroom Swiss Smash', 'Smash champignons suisse', 'سماش فطر وسويس'), description: tr('Sauteed mushrooms, Swiss cheese, onion glaze.', 'Champignons sautes, fromage suisse, oignons.', 'فطر مشوح وجبنة سويسرية وبصل.'), usdPrice: 11 }),
          item({ name: tr('BBQ Onion Smash', 'Smash BBQ oignons', 'سماش باربكيو وبصل'), description: tr('Crispy onions, BBQ sauce, cheddar.', 'Oignons croustillants, sauce BBQ, cheddar.', 'بصل مقرمش وصوص باربكيو وشيدر.'), usdPrice: 10.75 }),
          item({ name: tr('Mini Slider Trio', 'Trio mini sliders', 'ثلاثة سلايدرز'), description: tr('Three small burgers for sharing.', 'Trois mini burgers a partager.', 'ثلاث برغر صغيرة للمشاركة.'), usdPrice: 12.5, promo: true }),
        ],
      },
      {
        name: tr('Chicken', 'Poulet', 'دجاج'),
        items: [
          item({ name: tr('Crispy Chicken Burger', 'Burger poulet croustillant', 'برغر دجاج مقرمش'), description: tr('Fried chicken, slaw, pickles, garlic mayo.', 'Poulet frit, coleslaw, cornichons, mayo ail.', 'دجاج مقلي وكولسلو ومخلل ومايونيز ثوم.'), usdPrice: 8.75, popular: true }),
          item({ name: tr('Nashville Hot Chicken', 'Poulet Nashville piquant', 'دجاج ناشفيل حار'), description: tr('Hot glaze, pickles, cooling ranch.', 'Glacage piquant, cornichons, ranch.', 'صوص حار ومخلل ورانش.'), usdPrice: 9.5, spicy: true }),
          item({ name: tr('Chicken Tawouk Wrap', 'Wrap tawouk', 'راب طاووق'), description: tr('Grilled tawouk, fries, garlic, pickles.', 'Tawouk grille, frites, ail, cornichons.', 'طاووق مشوي وبطاطا وثوم ومخلل.'), usdPrice: 7.5 }),
          item({ name: tr('Buffalo Tenders', 'Tenders buffalo', 'تندرز بافالو'), description: tr('Crispy tenders tossed in buffalo sauce.', 'Tenders croustillants sauce buffalo.', 'تندرز مقرمشة بصوص بافالو.'), usdPrice: 8.25, spicy: true }),
          item({ name: tr('Honey Mustard Tenders', 'Tenders miel moutarde', 'تندرز عسل وخردل'), description: tr('Crispy tenders with honey mustard dip.', 'Tenders avec dip miel moutarde.', 'تندرز مع صوص عسل وخردل.'), usdPrice: 8 }),
        ],
      },
      {
        name: tr('Loaded Fries', 'Frites chargees', 'بطاطا محملة'),
        items: [
          item({ name: tr('Cheese Fries', 'Frites fromage', 'بطاطا جبنة'), description: tr('Crispy fries with cheese sauce.', 'Frites croustillantes sauce fromage.', 'بطاطا مقرمشة مع صوص جبنة.'), usdPrice: 5.5 }),
          item({ name: tr('Bacon Smash Fries', 'Frites bacon smash', 'بطاطا سماش وبيكن'), description: tr('Fries, chopped patty, cheese, onions.', 'Frites, steak hache, fromage, oignons.', 'بطاطا مع لحم مفروم وجبنة وبصل.'), usdPrice: 8.5, featured: true }),
          item({ name: tr('Truffle Parmesan Fries', 'Frites truffe parmesan', 'بطاطا ترافل وبارميزان'), description: tr('Truffle oil, parmesan, parsley.', 'Huile de truffe, parmesan, persil.', 'زيت ترافل وبارميزان وبقدونس.'), usdPrice: 6.75 }),
          item({ name: tr('Chili Cheese Fries', 'Frites chili fromage', 'بطاطا تشيلي جبنة'), description: tr('Beef chili, cheese sauce, jalapeno.', 'Chili boeuf, sauce fromage, jalapeno.', 'تشيلي لحم وصوص جبنة وهلابينو.'), usdPrice: 8.25, spicy: true }),
          item({ name: tr('Sweet Potato Fries', 'Frites patate douce', 'بطاطا حلوة'), description: tr('Sweet potato fries with smoky dip.', 'Patates douces frites avec dip fume.', 'بطاطا حلوة مع صوص مدخن.'), usdPrice: 5.75, isNew: true }),
        ],
      },
      {
        name: tr('Snack Boxes', 'Box snacks', 'بوكس سناك'),
        items: [
          item({ name: tr('Game Night Box', 'Box soiree match', 'بوكس سهرة'), description: tr('Sliders, tenders, fries, sauces.', 'Sliders, tenders, frites, sauces.', 'سلايدرز وتندرز وبطاطا وصوصات.'), usdPrice: 24, promo: true, featured: true }),
          item({ name: tr('Mozzarella Sticks', 'Sticks mozzarella', 'موزاريلا ستيكس'), description: tr('Fried mozzarella with marinara.', 'Mozzarella frite sauce tomate.', 'موزاريلا مقلية مع صوص بندورة.'), usdPrice: 6 }),
          item({ name: tr('Onion Rings', 'Onion rings', 'حلقات بصل'), description: tr('Beer-style battered onion rings.', 'Rondelles oignon panees.', 'حلقات بصل مقرمشة.'), usdPrice: 4.75 }),
          item({ name: tr('Nacho Cup', 'Cup nachos', 'كوب ناتشوز'), description: tr('Nachos, cheese, salsa, jalapeno.', 'Nachos, fromage, salsa, jalapeno.', 'ناتشوز وجبنة وسالسا وهلابينو.'), usdPrice: 5.75, spicy: true }),
          item({ name: tr('Kids Mini Burger Meal', 'Menu mini burger enfant', 'وجبة برغر أطفال'), description: tr('Mini burger, fries, juice.', 'Mini burger, frites, jus.', 'برغر صغير وبطاطا وعصير.'), usdPrice: 7.5 }),
        ],
      },
      {
        name: tr('Shakes & Sodas', 'Milkshakes et sodas', 'ميلك شيك ومشروبات'),
        items: [
          item({ name: tr('Vanilla Shake', 'Milkshake vanille', 'ميلك شيك فانيلا'), description: tr('Thick vanilla shake.', 'Milkshake vanille epais.', 'ميلك شيك فانيلا كثيف.'), usdPrice: 5 }),
          item({ name: tr('Lotus Shake', 'Milkshake lotus', 'ميلك شيك لوتس'), description: tr('Biscoff spread, vanilla ice cream.', 'Speculoos et glace vanille.', 'لوتس وآيس كريم فانيلا.'), usdPrice: 6, popular: true }),
          item({ name: tr('Chocolate Brownie Shake', 'Milkshake brownie chocolat', 'ميلك شيك براوني'), description: tr('Chocolate shake with brownie pieces.', 'Milkshake chocolat avec brownie.', 'ميلك شيك شوكولا مع قطع براوني.'), usdPrice: 6.25 }),
          item({ name: tr('Cherry Cola', 'Cola cerise', 'كولا كرز'), description: tr('Classic cola with cherry syrup.', 'Cola classique au sirop cerise.', 'كولا مع شراب كرز.'), usdPrice: 2.75 }),
          item({ name: tr('Lemon Iced Tea', 'The glace citron', 'شاي مثلج ليمون'), description: tr('House brewed iced tea.', 'The glace maison.', 'شاي مثلج منزلي.'), usdPrice: 3.25 }),
        ],
      },
    ],
  },
  {
    id: `${DEMO_PREFIX}lebanese-restaurant`,
    displayName: 'Wasl Demo - Beit El Demo',
    templateStyle: 'table_service',
    profile: 'table_service',
    orderingMode: 'table_ordering',
    primaryColor: '#166534',
    accentColor: '#dc2626',
    themeMode: 'day',
    whatsapp: '+96170000003',
    address: 'Demo Terrace, Achrafieh, Beirut',
    hours: 'Daily 11:00 AM - 11:30 PM',
    instagram: 'https://instagram.com/wasl_demo_beit',
    wifiName: 'BeitDemo Guest',
    wifiPassword: 'demo-mezza',
    delivery: {
      enabled: true,
      pickup: true,
      feeUsd: 3,
      minimumUsd: 15,
      eta: '35-50 minutes',
      coverage: 'Demo delivery for family platters and mezza boxes.',
    },
    qr: {
      mode: 'per_table',
      frame: '#166534',
      foreground: '#111827',
      background: '#ffffff',
      label: 'Scan for menu',
      style: 'classic',
    },
    tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    categories: [
      {
        name: tr('Cold Mezza', 'Mezza froid', 'مازة باردة'),
        items: [
          item({ name: tr('Hummus Beiruti', 'Houmous beiruti', 'حمص بيروتي'), description: tr('Chickpeas, tahini, parsley, chili, olive oil.', 'Pois chiches, tahini, persil, piment, huile olive.', 'حمص وطحينة وبقدونس وحر وزيت زيتون.'), usdPrice: 5.5, popular: true }),
          item({ name: tr('Moutabbal', 'Moutabbal', 'متبل'), description: tr('Smoked eggplant, tahini, lemon.', 'Aubergine fumee, tahini, citron.', 'باذنجان مدخن وطحينة وليمون.'), usdPrice: 5.75 }),
          item({ name: tr('Tabbouleh', 'Tabbouleh', 'تبولة'), description: tr('Parsley, tomato, bulgur, lemon dressing.', 'Persil, tomate, boulgour, citron.', 'بقدونس وبندورة وبرغل وحامض.'), usdPrice: 6.25, popular: true }),
          item({ name: tr('Fattoush', 'Fattouche', 'فتوش'), description: tr('Crisp vegetables, sumac, toasted bread.', 'Legumes croquants, sumac, pain grille.', 'خضار مقرمشة وسماق وخبز محمص.'), usdPrice: 6 }),
          item({ name: tr('Labneh with Garlic', 'Labneh ail', 'لبنة بالثوم'), description: tr('Strained yogurt, garlic, mint, olive oil.', 'Yaourt egoutte, ail, menthe, huile olive.', 'لبنة وثوم ونعنع وزيت زيتون.'), usdPrice: 4.75 }),
        ],
      },
      {
        name: tr('Hot Mezza', 'Mezza chaud', 'مازة ساخنة'),
        items: [
          item({ name: tr('Kibbeh Kras', 'Kebbe kras', 'كبة أقراص'), description: tr('Fried kibbeh with pine nuts and minced beef.', 'Kebbe frit aux pignons et boeuf.', 'كبة مقلية مع صنوبر ولحم.'), usdPrice: 8.5, featured: true }),
          item({ name: tr('Cheese Rakakat', 'Rakakat fromage', 'رقاقات جبنة'), description: tr('Crispy rolls stuffed with cheese.', 'Rouleaux croustillants au fromage.', 'رقاقات مقرمشة محشوة بالجبنة.'), usdPrice: 6.5, popular: true }),
          item({ name: tr('Spicy Potatoes', 'Batata harra', 'بطاطا حرة'), description: tr('Potatoes with coriander, garlic, chili.', 'Pommes de terre coriandre, ail, piment.', 'بطاطا مع كزبرة وثوم وحر.'), usdPrice: 5.75, spicy: true, popular: true }),
          item({ name: tr('Fried Halloumi', 'Halloumi frit', 'حلوم مقلي'), description: tr('Golden halloumi with tomato jam.', 'Halloumi dore avec confiture tomate.', 'حلوم ذهبي مع مربى بندورة.'), usdPrice: 7.25 }),
          item({ name: tr('Soujouk Pomegranate', 'Soujouk grenade', 'سجق بدبس الرمان'), description: tr('Spiced sausage with pomegranate molasses.', 'Saucisse epicee melasse grenade.', 'سجق حار مع دبس الرمان.'), usdPrice: 8.25, spicy: true }),
        ],
      },
      {
        name: tr('Grill', 'Grillades', 'مشاوي'),
        items: [
          item({ name: tr('Mixed Grill Plate', 'Assiette grillades mixtes', 'طبق مشاوي مشكل'), description: tr('Kofta, tawouk, lahme meshwe, garlic, pickles.', 'Kofta, tawouk, viande grillee, ail, pickles.', 'كفتة وطاووق ولحمة مشوية وثوم ومخلل.'), usdPrice: 18.5, popular: true, featured: true }),
          item({ name: tr('Chicken Tawouk Skewers', 'Brochettes tawouk', 'أسياخ طاووق'), description: tr('Marinated chicken skewers with garlic dip.', 'Brochettes poulet marine avec toum.', 'أسياخ دجاج متبلة مع ثوم.'), usdPrice: 14 }),
          item({ name: tr('Kafta Khashkhash', 'Kafta khashkhash', 'كفتة خشخاش'), description: tr('Kafta over spicy tomato sauce.', 'Kafta sur sauce tomate epicee.', 'كفتة فوق صوص بندورة حار.'), usdPrice: 15.5, spicy: true }),
          item({ name: tr('Lahme Meshwe', 'Lahme meshwe', 'لحمة مشوية'), description: tr('Charcoal grilled beef cubes.', 'Cubes de boeuf grilles charbon.', 'مكعبات لحم مشوية على الفحم.'), usdPrice: 17 }),
          item({ name: tr('Grilled Halloumi Platter', 'Plateau halloumi grille', 'طبق حلوم مشوي'), description: tr('Halloumi, vegetables, thyme oil.', 'Halloumi, legumes, huile au thym.', 'حلوم وخضار وزيت زعتر.'), usdPrice: 12.5 }),
        ],
      },
      {
        name: tr('Oven & Saj', 'Four et saj', 'فرن وصاج'),
        items: [
          item({ name: tr('Lahm Bi Ajeen', 'Lahm bi ajin', 'لحم بعجين'), description: tr('Thin dough, spiced meat, tomato, pine nuts.', 'Pate fine, viande epicee, tomate, pignons.', 'عجينة رقيقة ولحم متبل وبندورة وصنوبر.'), usdPrice: 6.5 }),
          item({ name: tr('Zaatar Saj', 'Saj zaatar', 'صاج زعتر'), description: tr('Zaatar, olive oil, vegetables.', 'Zaatar, huile olive, legumes.', 'زعتر وزيت زيتون وخضار.'), usdPrice: 4.5 }),
          item({ name: tr('Kishk Manoushe', 'Manoushe kishk', 'منقوشة كشك'), description: tr('Kishk, tomato, onion, olive oil.', 'Kishk, tomate, oignon, huile olive.', 'كشك وبندورة وبصل وزيت زيتون.'), usdPrice: 5.25, isNew: true }),
          item({ name: tr('Akkawi Cheese Saj', 'Saj fromage akkawi', 'صاج جبنة عكاوي'), description: tr('Melted akkawi cheese in thin saj bread.', 'Akkawi fondu dans pain saj.', 'جبنة عكاوي ذائبة بخبز صاج.'), usdPrice: 5.75 }),
          item({ name: tr('Family Bread Basket', 'Panier pain familial', 'سلة خبز عائلية'), description: tr('Fresh pita, markouk, and saj bread.', 'Pita, markouk et saj frais.', 'خبز عربي ومرقوق وصاج طازج.'), usdPrice: 3.5 }),
        ],
      },
      {
        name: tr('Desserts & Drinks', 'Desserts et boissons', 'حلويات ومشروبات'),
        items: [
          item({ name: tr('Osmalieh Cup', 'Coupe osmalieh', 'كوب عثمانلية'), description: tr('Cream, crispy pastry, orange blossom.', 'Creme, pate croustillante, fleur oranger.', 'قشطة وعجينة مقرمشة وزهر.'), usdPrice: 6.25, isNew: true }),
          item({ name: tr('Knefeh Bites', 'Bouchees knefeh', 'لقيمات كنافة'), description: tr('Mini knefeh pieces with syrup.', 'Mini knefeh avec sirop.', 'قطع كنافة صغيرة مع قطر.'), usdPrice: 6.75, popular: true }),
          item({ name: tr('Rose Loukoum Plate', 'Assiette loukoum rose', 'راحة حلقوم ورد'), description: tr('Rose loukoum with pistachio.', 'Loukoum rose avec pistache.', 'راحة ورد مع فستق.'), usdPrice: 4.5 }),
          item({ name: tr('Ayran', 'Ayran', 'عيران'), description: tr('Cold yogurt drink with salt.', 'Boisson yaourt salee froide.', 'مشروب لبن بارد ومالح.'), usdPrice: 2.5 }),
          item({ name: tr('Jallab Pitcher', 'Carafe jallab', 'إبريق جلاب'), description: tr('Jallab with pine nuts and raisins.', 'Jallab avec pignons et raisins.', 'جلاب مع صنوبر وزبيب.'), usdPrice: 8.5, promo: true }),
        ],
      },
    ],
  },
  {
    id: `${DEMO_PREFIX}shisha-lounge`,
    displayName: 'Wasl Demo - Layali Lounge',
    templateStyle: 'shisha_lounge',
    profile: 'shisha_lounge',
    orderingMode: 'table_ordering',
    primaryColor: '#f59e0b',
    accentColor: '#a855f7',
    themeMode: 'night',
    whatsapp: '+96170000004',
    address: 'Demo Rooftop, Verdun, Beirut',
    hours: 'Daily 5:00 PM - 2:00 AM',
    instagram: 'https://instagram.com/wasl_demo_layali',
    wifiName: 'Layali Guest',
    wifiPassword: 'demo-lounge',
    delivery: {
      enabled: false,
      pickup: false,
      feeUsd: null,
      minimumUsd: null,
      eta: null,
      coverage: 'Table service demo only.',
    },
    qr: {
      mode: 'per_table',
      frame: '#a855f7',
      foreground: '#f59e0b',
      background: '#18181b',
      label: 'Scan lounge menu',
      style: 'modern',
    },
    tables: [1, 2, 3, 4, 5, 6, 7, 8],
    categories: [
      {
        name: tr('Signature Shisha', 'Chicha signature', 'أراكيل خاصة'),
        items: [
          item({ name: tr('Double Apple Classic', 'Double pomme classique', 'تفاحتين كلاسيك'), description: tr('Traditional double apple blend.', 'Melange double pomme traditionnel.', 'خلطة تفاحتين تقليدية.'), usdPrice: 14, popular: true }),
          item({ name: tr('Mint Grape', 'Raisin menthe', 'عنب ونعنع'), description: tr('Grape tobacco with cooling mint.', 'Raisin avec menthe fraiche.', 'تبغ عنب مع نعنع منعش.'), usdPrice: 15, popular: true }),
          item({ name: tr('Blueberry Ice', 'Myrtille glacee', 'بلو بيري آيس'), description: tr('Blueberry blend with icy finish.', 'Myrtille avec finale fraiche.', 'بلو بيري مع نكهة باردة.'), usdPrice: 16, isNew: true }),
          item({ name: tr('Layali Special Mix', 'Mix special Layali', 'خلطة ليالي الخاصة'), description: tr('House fruit and mint blend.', 'Melange maison fruits et menthe.', 'خلطة فواكه ونعنع خاصة.'), usdPrice: 18, featured: true }),
          item({ name: tr('Gum Cinnamon', 'Chewing gum cannelle', 'علكة وقرفة'), description: tr('Sweet gum with warm cinnamon.', 'Gomme douce et cannelle chaude.', 'علكة حلوة مع قرفة دافئة.'), usdPrice: 15 }),
        ],
      },
      {
        name: tr('Lounge Bites', 'Bouchees lounge', 'لقمات لاونج'),
        items: [
          item({ name: tr('Truffle Labneh Chips', 'Chips labneh truffe', 'تشيبس لبنة وترافل'), description: tr('Crisps with truffle labneh dip.', 'Chips avec labneh truffe.', 'تشيبس مع صوص لبنة وترافل.'), usdPrice: 7.5, featured: true }),
          item({ name: tr('Mini Kafta Tacos', 'Mini tacos kafta', 'تاكو كفتة صغير'), description: tr('Kafta, tahini slaw, pickles.', 'Kafta, salade tahini, pickles.', 'كفتة وكولسلو طحينة ومخلل.'), usdPrice: 9.5 }),
          item({ name: tr('Halloumi Fries', 'Frites halloumi', 'بطاطا حلوم'), description: tr('Fried halloumi sticks with chili honey.', 'Halloumi frit avec miel pimente.', 'أصابع حلوم مقلية مع عسل حار.'), usdPrice: 8.25, spicy: true }),
          item({ name: tr('Loaded Nachos', 'Nachos garnis', 'ناتشوز محملة'), description: tr('Cheese, salsa, jalapeno, sour cream.', 'Fromage, salsa, jalapeno, crème.', 'جبنة وسالسا وهلابينو وكريمة.'), usdPrice: 8.75, spicy: true }),
          item({ name: tr('Crispy Shrimp Cup', 'Cup crevettes croustillantes', 'كوب روبيان مقرمش'), description: tr('Shrimp bites with spicy mayo.', 'Crevettes avec mayo epicee.', 'روبيان مقرمش مع مايونيز حار.'), usdPrice: 11.5, popular: true }),
        ],
      },
      {
        name: tr('Mocktails', 'Mocktails', 'موكتيلات'),
        items: [
          item({ name: tr('Pomegranate Mule', 'Mule grenade', 'ميول رمان'), description: tr('Pomegranate, ginger, lime, soda.', 'Grenade, gingembre, citron vert, soda.', 'رمان وزنجبيل وليمون وصودا.'), usdPrice: 7 }),
          item({ name: tr('Passion Mint Cooler', 'Cooler passion menthe', 'باشن ونعنع'), description: tr('Passion fruit, mint, citrus.', 'Fruit passion, menthe, agrumes.', 'باشن فروت ونعنع وحمضيات.'), usdPrice: 7.5, popular: true }),
          item({ name: tr('Smoked Peach Iced Tea', 'The glace peche fumee', 'شاي خوخ مدخن'), description: tr('Peach tea with aromatic smoke.', 'The peche avec note fumee.', 'شاي خوخ مع نكهة مدخنة.'), usdPrice: 6.5, isNew: true }),
          item({ name: tr('Rose Lychee Fizz', 'Fizz rose litchi', 'فوار ورد وليتشي'), description: tr('Lychee, rose, lemon, sparkling water.', 'Litchi, rose, citron, eau petillante.', 'ليتشي وورد وليمون ومياه غازية.'), usdPrice: 7.75, featured: true }),
          item({ name: tr('Classic Mint Lemonade', 'Citronnade menthe classique', 'ليموناضة نعنع'), description: tr('Lemon, mint, crushed ice.', 'Citron, menthe, glace pilee.', 'ليمون ونعنع وثلج مجروش.'), usdPrice: 5.5 }),
        ],
      },
      {
        name: tr('Platters', 'Plateaux', 'صحون مشاركة'),
        items: [
          item({ name: tr('Lounge Mezza Board', 'Planche mezza lounge', 'لوح مازة لاونج'), description: tr('Hummus, moutabbal, labneh, olives, bread.', 'Houmous, moutabbal, labneh, olives, pain.', 'حمص ومتبل ولبنة وزيتون وخبز.'), usdPrice: 18.5, promo: true }),
          item({ name: tr('Grilled Skewer Board', 'Planche brochettes', 'لوح أسياخ'), description: tr('Tawouk, kafta, vegetables, dips.', 'Tawouk, kafta, legumes, dips.', 'طاووق وكفتة وخضار وصوصات.'), usdPrice: 26, featured: true }),
          item({ name: tr('Cheese & Nuts', 'Fromages et noix', 'جبنة ومكسرات'), description: tr('Cheese selection, nuts, dried fruit.', 'Selection fromage, noix, fruits secs.', 'تشكيلة جبنة ومكسرات وفواكه مجففة.'), usdPrice: 16 }),
          item({ name: tr('Fruit Platter', 'Plateau fruits', 'صحن فواكه'), description: tr('Seasonal sliced fruits for the table.', 'Fruits de saison a partager.', 'فواكه موسمية مقطعة للمشاركة.'), usdPrice: 14, popular: true }),
          item({ name: tr('Midnight Fries Basket', 'Panier frites minuit', 'سلة بطاطا منتصف الليل'), description: tr('Fries, wedges, dips, chili dust.', 'Frites, potatoes, dips, epices.', 'بطاطا عادية وودجز وصوصات وتوابل.'), usdPrice: 10.5, spicy: true }),
        ],
      },
      {
        name: tr('Dessert Lounge', 'Desserts lounge', 'حلويات لاونج'),
        items: [
          item({ name: tr('Chocolate Fondant', 'Fondant chocolat', 'فوندان شوكولا'), description: tr('Warm fondant with vanilla ice cream.', 'Fondant chaud avec glace vanille.', 'فوندان دافئ مع آيس كريم فانيلا.'), usdPrice: 8.5, popular: true }),
          item({ name: tr('Lotus Cheesecake Jar', 'Cheesecake lotus bocal', 'تشيزكيك لوتس'), description: tr('Layered cheesecake in a jar.', 'Cheesecake en couches dans un bocal.', 'تشيزكيك طبقات في مرطبان.'), usdPrice: 7.5 }),
          item({ name: tr('Pistachio Milk Cake', 'Milk cake pistache', 'ميلك كيك فستق'), description: tr('Soft milk cake with pistachio cream.', 'Gateau lait creme pistache.', 'كيك حليب طري مع كريمة فستق.'), usdPrice: 8, featured: true }),
          item({ name: tr('Arabic Ice Cream Cup', 'Coupe glace arabe', 'كوب بوظة عربية'), description: tr('Mastic ice cream, pistachio, rose.', 'Glace mastic, pistache, rose.', 'بوظة مستكة وفستق وورد.'), usdPrice: 6.5 }),
          item({ name: tr('Mini Churros', 'Mini churros', 'تشوروز صغير'), description: tr('Cinnamon churros with chocolate dip.', 'Churros cannelle sauce chocolat.', 'تشوروز قرفة مع صوص شوكولا.'), usdPrice: 6.75, isNew: true }),
        ],
      },
    ],
  },
  {
    id: `${DEMO_PREFIX}beach-club`,
    displayName: 'Wasl Demo - Azure Bay Club',
    templateStyle: 'casual_restaurant',
    profile: 'beach_club',
    orderingMode: 'pickup',
    primaryColor: '#0e7490',
    accentColor: '#f97316',
    themeMode: 'day',
    whatsapp: '+96170000005',
    address: 'Demo Seafront, Batroun',
    hours: 'Daily 10:00 AM - sunset',
    instagram: 'https://instagram.com/wasl_demo_azure',
    wifiName: 'AzureBay Guest',
    wifiPassword: 'demo-beach',
    delivery: {
      enabled: false,
      pickup: true,
      feeUsd: null,
      minimumUsd: null,
      eta: null,
      coverage: 'Poolside and counter pickup demo.',
    },
    qr: {
      mode: 'both',
      frame: '#0e7490',
      foreground: '#0f172a',
      background: '#ecfeff',
      label: 'Scan beach menu',
      style: 'classic',
    },
    tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    categories: [
      {
        name: tr('Beach Breakfast', 'Petit dej plage', 'فطور البحر'),
        items: [
          item({ name: tr('Acai Beach Bowl', 'Bol acai plage', 'وعاء أساي'), description: tr('Acai, banana, berries, coconut, granola.', 'Acai, banane, fruits rouges, coco, granola.', 'أساي وموز وتوت وجوز هند وغرانولا.'), usdPrice: 9.5, featured: true }),
          item({ name: tr('Halloumi Egg Bun', 'Bun oeuf halloumi', 'خبز بيض وحلوم'), description: tr('Egg, grilled halloumi, tomato, zaatar mayo.', 'Oeuf, halloumi grille, tomate, mayo zaatar.', 'بيض وحلوم مشوي وبندورة ومايونيز زعتر.'), usdPrice: 8.5, popular: true }),
          item({ name: tr('Smoked Salmon Toast', 'Toast saumon fume', 'توست سلمون مدخن'), description: tr('Sourdough, labneh, salmon, capers.', 'Levain, labneh, saumon, capres.', 'ساوردو ولبنة وسلمون وكابر.'), usdPrice: 12.5 }),
          item({ name: tr('Beach Pancakes', 'Pancakes plage', 'بانكيك البحر'), description: tr('Pancakes, banana, honey, walnuts.', 'Pancakes, banane, miel, noix.', 'بانكيك وموز وعسل وجوز.'), usdPrice: 8 }),
          item({ name: tr('Fruit & Labneh Plate', 'Assiette fruits labneh', 'فواكه ولبنة'), description: tr('Seasonal fruit, labneh, honey.', 'Fruits de saison, labneh, miel.', 'فواكه موسمية ولبنة وعسل.'), usdPrice: 7.5 }),
        ],
      },
      {
        name: tr('Salads & Bowls', 'Salades et bowls', 'سلطات وأوعية'),
        items: [
          item({ name: tr('Grilled Chicken Caesar', 'Caesar poulet grille', 'سيزر دجاج مشوي'), description: tr('Romaine, grilled chicken, parmesan, croutons.', 'Romaine, poulet grille, parmesan, croutons.', 'خس ودجاج مشوي وبارميزان وكروتون.'), usdPrice: 11.5, popular: true }),
          item({ name: tr('Tuna Nicoise Bowl', 'Bowl thon nicoise', 'وعاء تونا نيسواز'), description: tr('Tuna, egg, potato, beans, olives.', 'Thon, oeuf, pomme de terre, haricots, olives.', 'تونا وبيض وبطاطا وفاصوليا وزيتون.'), usdPrice: 12 }),
          item({ name: tr('Watermelon Feta Salad', 'Salade pasteque feta', 'سلطة بطيخ وفيتا'), description: tr('Watermelon, feta, mint, cucumber.', 'Pasteque, feta, menthe, concombre.', 'بطيخ وفيتا ونعنع وخيار.'), usdPrice: 9.25, isNew: true }),
          item({ name: tr('Quinoa Tabbouleh Bowl', 'Bowl tabbouleh quinoa', 'تبولة كينوا'), description: tr('Quinoa, parsley, tomato, lemon.', 'Quinoa, persil, tomate, citron.', 'كينوا وبقدونس وبندورة وحامض.'), usdPrice: 9.75 }),
          item({ name: tr('Shrimp Avocado Bowl', 'Bowl crevettes avocat', 'وعاء روبيان وأفوكادو'), description: tr('Shrimp, avocado, corn, lime dressing.', 'Crevettes, avocat, mais, sauce citron vert.', 'روبيان وأفوكادو وذرة وصوص ليمون.'), usdPrice: 14.5, featured: true }),
        ],
      },
      {
        name: tr('Grill & Seafood', 'Grill et seafood', 'مشاوي وبحر'),
        items: [
          item({ name: tr('Grilled Sea Bass', 'Bar grille', 'قرض مشوي'), description: tr('Whole fish with lemon herb oil.', 'Poisson entier huile citron herbes.', 'سمكة كاملة مع زيت ليمون وأعشاب.'), usdPrice: 22, featured: true }),
          item({ name: tr('Shrimp Skewers', 'Brochettes crevettes', 'أسياخ روبيان'), description: tr('Charred shrimp, garlic, chili, lime.', 'Crevettes grillees, ail, piment, citron vert.', 'روبيان مشوي وثوم وحر وليمون.'), usdPrice: 18.5, spicy: true, popular: true }),
          item({ name: tr('Chicken Lemon Skewers', 'Brochettes poulet citron', 'أسياخ دجاج وليمون'), description: tr('Marinated chicken, lemon, herbs.', 'Poulet marine, citron, herbes.', 'دجاج متبل بليمون وأعشاب.'), usdPrice: 14 }),
          item({ name: tr('Beach Burger', 'Burger plage', 'برغر البحر'), description: tr('Beef patty, cheddar, tomato relish.', 'Steak boeuf, cheddar, relish tomate.', 'لحم وشيدر وريليش بندورة.'), usdPrice: 12.5 }),
          item({ name: tr('Fish Tacos', 'Tacos poisson', 'تاكو سمك'), description: tr('Crispy fish, slaw, spicy mayo.', 'Poisson croustillant, salade, mayo epicee.', 'سمك مقرمش وكولسلو ومايونيز حار.'), usdPrice: 13.5, spicy: true, promo: true }),
        ],
      },
      {
        name: tr('Poolside Snacks', 'Snacks piscine', 'سناك المسبح'),
        items: [
          item({ name: tr('Guacamole & Chips', 'Guacamole et chips', 'غواكامولي وتشيبس'), description: tr('Fresh guacamole with tortilla chips.', 'Guacamole frais avec chips tortilla.', 'غواكامولي طازج مع تشيبس تورتيلا.'), usdPrice: 8.5 }),
          item({ name: tr('Calamari Basket', 'Panier calamars', 'سلة كالاماري'), description: tr('Fried calamari with lemon aioli.', 'Calamars frits avec aioli citron.', 'كالاماري مقلي مع أيولي ليمون.'), usdPrice: 12.75, popular: true }),
          item({ name: tr('Chicken Nachos', 'Nachos poulet', 'ناتشوز دجاج'), description: tr('Nachos, chicken, cheese, salsa.', 'Nachos, poulet, fromage, salsa.', 'ناتشوز ودجاج وجبنة وسالسا.'), usdPrice: 11 }),
          item({ name: tr('Crispy Zucchini', 'Courgettes croustillantes', 'كوسا مقرمشة'), description: tr('Zucchini fries with yogurt dip.', 'Frites courgette avec dip yaourt.', 'كوسا مقرمشة مع صوص لبن.'), usdPrice: 7.25, isNew: true }),
          item({ name: tr('Kids Fish Fingers', 'Fish fingers enfant', 'أصابع سمك للأطفال'), description: tr('Fish fingers, fries, tartar.', 'Fish fingers, frites, tartare.', 'أصابع سمك وبطاطا وتارتار.'), usdPrice: 8.5 }),
        ],
      },
      {
        name: tr('Sunset Drinks', 'Boissons sunset', 'مشروبات الغروب'),
        items: [
          item({ name: tr('Frozen Mint Lemonade', 'Citronnade menthe glacee', 'ليموناضة مثلجة'), description: tr('Frozen lemon, mint, crushed ice.', 'Citron glace, menthe, glace pilee.', 'ليمون مثلج ونعنع وثلج مجروش.'), usdPrice: 5.75, popular: true }),
          item({ name: tr('Mango Passion Smoothie', 'Smoothie mangue passion', 'سموذي مانغو وباشن'), description: tr('Mango, passion fruit, yogurt.', 'Mangue, fruit passion, yaourt.', 'مانغو وباشن فروت ولبن.'), usdPrice: 6.75, featured: true }),
          item({ name: tr('Coconut Cold Brew', 'Cold brew coco', 'كولد برو جوز هند'), description: tr('Cold brew with coconut milk.', 'Cold brew au lait coco.', 'كولد برو مع حليب جوز الهند.'), usdPrice: 6.25, isNew: true }),
          item({ name: tr('Iced Hibiscus Tea', 'The hibiscus glace', 'كركديه مثلج'), description: tr('Hibiscus, citrus, light syrup.', 'Hibiscus, agrumes, sirop leger.', 'كركديه وحمضيات وشراب خفيف.'), usdPrice: 4.75 }),
          item({ name: tr('Sparkling Water Large', 'Eau petillante grande', 'مياه غازية كبيرة'), description: tr('Large sparkling water bottle.', 'Grande bouteille eau petillante.', 'قارورة مياه غازية كبيرة.'), usdPrice: 3.5 }),
        ],
      },
    ],
  },
];

const assertSafeDemoId = (organizationId) => {
  if (!organizationId.startsWith(DEMO_PREFIX)) {
    throw new Error(`Unsafe demo organization id: ${organizationId}`);
  }
};

const deleteDemoRows = async (client, organizationId) => {
  assertSafeDemoId(organizationId);

  await client.query(
    'DELETE FROM order_item WHERE order_id IN (SELECT id FROM "order" WHERE organization_id = $1)',
    [organizationId],
  );
  await client.query('DELETE FROM payment_session WHERE organization_id = $1', [organizationId]);
  await client.query('DELETE FROM analytics_event WHERE organization_id = $1', [organizationId]);
  await client.query('DELETE FROM "order" WHERE organization_id = $1', [organizationId]);
  await client.query('DELETE FROM restaurant_table WHERE organization_id = $1', [organizationId]);
  await client.query('DELETE FROM menu_item WHERE organization_id = $1', [organizationId]);
  await client.query('DELETE FROM menu_category WHERE organization_id = $1', [organizationId]);
};

const upsertOrganization = async (client, demo) => {
  await client.query(
    `
      INSERT INTO organization (
        id,
        restaurant_display_name,
        client_category,
        restaurant_address,
        restaurant_opening_hours,
        restaurant_instagram_url,
        restaurant_wifi_name,
        restaurant_wifi_password,
        restaurant_whatsapp_number,
        restaurant_primary_color,
        restaurant_accent_color,
        restaurant_theme_mode,
        restaurant_template_style,
        restaurant_profile,
        ordering_mode,
        local_currency_code,
        local_currency_label,
        show_menu_item_images,
        welcome_screen_enabled,
        welcome_button_label,
        welcome_button_color,
        welcome_button_position,
        delivery_enabled,
        pickup_enabled,
        delivery_fee_usd_cents,
        delivery_fee_local,
        minimum_order_amount_usd_cents,
        minimum_order_amount_local,
        delivery_estimated_time,
        delivery_coverage_notes,
        qr_mode,
        qr_frame_color,
        qr_foreground_color,
        qr_background_color,
        qr_label_text,
        qr_show_restaurant_name,
        qr_show_table_number,
        qr_style_template,
        access_status,
        access_suspended,
        subscription_status,
        admin_notes
      )
      VALUES (
        $1, $2, 'demo', $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, 'LBP', 'LL', true, false,
        'Open Menu', $10, 'lower_center', $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, true,
        true, $28, 'active', false, 'trial', $29
      )
      ON CONFLICT (id) DO UPDATE SET
        restaurant_display_name = EXCLUDED.restaurant_display_name,
        client_category = EXCLUDED.client_category,
        restaurant_address = EXCLUDED.restaurant_address,
        restaurant_opening_hours = EXCLUDED.restaurant_opening_hours,
        restaurant_instagram_url = EXCLUDED.restaurant_instagram_url,
        restaurant_wifi_name = EXCLUDED.restaurant_wifi_name,
        restaurant_wifi_password = EXCLUDED.restaurant_wifi_password,
        restaurant_whatsapp_number = EXCLUDED.restaurant_whatsapp_number,
        restaurant_primary_color = EXCLUDED.restaurant_primary_color,
        restaurant_accent_color = EXCLUDED.restaurant_accent_color,
        restaurant_theme_mode = EXCLUDED.restaurant_theme_mode,
        restaurant_template_style = EXCLUDED.restaurant_template_style,
        restaurant_profile = EXCLUDED.restaurant_profile,
        ordering_mode = EXCLUDED.ordering_mode,
        local_currency_code = EXCLUDED.local_currency_code,
        local_currency_label = EXCLUDED.local_currency_label,
        show_menu_item_images = EXCLUDED.show_menu_item_images,
        welcome_screen_enabled = EXCLUDED.welcome_screen_enabled,
        welcome_button_label = EXCLUDED.welcome_button_label,
        welcome_button_color = EXCLUDED.welcome_button_color,
        welcome_button_position = EXCLUDED.welcome_button_position,
        delivery_enabled = EXCLUDED.delivery_enabled,
        pickup_enabled = EXCLUDED.pickup_enabled,
        delivery_fee_usd_cents = EXCLUDED.delivery_fee_usd_cents,
        delivery_fee_local = EXCLUDED.delivery_fee_local,
        minimum_order_amount_usd_cents = EXCLUDED.minimum_order_amount_usd_cents,
        minimum_order_amount_local = EXCLUDED.minimum_order_amount_local,
        delivery_estimated_time = EXCLUDED.delivery_estimated_time,
        delivery_coverage_notes = EXCLUDED.delivery_coverage_notes,
        qr_mode = EXCLUDED.qr_mode,
        qr_frame_color = EXCLUDED.qr_frame_color,
        qr_foreground_color = EXCLUDED.qr_foreground_color,
        qr_background_color = EXCLUDED.qr_background_color,
        qr_label_text = EXCLUDED.qr_label_text,
        qr_show_restaurant_name = EXCLUDED.qr_show_restaurant_name,
        qr_show_table_number = EXCLUDED.qr_show_table_number,
        qr_style_template = EXCLUDED.qr_style_template,
        access_status = EXCLUDED.access_status,
        access_suspended = EXCLUDED.access_suspended,
        subscription_status = EXCLUDED.subscription_status,
        admin_notes = EXCLUDED.admin_notes,
        updated_at = now()
    `,
    [
      demo.id,
      demo.displayName,
      demo.address,
      demo.hours,
      demo.instagram,
      demo.wifiName,
      demo.wifiPassword,
      demo.whatsapp,
      demo.primaryColor,
      demo.accentColor,
      demo.themeMode,
      demo.templateStyle,
      demo.profile,
      demo.orderingMode,
      demo.delivery.enabled,
      demo.delivery.pickup,
      demo.delivery.feeUsd === null ? null : usd(demo.delivery.feeUsd),
      demo.delivery.feeUsd === null ? null : lbp(demo.delivery.feeUsd),
      demo.delivery.minimumUsd === null ? null : usd(demo.delivery.minimumUsd),
      demo.delivery.minimumUsd === null ? null : lbp(demo.delivery.minimumUsd),
      demo.delivery.eta,
      demo.delivery.coverage,
      demo.qr.mode,
      demo.qr.frame,
      demo.qr.foreground,
      demo.qr.background,
      demo.qr.label,
      demo.qr.style,
      'Seeded by scripts/seed-demo-restaurants.mjs. Demo data may be reset safely.',
    ],
  );
};

const insertMenu = async (client, demo) => {
  for (const [categoryIndex, category] of demo.categories.entries()) {
    const categoryResult = await client.query(
      `
        INSERT INTO menu_category (
          organization_id,
          parent_category_id,
          name,
          name_en,
          name_fr,
          name_ar,
          display_order
        )
        VALUES ($1, NULL, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        demo.id,
        category.name.en,
        category.name.en,
        category.name.fr,
        category.name.ar,
        (categoryIndex + 1) * 10,
      ],
    );
    const categoryId = categoryResult.rows[0].id;

    for (const menuItem of category.items) {
      await client.query(
        `
          INSERT INTO menu_item (
            organization_id,
            category_id,
            name,
            name_en,
            name_fr,
            name_ar,
            description,
            description_en,
            description_fr,
            description_ar,
            image_url,
            price_usd_cents,
            price_lbp,
            is_popular,
            is_new,
            is_spicy,
            is_featured,
            is_promo,
            is_available
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            NULL, $11, $12, $13, $14, $15, $16, $17, true
          )
        `,
        [
          demo.id,
          categoryId,
          menuItem.name.en,
          menuItem.name.en,
          menuItem.name.fr,
          menuItem.name.ar,
          menuItem.description.en,
          menuItem.description.en,
          menuItem.description.fr,
          menuItem.description.ar,
          menuItem.priceUsdCents,
          menuItem.priceLbp,
          menuItem.isPopular,
          menuItem.isNew,
          menuItem.isSpicy,
          menuItem.isFeatured,
          menuItem.isPromo,
        ],
      );
    }
  }
};

const insertTables = async (client, demo) => {
  for (const tableNumber of demo.tables) {
    await client.query(
      `
        INSERT INTO restaurant_table (organization_id, table_number, qr_code)
        VALUES ($1, $2, $3)
      `,
      [demo.id, tableNumber, `restaurant-table-${demo.id}-${tableNumber}`],
    );
  }
};

const seedDemo = async (client, demo) => {
  assertSafeDemoId(demo.id);
  await client.query('BEGIN');

  try {
    await upsertOrganization(client, demo);
    await deleteDemoRows(client, demo.id);
    await insertMenu(client, demo);
    await insertTables(client, demo);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
};

const main = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to seed demo restaurants.');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    for (const demo of demoRestaurants) {
      await seedDemo(client, demo);
      console.log(`Seeded ${demo.displayName} (${demo.id})`);
    }
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error('Failed to seed demo restaurants:', error);
  process.exitCode = 1;
});
