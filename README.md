# Tanış Ol v2.0 🍷
### AI əsaslı, iki nəfərlik real-time tanışlıq və müzakirə platforması

**Canlı URL:** [https://tanisol.onrender.com/](https://tanisol.onrender.com/)  
**Hosting:** Render (Web Service)  
**AI Mühərriki:** Google Gemini API  
**Dizayn Mövzusu:** Lüks Bordo–Qızılı–Krem & Three.js 3D  

---

## 🚀 Texnoloji Stack

- **Backend:** Node.js 22+, Express, WebSocket (`ws`), daxili yüksək performanslı `node:sqlite` (SQLite 3 WAL rejimi, ACID əməliyyatlar, prepared statements).
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion (Framer Motion), Three.js (3D qızılı fırlanan halqalar və partikullar), Lucide Icons.
- **AI İnteqrasiyası:** Google Gemini API (`@google/genai`) strukturlu JSON mode ilə toplu sual generasiyası və 3 səviyyəli təkrar filtri.

---

## 💎 Əsas İmkanlar və Üstünlüklər

1. **3 Səviyyəli Təkrar Əleyhinə Filtr:**
   - **Səviyyə 1 (Hash):** Azərbaycan hərflərini (ə, ı, ö, ü, ş, ç, ğ, İ) normallaşdıran deterministik SHA-256 hash.
   - **Səviyyə 2 (N-gram & Jaccard):** 3-gram və söz səviyyəsində oxşarlıq + açar söz kəsişməsi (azacıq sözləri dəyişdirilmiş sualların tutulması).
   - **Səviyyə 3 (Embedding):** Məna oxşarlığı yoxlanışı (opsional konfiqurasiya bayrağı ilə).
2. **"Əvvəlcə Baza, Sonra Gemini" Strategiyası:**
   - Əvvəlcə otaq və iştirakçıların daha əvvəl görmədiyi suallar bazadan axtarılır. Kifayət qədər sual olduqda Gemini çağırılmır (0 token sərfiyyatı!).
   - Çatışmayan say üçün tək bir toplu JSON sorğusu göndərilir.
   - Gemini xəta verdikdə və ya kvota bitdikdə, zəngin ehtiyat seed bazası (300+ sual) oyunu fasiləsiz davam etdirir.
3. **Multiplayer Sinxronizasiya və Server State Machine:**
   - Hər iki oyunçu eyni anda eyni sualı cavablandırır.
   - Sual taymeri server tərəfindən idarə olunur (`question_started_at` və `question_deadline_at`). Səhifə yeniləndikdə taymer sıfırlanmır.
   - Cavablar oyun bitənədək digər tərəfə tamamilə gizli qalır.
   - Hər iki tərəf cavab verdikdə 2.5 saniyəlik keçiddən sonra avtomatik növbəti suala keçilir.
4. **Nəticə, Canlı Çat və Tarixçə:**
   - Oyun bitdikdə hər iki tərəfin cavabları eyni anda açılır və yan-yana nümayiş olunur.
   - "Bu barədə danışaq" düyməsi ilə sual teqi birbaşa çatda qeyd olunur.
   - "Yenidən Oyna" düyməsi ilə hər iki tərəfin razılığı əsasında yeni oyun başlayır; əvvəlki oyunlar bazada saxlanılır.

---

## 🛠️ Yerli İcra (Local Development)

```bash
# Asılılıqları quraşdırın
npm install

# İnkişaf rejimində başladın
npm run dev
```

Brauzerdə açın: `http://localhost:3000`

---

## 📦 Production və Render Deployment

Layihə Render-də **Web Service** olaraq deploy edilməyə 100% hazırdır:

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Node Version:** `>= 22`

### Render Environment Variables

Render Dashboard-da layihə tənzimləmələrinə daxil olaraq aşağıdakı mühit dəyişənlərini təyin edin:

| Dəyişən Adı | Təsvir | Nümunə / Standart Dəyər |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API açarınız | `AIzaSy...` (yalnız Render-də saxlayın) |
| `GEMINI_MODEL` | Gemini model adı | `gemini-2.5-flash` |
| `GEMINI_MAX_OUTPUT_TOKENS` | Çıxış token limiti | `1500` |
| `GEMINI_DAILY_REQUEST_LIMIT` | Gündəlik daxili sorğu limiti | `100` |
| `SIMILARITY_THRESHOLD` | Oxşarlıq eşik dəyəri | `0.55` |
| `DATA_RETENTION_DAYS` | Məlumat saxlanma müddəti | `30` |
| `NODE_ENV` | Production rejimi | `production` |

---

## 🧪 Avtomatlaşdırılmış Testlər

Bütün mərhələlər üzrə testləri istənilən vaxt icra edə bilərsiniz:

```bash
# Mərhələ 2: Verilənlər bazası və vəziyyət maşını testi
npx tsx server/test_phase2.ts

# Mərhələ 3: Oyun parametrləri və lobby testi
npx tsx server/test_phase3.ts

# Mərhələ 4: AI sual generasiyası və 3 səviyyəli təkrar filtri testi
npx tsx server/test_phase4.ts

# Mərhələ 5 & 6: Multiplayer mexanikası, açılış və çat testi
npx tsx server/test_phase5_6.ts
```
