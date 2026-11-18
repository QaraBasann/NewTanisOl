import { Category, CategoryId, Question } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'all',
    name: 'Bütün Kateqoriyalar',
    icon: 'Sparkles',
    description: 'Həm dərin, həm əyləncəli, həm də sürpriz sualların qarışığı',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'deep',
    name: 'Dərin Söhbətlər',
    icon: 'Compass',
    description: 'Dünya görüşü, fəlsəfə, həyat dəyərləri və daxili aləm',
    color: 'from-blue-600 to-cyan-500',
  },
  {
    id: 'fun',
    name: 'Əyləncəli & Maraqlı',
    icon: 'Smile',
    description: 'Gülməli xatirələr, vərdişlər, qəribə üstünlüklər və yumor',
    color: 'from-amber-500 to-rose-500',
  },
  {
    id: 'love',
    name: 'Sevgi & Münasibətlər',
    icon: 'Heart',
    description: 'Emosional bağlar, sevgi dili, hisslər və güvən',
    color: 'from-rose-500 to-pink-600',
  },
  {
    id: 'mindset',
    name: 'Xarakter & Şəxsiyyət',
    icon: 'Brain',
    description: 'Qərarlar, prinsip və qırmızı xəttlər, gərgin anlarda davranış',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'dreams',
    name: 'Xəyallar & Gələcək',
    icon: 'Rocket',
    description: 'Arzular, hədəflər, səyahətlər və gələcəyə baxış',
    color: 'from-violet-600 to-fuchsia-600',
  },
];

export const QUESTION_BANK: Question[] = [
  // --- DƏRİN SÖHBƏTLƏR (deep) ---
  { id: 'd1', category: 'deep', text: 'Həyatında aldığın və heç vaxt unutmadığın ən dəyərli məsləhət nə olub?' },
  { id: 'd2', category: 'deep', text: 'Sənin üçün həqiqi uğur nədir və bunu nə zaman hiss edirsən?' },
  { id: 'd3', category: 'deep', text: 'Bir insanla səmimi dostlaşmağın üçün ən vacib amil nədir?' },
  { id: 'd4', category: 'deep', text: 'Keçmişə qayıda bilsəydin, özünə hansı xəbərdarlığı edərdin?' },
  { id: 'd5', category: 'deep', text: 'Səni ən çox nə narahat edir və ya düşündürür?' },
  { id: 'd6', category: 'deep', text: 'Sənin üçün "ev" anlayışı nə deməkdir — məkan, yoxsa insan?' },
  { id: 'd7', category: 'deep', text: 'Həyatında xarakterini ən çox dəyişən hadisə nə olub?' },
  { id: 'd8', category: 'deep', text: 'Səncə, zamanla insanlarda itən ən gözəl xüsusiyyət hansıdır?' },
  { id: 'd9', category: 'deep', text: 'Səni başqalarından fərqləndirən ən böyük daxili gücün nədir?' },
  { id: 'd10', category: 'deep', text: 'Həyatında ən çox kimə və nəyə görə minnatdarsan?' },
  { id: 'd11', category: 'deep', text: 'Özünü ən çox nə vaxt azad və xoşbəxt hiss edirsən?' },
  { id: 'd12', category: 'deep', text: 'İnsanların sənin haqqında ən çox səhv anladığı şey nədir?' },
  { id: 'd13', category: 'deep', text: 'Çətin anlarda təsəlli tapmaq üçün nə edirsən?' },
  { id: 'd14', category: 'deep', text: 'Sənin üçün "bağışlamaq" asandır, yoxsa unutmaq?' },
  { id: 'd15', category: 'deep', text: 'Bir cümlə ilə öz həyat fəlsəfəni necə ifadə edərdin?' },
  { id: 'd16', category: 'deep', text: 'Səncə insan ən böyük dərsi nə zaman alır?' },
  { id: 'd17', category: 'deep', text: 'Sakitlik və tənhalıq sənin üçün rahatlıqdır, yoxsa qorxu?' },
  { id: 'd18', category: 'deep', text: 'Gələcəkdən ən böyük gözləntin nədir?' },
  { id: 'd19', category: 'deep', text: 'Səni ən çox təsirləndirən kitab, film və ya sitat hansıdır?' },
  { id: 'd20', category: 'deep', text: 'Bir insanı yaxşı tanıdığını nə zaman hiss edirsən?' },

  // --- ƏYLƏNCƏLİ & MARAQLI (fun) ---
  { id: 'f1', category: 'fun', text: 'Sənin gizli və ya qəribə istedadın/bacarığın nədir?' },
  { id: 'f2', category: 'fun', text: 'Əgər bir gün ərzində gözəgörünməz olsaydın, ilk nə edərdin?' },
  { id: 'f3', category: 'fun', text: 'Sənin ən sevdiyin komfort yeməyi (comfort food) hansıdır?' },
  { id: 'f4', category: 'fun', text: 'Başına gələn ən gülməli və ya utanmalı xatirən nədir?' },
  { id: 'f5', category: 'fun', text: 'Hər gün heç bezmədən yeyə biləcəyin tək bir yemək seçsəydin?' },
  { id: 'f6', category: 'fun', text: 'Əgər film və ya çizgi film qəhrəmanı olsaydın, kim olardın?' },
  { id: 'f7', category: 'fun', text: 'Səni dərhal yaxşı əhvala gətirən mahnı və ya musiqi hansıdır?' },
  { id: 'f8', category: 'fun', text: 'Qəribə və ya mənasız bir vərdişin var?' },
  { id: 'f9', category: 'fun', text: 'Əgər piyada gəzmədən istənilən yerə anında teleport ola bilsəydin, hara gedərdin?' },
  { id: 'f10', category: 'fun', text: 'Uşaqlıqda ən böyük xəyalın kim olmaq idi?' },
  { id: 'f11', category: 'fun', text: 'Sənin ən sevdiyin serial/film hansıdır və neçə dəfə baxmısan?' },
  { id: 'f12', category: 'fun', text: 'Telefonunda en çox istifadə etdiyin tətbiq hansıdır?' },
  { id: 'f13', category: 'fun', text: 'Sənin ən böyük "guilty pleasure"ın (utanaraq sevdiyin şey) nədir?' },
  { id: 'f14', category: 'fun', text: 'Səhərlər tez duran insansan, yoxsa gecə quşusan?' },
  { id: 'f15', category: 'fun', text: 'Dünyada bütün pişiklər və ya itlər danışa bilsəydi, ilk ne soruşardın?' },
  { id: 'f16', category: 'fun', text: 'Əgər özünə xüsusi bir super güc seçə bilsəydin, bu nə olardı?' },
  { id: 'f17', category: 'fun', text: 'Qaranlıqda tək qalmaqdan, yoksa hündürlükdən daha çox qorxursan?' },
  { id: 'f18', category: 'fun', text: 'Həyatının adını bir film qoysaydılar, adı nə olardı?' },
  { id: 'f19', category: 'fun', text: 'Loto-da 1 milyon dollar qazansaydın, ilk 3 saatda nə edərdin?' },
  { id: 'f20', category: 'fun', text: 'Ən son nəyə uca səslə gülmüsən?' },

  // --- SEVGİ & MÜNASİBƏTLƏR (love) ---
  { id: 'l1', category: 'love', text: 'Sənin üçün "Sevgi dili" hansıdır? (Sözlər, diqqət, hədiyyələr, toxunuş, yoxsa kömək?)' },
  { id: 'l2', category: 'love', text: 'Bir münasibətdə sənin üçün ən böyük "Red Flag" (qırmızı xətt) nədir?' },
  { id: 'l3', category: 'love', text: 'İdeal bir görüş (date) sənin üçün necə keçməlidir?' },
  { id: 'l4', category: 'love', text: 'Bir insanda səni ilk baxışdan valeh edən xüsusiyyət nədir?' },
  { id: 'l5', category: 'love', text: 'Münasibətdə güvəni bərpa etmək mümkündür, yoxsa yox?' },
  { id: 'l6', category: 'love', text: 'Qarşı tərəfdən aldığın ən romantik və ya yaddaqalan jest nə olub?' },
  { id: 'l7', category: 'love', text: 'Sən özünü diqqətcil və romantik biri hesab edirsən?' },
  { id: 'l8', category: 'love', text: 'Bir münasibətdə fədakarlıq etmək harada bitməlidir?' },
  { id: 'l9', category: 'love', text: 'Gözlənilməz sürprizləri sevirsən, yoxsa əvvəlcədən planlaşdırılmış anları?' },
  { id: 'l10', category: 'love', text: 'Ailə və dostların rəyi münasibət qərarına nə dərəcədə təsir edir?' },
  { id: 'l11', category: 'love', text: 'Səncə sevmək daha vacibdir, yoxsa sevilmək?' },
  { id: 'l12', category: 'love', text: 'İncidiyin zaman susmağı üstün tutursan, yoxsa anında danışmağı?' },
  { id: 'l13', category: 'love', text: 'Münasibətdə yumor hissiyyatı neçə faiz rola malikdir?' },
  { id: 'l14', category: 'love', text: 'Uzunmüddətli münasibətin sirri səncə nədir?' },
  { id: 'l15', category: 'love', text: 'Səni ən çox nə xoşbəxt edər — balaca gözəl diqqət, yoxsa böyük addım?' },
  { id: 'l16', category: 'love', text: 'Küsülü qalmaq vərdişin var, yoxsa dərhal barışmaq istəyirsən?' },
  { id: 'l17', category: 'love', text: 'Qısqanclıq səncə sevginin əlamətidir, yoxsa özünə inamsızlığın?' },
  { id: 'l18', category: 'love', text: 'Qarşı tərəfdə geyim tərzi və estetik görüş sənin üçün vacibdir?' },
  { id: 'l19', category: 'love', text: 'Münasibətdə şəxsi məkan və vaxt necə qorunmalıdır?' },
  { id: 'l20', category: 'love', text: 'Sənin üçün "biz" olmaq nə deməkdir?' },

  // --- XARAKTER & ŞƏXSİYYƏT (mindset) ---
  { id: 'm1', category: 'mindset', text: 'Stressli və gərgin vəziyyətlərdə necə davranırsan?' },
  { id: 'm2', category: 'mindset', text: 'Qərarlarını daha çox ağılla verirsən, yoxsa ürəyinlə?' },
  { id: 'm3', category: 'mindset', text: 'Sənin xarakterində ən çox bəyəndiyin xüsusiyyət hansıdır?' },
  { id: 'm4', category: 'mindset', text: 'Özündə dəyişmək istədiyin bir mənfi xüsusiyyət var?' },
  { id: 'm5', category: 'mindset', text: 'Tənqid olunanda reaksiyan necə olur?' },
  { id: 'm6', category: 'mindset', text: 'Planlı insanlarsan, yoxsa anlıq (spontan) yaşamağı sevsən?' },
  { id: 'm7', category: 'mindset', text: 'Səbrli insansan, yoxsa tez hövsələdən çıxırsan?' },
  { id: 'm8', category: 'mindset', text: 'Sənin üçün ən çətin "YOX" demək hansı məqamdadır?' },
  { id: 'm9', category: 'mindset', text: 'İnsanlara tez güvənirsən, yoxsa zamana ehtiyacın olur?' },
  { id: 'm10', category: 'mindset', text: 'Özünü introvert, ekstravert, yoxsa hər ikisinin qarışığı sayırsan?' },
  { id: 'm11', category: 'mindset', text: 'Haqlı olduğunu bildiyin halda güzəştə gedə bilərsən?' },
  { id: 'm12', category: 'mindset', text: 'Səni ən çox nə həvəsləndirir və enerjini artırır?' },
  { id: 'm13', category: 'mindset', text: 'Yalanı hansı hallarda bağışlaya bilərsən?' },
  { id: 'm14', category: 'mindset', text: 'Sənin üçün dürüstlük, yoxsa nəzakət daha önəmlidir?' },
  { id: 'm15', category: 'mindset', text: 'Böyük bir risk etməkdən qorxursan?' },
  { id: 'm16', category: 'mindset', text: 'Xəyal gücün güclüdür, yoxsa daha çox realist insansan?' },
  { id: 'm17', category: 'mindset', text: 'Özünə ən çox güvəndiyin sahə hansıdır?' },
  { id: 'm18', category: 'mindset', text: 'Məğlubiyyətlə qarşılaşanda dərhal addım atırsan, yoxsa vaxt götürürsən?' },
  { id: 'm19', category: 'mindset', text: 'Sənə olunan yaxşılığı nə qədər vaxt xatırlayırsan?' },
  { id: 'm20', category: 'mindset', text: 'Özünü 3 sözlə necə xarakterizə edərdin?' },

  // --- XƏYALLAR & GƏLƏCƏK (dreams) ---
  { id: 'dr1', category: 'dreams', text: 'Səyahət etmək istədiyin xəyalındakı ölkə və ya şəhər hansıdır?' },
  { id: 'dr2', category: 'dreams', text: '5 ildən sonra özünü harada və necə görürsən?' },
  { id: 'dr3', category: 'dreams', text: 'Hələ etmədiyin, amma mütləq reallaşdırmaq istədiyin bir arzu?' },
  { id: 'dr4', category: 'dreams', text: 'İdeal yaşayış yerin necə olmalıdır — dəniz qırağı, dağ ətəyi, yoxsa modern şəhər?' },
  { id: 'dr5', category: 'dreams', text: 'Öz biznesini qursaydın, bu hansı sahədə olardı?' },
  { id: 'dr6', category: 'dreams', text: 'Sənin xəyalındakı ev necə dizayn edilib?' },
  { id: 'dr7', category: 'dreams', text: 'Dünyanı dəyişmək şansın olsaydı, nəyi ilk olaraq həll edərdin?' },
  { id: 'dr8', category: 'dreams', text: 'Öyrənmək istədiyin yeni bir dil və ya sənət var?' },
  { id: 'dr9', category: 'dreams', text: 'Həyatında imza atmaq istədiyin ən böyük layihə nədir?' },
  { id: 'dr10', category: 'dreams', text: 'Qocalanda özünü necə xatırlamaq istərdin?' },
  { id: 'dr11', category: 'dreams', text: 'Sənin üçün xəyallar arxasınca qaçmaq vacibdir, yoxsa sabitlik?' },
  { id: 'dr12', category: 'dreams', text: 'Bir gün təkbaşına dünya turuna çıxmaq istərdin?' },
  { id: 'dr13', category: 'dreams', text: 'Ən çox hansı sahədə məşhur və ya tanınan olmaq istərdin?' },
  { id: 'dr14', category: 'dreams', text: 'Gələcəkdə toplamaq istədiyin unikal kolleksiya nə ola bilər?' },
  { id: 'dr15', category: 'dreams', text: 'Həyatında reallaşan ən gözəl xəyalın nə olub?' },
  { id: 'dr16', category: 'dreams', text: 'Sənin üçün unudulmaz bir macəra necə olmalıdır?' },
  { id: 'dr17', category: 'dreams', text: 'Ən çox hansı tarixi şəxsiyyətlə şam yeməyində oturmaq istərdin?' },
  { id: 'dr18', category: 'dreams', text: 'Gələcək nəslə buraxmaq istədiyin en böyük miras nədir?' },
  { id: 'dr19', category: 'dreams', text: 'Xəyallarının arxasınca gedərkən ən çox nəyə güvənirsən?' },
  { id: 'dr20', category: 'dreams', text: 'Bu gün sənə limitsiz imkan verilsə, sabah ilk nə edərdin?' },
];

export function getRandomQuestions(category: CategoryId, count = 10, excludeIds: string[] = []): Question[] {
  let eligible = QUESTION_BANK.filter(q => !excludeIds.includes(q.id));
  if (category !== 'all') {
    eligible = eligible.filter(q => q.category === category);
  }
  
  // If not enough questions left in pool, reset exclusion for category
  if (eligible.length < count) {
    eligible = category === 'all' 
      ? QUESTION_BANK 
      : QUESTION_BANK.filter(q => q.category === category);
  }

  // Shuffle
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
