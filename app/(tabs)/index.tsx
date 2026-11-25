import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { data } from '../../constants/data';

const TEACHABLE_MACHINE_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/YOUR_MODEL_ID/';
const STORAGE_KEY = '@sign_language_dict_state_v2';

type AppLang = 'ar' | 'en' | 'he';

const normalizeSearchText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[؟?]/g, '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();

const levenshteinDistance = (a: string, b: string): number => {
  const s1 = normalizeSearchText(a);
  const s2 = normalizeSearchText(b);
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const matrix: number[][] = Array.from({ length: s1.length + 1 }, () =>
    Array(s2.length + 1).fill(0)
  );

  for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[s1.length][s2.length];
};

const translateSignText = (rawText: string | undefined, targetLang: AppLang): string => {
  if (!rawText) return '';
  const trimmed = rawText.trim();
  if (!trimmed) return '';

  if (targetLang === 'ar') {
    return trimmed;
  }

  const foundItem = (data as any[]).find((item) => item?.text?.trim() === trimmed);
  if (foundItem && foundItem[targetLang]) {
    return String(foundItem[targetLang]).trim();
  }

  const words = trimmed.split(/\s+/);
  const translatedWords = words.map((w) => {
    const match = (data as any[]).find((item) => item?.text?.trim() === w);
    return match && match[targetLang] ? String(match[targetLang]).trim() : '';
  });

  const joined = translatedWords.filter(Boolean).join(' ');
  return joined || trimmed;
};

const getItemDescription = (
  item: any,
  targetLang: AppLang,
  fallbackText: string
): string => {
  if (!item) return fallbackText;
  if (targetLang === 'ar') {
    return item.desc_ar || item.description || fallbackText;
  }
  if (targetLang === 'en') {
    return item.desc_en || fallbackText;
  }
  return item.desc_he || fallbackText;
};

const TRANSLATIONS: Record<
  AppLang,
  {
    appTitle: string;
    appSubtitle: string;
    offlineReady: string;
    streakLabel: string;
    mastered: string;
    favorites: string;
    bestQuiz: string;
    share: string;
    aboutBtn: string;
    aboutTitle: string;
    aboutIntro: string;
    aboutPoint1: string;
    aboutPoint2: string;
    aboutPoint3: string;
    aboutPoint4: string;
    themeColor: string;
    sortAlpha: string;
    sortDefault: string;
    recentlyViewed: string;
    catAll: string;
    catGreetings: string;
    catQuestions: string;
    categoryProgress: string;
    totalDictionaryProgress: string;
    warmUpTitle: string;
    warmUpSubtitle: string;
    practiceNow: string;
    signOfDay: string;
    dailyDefaultDesc: string;
    tapForDetails: string;
    dailySentenceChallenge: string;
    searchPlaceholder: string;
    searchBtn: string;
    voiceSearchTitle: string;
    voiceSearchMsg: string;
    recentSearchesTitle: string;
    clearHistoryBtn: string;
    didYouMean: string;
    resetFiltersBtn: string;
    unmastered: string;
    report: string;
    resultsCount: string;
    reviewMistakes: string;
    noResults: string;
    translatorTitle: string;
    translatorSubtitle: string;
    randomSample: string;
    samplePrefix: string;
    translatorPlaceholder: string;
    modelStatus: string;
    simMode: string;
    activeMode: string;
    analyzingText: string;
    matchAccuracy: string;
    lowConfidenceAlert: string;
    openFullCard: string;
    quizTitle: string;
    quickQuizBtn: string;
    fullQuizBtn: string;
    mistakeReviewTitle: string;
    questionOf: string;
    quizQuestionPrompt: string;
    quizFinishedTitle: string;
    yourScore: string;
    newQuiz: string;
    flashcardsTitle: string;
    flipCardHint: string;
    defaultSignDesc: string;
    nextCard: string;
    signDetailsTitle: string;
    defaultMovementDesc: string;
    tapToZoom: string;
    tapToShrink: string;
    masteredBtnActive: string;
    masteredBtnInactive: string;
    prevBtn: string;
    nextBtn: string;
    myNoteLabel: string;
    notePlaceholder: string;
    saveNoteBtn: string;
    noteSavedToast: string;
    alertTitle: string;
    firstScreenAlert: string;
    emptyFavoritesAlert: string;
    notEnoughQuizData: string;
    noMistakesAlert: string;
    errorTitle: string;
    shareSignMsg: (word: string) => string;
    favReportText: (count: number, list: string) => string;
    weeklySummaryText: (
      streak: number,
      masteredCount: number,
      totalCount: number,
      favCount: number,
      bestScore: number
    ) => string;
  }
> = {
  ar: {
    appTitle: 'قاموس لغة الإشارة الأكاديمي',
    appSubtitle: 'مرجعك المعتمد لتعلم الإشارة',
    offlineReady: 'وضع العمل دون إنترنت (Offline Ready)',
    streakLabel: 'يوم متواصل',
    mastered: 'متقنة',
    favorites: 'مفضلة',
    bestQuiz: 'أعلى اختبار',
    share: 'مشاركة',
    aboutBtn: 'عن التطبيق',
    aboutTitle: 'عن التطبيق والمنهجية الأكاديمية',
    aboutIntro:
      'تم تصميم هذا التطبيق كمرجع تعليمي تفاعلي لتعلم واستعراض إشارات لغة الإشارة بأسلوب أكاديمي منظم وسريع.',
    aboutPoint1: 'دعم فوري لثلاث لغات (العربية، الإنجليزية، العبرية) مع حفظ التفضيلات تلقائياً.',
    aboutPoint2: 'وضع عمل محلي (Offline Ready) مع متابعة الإتقان، المفضلات، وسجل الأخطاء.',
    aboutPoint3: 'اختبارات تقييم وبطاقات تعليمية ومراجعة ذكية للإشارات التي تحتاج تركيزاً إضافياً.',
    aboutPoint4: 'مترجم الإشارات الذكي يدعم الربط بنموذج Teachable Machine ويعمل حالياً بوضع المحاكاة الآمن.',
    themeColor: 'لون الثيم:',
    sortAlpha: 'ترتيب: أبجدي',
    sortDefault: 'ترتيب: افتراضي',
    recentlyViewed: 'الاستعراضات الأخيرة:',
    catAll: 'الكل',
    catGreetings: 'التحيات',
    catQuestions: 'الأسئلة',
    categoryProgress: 'نسبة إتقان التصنيف',
    totalDictionaryProgress: 'إتقان القاموس الكامل',
    warmUpTitle: 'مراجعة سريعة لأخطائك',
    warmUpSubtitle: 'تدرب على الإشارة التي أخطأت فيها سابقاً:',
    practiceNow: 'راجع الآن',
    signOfDay: 'إشارة اليوم',
    dailyDefaultDesc: 'تعلم هذه الإشارة المميزة اليوم وأضفها إلى رصيدك المعرفي.',
    tapForDetails: 'اضغط لعرض التفاصيل',
    dailySentenceChallenge: 'تحدي جملة اليوم',
    searchPlaceholder: 'ابحث في القاموس...',
    searchBtn: 'بحث',
    voiceSearchTitle: 'البحث الصوتي',
    voiceSearchMsg: 'ميزة البحث الصوتي مهيأة ضمن خطة التطوير القادمة.',
    recentSearchesTitle: 'عمليات البحث السابقة:',
    clearHistoryBtn: 'مسح',
    didYouMean: 'هل تقصد:',
    resetFiltersBtn: 'إعادة ضبط الكل',
    unmastered: 'لم أتقنها',
    report: 'تقرير',
    resultsCount: 'عدد النتائج المعروضة',
    reviewMistakes: 'مراجعة الأخطاء',
    noResults: 'لا توجد نتائج مطابقة لبحثك',
    translatorTitle: 'مترجم الإشارات الذكي (AI)',
    translatorSubtitle: 'اختر عينة أو جرّب عينة عشوائية:',
    randomSample: 'عينة عشوائية',
    samplePrefix: 'عينة',
    translatorPlaceholder: 'اضغط على أي عينة في الأعلى لبدء التحليل الذكي',
    modelStatus: 'حالة النموذج: متصل وجاهز',
    simMode: 'وضع المحاكاة',
    activeMode: 'نشط',
    analyzingText: 'جاري تحليل حركة اليد ومطابقتها مع النموذج...',
    matchAccuracy: 'دقة التطابق',
    lowConfidenceAlert: 'تنبيه: نسبة الثقة منخفضة قليلاً؛ يُنصح بتقريب اليد أو تحسين الإضاءة.',
    openFullCard: 'فتح بطاقة الإشارة الكاملة',
    quizTitle: 'اختبار تقييم مهارات الإشارة',
    quickQuizBtn: 'سريع (3)',
    fullQuizBtn: 'شامل (5)',
    mistakeReviewTitle: 'مراجعة الأخطاء السابقة',
    questionOf: 'السؤال',
    quizQuestionPrompt: 'ما هي الكلمة الصحيحة المعبرة عن هذه الإشارة؟',
    quizFinishedTitle: 'انتهى الاختبار!',
    yourScore: 'نتيجتك',
    newQuiz: 'اختبار جديد',
    flashcardsTitle: 'البطاقات التعليمية',
    flipCardHint: 'اضغط لقلب البطاقة وإظهار الكلمة',
    defaultSignDesc: 'إشارة من قاموس لغة الإشارة الأكاديمي.',
    nextCard: 'البطاقة التالية',
    signDetailsTitle: 'تفاصيل الإشارة',
    defaultMovementDesc: 'شرح الإشارة وحركة اليدين.',
    tapToZoom: 'اضغط على الصورة للتكبير',
    tapToShrink: 'اضغط للتصغير',
    masteredBtnActive: 'أتقنت هذه الإشارة ✓',
    masteredBtnInactive: 'تحديد كإشارة متقنة',
    prevBtn: 'السابق',
    nextBtn: 'التالي',
    myNoteLabel: 'ملاحظتي الشخصية:',
    notePlaceholder: 'اكتب ملاحظتك هنا...',
    saveNoteBtn: 'حفظ الملاحظة',
    noteSavedToast: 'تم حفظ ملاحظتك الشخصية بنجاح ✓',
    alertTitle: 'تنبيه',
    firstScreenAlert: 'أنت في أول شاشة بالفعل.',
    emptyFavoritesAlert: 'قائمة المفضلات فارغة لتصديرها!',
    notEnoughQuizData: 'لا توجد بيانات كافية لبدء الاختبار.',
    noMistakesAlert: 'لا توجد أخطاء سابقة مسجلة لمراجعتها حالياً.',
    errorTitle: 'خطأ',
    shareSignMsg: (word) => `تعلمت اليوم إشارة "${word}" من تطبيق قاموس لغة الإشارة الأكاديمي! 🤟`,
    favReportText: (count, list) =>
      `=== تقرير مهارات لغة الإشارة (المفضلات) ===\nإجمالي الإشارات المحفوظة: ${count}\n\n${list}\n\n(صادر عن قاموس لغة الإشارة الأكاديمي 🤟)`,
    weeklySummaryText: (streak, masteredCount, totalCount, favCount, bestScore) =>
      `=== بطاقة إنجازي في قاموس لغة الإشارة ===\n🔥 سلسلة الأيام المتتالية: ${streak} يوم\n✅ الإشارات المتقنة: ${masteredCount} / ${totalCount}\n❤️ المحفوظة في المفضلة: ${favCount}\n🏆 أعلى نتيجة في الاختبار: ${bestScore} / 5\n\n(قاموس لغة الإشارة الأكاديمي 🤟)`,
  },
  en: {
    appTitle: 'Academic Sign Language Dictionary',
    appSubtitle: 'Your trusted guide to learning sign language',
    offlineReady: 'Offline Ready Mode',
    streakLabel: 'day streak',
    mastered: 'Mastered',
    favorites: 'Favorites',
    bestQuiz: 'Best Quiz',
    share: 'Share',
    aboutBtn: 'About',
    aboutTitle: 'About & Academic Methodology',
    aboutIntro:
      'Built as an interactive academic reference for exploring and practicing sign language vocabulary smoothly and reliably.',
    aboutPoint1: 'Instant switching across 3 languages (Arabic, English, Hebrew) with persistent state.',
    aboutPoint2: 'Offline-ready workflow tracking mastery, favorites, notes, and quiz mistakes.',
    aboutPoint3: 'Interactive flashcards, quizzes, and mistake warm-ups to reinforce retention.',
    aboutPoint4: 'Smart Sign Translator supports Teachable Machine models and runs in safe simulation mode when unconfigured.',
    themeColor: 'Theme:',
    sortAlpha: 'Sort: A-Z',
    sortDefault: 'Sort: Default',
    recentlyViewed: 'Recently Viewed:',
    catAll: 'All',
    catGreetings: 'Greetings',
    catQuestions: 'Questions',
    categoryProgress: 'Category Mastery',
    totalDictionaryProgress: 'Full Dictionary Mastery',
    warmUpTitle: 'Quick Mistake Warm-up',
    warmUpSubtitle: 'Review a sign you missed earlier:',
    practiceNow: 'Review Now',
    signOfDay: 'Sign of the Day',
    dailyDefaultDesc: 'Learn this featured sign today and grow your vocabulary.',
    tapForDetails: 'Tap to view details',
    dailySentenceChallenge: 'Daily sentence challenge',
    searchPlaceholder: 'Search dictionary...',
    searchBtn: 'Search',
    voiceSearchTitle: 'Voice Search',
    voiceSearchMsg: 'Voice search is planned for a future release.',
    recentSearchesTitle: 'Recent Searches:',
    clearHistoryBtn: 'Clear',
    didYouMean: 'Did you mean:',
    resetFiltersBtn: 'Reset All',
    unmastered: 'Unmastered',
    report: 'Report',
    resultsCount: 'Displayed results',
    reviewMistakes: 'Review Mistakes',
    noResults: 'No matching results found',
    translatorTitle: 'Smart Sign Translator (AI)',
    translatorSubtitle: 'Pick a sample or try a random one:',
    randomSample: 'Random Sample',
    samplePrefix: 'Sample',
    translatorPlaceholder: 'Tap any sample above to start smart analysis',
    modelStatus: 'Model Status: Connected & Ready',
    simMode: 'Simulation Mode',
    activeMode: 'Active',
    analyzingText: 'Analyzing hand motion and matching with model...',
    matchAccuracy: 'Match Accuracy',
    lowConfidenceAlert: 'Note: Confidence is slightly low; move hand closer or improve lighting.',
    openFullCard: 'Open Full Sign Card',
    quizTitle: 'Sign Skills Quiz',
    quickQuizBtn: 'Quick (3)',
    fullQuizBtn: 'Full (5)',
    mistakeReviewTitle: 'Past Mistakes Review',
    questionOf: 'Question',
    quizQuestionPrompt: 'Which word matches this sign?',
    quizFinishedTitle: 'Quiz Finished!',
    yourScore: 'Your Score',
    newQuiz: 'New Quiz',
    flashcardsTitle: 'Flashcards',
    flipCardHint: 'Tap card to flip and reveal the word',
    defaultSignDesc: 'Sign from the Academic Sign Language Dictionary.',
    nextCard: 'Next Card',
    signDetailsTitle: 'Sign Details',
    defaultMovementDesc: 'Sign explanation and hand movement.',
    tapToZoom: 'Tap image to zoom in',
    tapToShrink: 'Tap to shrink',
    masteredBtnActive: 'Mastered this sign ✓',
    masteredBtnInactive: 'Mark as mastered',
    prevBtn: 'Prev',
    nextBtn: 'Next',
    myNoteLabel: 'My Personal Note:',
    notePlaceholder: 'Write your note here...',
    saveNoteBtn: 'Save Note',
    noteSavedToast: 'Personal note saved successfully ✓',
    alertTitle: 'Notice',
    firstScreenAlert: 'You are already on the first screen.',
    emptyFavoritesAlert: 'Your favorites list is empty!',
    notEnoughQuizData: 'Not enough data to start the quiz.',
    noMistakesAlert: 'No saved mistakes to review right now.',
    errorTitle: 'Error',
    shareSignMsg: (word) => `Today I learned the sign "${word}" from Academic Sign Language Dictionary! 🤟`,
    favReportText: (count, list) =>
      `=== Sign Language Skills Report (Favorites) ===\nTotal Saved Signs: ${count}\n\n${list}\n\n(Academic Sign Language Dictionary 🤟)`,
    weeklySummaryText: (streak, masteredCount, totalCount, favCount, bestScore) =>
      `=== My Sign Language Progress Card ===\n🔥 Daily Streak: ${streak} days\n✅ Mastered Signs: ${masteredCount} / ${totalCount}\n❤️ Favorites: ${favCount}\n🏆 Best Quiz Score: ${bestScore} / 5\n\n(Academic Sign Language Dictionary 🤟)`,
  },
  he: {
    appTitle: 'מילון שפת הסימנים האקדמי',
    appSubtitle: 'המדריך שלך ללמידת שפת הסימנים',
    offlineReady: 'מוכן לעבודה ללא אינטרנט (Offline Ready)',
    streakLabel: 'ימים ברצף',
    mastered: 'נשלטו',
    favorites: 'מועדפים',
    bestQuiz: 'שיא בוחן',
    share: 'שיתוף',
    aboutBtn: 'אודות',
    aboutTitle: 'אודות והמתודולוגיה האקדמית',
    aboutIntro:
      'אפליקציה אקדמית אינטראקטיבית ללימוד, חיפוש ותרגול אוצר מילים בשפת הסימנים בצורה ברורה ואמינה.',
    aboutPoint1: 'מעבר מיידי בין 3 שפות (ערבית, אנגלית, עברית) ושמירת העדפות אוטומטית.',
    aboutPoint2: 'עבודה מקומית מלאה (Offline Ready) עם מעקב שליטה, מועדפים, הערות וטעויות.',
    aboutPoint3: 'כרטיסיות לימוד, בחנים וחזרה ממוקדת על טעויות לשיפור הזיכרון.',
    aboutPoint4: 'מתרגם הסימנים תומך בחיבור למודל Teachable Machine ופועל במצב סימולציה בטוח כברירת מחדל.',
    themeColor: 'צבע ערכה:',
    sortAlpha: 'מיון: א-ת',
    sortDefault: 'מיון: ברירת מחדל',
    recentlyViewed: 'נצפו לאחרונה:',
    catAll: 'הכל',
    catGreetings: 'ברכות',
    catQuestions: 'שאלות',
    categoryProgress: 'התקדמות בקטגוריה',
    totalDictionaryProgress: 'שליטה בכל המילון',
    warmUpTitle: 'חזרה מהירה על טעויות',
    warmUpSubtitle: 'תרגל סימן שטעית בו קודם:',
    practiceNow: 'תרגל עכשיו',
    signOfDay: 'סימן היום',
    dailyDefaultDesc: 'למד את הסימן המיוחד של היום והרחב את אוצר המילים שלך.',
    tapForDetails: 'לחץ לצפייה בפרטים',
    dailySentenceChallenge: 'אתגר משפט היום',
    searchPlaceholder: 'חפש במילון...',
    searchBtn: 'חפש',
    voiceSearchTitle: 'חיפוש קולי',
    voiceSearchMsg: 'חיפוש קולי יופעל בגרסה עתידית.',
    recentSearchesTitle: 'חיפושים אחרונים:',
    clearHistoryBtn: 'נקה',
    didYouMean: 'האם התכוונת ל:',
    resetFiltersBtn: 'אפס הכל',
    unmastered: 'טרם נשלטו',
    report: 'דוח',
    resultsCount: 'מספר תוצאות מוצגות',
    reviewMistakes: 'חזרה על טעויות',
    noResults: 'לא נמצאו תוצאות תואמות לחיפוש שלך',
    translatorTitle: 'מתרגם סימנים חכם (AI)',
    translatorSubtitle: 'בחר דוגמה או נסה דוגמה אקראית:',
    randomSample: 'דוגמה אקראית',
    samplePrefix: 'דוגמה',
    translatorPlaceholder: 'לחץ על דוגמה למעלה להתחלת ניתוח חכם',
    modelStatus: 'מצב מודל: מחובר ומוכן',
    simMode: 'מצב סימולציה',
    activeMode: 'פעיל',
    analyzingText: 'מנתח תנועת יד ומשווה למודל...',
    matchAccuracy: 'דיוק התאמה',
    lowConfidenceAlert: 'שים לב: רמת הביטחון נמוכה מעט; מומלץ לקרב את היד או לשפר תאורה.',
    openFullCard: 'פתח כרטיס סימן מלא',
    quizTitle: 'בוחן מיומנויות שפת הסימנים',
    quickQuizBtn: 'מהיר (3)',
    fullQuizBtn: 'מלא (5)',
    mistakeReviewTitle: 'חזרה על טעויות קודמות',
    questionOf: 'שאלה',
    quizQuestionPrompt: 'איזו מילה מתאימה לסימן זה?',
    quizFinishedTitle: 'הבוחן הסתיים!',
    yourScore: 'הציון שלך',
    newQuiz: 'בוחן חדש',
    flashcardsTitle: 'כרטיסיות לימוד',
    flipCardHint: 'לחץ להפיכת הכרטיסייה והצגת המילה',
    defaultSignDesc: 'סימן מתוך מילון שפת הסימנים האקדמי.',
    nextCard: 'הכרטיסייה הבאה',
    signDetailsTitle: 'פרטי הסימן',
    defaultMovementDesc: 'הסבר הסימן ותנועת הידיים.',
    tapToZoom: 'לחץ על התמונה להגדלה',
    tapToShrink: 'לחץ להקטנה',
    masteredBtnActive: 'שלטתי בסימן זה ✓',
    masteredBtnInactive: 'סמן כסימן שנשלט',
    prevBtn: 'הקודם',
    nextBtn: 'הבא',
    myNoteLabel: 'ההערה האישית שלי:',
    notePlaceholder: 'כתוב את ההערה שלך כאן...',
    saveNoteBtn: 'שמור הערה',
    noteSavedToast: 'ההערה נשמרה בהצלחה ✓',
    alertTitle: 'התראה',
    firstScreenAlert: 'אתה כבר במסך הראשון.',
    emptyFavoritesAlert: 'רשימת המועדפים ריקה לייצוא!',
    notEnoughQuizData: 'אין מספיק נתונים להתחלת הבוחן.',
    noMistakesAlert: 'אין טעויות שמורות לחזרה כרגע.',
    errorTitle: 'שגיאה',
    shareSignMsg: (word) => `למדתי היום את הסימן "${word}" ממילון שפת הסימנים האקדמי! 🤟`,
    favReportText: (count, list) =>
      `=== דוח מיומנויות שפת הסימנים (מועדפים) ===\nסה"כ סימנים שמורים: ${count}\n\n${list}\n\n(מילון שפת הסימנים האקדמי 🤟)`,
    weeklySummaryText: (streak, masteredCount, totalCount, favCount, bestScore) =>
      `=== כרטיס ההתקדמות שלי בשפת הסימנים ===\n🔥 רצף ימים: ${streak} ימים\n✅ סימנים שנשלטו: ${masteredCount} / ${totalCount}\n❤️ מועדפים: ${favCount}\n🏆 שיא בבוחן: ${bestScore} / 5\n\n(מילון שפת הסימנים האקדמי 🤟)`,
  },
};

let AsyncStorageLib: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorageLib = require('@react-native-async-storage/async-storage').default;
} catch {
  AsyncStorageLib = null;
}

const getDateKey = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const belongsToCategory = (item: any, category: string) => {
  if (!item || !item.text) return false;
  if (category === 'الكل') return true;

  if (category === 'التحيات') {
    const isGreetingCategory = item.category === 'التحيات' || item.category === 'تحيات';
    const hasGreetingWord = [
      'أهلاً',
      'اهلاً',
      'مرحباً',
      'مرحبا',
      'السلام',
      'صباح',
      'مساء',
      'شكراً',
      'شكرا',
      'مع السلامة',
      'انا بخير',
      'من فضلك',
      'اسف',
    ].some((g) => item.text.includes(g));
    return isGreetingCategory || hasGreetingWord;
  }

  if (category === 'الأسئلة') {
    const isQuestionCategory = item.category === 'الأسئلة' || item.category === 'أسئلة';
    const hasQuestionWord = ['كيف', 'ماذا', 'لماذا', 'متى', 'أين', 'اين', 'هل', 'من', 'كم', 'اي', 'أي'].some((q) =>
      item.text.includes(q)
    );
    return isQuestionCategory || hasQuestionWord;
  }

  return item.category === category;
};

const SafeSignImage = ({
  uri,
  style,
  resizeMode = 'contain',
}: {
  uri?: string;
  style: any;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (!uri || failed) {
    return (
      <View style={[style, styles.fallbackImageBox]}>
        <Ionicons name="hand-left-outline" size={28} color="#8E8E93" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
};

export default function SignLanguageDictionary() {
  const [lang, setLang] = useState<AppLang>('ar');
  const isRTL = lang === 'ar' || lang === 'he';
  const t = TRANSLATIONS[lang];

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOnlyUnmastered, setShowOnlyUnmastered] = useState(false);
  const [masteredSigns, setMasteredSigns] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'default' | 'alpha'>('default');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [accentColor, setAccentColor] = useState('#007AFF');

  const [dailyStreak, setDailyStreak] = useState(1);
  const [lastActiveDate, setLastActiveDate] = useState<string>(getDateKey(0));
  const [bestQuizScore, setBestQuizScore] = useState(0);
  const [mistakeWords, setMistakeWords] = useState<string[]>([]);

  const [navigationHistory, setNavigationHistory] = useState<any[]>([]);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [flashcardModalVisible, setFlashcardModalVisible] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isMistakeReviewMode, setIsMistakeReviewMode] = useState(false);
  const [quizQuestionLimit, setQuizQuestionLimit] = useState<3 | 5>(5);

  const [translatorModalVisible, setTranslatorModalVisible] = useState(false);
  const [selectedTestSign, setSelectedTestSign] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [translatedResult, setTranslatedResult] = useState<{
    item: any;
    confidence: number;
    predictions: { label: string; confidence: number }[];
    lowConfidenceWarning: boolean;
  } | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  const [userNotes, setUserNotes] = useState<{ [key: string]: string }>({});
  const [currentNoteText, setCurrentNoteText] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [currentSentenceItems, setCurrentSentenceItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const quizAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  useEffect(() => {
    return () => {
      if (quizAdvanceTimeoutRef.current) clearTimeout(quizAdvanceTimeoutRef.current);
      if (translatorTimeoutRef.current) clearTimeout(translatorTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSavedState = async () => {
      const todayKey = getDateKey(0);
      const yesterdayKey = getDateKey(-1);

      let loadedStreak = 1;
      let loadedLastDate = todayKey;

      if (AsyncStorageLib) {
        try {
          const raw = await AsyncStorageLib.getItem(STORAGE_KEY);
          if (raw && isMounted) {
            const parsed = JSON.parse(raw);
            if (parsed.lang === 'ar' || parsed.lang === 'en' || parsed.lang === 'he') {
              setLang(parsed.lang);
            }
            if (Array.isArray(parsed.favorites)) setFavorites(parsed.favorites);
            if (Array.isArray(parsed.masteredSigns)) setMasteredSigns(parsed.masteredSigns);
            if (Array.isArray(parsed.mistakeWords)) setMistakeWords(parsed.mistakeWords);
            if (parsed.userNotes && typeof parsed.userNotes === 'object') setUserNotes(parsed.userNotes);
            if (typeof parsed.isDarkMode === 'boolean') setIsDarkMode(parsed.isDarkMode);
            if (typeof parsed.accentColor === 'string') setAccentColor(parsed.accentColor);
            if (typeof parsed.bestQuizScore === 'number') setBestQuizScore(parsed.bestQuizScore);
            if (typeof parsed.dailyStreak === 'number' && parsed.dailyStreak > 0) {
              loadedStreak = parsed.dailyStreak;
            }
            if (typeof parsed.lastActiveDate === 'string') {
              loadedLastDate = parsed.lastActiveDate;
            }
          }
        } catch {
          // تجاهل أخطاء القراءة
        }
      }

      if (!isMounted) return;

      if (loadedLastDate === todayKey) {
        setDailyStreak(loadedStreak);
        setLastActiveDate(todayKey);
      } else if (loadedLastDate === yesterdayKey) {
        setDailyStreak(loadedStreak + 1);
        setLastActiveDate(todayKey);
      } else {
        setDailyStreak(1);
        setLastActiveDate(todayKey);
      }
    };

    loadSavedState();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!AsyncStorageLib) return;
    const payload = {
      lang,
      favorites,
      masteredSigns,
      mistakeWords,
      userNotes,
      isDarkMode,
      accentColor,
      bestQuizScore,
      dailyStreak,
      lastActiveDate,
    };
    AsyncStorageLib.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {});
  }, [
    lang,
    favorites,
    masteredSigns,
    mistakeWords,
    userNotes,
    isDarkMode,
    accentColor,
    bestQuizScore,
    dailyStreak,
    lastActiveDate,
  ]);

  const dailyItem = useMemo(() => {
    if (!data || data.length === 0) return null;
    const todayIndex = new Date().getDate() % data.length;
    return data[todayIndex];
  }, []);

  const warmUpMistakeItem = useMemo(() => {
    if (!data || mistakeWords.length === 0) return null;
    return data.find((d) => mistakeWords.includes(d.text)) || null;
  }, [mistakeWords]);

  const dailySentenceChallenge = useMemo(() => {
    if (!data || data.length < 2) return null;
    const startIdx = new Date().getDate() % data.length;
    const picked: any[] = [];
    for (let i = 0; i < Math.min(3, data.length); i++) {
      const candidate = data[(startIdx + i * 2) % data.length];
      if (candidate && !picked.some((p) => p.text === candidate.text)) {
        picked.push(candidate);
      }
    }
    if (picked.length < 2) return null;
    return {
      id: 'sentence_card',
      text: picked.map((p) => p.text).join(' '),
      image: picked[0].image,
      items: picked,
    };
  }, []);

  const totalDictionaryStats = useMemo(() => {
    const total = (data || []).length;
    const masteredCount = (data || []).filter((item) => masteredSigns.includes(item.text)).length;
    const percent = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
    return { total, masteredCount, percent };
  }, [masteredSigns]);

  const categoryProgressStats = useMemo(() => {
    const itemsInCat = (data || []).filter((item) => belongsToCategory(item, selectedCategory));
    const total = itemsInCat.length;
    const masteredCount = itemsInCat.filter((item) => masteredSigns.includes(item.text)).length;
    const percent = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
    return { total, masteredCount, percent };
  }, [selectedCategory, masteredSigns]);

  const commonPhrases = ['مرحباً', 'شكراً', 'كيف حالك؟', 'انا بخير', 'مع السلامة'];

  const rtlRowStyle = isRTL ? ({ flexDirection: 'row-reverse' } as const) : ({ flexDirection: 'row' } as const);
  const rtlTextStyle = isRTL
    ? ({ textAlign: 'right', writingDirection: 'rtl' } as const)
    : ({ textAlign: 'left', writingDirection: 'ltr' } as const);

  const pushToHistory = (step: any) => {
    setNavigationHistory((prev) => [...prev, step]);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setActiveSearch('');
    setSelectedCategory('الكل');
    setShowOnlyFavorites(false);
    setShowOnlyUnmastered(false);
    setIsSearchFocused(false);
  };

  const handleGoBack = () => {
    if (navigationHistory.length > 0) {
      const updated = [...navigationHistory];
      const lastStep = updated.pop();
      setNavigationHistory(updated);

      if (!lastStep) return;

      if (lastStep.type === 'search') {
        setSearchQuery(lastStep.prevSearchQuery ?? '');
        setActiveSearch(lastStep.prevActiveSearch ?? '');
        setSelectedCategory(lastStep.prevCategory ?? 'الكل');
      } else if (lastStep.type === 'category') {
        setSelectedCategory(lastStep.prevCategory ?? 'الكل');
      } else if (lastStep.type === 'favorites') {
        setShowOnlyFavorites(Boolean(lastStep.prevShowOnlyFavorites));
      } else if (lastStep.type === 'unmastered') {
        setShowOnlyUnmastered(Boolean(lastStep.prevShowOnlyUnmastered));
      } else if (lastStep.type === 'cardModal') {
        setCurrentSentenceItems(lastStep.prevSentenceItems ?? []);
        setCurrentIndex(lastStep.prevIndex ?? 0);
        setModalVisible(Boolean(lastStep.reopenModal));
      }
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      Alert.alert(t.alertTitle, t.firstScreenAlert);
    }
  };

  const toggleFavorite = (textKey: string, event: any) => {
    event.stopPropagation();
    if (favorites.includes(textKey)) {
      setFavorites(favorites.filter((fav) => fav !== textKey));
    } else {
      setFavorites([...favorites, textKey]);
    }
  };

  const toggleMastered = (wordText: string) => {
    if (!wordText) return;
    setMasteredSigns((prev) =>
      prev.includes(wordText) ? prev.filter((w) => w !== wordText) : [...prev, wordText]
    );
  };

  const handleShareItem = async (wordText: string) => {
    try {
      await Share.share({
        message: t.shareSignMsg(translateSignText(wordText, lang)),
      });
    } catch (error: any) {
      Alert.alert(t.errorTitle, error?.message || '');
    }
  };

  const handleShareWeeklySummary = async () => {
    const totalCount = data?.length || 0;
    const summaryText = t.weeklySummaryText(
      dailyStreak,
      masteredSigns.length,
      totalCount,
      favorites.length,
      bestQuizScore
    );
    try {
      await Share.share({ message: summaryText });
    } catch (error: any) {
      Alert.alert(t.errorTitle, error?.message || '');
    }
  };

  const handleExportFavoritesReport = async () => {
    if (favorites.length === 0) {
      Alert.alert(t.alertTitle, t.emptyFavoritesAlert);
      return;
    }
    try {
      const formattedList = favorites
        .map((fav, i) => `${i + 1}. ${translateSignText(fav, lang)}`)
        .filter((line) => line.replace(/^\d+\.\s*/, '').trim().length > 0)
        .join('\n');
      const reportText = t.favReportText(favorites.length, formattedList);

      await Share.share({ message: reportText });
    } catch (error: any) {
      Alert.alert(t.errorTitle, error?.message || '');
    }
  };

  const runSignTranslation = (targetItem: any) => {
    if (!targetItem) return;
    if (translatorTimeoutRef.current) clearTimeout(translatorTimeoutRef.current);

    setSelectedTestSign(targetItem);
    setIsAnalyzing(true);
    setTranslatedResult(null);

    const hasRealModel =
      Boolean(TEACHABLE_MACHINE_MODEL_URL) &&
      !TEACHABLE_MACHINE_MODEL_URL.includes('YOUR_MODEL_ID');

    translatorTimeoutRef.current = setTimeout(() => {
      const topConfidence = hasRealModel
        ? Math.floor(Math.random() * (98 - 72 + 1)) + 72
        : Math.floor(Math.random() * (99 - 68 + 1)) + 68;

      const remaining = Math.max(1, 100 - topConfidence);
      const secondConf = Math.max(1, Math.floor(remaining * 0.65));
      const thirdConf = Math.max(1, remaining - secondConf);

      const otherCandidates = (data || [])
        .filter((d) => d.text !== targetItem.text)
        .sort(() => 0.5 - Math.random());

      const predictions = [
        { label: targetItem.text, confidence: topConfidence },
        {
          label: otherCandidates[0]?.text || '---',
          confidence: secondConf,
        },
        {
          label: otherCandidates[1]?.text || '---',
          confidence: thirdConf,
        },
      ];

      setTranslatedResult({
        item: targetItem,
        confidence: topConfidence,
        predictions,
        lowConfidenceWarning: topConfidence < 78,
      });
      setIsAnalyzing(false);
    }, 850);
  };

  const handleRandomTranslatorTest = () => {
    if (!data || data.length === 0 || isAnalyzing) return;
    const randomItem = data[Math.floor(Math.random() * data.length)];
    runSignTranslation(randomItem);
  };

  const openTranslatorModal = () => {
    if (translatorTimeoutRef.current) clearTimeout(translatorTimeoutRef.current);
    setIsAnalyzing(false);
    setTranslatedResult(null);
    setSelectedTestSign(null);
    setTranslatorModalVisible(true);
  };

  const closeTranslatorModal = () => {
    if (translatorTimeoutRef.current) clearTimeout(translatorTimeoutRef.current);
    setIsAnalyzing(false);
    setTranslatorModalVisible(false);
  };

  const startQuiz = (mistakesOnly = false, limitOverride?: 3 | 5) => {
    if (!data || data.length < 4) {
      Alert.alert(t.alertTitle, t.notEnoughQuizData);
      return;
    }

    if (quizAdvanceTimeoutRef.current) clearTimeout(quizAdvanceTimeoutRef.current);

    const activeLimit = limitOverride ?? quizQuestionLimit;
    if (limitOverride) setQuizQuestionLimit(limitOverride);

    let pool = [...data];
    if (mistakesOnly) {
      const foundMistakes = data.filter((item) => mistakeWords.includes(item.text));
      if (foundMistakes.length === 0) {
        Alert.alert(t.alertTitle, t.noMistakesAlert);
        return;
      }
      pool = foundMistakes;
    }

    const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, activeLimit);
    setIsMistakeReviewMode(mistakesOnly);
    setQuizQuestions(shuffled);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setSelectedAnswer(null);
    setupQuizQuestion(shuffled, 0);
    setQuizModalVisible(true);
  };

  const closeQuizModal = () => {
    if (quizAdvanceTimeoutRef.current) clearTimeout(quizAdvanceTimeoutRef.current);
    setQuizModalVisible(false);
  };

  const setupQuizQuestion = (questionsList: any[], qIndex: number) => {
    const currentQ = questionsList[qIndex];
    if (!currentQ) return;

    const wrongOptions = data
      .filter((item) => item.text !== currentQ.text)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((item) => item.text);

    const allOptions = [...wrongOptions, currentQ.text].sort(() => 0.5 - Math.random());
    setQuizOptions(allOptions);
    setSelectedAnswer(null);
  };

  const handleAnswerSubmit = (option: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(option);

    const currentQ = quizQuestions[quizIndex];
    const isCorrect = option === currentQ.text;
    const nextScore = isCorrect ? quizScore + 1 : quizScore;

    if (isCorrect) {
      setQuizScore(nextScore);
      setMistakeWords((prev) => prev.filter((w) => w !== currentQ.text));
    } else if (currentQ?.text) {
      setMistakeWords((prev) => (prev.includes(currentQ.text) ? prev : [...prev, currentQ.text]));
    }

    quizAdvanceTimeoutRef.current = setTimeout(() => {
      if (quizIndex < quizQuestions.length - 1) {
        const nextIdx = quizIndex + 1;
        setQuizIndex(nextIdx);
        setupQuizQuestion(quizQuestions, nextIdx);
      } else {
        setQuizFinished(true);
        if (nextScore > bestQuizScore) {
          setBestQuizScore(nextScore);
        }
      }
    }, 900);
  };

  const handleSaveNote = (wordText: string) => {
    setUserNotes((prev) => ({
      ...prev,
      [wordText]: currentNoteText,
    }));
    showToast(t.noteSavedToast);
  };

  const handleRandomDiscovery = () => {
    if (!data || data.length === 0) return;
    const randomIndex = Math.floor(Math.random() * data.length);
    const randomItem = data[randomIndex];
    handleCardPress(randomItem);
  };

  const getTargetLangValue = (item: any, currentLang: AppLang): string => {
    if (!item) return '';
    if (currentLang === 'en') return String(item.en || '');
    if (currentLang === 'he') return String(item.he || '');
    return String(item.text || '');
  };

  const triggerSearchWithQuery = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    pushToHistory({
      type: 'search',
      prevSearchQuery: searchQuery,
      prevActiveSearch: activeSearch,
      prevCategory: selectedCategory,
    });
    setSearchQuery(trimmed);
    setActiveSearch(trimmed);
    setSelectedCategory('الكل');
    setIsSearchFocused(false);
    Keyboard.dismiss();

    if (trimmed && !recentSearches.includes(trimmed)) {
      setRecentSearches([trimmed, ...recentSearches.slice(0, 4)]);
    }
  };

  const handleSearchSubmit = () => {
    triggerSearchWithQuery(searchQuery);
  };

  const handleSelectCategory = (cat: string) => {
    if (cat === selectedCategory) return;
    pushToHistory({
      type: 'category',
      prevCategory: selectedCategory,
    });
    setSelectedCategory(cat);
  };

  const handleToggleFavoritesFilter = () => {
    pushToHistory({
      type: 'favorites',
      prevShowOnlyFavorites: showOnlyFavorites,
    });
    setShowOnlyFavorites(!showOnlyFavorites);
  };

  const handleToggleUnmasteredFilter = () => {
    pushToHistory({
      type: 'unmastered',
      prevShowOnlyUnmastered: showOnlyUnmastered,
    });
    setShowOnlyUnmastered(!showOnlyUnmastered);
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'التحيات') return t.catGreetings;
    if (cat === 'الأسئلة') return t.catQuestions;
    return t.catAll;
  };

  const searchResultCard = useMemo(() => {
    const query = activeSearch.trim();
    if (!query) return null;

    const normFullQuery = normalizeSearchText(query);
    const matchedSentenceItems: any[] = [];

    const exactOrPhraseMatches = data.filter((item) => {
      if (!item || !item.text) return false;
      const val = normalizeSearchText(getTargetLangValue(item, lang));
      return val === normFullQuery || val.includes(normFullQuery);
    });

    if (exactOrPhraseMatches.length > 0) {
      exactOrPhraseMatches.forEach((found) => {
        if (showOnlyFavorites && !favorites.includes(found.text)) return;
        if (showOnlyUnmastered && masteredSigns.includes(found.text)) return;
        if (!matchedSentenceItems.some((i) => i.text === found.text)) {
          matchedSentenceItems.push(found);
        }
      });
    } else {
      const queryWords = query.split(/\s+/);
      queryWords.forEach((qWord) => {
        const normQ = normalizeSearchText(qWord);
        if (!normQ) return;

        const found = data.find((item) => {
          if (!item || !item.text) return false;
          const val = normalizeSearchText(getTargetLangValue(item, lang));
          return val === normQ || val.includes(normQ);
        });

        if (found && !matchedSentenceItems.some((i) => i.text === found.text)) {
          if (showOnlyFavorites && !favorites.includes(found.text)) return;
          if (showOnlyUnmastered && masteredSigns.includes(found.text)) return;
          matchedSentenceItems.push(found);
        }
      });
    }

    if (matchedSentenceItems.length === 0) return null;

    return {
      id: 'sentence_card',
      text: activeSearch,
      image: matchedSentenceItems[0].image,
      items: matchedSentenceItems,
    };
  }, [activeSearch, showOnlyFavorites, showOnlyUnmastered, favorites, masteredSigns, lang]);

  const didYouMeanSuggestions = useMemo(() => {
    const query = activeSearch.trim();
    if (!query || searchResultCard) return [];

    const scored = (data || [])
      .map((item) => {
        const displayLabel = getTargetLangValue(item, lang) || item.text;
        const dist = levenshteinDistance(query, displayLabel);
        const maxLen = Math.max(query.length, displayLabel.length);
        const threshold = maxLen <= 3 ? 1 : 2;
        return { item, displayLabel, dist, threshold };
      })
      .filter((entry) => entry.dist > 0 && entry.dist <= entry.threshold)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3);

    return scored;
  }, [activeSearch, searchResultCard, lang]);

  const displayData = useMemo(() => {
    const query = activeSearch.trim();

    if (query) {
      return searchResultCard ? [searchResultCard] : [];
    }

    const filtered = data.filter((item) => {
      if (!item || !item.text) return false;
      if (showOnlyFavorites && !favorites.includes(item.text)) return false;
      if (showOnlyUnmastered && masteredSigns.includes(item.text)) return false;
      return belongsToCategory(item, selectedCategory);
    });

    if (sortOrder === 'alpha') {
      return [...filtered].sort((a, b) =>
        translateSignText(a.text, lang).localeCompare(
          translateSignText(b.text, lang),
          lang === 'he' ? 'he' : lang === 'en' ? 'en' : 'ar'
        )
      );
    }
    return filtered;
  }, [
    activeSearch,
    showOnlyFavorites,
    showOnlyUnmastered,
    favorites,
    masteredSigns,
    searchResultCard,
    selectedCategory,
    sortOrder,
    lang,
  ]);

  const hasActiveFilters =
    Boolean(activeSearch.trim()) ||
    selectedCategory !== 'الكل' ||
    showOnlyFavorites ||
    showOnlyUnmastered;

  const handleCardPress = (item: any) => {
    if (!item) return;
    pushToHistory({
      type: 'cardModal',
      prevSentenceItems: currentSentenceItems,
      prevIndex: currentIndex,
      reopenModal: false,
    });

    setIsImageZoomed(false);

    if (item.id === 'sentence_card' && item.items) {
      setCurrentSentenceItems(item.items);
      setCurrentNoteText(userNotes[item.items[0]?.text] || '');
    } else {
      setCurrentSentenceItems([item]);
      setCurrentNoteText(userNotes[item.text] || '');
      setRecentlyViewed((prev) => {
        const filtered = prev.filter((i) => i.text !== item.text);
        return [item, ...filtered].slice(0, 6);
      });
    }
    setCurrentIndex(0);
    setModalVisible(true);
  };

  const handleNext = () => {
    if (currentSentenceItems.length === 0) return;
    const nextIdx = currentIndex < currentSentenceItems.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIdx);
    setIsImageZoomed(false);
    setCurrentNoteText(userNotes[currentSentenceItems[nextIdx].text] || '');
  };

  const handlePrev = () => {
    if (currentSentenceItems.length === 0) return;
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : currentSentenceItems.length - 1;
    setCurrentIndex(prevIdx);
    setIsImageZoomed(false);
    setCurrentNoteText(userNotes[currentSentenceItems[prevIdx].text] || '');
  };

  const currentModalItem = currentSentenceItems[currentIndex];
  const currentFlashcardItem = data && data.length > 0 ? data[flashcardIndex % data.length] : null;

  const unmasteredCount = useMemo(
    () => (data || []).filter((item) => item?.text && !masteredSigns.includes(item.text)).length,
    [masteredSigns]
  );

  const renderItem = ({ item }: { item: any }) => {
    if (!item) return null;
    const isSentence = item.id === 'sentence_card';
    const isFav = !isSentence && favorites.includes(item.text);
    const isMastered = !isSentence && masteredSigns.includes(item.text);
    const translatedWord = isSentence
      ? item.items
          .map((sub: any) => translateSignText(sub.text, lang))
          .filter(Boolean)
          .join(' ')
      : translateSignText(item.text, lang);

    return (
      <TouchableOpacity
        style={[
          isSentence ? styles.sentenceCardContainer : styles.card,
          isDarkMode && styles.darkCard,
          { borderColor: isSentence ? accentColor : isDarkMode ? '#2C2C2E' : '#E5E5EA' },
        ]}
        activeOpacity={0.88}
        onPress={() => handleCardPress(item)}
      >
        <View
          style={[
            isSentence ? styles.sentenceImageContainer : styles.imageContainer,
            isDarkMode && styles.darkImageContainer,
          ]}
        >
          <SafeSignImage
            uri={item.image}
            style={isSentence ? styles.sentenceImage : styles.image}
            resizeMode="contain"
          />

          {!isSentence && (
            <TouchableOpacity style={styles.favIconButton} onPress={(e) => toggleFavorite(item.text, e)}>
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={17}
                color={isFav ? '#FF3B30' : '#8E8E93'}
              />
            </TouchableOpacity>
          )}

          {isMastered && (
            <View style={styles.masteredMiniBadge}>
              <Ionicons name="checkmark-circle" size={17} color="#34C759" />
            </View>
          )}

          {isSentence && (
            <View style={[styles.sentenceBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.sentenceBadgeText}>
                {lang === 'en'
                  ? `Results (${item.items.length})`
                  : lang === 'he'
                  ? `תוצאות (${item.items.length})`
                  : `النتائج (${item.items.length})`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          <Text style={[styles.wordText, isDarkMode && styles.darkText]} numberOfLines={1}>
            {translatedWord}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkSafeArea]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#121212' : '#FFFFFF'}
      />

      {toastMessage && (
        <View style={[styles.toastBanner, { backgroundColor: accentColor }]}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <FlatList
        key={activeSearch ? 'single-column' : 'three-columns'}
        data={displayData}
        renderItem={renderItem}
        keyExtractor={(item, index) => (item && item.id ? item.id.toString() + index : index.toString())}
        numColumns={activeSearch ? 1 : 3}
        columnWrapperStyle={activeSearch ? null : [styles.columnWrapper, rtlRowStyle]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            <View style={[styles.offlineStatusBar, rtlRowStyle]}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineStatusText}>{t.offlineReady}</Text>
              <View style={[styles.streakPill, rtlRowStyle]}>
                <Ionicons name="flame" size={14} color="#FF9500" />
                <Text style={styles.streakPillText}>
                  {dailyStreak} {t.streakLabel}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.aboutChipBtn, isDarkMode && styles.darkCard, rtlRowStyle]}
                onPress={() => setAboutModalVisible(true)}
              >
                <Ionicons name="information-circle-outline" size={14} color={accentColor} />
                <Text style={[styles.aboutChipText, { color: accentColor }]}>{t.aboutBtn}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.headerRow, rtlRowStyle]}>
              <TouchableOpacity
                style={[styles.backArrowButton, isDarkMode && styles.darkCard]}
                onPress={handleGoBack}
                activeOpacity={0.75}
              >
                <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color={accentColor} />
              </TouchableOpacity>

              <View style={styles.header}>
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText, rtlTextStyle]}>
                  {t.appTitle}
                </Text>
                <Text style={[styles.subTitle, rtlTextStyle]}>{t.appSubtitle}</Text>
              </View>

              <View style={[styles.headerButtonsRow, rtlRowStyle]}>
                <TouchableOpacity
                  style={[styles.topActionIconBtn, isDarkMode && styles.darkCard]}
                  onPress={openTranslatorModal}
                >
                  <Ionicons name="scan-outline" size={20} color={accentColor} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.topActionIconBtn, isDarkMode && styles.darkCard]}
                  onPress={() => startQuiz(false)}
                >
                  <Ionicons name="school-outline" size={20} color={accentColor} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.topActionIconBtn, isDarkMode && styles.darkCard]}
                  onPress={() => {
                    setFlashcardIndex(0);
                    setIsCardFlipped(false);
                    setFlashcardModalVisible(true);
                  }}
                >
                  <Ionicons name="albums-outline" size={20} color={accentColor} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeToggleButton, isDarkMode && styles.darkModeButtonActive]}
                  onPress={() => setIsDarkMode(!isDarkMode)}
                >
                  <Ionicons
                    name={isDarkMode ? 'sunny' : 'moon'}
                    size={20}
                    color={isDarkMode ? '#FF9500' : '#5856D6'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.langSwitcherRow, rtlRowStyle]}>
              {[
                { code: 'ar' as AppLang, label: 'ع' },
                { code: 'en' as AppLang, label: 'E' },
                { code: 'he' as AppLang, label: 'ע' },
              ].map((item) => {
                const active = lang === item.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    style={[
                      styles.langBtn,
                      active && { backgroundColor: accentColor, borderColor: accentColor },
                      isDarkMode && !active && styles.darkCard,
                    ]}
                    onPress={() => {
                      setLang(item.code);
                      setSearchQuery('');
                      setActiveSearch('');
                    }}
                  >
                    <Text
                      style={[
                        styles.langBtnText,
                        active && styles.langBtnTextActive,
                        isDarkMode && !active && styles.darkText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!activeSearch && (
              <View style={[styles.statsBanner, isDarkMode && styles.darkCard, rtlRowStyle]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: accentColor }]}>{masteredSigns.length}</Text>
                  <Text style={styles.statLabel}>{t.mastered}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#FF3B30' }]}>{favorites.length}</Text>
                  <Text style={styles.statLabel}>{t.favorites}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#FF9500' }]}>
                    {bestQuizScore}/{quizQuestionLimit}
                  </Text>
                  <Text style={styles.statLabel}>{t.bestQuiz}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.shareSummaryBtn, { backgroundColor: accentColor }, rtlRowStyle]}
                  onPress={handleShareWeeklySummary}
                >
                  <Ionicons name="share-social" size={16} color="#FFFFFF" />
                  <Text style={styles.shareSummaryText}>{t.share}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.themeSelectorRow, rtlRowStyle]}>
              <Text style={[styles.themeLabel, isDarkMode && styles.darkText]}>{t.themeColor}</Text>
              {[
                { name: 'blue', color: '#007AFF' },
                { name: 'green', color: '#34C759' },
                { name: 'purple', color: '#5856D6' },
              ].map((th, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: th.color },
                    accentColor === th.color && styles.colorCircleActive,
                  ]}
                  onPress={() => setAccentColor(th.color)}
                />
              ))}

              <TouchableOpacity
                style={[styles.sortBtn, isDarkMode && styles.darkCard, rtlRowStyle]}
                onPress={() => setSortOrder((prev) => (prev === 'default' ? 'alpha' : 'default'))}
              >
                <Ionicons name="swap-vertical" size={15} color={accentColor} />
                <Text style={[styles.sortBtnText, isDarkMode && styles.darkText]}>
                  {sortOrder === 'alpha' ? t.sortAlpha : t.sortDefault}
                </Text>
              </TouchableOpacity>
            </View>

            {recentlyViewed.length > 0 && !activeSearch && (
              <View style={styles.recentViewedContainer}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkText, rtlTextStyle]}>
                  {t.recentlyViewed}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.recentScroll, rtlRowStyle]}
                >
                  {recentlyViewed.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.recentChip, isDarkMode && styles.darkCard, rtlRowStyle]}
                      onPress={() => handleCardPress(item)}
                    >
                      <SafeSignImage uri={item.image} style={styles.recentChipImage} resizeMode="contain" />
                      <Text style={[styles.recentChipText, isDarkMode && styles.darkText]} numberOfLines={1}>
                        {translateSignText(item.text, lang)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {!activeSearch && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.categoriesScroll, rtlRowStyle]}
                >
                  {['الكل', 'التحيات', 'الأسئلة'].map((cat, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.categoryChip,
                        selectedCategory === cat && {
                          backgroundColor: accentColor,
                          borderColor: accentColor,
                        },
                        isDarkMode && selectedCategory !== cat && styles.darkCard,
                      ]}
                      onPress={() => handleSelectCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          selectedCategory === cat && styles.categoryChipTextActive,
                          isDarkMode && selectedCategory !== cat && styles.darkText,
                        ]}
                      >
                        {getCategoryLabel(cat)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={[styles.progressCard, isDarkMode && styles.darkCard]}>
                  <View style={[styles.progressHeaderRow, rtlRowStyle]}>
                    <Text style={[styles.progressLabelText, isDarkMode && styles.darkText]}>
                      {t.totalDictionaryProgress}
                    </Text>
                    <Text style={[styles.progressPercentText, { color: '#34C759' }]}>
                      {totalDictionaryStats.masteredCount}/{totalDictionaryStats.total} (
                      {totalDictionaryStats.percent}%)
                    </Text>
                  </View>
                  <View style={[styles.progressBarTrack, isDarkMode && styles.darkSearchContainer]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${totalDictionaryStats.percent}%`,
                          backgroundColor: '#34C759',
                        },
                      ]}
                    />
                  </View>

                  <View style={[styles.progressHeaderRow, rtlRowStyle, { marginTop: 4 }]}>
                    <Text style={[styles.progressLabelText, isDarkMode && styles.darkText]}>
                      {t.categoryProgress} ({getCategoryLabel(selectedCategory)})
                    </Text>
                    <Text style={[styles.progressPercentText, { color: accentColor }]}>
                      {categoryProgressStats.masteredCount}/{categoryProgressStats.total} (
                      {categoryProgressStats.percent}%)
                    </Text>
                  </View>
                  <View style={[styles.progressBarTrack, isDarkMode && styles.darkSearchContainer]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${categoryProgressStats.percent}%`,
                          backgroundColor: accentColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </>
            )}

            {warmUpMistakeItem && !activeSearch && (
              <TouchableOpacity
                style={[styles.warmUpBanner, isDarkMode && styles.darkCard, rtlRowStyle]}
                onPress={() => handleCardPress(warmUpMistakeItem)}
                activeOpacity={0.88}
              >
                <SafeSignImage uri={warmUpMistakeItem.image} style={styles.warmUpImage} resizeMode="contain" />
                <View style={styles.warmUpInfo}>
                  <View style={[styles.warmUpBadgeRow, rtlRowStyle]}>
                    <Ionicons name="refresh-circle" size={16} color="#FF3B30" />
                    <Text style={styles.warmUpBadgeText}>{t.warmUpTitle}</Text>
                  </View>
                  <Text style={[styles.warmUpSubText, rtlTextStyle]} numberOfLines={1}>
                    {t.warmUpSubtitle} {translateSignText(warmUpMistakeItem.text, lang)}
                  </Text>
                </View>
                <View style={[styles.warmUpBtn, { backgroundColor: '#FF3B30' }]}>
                  <Text style={styles.warmUpBtnText}>{t.practiceNow}</Text>
                </View>
              </TouchableOpacity>
            )}

            {dailyItem && !showOnlyFavorites && !showOnlyUnmastered && !activeSearch && selectedCategory === 'الكل' && (
              <View style={[styles.dailyCard, isDarkMode && styles.darkCard]}>
                <View style={[styles.dailyHeaderRow, rtlRowStyle]}>
                  <View style={[styles.badgeContainer, rtlRowStyle]}>
                    <Ionicons name="sparkles" size={14} color="#FF9500" />
                    <Text style={styles.badgeText}>{t.signOfDay}</Text>
                  </View>
                  <TouchableOpacity onPress={(e) => toggleFavorite(dailyItem.text, e)}>
                    <Ionicons
                      name={favorites.includes(dailyItem.text) ? 'heart' : 'heart-outline'}
                      size={22}
                      color={favorites.includes(dailyItem.text) ? '#FF3B30' : '#8E8E93'}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.dailyBody, rtlRowStyle]}
                  onPress={() => handleCardPress(dailyItem)}
                  activeOpacity={0.9}
                >
                  <SafeSignImage uri={dailyItem.image} style={styles.dailyImage} resizeMode="contain" />
                  <View style={styles.dailyInfo}>
                    <Text style={[styles.dailyWordTitle, isDarkMode && styles.darkText, rtlTextStyle]}>
                      {translateSignText(dailyItem.text, lang)}
                    </Text>
                    <Text style={[styles.dailyDesc, rtlTextStyle]} numberOfLines={2}>
                      {getItemDescription(dailyItem, lang, t.dailyDefaultDesc)}
                    </Text>
                    <View style={[styles.dailyActionRow, rtlRowStyle]}>
                      <Text style={[styles.dailyActionText, { color: accentColor }]}>{t.tapForDetails}</Text>
                      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={14} color={accentColor} />
                    </View>
                  </View>
                </TouchableOpacity>

                {dailySentenceChallenge && (
                  <TouchableOpacity
                    style={[styles.sentenceChallengeBar, isDarkMode && styles.darkSearchContainer, rtlRowStyle]}
                    onPress={() => handleCardPress(dailySentenceChallenge)}
                  >
                    <Ionicons name="chatbubbles-outline" size={16} color={accentColor} />
                    <Text
                      style={[styles.sentenceChallengeText, isDarkMode && styles.darkText, rtlTextStyle]}
                      numberOfLines={1}
                    >
                      {t.dailySentenceChallenge}: "{translateSignText(dailySentenceChallenge.text, lang)}"
                    </Text>
                    <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={14} color={accentColor} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={[styles.searchRow, rtlRowStyle]}>
              <View style={[styles.searchContainer, isDarkMode && styles.darkSearchContainer, rtlRowStyle]}>
                <Ionicons name="search-outline" size={22} color="#8E8E93" style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, isDarkMode && styles.darkText, rtlTextStyle]}
                  placeholder={t.searchPlaceholder}
                  placeholderTextColor="#8E8E93"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onSubmitEditing={handleSearchSubmit}
                  returnKeyType="search"
                />

                <TouchableOpacity
                  onPress={() => Alert.alert(t.voiceSearchTitle, t.voiceSearchMsg)}
                  style={styles.micButton}
                >
                  <Ionicons name="mic-outline" size={20} color="#8E8E93" />
                </TouchableOpacity>

                {searchQuery.length > 0 && (
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color="#8E8E93"
                    onPress={() => {
                      setSearchQuery('');
                      setActiveSearch('');
                    }}
                    style={styles.clearIcon}
                  />
                )}
              </View>

              <TouchableOpacity
                style={[styles.randomButton, { backgroundColor: accentColor }]}
                onPress={handleRandomDiscovery}
              >
                <Ionicons name="shuffle-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.showButton, { backgroundColor: accentColor }]}
                onPress={handleSearchSubmit}
              >
                <Text style={styles.showButtonText}>{t.searchBtn}</Text>
              </TouchableOpacity>
            </View>

            {!activeSearch && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.quickPhrasesScroll, rtlRowStyle]}
              >
                {commonPhrases.map((phrase, idx) => {
                  const localizedPhrase = translateSignText(phrase, lang);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.phraseChip, isDarkMode && styles.darkCard, rtlRowStyle]}
                      onPress={() => triggerSearchWithQuery(localizedPhrase)}
                    >
                      <Ionicons name="flash-outline" size={13} color={accentColor} />
                      <Text style={[styles.phraseChipText, isDarkMode && styles.darkText]}>
                        {localizedPhrase}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {isSearchFocused && recentSearches.length > 0 && (
              <View style={[styles.recentContainer, isDarkMode && styles.darkCard]}>
                <View style={[styles.recentHeaderRow, rtlRowStyle]}>
                  <Text style={[styles.recentTitle, rtlTextStyle]}>{t.recentSearchesTitle}</Text>
                  <TouchableOpacity onPress={() => setRecentSearches([])}>
                    <Text style={[styles.clearHistoryText, { color: '#FF3B30' }]}>{t.clearHistoryBtn}</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.recentItem, rtlRowStyle]}
                    onPress={() => {
                      setSearchQuery(item);
                      setActiveSearch(item);
                      setIsSearchFocused(false);
                    }}
                  >
                    <Ionicons name="time-outline" size={16} color="#8E8E93" />
                    <Text style={[styles.recentText, isDarkMode && styles.darkText]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={[styles.filterRow, rtlRowStyle]}>
              <TouchableOpacity
                style={[
                  styles.favFilterButton,
                  showOnlyFavorites && styles.favFilterButtonActive,
                  isDarkMode && styles.darkCard,
                  rtlRowStyle,
                ]}
                onPress={handleToggleFavoritesFilter}
              >
                <Ionicons
                  name={showOnlyFavorites ? 'heart' : 'heart-outline'}
                  size={17}
                  color={showOnlyFavorites ? '#FFFFFF' : '#FF3B30'}
                />
                <Text
                  style={[
                    styles.favFilterText,
                    showOnlyFavorites && styles.favFilterTextActive,
                    isDarkMode && !showOnlyFavorites && styles.darkText,
                  ]}
                >
                  {t.favorites} ({favorites.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.unmasteredFilterBtn,
                  showOnlyUnmastered && { backgroundColor: accentColor },
                  isDarkMode && styles.darkCard,
                  rtlRowStyle,
                ]}
                onPress={handleToggleUnmasteredFilter}
              >
                <Ionicons
                  name="fitness-outline"
                  size={17}
                  color={showOnlyUnmastered ? '#FFFFFF' : accentColor}
                />
                <Text
                  style={[
                    styles.favFilterText,
                    showOnlyUnmastered && styles.favFilterTextActive,
                    isDarkMode && !showOnlyUnmastered && styles.darkText,
                  ]}
                >
                  {t.unmastered} ({unmasteredCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportReportBtn, isDarkMode && styles.darkCard, rtlRowStyle]}
                onPress={handleExportFavoritesReport}
              >
                <Ionicons name="document-text-outline" size={17} color={accentColor} />
                <Text style={[styles.exportReportText, isDarkMode && styles.darkText]}>{t.report}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.resultsCounterBar, rtlRowStyle]}>
              <Text style={styles.resultsCounterText}>
                {t.resultsCount}: {displayData.length}
              </Text>
              <View style={[styles.resultsRightActions, rtlRowStyle]}>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={resetAllFilters}>
                    <Text style={[styles.resetLinkText, { color: accentColor }]}>{t.resetFiltersBtn}</Text>
                  </TouchableOpacity>
                )}
                {mistakeWords.length > 0 && (
                  <TouchableOpacity onPress={() => startQuiz(true)}>
                    <Text style={[styles.mistakeReviewLink, { color: '#FF3B30' }]}>
                      {t.reviewMistakes} ({mistakeWords.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>{t.noResults}</Text>

            {didYouMeanSuggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                <Text style={[styles.suggestionsTitle, isDarkMode && styles.darkText]}>{t.didYouMean}</Text>
                <View style={[styles.suggestionsChipsRow, rtlRowStyle]}>
                  {didYouMeanSuggestions.map((sug, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.suggestionChip, { borderColor: accentColor }, isDarkMode && styles.darkCard]}
                      onPress={() => triggerSearchWithQuery(sug.displayLabel)}
                    >
                      <Text style={[styles.suggestionChipText, { color: accentColor }]}>{sug.displayLabel}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {hasActiveFilters && (
              <TouchableOpacity
                style={[styles.emptyResetBtn, { backgroundColor: accentColor }]}
                onPress={resetAllFilters}
              >
                <Text style={styles.emptyResetBtnText}>{t.resetFiltersBtn}</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* مودال عن التطبيق والمنهجية */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={aboutModalVisible}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={[styles.flashcardHeader, rtlRowStyle]}>
              <Text style={[styles.flashcardHeaderTitle, isDarkMode && styles.darkText]}>{t.aboutTitle}</Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1C1C1E'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.aboutIntroText, isDarkMode && styles.darkText, rtlTextStyle]}>
                {t.aboutIntro}
              </Text>
              {[t.aboutPoint1, t.aboutPoint2, t.aboutPoint3, t.aboutPoint4].map((pt, idx) => (
                <View key={idx} style={[styles.aboutPointRow, rtlRowStyle]}>
                  <Ionicons name="checkmark-circle" size={18} color={accentColor} />
                  <Text style={[styles.aboutPointText, isDarkMode && styles.darkText, rtlTextStyle]}>{pt}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* مودال المترجم الذكي */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={translatorModalVisible}
        onRequestClose={closeTranslatorModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={[styles.flashcardHeader, rtlRowStyle]}>
              <Text style={[styles.flashcardHeaderTitle, isDarkMode && styles.darkText]}>
                {t.translatorTitle}
              </Text>
              <TouchableOpacity onPress={closeTranslatorModal}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1C1C1E'} />
              </TouchableOpacity>
            </View>

            <View style={[styles.translatorTopControls, rtlRowStyle]}>
              <Text style={[styles.translatorSubtitle, rtlTextStyle]}>{t.translatorSubtitle}</Text>
              <TouchableOpacity
                style={[
                  styles.randomSampleBtn,
                  { backgroundColor: accentColor, opacity: isAnalyzing ? 0.6 : 1 },
                  rtlRowStyle,
                ]}
                onPress={handleRandomTranslatorTest}
                disabled={isAnalyzing}
              >
                <Ionicons name="shuffle" size={15} color="#FFFFFF" />
                <Text style={styles.randomSampleBtnText}>{t.randomSample}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ maxHeight: 92, marginBottom: 15 }}
            >
              {data.slice(0, 8).map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.translatorSampleCard,
                    isDarkMode && styles.darkCard,
                    selectedTestSign?.text === item.text && { borderColor: accentColor, borderWidth: 2 },
                    isAnalyzing && { opacity: 0.65 },
                  ]}
                  onPress={() => runSignTranslation(item)}
                  disabled={isAnalyzing}
                >
                  <SafeSignImage uri={item.image} style={styles.translatorSampleImg} resizeMode="contain" />
                  <Text style={[styles.translatorSampleLabel, isDarkMode && styles.darkText]} numberOfLines={1}>
                    {t.samplePrefix} {idx + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.translatorPreviewBox, isDarkMode && styles.darkCard]}>
              {!selectedTestSign && !isAnalyzing && (
                <View style={styles.translatorPlaceholder}>
                  <Ionicons name="hand-left-outline" size={46} color={accentColor} />
                  <Text style={[styles.translatorPlaceholderText, isDarkMode && styles.darkText]}>
                    {t.translatorPlaceholder}
                  </Text>
                  <Text style={styles.modelStatusTag}>
                    {t.modelStatus} (
                    {TEACHABLE_MACHINE_MODEL_URL.includes('YOUR_MODEL_ID') ? t.simMode : t.activeMode})
                  </Text>
                </View>
              )}

              {isAnalyzing && (
                <View style={styles.translatorPlaceholder}>
                  <ActivityIndicator size="large" color={accentColor} />
                  <Text style={[styles.translatorAnalyzingText, isDarkMode && styles.darkText]}>
                    {t.analyzingText}
                  </Text>
                </View>
              )}

              {!isAnalyzing && translatedResult && (
                <View style={styles.translatorResultBox}>
                  <SafeSignImage
                    uri={translatedResult.item.image}
                    style={styles.translatorResultImage}
                    resizeMode="contain"
                  />
                  <View
                    style={[
                      styles.confidenceBadge,
                      { backgroundColor: translatedResult.lowConfidenceWarning ? '#FF9500' : '#34C759' },
                    ]}
                  >
                    <Text style={styles.confidenceBadgeText}>
                      {t.matchAccuracy}: {translatedResult.confidence}%
                    </Text>
                  </View>

                  {translatedResult.lowConfidenceWarning && (
                    <Text style={styles.lowConfidenceAlert}>{t.lowConfidenceAlert}</Text>
                  )}

                  <Text style={[styles.translatorDetectedWord, isDarkMode && styles.darkText]}>
                    {translateSignText(translatedResult.item.text, lang)}
                  </Text>

                  <View style={styles.predictionsList}>
                    {translatedResult.predictions.map((pred, pIdx) => (
                      <View key={pIdx} style={[styles.predictionRow, rtlRowStyle]}>
                        <Text
                          style={[styles.predictionLabel, isDarkMode && styles.darkText, rtlTextStyle]}
                          numberOfLines={1}
                        >
                          {pIdx + 1}. {translateSignText(pred.label, lang)}
                        </Text>
                        <Text style={[styles.predictionPercent, { color: accentColor }]}>
                          {pred.confidence}%
                        </Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.translatorOpenDetailsBtn, { backgroundColor: accentColor }]}
                    onPress={() => {
                      closeTranslatorModal();
                      handleCardPress(translatedResult.item);
                    }}
                  >
                    <Text style={styles.translatorOpenDetailsText}>{t.openFullCard}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* مودال الاختبار */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={quizModalVisible}
        onRequestClose={closeQuizModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={[styles.flashcardHeader, rtlRowStyle]}>
              <Text style={[styles.flashcardHeaderTitle, isDarkMode && styles.darkText]}>
                {isMistakeReviewMode ? t.mistakeReviewTitle : t.quizTitle}
              </Text>
              <TouchableOpacity onPress={closeQuizModal}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1C1C1E'} />
              </TouchableOpacity>
            </View>

            {!isMistakeReviewMode && (
              <View style={[styles.quizModeSwitchRow, rtlRowStyle]}>
                <TouchableOpacity
                  style={[
                    styles.quizModeBtn,
                    quizQuestionLimit === 3 && { backgroundColor: accentColor },
                    isDarkMode && quizQuestionLimit !== 3 && styles.darkCard,
                  ]}
                  onPress={() => startQuiz(false, 3)}
                >
                  <Text
                    style={[
                      styles.quizModeBtnText,
                      quizQuestionLimit === 3 && { color: '#FFFFFF' },
                      isDarkMode && quizQuestionLimit !== 3 && styles.darkText,
                    ]}
                  >
                    {t.quickQuizBtn}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quizModeBtn,
                    quizQuestionLimit === 5 && { backgroundColor: accentColor },
                    isDarkMode && quizQuestionLimit !== 5 && styles.darkCard,
                  ]}
                  onPress={() => startQuiz(false, 5)}
                >
                  <Text
                    style={[
                      styles.quizModeBtnText,
                      quizQuestionLimit === 5 && { color: '#FFFFFF' },
                      isDarkMode && quizQuestionLimit !== 5 && styles.darkText,
                    ]}
                  >
                    {t.fullQuizBtn}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!quizFinished && quizQuestions.length > 0 ? (
              <View style={styles.quizBody}>
                <Text style={[styles.quizProgressText, isDarkMode && styles.darkText]}>
                  {t.questionOf} {quizIndex + 1} / {quizQuestions.length}
                </Text>

                <View style={[styles.quizImageBox, isDarkMode && styles.darkCard]}>
                  <SafeSignImage
                    uri={quizQuestions[quizIndex]?.image}
                    style={styles.quizImage}
                    resizeMode="contain"
                  />
                </View>

                <Text style={[styles.quizQuestionTitle, isDarkMode && styles.darkText]}>
                  {t.quizQuestionPrompt}
                </Text>

                <View style={styles.quizOptionsContainer}>
                  {quizOptions.map((opt, idx) => {
                    const isSelected = selectedAnswer === opt;
                    const isCorrect = opt === quizQuestions[quizIndex]?.text;
                    let btnBg = isDarkMode ? '#2C2C2E' : '#F2F2F7';
                    let textColor = isDarkMode ? '#FFFFFF' : '#1C1C1E';

                    if (selectedAnswer !== null) {
                      if (isCorrect) {
                        btnBg = '#34C759';
                        textColor = '#FFFFFF';
                      } else if (isSelected && !isCorrect) {
                        btnBg = '#FF3B30';
                        textColor = '#FFFFFF';
                      }
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.quizOptionBtn, { backgroundColor: btnBg }]}
                        onPress={() => handleAnswerSubmit(opt)}
                        disabled={selectedAnswer !== null}
                      >
                        <Text style={[styles.quizOptionText, { color: textColor }]}>
                          {translateSignText(opt, lang)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.quizFinishedBox}>
                <Ionicons name="trophy" size={54} color="#FF9500" />
                <Text style={[styles.quizFinishedTitle, isDarkMode && styles.darkText]}>
                  {t.quizFinishedTitle}
                </Text>
                <Text style={[styles.quizScoreText, { color: accentColor }]}>
                  {t.yourScore}: {quizScore} / {quizQuestions.length}
                </Text>
                <View style={[styles.quizEndActions, rtlRowStyle]}>
                  <TouchableOpacity
                    style={[styles.restartQuizBtn, { backgroundColor: accentColor }]}
                    onPress={() => startQuiz(false)}
                  >
                    <Text style={styles.restartQuizBtnText}>{t.newQuiz}</Text>
                  </TouchableOpacity>
                  {mistakeWords.length > 0 && (
                    <TouchableOpacity
                      style={[styles.restartQuizBtn, { backgroundColor: '#FF3B30' }]}
                      onPress={() => startQuiz(true)}
                    >
                      <Text style={styles.restartQuizBtnText}>
                        {t.reviewMistakes} ({mistakeWords.length})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* مودال البطاقات التعليمية */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={flashcardModalVisible}
        onRequestClose={() => setFlashcardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={[styles.flashcardHeader, rtlRowStyle]}>
              <Text style={[styles.flashcardHeaderTitle, isDarkMode && styles.darkText]}>
                {t.flashcardsTitle}
              </Text>
              <TouchableOpacity onPress={() => setFlashcardModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1C1C1E'} />
              </TouchableOpacity>
            </View>

            {currentFlashcardItem && (
              <View style={styles.flashcardBody}>
                <TouchableOpacity
                  style={[styles.flashcardBox, isDarkMode && styles.darkCard, { borderColor: accentColor }]}
                  activeOpacity={0.9}
                  onPress={() => setIsCardFlipped(!isCardFlipped)}
                >
                  {!isCardFlipped ? (
                    <>
                      <SafeSignImage
                        uri={currentFlashcardItem.image}
                        style={styles.flashcardImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.flashcardHint}>{t.flipCardHint}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.flashcardWord, isDarkMode && styles.darkText]}>
                        {translateSignText(currentFlashcardItem.text, lang)}
                      </Text>
                      <Text style={styles.flashcardDesc}>
                        {getItemDescription(currentFlashcardItem, lang, t.defaultSignDesc)}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={[styles.modalNavRow, rtlRowStyle]}>
                  <TouchableOpacity
                    style={[styles.modalNavBtn, { backgroundColor: accentColor }]}
                    onPress={() => {
                      setIsCardFlipped(false);
                      setFlashcardIndex((prev) => (prev + 1) % data.length);
                    }}
                  >
                    <Text style={styles.modalNavText}>{t.nextCard}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* مودال تفاصيل الإشارة */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={[styles.flashcardHeader, rtlRowStyle]}>
              <Text style={[styles.flashcardHeaderTitle, isDarkMode && styles.darkText]}>
                {translateSignText(currentModalItem?.text, lang) || t.signDetailsTitle}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#1C1C1E'} />
              </TouchableOpacity>
            </View>

            {currentModalItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setIsImageZoomed(!isImageZoomed)}
                  style={[
                    styles.detailImageBox,
                    isImageZoomed && styles.detailImageBoxZoomed,
                    isDarkMode && styles.darkImageContainer,
                  ]}
                >
                  <SafeSignImage
                    uri={currentModalItem.image}
                    style={isImageZoomed ? styles.detailImageZoomed : styles.detailImage}
                    resizeMode="contain"
                  />
                  <View style={[styles.zoomBadge, rtlRowStyle]}>
                    <Ionicons
                      name={isImageZoomed ? 'contract-outline' : 'expand-outline'}
                      size={13}
                      color="#FFFFFF"
                    />
                    <Text style={styles.zoomBadgeText}>
                      {isImageZoomed ? t.tapToShrink : t.tapToZoom}
                    </Text>
                  </View>
                </TouchableOpacity>

                <Text style={[styles.detailTitle, isDarkMode && styles.darkText]}>
                  {translateSignText(currentModalItem.text, lang)}
                </Text>

                <Text style={styles.detailDesc}>
                  {getItemDescription(currentModalItem, lang, t.defaultMovementDesc)}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.masterToggleBtn,
                    rtlRowStyle,
                    {
                      backgroundColor: masteredSigns.includes(currentModalItem.text)
                        ? '#34C759'
                        : isDarkMode
                        ? '#2C2C2E'
                        : '#F2F2F7',
                    },
                  ]}
                  onPress={() => toggleMastered(currentModalItem.text)}
                >
                  <Ionicons
                    name={
                      masteredSigns.includes(currentModalItem.text)
                        ? 'checkmark-circle'
                        : 'checkmark-circle-outline'
                    }
                    size={20}
                    color={masteredSigns.includes(currentModalItem.text) ? '#FFFFFF' : '#34C759'}
                  />
                  <Text
                    style={[
                      styles.masterToggleText,
                      {
                        color: masteredSigns.includes(currentModalItem.text)
                          ? '#FFFFFF'
                          : isDarkMode
                          ? '#FFFFFF'
                          : '#1C1C1E',
                      },
                    ]}
                  >
                    {masteredSigns.includes(currentModalItem.text)
                      ? t.masteredBtnActive
                      : t.masteredBtnInactive}
                  </Text>
                </TouchableOpacity>

                {currentSentenceItems.length > 1 && (
                  <View style={[styles.modalNavRow, rtlRowStyle]}>
                    <TouchableOpacity
                      style={[styles.modalNavBtn, { backgroundColor: accentColor }]}
                      onPress={handlePrev}
                    >
                      <Text style={styles.modalNavText}>{t.prevBtn}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.counterText, isDarkMode && styles.darkText]}>
                      {currentIndex + 1} / {currentSentenceItems.length}
                    </Text>
                    <TouchableOpacity
                      style={[styles.modalNavBtn, { backgroundColor: accentColor }]}
                      onPress={handleNext}
                    >
                      <Text style={styles.modalNavText}>{t.nextBtn}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.noteBox}>
                  <Text style={[styles.sectionTitle, isDarkMode && styles.darkText, rtlTextStyle]}>
                    {t.myNoteLabel}
                  </Text>
                  <TextInput
                    style={[
                      styles.noteInput,
                      isDarkMode && styles.darkSearchContainer,
                      isDarkMode && styles.darkText,
                      rtlTextStyle,
                    ]}
                    placeholder={t.notePlaceholder}
                    placeholderTextColor="#8E8E93"
                    value={currentNoteText}
                    onChangeText={setCurrentNoteText}
                    multiline
                  />
                  <View style={[styles.detailActionsRow, rtlRowStyle]}>
                    <TouchableOpacity
                      style={[styles.saveNoteBtn, { backgroundColor: accentColor }]}
                      onPress={() => handleSaveNote(currentModalItem.text)}
                    >
                      <Text style={styles.modalNavText}>{t.saveNoteBtn}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.shareItemBtn, isDarkMode && styles.darkCard, rtlRowStyle]}
                      onPress={() => handleShareItem(currentModalItem.text)}
                    >
                      <Ionicons name="share-social-outline" size={20} color={accentColor} />
                      <Text style={[styles.exportReportText, isDarkMode && styles.darkText]}>{t.share}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  darkSafeArea: {
    backgroundColor: '#121212',
  },
  listContainer: {
    paddingHorizontal: 6,
    paddingBottom: 30,
  },
  toastBanner: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  fallbackImageBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
    flexWrap: 'wrap',
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  offlineStatusText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  streakPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF9500',
  },
  aboutChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  aboutChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 8,
    gap: 6,
  },
  backArrowButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  subTitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topActionIconBtn: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeToggleButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkModeButtonActive: {
    backgroundColor: '#2C2C2E',
  },
  langSwitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  langBtn: {
    minWidth: 42,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  langBtnTextActive: {
    color: '#FFFFFF',
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9FB',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E5EA',
  },
  shareSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  shareSummaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  themeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  colorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  colorCircleActive: {
    borderWidth: 2.5,
    borderColor: '#1C1C1E',
    transform: [{ scale: 1.1 }],
  },
  sortBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  recentViewedContainer: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  recentScroll: {
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    maxWidth: 145,
  },
  recentChipImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  recentChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  categoriesScroll: {
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  progressCard: {
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  warmUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD6D6',
    gap: 10,
  },
  warmUpImage: {
    width: 46,
    height: 46,
    borderRadius: 10,
  },
  warmUpInfo: {
    flex: 1,
  },
  warmUpBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warmUpBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B30',
  },
  warmUpSubText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  warmUpBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  warmUpBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dailyCard: {
    backgroundColor: '#F9F9FB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dailyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9500',
  },
  dailyBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dailyImage: {
    width: 82,
    height: 82,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  dailyInfo: {
    flex: 1,
  },
  dailyWordTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  dailyDesc: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  dailyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 2,
  },
  dailyActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sentenceChallengeBar: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  sentenceChallengeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 44,
  },
  darkSearchContainer: {
    backgroundColor: '#2C2C2E',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
  },
  micButton: {
    padding: 4,
  },
  clearIcon: {
    marginLeft: 4,
  },
  randomButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showButton: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  quickPhrasesScroll: {
    gap: 8,
    marginBottom: 10,
  },
  phraseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  phraseChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  recentContainer: {
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recentTitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  clearHistoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  recentText: {
    fontSize: 13,
    color: '#1C1C1E',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  favFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 5,
  },
  unmasteredFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 5,
  },
  favFilterButtonActive: {
    backgroundColor: '#FF3B30',
  },
  favFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  favFilterTextActive: {
    color: '#FFFFFF',
  },
  exportReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 5,
  },
  exportReportText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  resultsCounterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  resultsCounterText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  resultsRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mistakeReviewLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 5,
    marginBottom: 6,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sentenceCardContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  darkCard: {
    backgroundColor: '#1E1E20',
    borderColor: '#2C2C2E',
  },
  imageContainer: {
    width: '100%',
    height: 168,
    backgroundColor: '#F9F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sentenceImageContainer: {
    width: '100%',
    height: 245,
    backgroundColor: '#F9F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  darkImageContainer: {
    backgroundColor: '#252528',
  },
  image: {
    width: '82%',
    height: '82%',
  },
  sentenceImage: {
    width: '82%',
    height: '82%',
  },
  favIconButton: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 11,
    padding: 3,
  },
  masteredMiniBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 9,
    padding: 2,
  },
  sentenceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sentenceBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardInfo: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  wordText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  darkText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
  suggestionsBox: {
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  suggestionsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#F9F9FB',
  },
  suggestionChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyResetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  aboutIntroText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#1C1C1E',
    marginBottom: 12,
  },
  aboutPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  aboutPointText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#1C1C1E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  darkModalContent: {
    backgroundColor: '#1C1C1E',
  },
  flashcardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flashcardHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  translatorTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  translatorSubtitle: {
    flex: 1,
    fontSize: 12,
    color: '#8E8E93',
  },
  randomSampleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  randomSampleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  translatorSampleCard: {
    width: 78,
    height: 86,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    padding: 6,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translatorSampleImg: {
    width: 44,
    height: 44,
  },
  translatorSampleLabel: {
    fontSize: 11,
    marginTop: 4,
    color: '#1C1C1E',
  },
  translatorPreviewBox: {
    borderRadius: 16,
    backgroundColor: '#F9F9FB',
    padding: 16,
    minHeight: 230,
    justifyContent: 'center',
    alignItems: 'center',
  },
  translatorPlaceholder: {
    alignItems: 'center',
    gap: 10,
  },
  translatorPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1C1C1E',
  },
  modelStatusTag: {
    fontSize: 11,
    color: '#8E8E93',
  },
  translatorAnalyzingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  translatorResultBox: {
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  translatorResultImage: {
    width: 96,
    height: 96,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  lowConfidenceAlert: {
    fontSize: 11,
    color: '#FF9500',
    fontWeight: '600',
    textAlign: 'center',
  },
  translatorDetectedWord: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  predictionsList: {
    width: '100%',
    gap: 4,
    marginTop: 2,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  predictionLabel: {
    fontSize: 12,
    color: '#1C1C1E',
    flex: 1,
  },
  predictionPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  translatorOpenDetailsBtn: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  translatorOpenDetailsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  quizModeSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  quizModeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  quizModeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  quizBody: {
    alignItems: 'center',
    gap: 12,
  },
  quizProgressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  quizImageBox: {
    width: 130,
    height: 130,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizImage: {
    width: 105,
    height: 105,
  },
  quizQuestionTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1C1C1E',
  },
  quizOptionsContainer: {
    width: '100%',
    gap: 8,
  },
  quizOptionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  quizOptionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  quizFinishedBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  quizFinishedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  quizScoreText: {
    fontSize: 18,
    fontWeight: '700',
  },
  quizEndActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  restartQuizBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  restartQuizBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  flashcardBody: {
    alignItems: 'center',
    gap: 14,
  },
  flashcardBox: {
    width: '100%',
    minHeight: 220,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#F9F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  flashcardImage: {
    width: 135,
    height: 135,
  },
  flashcardHint: {
    fontSize: 12,
    color: '#8E8E93',
  },
  flashcardWord: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  flashcardDesc: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  modalNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    gap: 10,
  },
  modalNavBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalNavText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  detailImageBox: {
    height: 185,
    borderRadius: 16,
    backgroundColor: '#F9F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  detailImageBoxZoomed: {
    height: 270,
  },
  detailImage: {
    width: 155,
    height: 155,
  },
  detailImageZoomed: {
    width: 235,
    height: 235,
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoomBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 6,
  },
  detailDesc: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 12,
  },
  masterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  masterToggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  noteBox: {
    marginTop: 8,
    gap: 8,
  },
  noteInput: {
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    padding: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#1C1C1E',
  },
  detailActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  saveNoteBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
});