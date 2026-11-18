export interface CategoryConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'love',
    name: 'Sevgi və münasibətlər',
    description: 'Emosional bağlar, münasibətlərə baxış, sevgi dili və hisslər',
    icon: 'Heart',
  },
  {
    id: 'friendship',
    name: 'Dostluq',
    description: 'Səmimiyyət, etibar, dəstək və dostluq prinsipləri',
    icon: 'Users',
  },
  {
    id: 'memories',
    name: 'Uşaqlıq və xatirələr',
    description: 'Unudulmaz anlar, nostalji və keçmişin izləri',
    icon: 'History',
  },
  {
    id: 'personality',
    name: 'Xarakter və şəxsiyyət',
    description: 'Daxili aləm, prinsiplər, güclü və zəif tərəflər',
    icon: 'UserCheck',
  },
  {
    id: 'life_future',
    name: 'Həyat və gələcək',
    description: 'Həyat fəlsəfəsi, prioritetlər və gələcəyə baxış',
    icon: 'Compass',
  },
  {
    id: 'dreams_goals',
    name: 'Xəyallar və məqsədlər',
    description: 'Böyük arzular, karyera və nailiyyət planları',
    icon: 'Sparkles',
  },
  {
    id: 'fun_unusual',
    name: 'Əyləncəli və qeyri-adi suallar',
    description: 'Gözlənilməz dilemmalar, yumor və təxəyyül sınağı',
    icon: 'Smile',
  },
  {
    id: 'deep_thoughtful',
    name: 'Dərin və düşündürücü suallar',
    description: 'Fəlsəfi yanaşmalar, mənəvi dəyərlər və varlıq sualları',
    icon: 'Brain',
  },
  {
    id: 'intimate_personal',
    name: 'Səmimi və şəxsi suallar',
    description: 'Qorxular, gizli düşüncələr və dürüst etiraflar',
    icon: 'Lock',
  },
  {
    id: 'random',
    name: 'Təsadüfi kateqoriya',
    description: 'Hər sual fərqli kateqoriyadan təsadüfi seçilir',
    icon: 'Shuffle',
  },
];

export const VALID_QUESTION_COUNTS = [5, 10, 15, 20] as const;
export const VALID_TIMES_PER_QUESTION = [30, 45, 60, 90, 120] as const;
export const VALID_REVEAL_MODES = ['standard', 'immediate'] as const;

export type QuestionCount = typeof VALID_QUESTION_COUNTS[number];
export type TimePerQuestion = typeof VALID_TIMES_PER_QUESTION[number];
export type RevealMode = typeof VALID_REVEAL_MODES[number];
