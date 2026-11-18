import { db } from './db.js';
import { 
  normalizeAzerbaijaniText, 
  computeSimilarityHash, 
  extractNgrams 
} from './questionDeduplication.js';
import { generateId } from './session.js';

export interface SeedQuestion {
  category: string;
  text: string;
  topic_tags: string[];
}

export const SEED_QUESTIONS: SeedQuestion[] = [
  // ================= 1. SEVGİ VƏ MÜNASİBƏTLƏR (love) =================
  { category: 'love', text: 'Səncə, bir münasibətdə hisslər soyuyanda onu xilas edən nə olur: vərdiş, yoxsa qətiyyət?', topic_tags: ['münasibət', 'hisslər', 'sədaqət'] },
  { category: 'love', text: 'Qarşı tərəfin hansı kiçik davranışı sənə dərhal dəyərli olduğunu hiss etdirir?', topic_tags: ['dəyər', 'qayğı', 'diqqət'] },
  { category: 'love', text: 'Sevgi etirafında ən vacib olan nədir: sözlər, baxışlar, yoxsa hərəkətlər?', topic_tags: ['etiraf', 'hisslər', 'səmimiyyət'] },
  { category: 'love', text: 'Münasibətdə sənin üçün heç vaxt bağışlanmayacaq qırmızı xətt hansıdır?', topic_tags: ['qırmızı xətt', 'xəyanət', 'sərhəd'] },
  { category: 'love', text: 'Səncə, əsl sevgi insanı azad edir, yoxsa müəyyən mənada asılı edir?', topic_tags: ['azadlıq', 'bağlılıq', 'fəlsəfə'] },
  { category: 'love', text: 'İlk baxışdan sevgiyə inanırsan, yoxsa sevgi zamanla qurulan bir qaladır?', topic_tags: ['ilk baxış', 'zaman', 'inam'] },
  { category: 'love', text: 'Münasibətdə qarşı tərəflə ən böyük fikir ayrılığını necə həll etməyə üstünlük verirsən?', topic_tags: ['münaqişə', 'ünsiyyət', 'kompromis'] },
  { category: 'love', text: 'Sevgi dilin hansıdır: xoş sözlər, birgə keyfiyyətli vaxt, toxunuş, yoxsa hədiyyə?', topic_tags: ['sevgi dili', 'ünsiyyət', 'diqqət'] },
  { category: 'love', text: 'Sevdiyin insan üçün indiyə qədər etdiyin ən gözlənilməz və ya çılğın addım nə olub?', topic_tags: ['fədakarlıq', 'sürpriz', 'xatirə'] },
  { category: 'love', text: 'Səncə, bir-birini sevən iki insanın tamamilə fərqli xarakterlərdə olması maneədir, yoxsa üstünlük?', topic_tags: ['xarakter', 'fərqlilik', 'uyğunluq'] },
  { category: 'love', text: 'Keçmiş münasibətlərindən gələcəyə apardığın ən böyük həyat dərsi nədir?', topic_tags: ['təcrübə', 'dərs', 'keçmiş'] },
  { category: 'love', text: 'İdeal romantik axşam sənin təsəvvüründə necə canlanır?', topic_tags: ['romantika', 'axşam', 'atmosfer'] },
  { category: 'love', text: 'Münasibətdə qısqanclıq sevginin sübutudur, yoxsa güvənsizliyin əlamətidir?', topic_tags: ['qısqanclıq', 'güvən', 'psixologiya'] },
  { category: 'love', text: 'Səncə, sevgidə "düzgün insan" anlayışı var, yoxsa münasibəti düzgün edən tərəflərin səyidir?', topic_tags: ['tale', 'səy', 'münasibət'] },
  { category: 'love', text: 'Qarşındakı insanın səni həqiqətən anladığını ilk dəfə nə vaxt və necə hiss etmisən?', topic_tags: ['anlaşılmaq', 'empatiya', 'duyğu'] },
  { category: 'love', text: 'Birlikdə susmaqdan zövq ala bilmək münasibətdə nəyin göstəricisidir?', topic_tags: ['sükut', 'rahatlıq', 'yaxınlıq'] },
  { category: 'love', text: 'Bir insanı həyatına daxil edərkən ən çox nədən çəkinirsən?', topic_tags: ['qorxu', 'güvən', 'başlanğıc'] },
  { category: 'love', text: 'Səncə, uzunömürlü sevginin ən böyük sirri nədir?', topic_tags: ['uzunömürlülük', 'sirr', 'bağlılıq'] },
  { category: 'love', text: 'Sevdiyin insanın hansı kiçik qüsuru və ya vərdişi sənə sevimli gəlir?', topic_tags: ['qüsur', 'sevimlilik', 'vərdiş'] },
  { category: 'love', text: 'Bir gün münasibətdə hər şey çətinləşsə, qalmaq üçün əsas səbəbin nə olar?', topic_tags: ['bağlılıq', 'sınaq', 'dəyər'] },
  { category: 'love', text: 'Sənin üçün sevgini itirmək daha ağrılıdır, yoxsa heç vaxt sevməmiş olmaq?', topic_tags: ['itki', 'hisslər', 'fəlsəfə'] },
  { category: 'love', text: 'Partnyorun kədərli olanda ona necə dəstək olmağı seçirsən: təsəlli ilə, yoxsa sadəcə yanında susaraq?', topic_tags: ['dəstək', 'kədər', 'qayğı'] },
  { category: 'love', text: 'Gözəl bir münasibətdə tərəflər bir-birinin şəxsi məkanına nə dərəcədə hörmət etməlidir?', topic_tags: ['şəxsi məkan', 'sərhəd', 'hörmət'] },
  { category: 'love', text: 'Səncə, sevgi zaman keçdikcə necə dəyişir və formalaşır?', topic_tags: ['dəyişim', 'yetkinlik', 'məhəbbət'] },
  { category: 'love', text: 'Həyatında aldığın ən səmimi sevgi etirafı və ya tərif nə olub?', topic_tags: ['tərif', 'etiraf', 'səmimiyyət'] },
  { category: 'love', text: 'Bir münasibətdə "mən" və "biz" balansını necə qoruyursan?', topic_tags: ['fərdilik', 'birlik', 'balans'] },
  { category: 'love', text: 'Səni bir insana qarşı emosional olaraq bağlayan ən güclü amil nədir?', topic_tags: ['bağ', 'emosiya', 'yaxınlıq'] },
  { category: 'love', text: 'Münasibətdə kiçik sürprizlər sənin üçün nə qədər əhəmiyyətlidir?', topic_tags: ['sürpriz', 'diqqət', 'sevinc'] },
  { category: 'love', text: 'Heç sevdiyin birindən öyrəndiyin və həyatında tətbiq etdiyin gözəl bir xüsusiyyət olubmu?', topic_tags: ['təsir', 'inkişaf', 'xatirə'] },
  { category: 'love', text: 'Səncə, sevgi bir hissdir, yoxsa hər gün verilən bir qərardır?', topic_tags: ['qərar', 'hiss', 'məsuliyyət'] },

  // ================= 2. DOSTLUQ (friendship) =================
  { category: 'friendship', text: 'Sənin üçün həqiqi dost kimdir və bunu ən çox hansı anda hiss etmisən?', topic_tags: ['həqiqi dost', 'dəstək', 'güvən'] },
  { category: 'friendship', text: 'Gecə saat 3-də tərəddüd etmədən zəng edə biləcəyin neçə insan var?', topic_tags: ['etibar', 'gecə', 'yaxınlıq'] },
  { category: 'friendship', text: 'Dostluqda ən çox bağışlanması çətin olan hərəkət nədir?', topic_tags: ['bağışlamaq', 'xəyanət', 'sərhəd'] },
  { category: 'friendship', text: 'Zaman və məsafə həqiqi dostluğu zəiflədə bilərmi, yoxsa daha da möhkəmləndirir?', topic_tags: ['məsafə', 'zaman', 'sınaq'] },
  { category: 'friendship', text: 'Uşaqlıq dostlarınla indiki dostların arasında hiss baxımından ən böyük fərq nədir?', topic_tags: ['uşaqlıq', 'nostalji', 'fərq'] },
  { category: 'friendship', text: 'Bir dostun səhvinə görə onu açıq tənqid edərsən, yoxsa qəlbinə dəyməmək üçün susarsan?', topic_tags: ['tənqid', 'dürüstlük', 'xarakter'] },
  { category: 'friendship', text: 'Dostunla birlikdə yaşadığın ən unudulmaz və gülməli macəra hansı olub?', topic_tags: ['macəra', 'gülüş', 'xatirə'] },
  { category: 'friendship', text: 'Dostunun uğuruna ürəkdən sevinə bilmək sənə görə nə qədər asandır?', topic_tags: ['uğur', 'həsəd', 'səmimiyyət'] },
  { category: 'friendship', text: 'Həyatından çıxardığın bir dostun üçün heç darıxdığın anlar olurmu?', topic_tags: ['ayrılıq', 'darıxmaq', 'keçmiş'] },
  { category: 'friendship', text: 'Səncə, qadın və kişi arasında təmənnasız, ömürlük dostluq mümkündürmü?', topic_tags: ['gender', 'dostluq', 'baxış'] },
  { category: 'friendship', text: 'Dostuna etdiyin və hələ də xatırlayanda qürur duyduğun ən böyük yaxşılıq nədir?', topic_tags: ['fədakarlıq', 'kömək', 'qürur'] },
  { category: 'friendship', text: 'Bir insanla dostlaşmağın üçün adətən nə qədər vaxt və hansı qığılcım lazımdır?', topic_tags: ['tanışlıq', 'vaxt', 'qığılcım'] },
  { category: 'friendship', text: 'Sənin fikrincə, çoxlu tanışa sahib olmaq yaxşıdır, yoxsa 2-3 etibarlı dosta?', topic_tags: ['çevrə', 'keyfiyyət', 'kəmiyyət'] },
  { category: 'friendship', text: 'Dostunun səndən gizlətdiyi bir sirri öyrənsəydin, reaksiyan necə olardı?', topic_tags: ['sirr', 'inciklik', 'etibar'] },
  { category: 'friendship', text: 'Dostluqda ən vacib prinsip hansıdır: sədaqət, dürüstlük, yoxsa əyləncə?', topic_tags: ['prinsip', 'sədaqət', 'dəyər'] },
  { category: 'friendship', text: 'Bir dostun səninlə fikirləşmədən kobud danışsa, ona bunu dərhal bildirərsən?', topic_tags: ['sərhəd', 'kobudluq', 'ünsiyyət'] },
  { category: 'friendship', text: 'Həyatında sənə ən çox təsir edən və yol göstərən dostun kim olub?', topic_tags: ['müdriklik', 'təsir', 'yol'] },
  { category: 'friendship', text: 'Dostunla ortaq maraqlarınız olmasa belə, dostluğu davam etdirə bilərsənmi?', topic_tags: ['maraqlar', 'fərqlilik', 'uyğunluq'] },
  { category: 'friendship', text: 'Dostun çətin vəziyyətdə olanda ilk nə edirsən: dinləyirsən, yoxsa çıxış yolu axtarırsan?', topic_tags: ['dinləmək', 'həll', 'empatiya'] },
  { category: 'friendship', text: 'Səncə, dostluqda rəqabət olmalıdırmı?', topic_tags: ['rəqabət', 'inkişaf', 'psixologiya'] },
  { category: 'friendship', text: 'Heç bir dostuna görə öz planlarından tamamilə imtina etmisənmi?', topic_tags: ['fədakarlıq', 'plan', 'bağlılıq'] },
  { category: 'friendship', text: 'Dostunun sənin haqqında dediyi və heç vaxt unutmadığın ən dəyərli söz hansıdır?', topic_tags: ['söz', 'xatirə', 'təsir'] },
  { category: 'friendship', text: 'Bir dostluğun bitdiyini ən çox hansı əlamətdən anlayırsan?', topic_tags: ['ayrılıq', 'soyumaq', 'son'] },
  { category: 'friendship', text: 'Dostun səhv yolda olanda onu dayandırmaq üçün nə qədər irəli gedə bilərsən?', topic_tags: ['məsuliyyət', 'səhv', 'dəstək'] },
  { category: 'friendship', text: 'Səncə, yaxşı dost olmaq üçün insanda hansı əsas keyfiyyət olmalıdır?', topic_tags: ['keyfiyyət', 'xarakter', 'dost'] },

  // ================= 3. UŞAQLIQ VƏ XATİRƏLƏR (memories) =================
  { category: 'memories', text: 'Uşaqlığından yadında qalan və hər dəfə xatırlayanda üzündə təbəssüm yaradan ilk an nədir?', topic_tags: ['uşaqlıq', 'ilk an', 'təbəssüm'] },
  { category: 'memories', text: 'Uşaq ikən ən sevimli oyunun və ya məşğuliyyətin nə idi?', topic_tags: ['oyun', 'əyləncə', 'məsumluq'] },
  { category: 'memories', text: 'Uşaqlıq illərində ən böyük qorxun nə idi və indi bu qorxudan əsər-əlamət qalıbmı?', topic_tags: ['qorxu', 'uşaqlıq', 'keçmiş'] },
  { category: 'memories', text: 'Böyüdüyün məhəllənin və ya evin ən sevimli guşəsi harası idi?', topic_tags: ['məhəllə', 'ev', 'nostalji'] },
  { category: 'memories', text: 'Uşaq vaxtı böyüyəndə kim olmaq istəyirdin və reallıq o arzuya nə qədər yaxındır?', topic_tags: ['peşə', 'arzu', 'reallıq'] },
  { category: 'memories', text: 'Valideynlərinin səni uşaqkən ən çox cəzalandırdığı və ya danladığı səbəb nə olub?', topic_tags: ['cəza', 'dəcəllik', 'ailə'] },
  { category: 'memories', text: 'Uşaqlıq illərindən bu günə qədər saxladığın hər hansı bir əşya və ya oyuncaq varmı?', topic_tags: ['əşya', 'oyuncaq', 'yadigar'] },
  { category: 'memories', text: 'Məktəb illərində ən sevdiyin və ən nifrət etdiyin fənn hansı idi?', topic_tags: ['məktəb', 'dərslər', 'müəllim'] },
  { category: 'memories', text: 'Uşaqkən böyüklərin dünyasında sənə ən qəribə və mənasız gələn şey nə idi?', topic_tags: ['böyüklər', 'məsumluq', 'baxış'] },
  { category: 'memories', text: 'Ailənlə keçirdiyin ən unudulmaz yay tətili və ya bayram günü hansı olub?', topic_tags: ['bayram', 'ailə', 'tətil'] },
  { category: 'memories', text: 'Uşaqlıqda etdiyin və uzun müddət sirr olaraq saxladığın ən böyük dəcəllik nə olub?', topic_tags: ['sirr', 'dəcəllik', 'xatirə'] },
  { category: 'memories', text: 'Səncə, indiki uşaqlarla sənin uşaqlığın arasındakı ən ağrılı və ya ən böyük fərq nədir?', topic_tags: ['texnologiya', 'uşaqlar', 'fərq'] },
  { category: 'memories', text: 'Nənə və ya babandan yadında qalan ən dərin məsləhət və ya xatirə hansıdır?', topic_tags: ['nənə', 'baba', 'müdriklik'] },
  { category: 'memories', text: 'Uşaqkən dünya sənə indiki ilə müqayisədə necə görünürdü?', topic_tags: ['dünya', 'məsumluq', 'dəyişim'] },
  { category: 'memories', text: 'İlk dəfə özünü həqiqətən böyümüş hiss etdiyin an nə vaxt olub?', topic_tags: ['böyümək', 'məsuliyyət', 'yetkinlik'] },
  { category: 'memories', text: 'Məktəb illərində gizli bəyəndiyin kimsə olmuşdumu?', topic_tags: ['məktəb', 'ilk sevgi', 'nostalji'] },
  { category: 'memories', text: 'Uşaqlıqda səni ən çox sevindirən yemək və ya şirniyyat hansı idi?', topic_tags: ['dad', 'şirniyyat', 'sevinc'] },
  { category: 'memories', text: 'Uşaqlığına qayıdıb sadəcə bir günü yenidən yaşamaq şansın olsa, hansı günü seçərdin?', topic_tags: ['keçmiş', 'arzular', 'zaman'] },
  { category: 'memories', text: 'Uşaqlıqda təxəyyülündə qurduğun xəyali dostun və ya qəhrəmanın var idimi?', topic_tags: ['təxəyyül', 'qəhrəman', 'uşaqlıq'] },
  { category: 'memories', text: 'Sənin üçün uşaqlığın qoxusu nədir: yağış, təzə çörək, yoxsa başqa bir şey?', topic_tags: ['qoxu', 'hiss', 'nostalji'] },

  // ================= 4. XARAKTER VƏ ŞƏXSİYYƏT (personality) =================
  { category: 'personality', text: 'Özündə ən çox dəyişmək istədiyin, amma hələ də bacarmadığın xasiyyət hansıdır?', topic_tags: ['xasiyyət', 'özünüdərk', 'dəyişim'] },
  { category: 'personality', text: 'Qəzəblənəndə necə davranırsan: içinə qapanırsan, yoxsa hər şeyi açıq deyirsən?', topic_tags: ['qəzəb', 'reaksiya', 'emosiya'] },
  { category: 'personality', text: 'Sənin ən güclü xarakter cəhətin hansıdır ki, onun sayəsində həmişə çətinliklərdən çıxırsan?', topic_tags: ['güc', 'dayanıqlılıq', 'qürur'] },
  { category: 'personality', text: 'İnsanların sənin haqqında ən çox yanıldığı və ya səhv başa düşdüyü xüsusiyyət nədir?', topic_tags: ['təəssürat', 'anlaşılmamaq', 'şəxsiyyət'] },
  { category: 'personality', text: 'Bir qərar verərkən ağılın səsinə qulaq asırsan, yoxsa qəlbinin və intuisiyanın?', topic_tags: ['ağıl', 'ürək', 'intuisiya'] },
  { category: 'personality', text: 'Tənqidlərə reaksiyan necə olur: dərhal müdafiəyə keçirsən, yoxsa dərindən analiz edirsən?', topic_tags: ['tənqid', 'özünütənqid', 'inkişaf'] },
  { category: 'personality', text: 'Özünlə tək qalmaqdan zövq alırsan, yoxsa tənha qalmaq səni narahat edir?', topic_tags: ['tənhalıq', 'sükut', 'daxili aləm'] },
  { category: 'personality', text: 'Səni ən tez əsəbiləşdirən insan davranışı hansıdır?', topic_tags: ['əsəb', 'sərhəd', 'dözümsüzlük'] },
  { category: 'personality', text: 'Həyatında prinsiplərinə görə böyük bir fürsətdən imtina etdiyin olubmu?', topic_tags: ['prinsip', 'fədakarlıq', 'dürüstlük'] },
  { category: 'personality', text: 'İnsanlara güvənməyə dərhal meyllisən, yoxsa güvən sənin üçün addım-addım qazanılır?', topic_tags: ['güvən', 'ehtiyat', 'insanlar'] },
  { category: 'personality', text: 'Özünü introvert, ekstrovert, yoxsa hər ikisinin qarışığı hesab edirsən?', topic_tags: ['şəxsiyyət növü', 'enerji', 'ünsiyyət'] },
  { category: 'personality', text: 'Gözlənilməz stressli situasiyalarda adətən necə reaksiya verirsən?', topic_tags: ['stress', 'sakitlik', 'böhran'] },
  { category: 'personality', text: 'Səncə, bir insanın xarakterini ən aydın göstərən an hansıdır?', topic_tags: ['sınaq', 'xarakter', 'müşahidə'] },
  { category: 'personality', text: 'Səhv etdiyini anlayanda üzr istəmək sənin üçün nə dərəcədə asandır?', topic_tags: ['üzr istəmək', 'qürur', 'yetkinlik'] },
  { category: 'personality', text: 'Səni ən dərindən motivasiya edən hiss hansıdır: rəqabət, sevgi, yoxsa özünü təsdiq?', topic_tags: ['motivasiya', 'məqsəd', 'hərəkət'] },

  // ================= 5. HƏYAT VƏ GƏLƏCƏK (life_future) =================
  { category: 'life_future', text: 'Sənin üçün mənalı və xoşbəxt həyatın tərifi nədir?', topic_tags: ['məna', 'xoşbəxtlik', 'fəlsəfə'] },
  { category: 'life_future', text: '10 il sonrakı özünlə qarşılaşsan, ondan ilk nəyi soruşardın?', topic_tags: ['gələcək', 'zaman', 'ümid'] },
  { category: 'life_future', text: 'Həyatında aldığın ən riskli qərar hansı olub və nəticəsi necə oldu?', topic_tags: ['risk', 'qərar', 'cəsarət'] },
  { category: 'life_future', text: 'Əgər maddi sıxıntı deyilən bir anlayış olmasaydı, hər gününü nəyə sərf edərdin?', topic_tags: ['azadlıq', 'ehtiras', 'seçim'] },
  { category: 'life_future', text: 'Qocalanda arxaya baxarkən ən çox hansı peşmanlıqdan qorxursan?', topic_tags: ['peşmanlıq', 'qocalıq', 'həyat'] },
  { category: 'life_future', text: 'Həyatının indiki mərhələsini bir kitab fəsli adlandırsaydın, o fəslin adı nə olardı?', topic_tags: ['mərhələ', 'kitab', 'özünüifadə'] },
  { category: 'life_future', text: 'Səncə, tale insanın öz əlindədir, yoxsa hər şey əvvəlcədən yazılıb?', topic_tags: ['tale', 'qismət', 'seçim'] },
  { category: 'life_future', text: 'Həyatında verdiyin ən çətin "yox" cavabı nə ilə bağlı olub?', topic_tags: ['yox demək', 'sərhəd', 'cəsarət'] },
  { category: 'life_future', text: 'Dünyada bir şeyi dəyişmək gücün olsaydı, nəyi dəyişərdin?', topic_tags: ['dünya', 'dəyişiklik', 'arzu'] },
  { category: 'life_future', text: 'Yaşadığın həyatın tempindən razısan, yoxsa hər şeyin daha yavaş/sürətli axmasını istərdin?', topic_tags: ['temp', 'zaman', 'huzur'] },
  { category: 'life_future', text: 'Gələcəkdə yaşamaq istədiyin ideal məkan haradır: səsli meqapolis, yoxsa dəniz kənarı sakit kənd?', topic_tags: ['məkan', 'gələcək', 'həyat tərzi'] },
  { category: 'life_future', text: 'Səncə, uğurlu karyera şəxsi həyatın rahatlığına dəyərmi?', topic_tags: ['karyera', 'balans', 'ailə'] },
  { category: 'life_future', text: 'Ömrünün sonuna qədər sadəcə bir vərdişi davam etdirə bilsəydin, bu nə olardı?', topic_tags: ['vərdiş', 'sədaqət', 'dəyər'] },
  { category: 'life_future', text: 'Həyatında öyrəndiyin ən qiymətli, heç bir kitabda yazılmayan həqiqət nədir?', topic_tags: ['təcrübə', 'həqiqət', 'müdriklik'] },
  { category: 'life_future', text: 'Gələcəkdə insanlara qoymaq istədiyin ən gözəl miras nə olardı?', topic_tags: ['miras', 'iz qoymaq', 'dəyər'] },

  // ================= 6. XƏYALLAR VƏ MƏQSƏDLƏR (dreams_goals) =================
  { category: 'dreams_goals', text: 'Uşaqlıqdan bəri qəlbində bəslədiyin, amma heç kimə demədiyin gizli bir xəyalın varmı?', topic_tags: ['xəyal', 'gizli', 'arzu'] },
  { category: 'dreams_goals', text: 'Hazırda həyatında çatmaq üçün hər gün çalışdığın ən böyük məqsəd nədir?', topic_tags: ['məqsəd', 'hədəf', 'səy'] },
  { category: 'dreams_goals', text: 'Əgər uğursuzluq ehtimalı sıfır olsaydı, sabah dərhal hansı işə başlayardın?', topic_tags: ['cəsarət', 'risk', 'başlanğıc'] },
  { category: 'dreams_goals', text: 'Özünü 5 il sonra harada və kiminlə görmək ən böyük arzundur?', topic_tags: ['5 il', 'vizyon', 'gələcək'] },
  { category: 'dreams_goals', text: 'Dünyanı gəzmək imkanın olsa, ayaq basmaq istədiyin ilk 3 ölkə hansı olardı?', topic_tags: ['səyahət', 'ölkələr', 'macəra'] },
  { category: 'dreams_goals', text: 'Məqsədinə çatanda hissini qeyd etmək üçün özünə verəcəyin ən böyük mükafat nədir?', topic_tags: ['mükafat', 'qələbə', 'hiss'] },
  { category: 'dreams_goals', text: 'Heç bir xəyalından məcburi şəkildə imtina etdiyin olubmu?', topic_tags: ['imtina', 'reallıq', 'dərs'] },
  { category: 'dreams_goals', text: 'Öyrənmək istədiyin ən böyük bacarıq və ya sənət hansıdır (məsələn, rəsm, musiqi aləti, yeni dil)?', topic_tags: ['bacarıq', 'sənət', 'inkişaf'] },
  { category: 'dreams_goals', text: 'Səncə, böyük xəyallar qurmaq insanı motivasiya edir, yoxsa xəyal qırıqlığına aparır?', topic_tags: ['xəyal', 'motivasiya', 'reallıq'] },
  { category: 'dreams_goals', text: 'Bir gün öz biznesini və ya layihəni qursaydın, o nə ilə bağlı olardı?', topic_tags: ['biznes', 'layihə', 'yaradıcılıq'] },
  { category: 'dreams_goals', text: 'Səni məqsədlərindən ən çox yayındıran daxili maneə nədir: tənbəllik, tərəddüd, yoxsa qorxu?', topic_tags: ['maneə', 'tərəddüd', 'mübarizə'] },
  { category: 'dreams_goals', text: 'Həyatında reallaşan və sənə möcüzə kimi görünən ən böyük arzun nə olub?', topic_tags: ['möcüzə', 'nailiyyət', 'minnətdarlıq'] },
  { category: 'dreams_goals', text: 'Bir gün bir kitab yazsan, o kitab nə haqqında olardı?', topic_tags: ['kitab', 'yazarlıq', 'hekayə'] },
  { category: 'dreams_goals', text: 'Arzularının ardınca getmək üçün nə vaxtsa hər şeyi sıfırdan başlamağa cəsarət edərsənmi?', topic_tags: ['sıfırdan', 'cəsarət', 'dəyişim'] },
  { category: 'dreams_goals', text: 'Sənin üçün nailiyyət hissi kənar təriflərlə ölçülür, yoxsa daxili razılıqla?', topic_tags: ['ölçü', 'daxili razılıq', 'qürur'] },

  // ================= 7. ƏYLƏNCƏLİ VƏ QEYRİ-ADİ (fun_unusual) =================
  { category: 'fun_unusual', text: 'Bir günlüyünə görünməz olsaydın, ilk edəcəyin dəcəllik nə olardı?', topic_tags: ['görünməzlik', 'əyləncə', 'fantaziya'] },
  { category: 'fun_unusual', text: 'Həyatın bir film janrı olsaydı, hansı janr olardı: komediya, dram, yoxsa elmi-fantastika?', topic_tags: ['film', 'janr', 'yumor'] },
  { category: 'fun_unusual', text: 'Əgər bir supergüc seçmək şansın olsaydı, nəyi seçərdin: uçmaq, vaxtı dayandırmaq, yoxsa fikir oxumaq?', topic_tags: ['supergüc', 'fantaziya', 'seçim'] },
  { category: 'fun_unusual', text: 'İndiyə qədər eşitdiyin ən gülünc və ya mənasız şayiə nə olub?', topic_tags: ['şayiə', 'gülüş', 'əyləncə'] },
  { category: 'fun_unusual', text: 'Tarixdən istənilən bir şəxslə şam yeməyi yemək şansın olsa, kimi seçərdin?', topic_tags: ['tarix', 'görüş', 'maraq'] },
  { category: 'fun_unusual', text: 'Sənin gizli, heç kimə demədiyin qəribə bir vərdişin və ya zövqün varmı?', topic_tags: ['vərdiş', 'qəribəlik', 'səmimiyyət'] },
  { category: 'fun_unusual', text: 'Issız bir adaya düşsən, yanında götürəcəyin 3 qeyri-adi əşya nə olardı?', topic_tags: ['ada', 'sağ qalmaq', 'əşyalar'] },
  { category: 'fun_unusual', text: 'Əgər bir heyvana çevrilmək məcburiyyətində qalsaydın, hansı heyvan olardın və niyə?', topic_tags: ['heyvan', 'xarakter', 'metafora'] },
  { category: 'fun_unusual', text: 'Başına gələn ən utancverici, amma indi xatırlayanda güldüyün hadisə nədir?', topic_tags: ['utanc', 'gülüş', 'xatirə'] },
  { category: 'fun_unusual', text: 'Telefonundan sadəcə bir tətbiqi saxlamaq icazən olsa, hansını saxlayardın?', topic_tags: ['telefon', 'tətbiq', 'seçim'] },
  { category: 'fun_unusual', text: 'Özünə qəribə bir ləqəb qoymalı olsaydın, nə qoyardın?', topic_tags: ['ləqəb', 'yumor', 'özünəməxsus'] },
  { category: 'fun_unusual', text: 'Əgər zamanda səyahət maşının olsaydı: keçmişə gedərdin, yoxsa gələcəyə?', topic_tags: ['zaman maşını', 'keçmiş', 'gələcək'] },
  { category: 'fun_unusual', text: 'Qəribə bir qorxun (fobian) varmı (məsələn, düymələr, qaranlıq, lift)?', topic_tags: ['fobiya', 'qorxu', 'qəribəlik'] },
  { category: 'fun_unusual', text: 'Hansı məşhur film qəhrəmanı ilə bir gün keçirmək istərdin?', topic_tags: ['film', 'qəhrəman', 'əyləncə'] },
  { category: 'fun_unusual', text: 'Sənin üçün ən gülməli uşaqlıq cəzası hansı olub?', topic_tags: ['cəza', 'uşaqlıq', 'yumor'] },

  // ================= 8. DƏRİN VƏ DÜŞÜNDÜRÜCÜ (deep_thoughtful) =================
  { category: 'deep_thoughtful', text: 'Səncə, insan zamanla dəyişir, yoxsa sadəcə özünün əsl mahiyyətini daha çox büruzə verir?', topic_tags: ['dəyişim', 'mahiyyət', 'fəlsəfə'] },
  { category: 'deep_thoughtful', text: 'Həyatında aldığın və bu gün də yoluna işıq salan ən böyük həyat dərsi nədir?', topic_tags: ['həyat dərsi', 'təcrübə', 'müdriklik'] },
  { category: 'deep_thoughtful', text: 'Sənin üçün "ev" anlayışı nədir: dörd divar, doğma şəhər, yoxsa müəyyən bir insan?', topic_tags: ['ev', 'məkan', 'sığınacaq'] },
  { category: 'deep_thoughtful', text: 'İnsanların əksəriyyətinin inandığı, amma sənin qətiyyən razılaşmadığın fikir hansıdır?', topic_tags: ['düşüncə', 'müstəqillik', 'fərqlilik'] },
  { category: 'deep_thoughtful', text: 'Bizi ən çox nə böyüdür: qazandığımız qələbələr, yoxsa aldığımız yaralar?', topic_tags: ['inkişaf', 'ağrı', 'qələbə'] },
  { category: 'deep_thoughtful', text: 'Səncə, həqiqəti bilmək həmişə yaxşıdır, yoxsa bəzi yalanlar insanı qoruyur?', topic_tags: ['həqiqət', 'yalan', 'əxlaq'] },
  { category: 'deep_thoughtful', text: 'Özünü ən çox nə vaxt azad və özün kimi hiss edirsən?', topic_tags: ['azadlıq', 'səmimiyyət', 'hüzur'] },
  { category: 'deep_thoughtful', text: 'Həyatda ən böyük ədalətsizlik sənə görə nədir?', topic_tags: ['ədalət', 'dünya', 'baxış'] },
  { category: 'deep_thoughtful', text: 'Səni bu dünyada ən çox heyrətləndirən şey nədir: insan zəkası, təbiət, yoxsa sevgi?', topic_tags: ['heyrət', 'dünya', 'dəyər'] },
  { category: 'deep_thoughtful', text: 'İtirməkdən ən çox qorxduğun mənəvi dəyər hansıdır?', topic_tags: ['mənəviyyat', 'dəyər', 'qorxu'] },
  { category: 'deep_thoughtful', text: 'Səncə, xoşbəxtlik bir məqsəddir, yoxsa sadəcə yolun özüdür?', topic_tags: ['xoşbəxtlik', 'yol', 'fəlsəfə'] },
  { category: 'deep_thoughtful', text: 'Bağışlamaq güclülüyün əlamətidir, yoxsa unuda bilməməyin çarəsizliyi?', topic_tags: ['bağışlamaq', 'güc', 'ruh'] },
  { category: 'deep_thoughtful', text: 'Heç həyatında hər şeyin mənasını itirdiyini düşündüyün bir andan necə çıxmısan?', topic_tags: ['ümid', 'böhran', 'dirçəliş'] },
  { category: 'deep_thoughtful', text: 'Səncə, sükut bəzən sözlərdən daha çox şey deyə bilərmi?', topic_tags: ['sükut', 'söz', 'dərinlik'] },
  { category: 'deep_thoughtful', text: 'Əgər dünyaya bir mesaj qoyub getmək şansın olsaydı, o tək cümlə nə olardı?', topic_tags: ['mesaj', 'miras', 'həqiqət'] },

  // ================= 9. SƏMİMİ VƏ ŞƏXSİ (intimate_personal) =================
  { category: 'intimate_personal', text: 'Heç kimə demədiyin, amma içində daşıdığın ən böyük narahatlıq və ya qorxu nədir?', topic_tags: ['qorxu', 'sirr', 'daxili aləm'] },
  { category: 'intimate_personal', text: 'Sonuncu dəfə nə vaxt və nə üçün ürəkdən ağlamısan?', topic_tags: ['göz yaşı', 'kövrəklik', 'səmimiyyət'] },
  { category: 'intimate_personal', text: 'Qarşındakı insana tamamilə açılmaq üçün səndə hansı hissin yaranması şərtdir?', topic_tags: ['güvən', 'açılmaq', 'yaxınlıq'] },
  { category: 'intimate_personal', text: 'Keçmişində peşman olduğun və düzəltmək üçün hər şeyi verəcəyin bir addım varmı?', topic_tags: ['peşmanlıq', 'keçmiş', 'bağışlanmaq'] },
  { category: 'intimate_personal', text: 'Özünü həyatda ən çox tənha hiss etdiyin an nə vaxt olub?', topic_tags: ['tənhalıq', 'kədər', 'hiss'] },
  { category: 'intimate_personal', text: 'Səni ən dərindən incidən sözü kim və nə vaxt deyib?', topic_tags: ['yara', 'söz', 'inciklik'] },
  { category: 'intimate_personal', text: 'Özün haqqında sevmədiyin, amma gizlətməyə çalışdığın bir zəifliyin varmı?', topic_tags: ['zəiflik', 'maska', 'səmimiyyət'] },
  { category: 'intimate_personal', text: 'Həyatında kiminsə qarşısında tamamilə kövrək və müdafiəsiz qala bilmisənmi?', topic_tags: ['müdafiəsizlik', 'etibar', 'ürək'] },
  { category: 'intimate_personal', text: 'Ən çox kimin səninlə fəxr etməsini istərdin?', topic_tags: ['fəxr', 'dəyər', 'ailə'] },
  { category: 'intimate_personal', text: 'Heç vaxt etiraf edə bilmədiyin gizli bir minnətdarlığın varmı?', topic_tags: ['minnətdarlıq', 'etiraf', 'təşəkkür'] },
  { category: 'intimate_personal', text: 'Səncə, bir insanın qəlbinə gedən ən qısa yol haradan keçir?', topic_tags: ['ürək', 'yol', 'sevgi'] },
  { category: 'intimate_personal', text: 'Özünə baxanda gördüyün insanla içində hiss etdiyin insan eynidirmi?', topic_tags: ['daxili səs', 'güzgü', 'həqiqət'] },
  { category: 'intimate_personal', text: 'Həyatında kiməsə qarşı hələ də dilə gətirə bilmədiyin bir inciklik daşıyırsanmı?', topic_tags: ['inciklik', 'yük', 'keçmiş'] },
  { category: 'intimate_personal', text: 'Səni qucaqlayanda bütün dərdlərini unutduran biri olubmu?', topic_tags: ['qucaqlamaq', 'huzur', 'təsəlli'] },
  { category: 'intimate_personal', text: 'Bu gün kiməsə "bağışla" və ya "çox sağ ol" demək istəsəydin, o kim olardı?', topic_tags: ['bağışla', 'təşəkkür', 'etiraf'] },
];

// Seed the database with all questions
export function seedQuestionsDatabase() {
  const countRow = db.prepare("SELECT COUNT(*) as count FROM questions WHERE source = 'seed'").get() as { count: number };
  if (countRow.count >= SEED_QUESTIONS.length) {
    return countRow.count;
  }

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO questions (
      id, category, question_text, normalized_text, similarity_hash, topic_tags, ngram_signature, source, created_at, times_used
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'seed', ?, 0)
  `);

  db.exec('BEGIN TRANSACTION;');
  let inserted = 0;
  try {
    for (const q of SEED_QUESTIONS) {
      const norm = normalizeAzerbaijaniText(q.text);
      const hash = computeSimilarityHash(norm);
      const ngrams = Array.from(extractNgrams(q.text, 3));
      const id = 'seed_' + hash.substring(0, 16);

      const res = insertStmt.run(
        id,
        q.category,
        q.text,
        norm,
        hash,
        JSON.stringify(q.topic_tags),
        JSON.stringify(ngrams),
        Date.now()
      );
      if (res.changes > 0) inserted++;
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Failed to seed questions:', err);
  }

  return inserted;
}
