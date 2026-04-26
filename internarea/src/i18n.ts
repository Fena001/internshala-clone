import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: { 
    translation: { 
      // Navbar & Generic
      Internships: 'Internships', Jobs: 'Jobs', Search: 'Search opportunities...', Logout: 'Logout', ContinueGoogle: 'Continue with Google', Admin: 'Admin',
      ViewDetails: "View details", ActivelyHiring: "Actively Hiring", Filters: "Filters", ClearAll: "Clear all", Category: "Category", Location: "Location", ShowFilters: "Show Filters",
      
      // Home Page
      HeroTitle: "Make your dream career a reality", HeroSub: "Trending on InternArea 🔥",
      Slide1: "Start Your Career Journey", Slide2: "Learn From The Best", Slide3: "Grow Your Skills", Slide4: "Connect With Top Companies",
      LatestInternships: "Latest internships on Intern Area", PopularCat: "POPULAR CATEGORIES:", LatestJobs: "Latest Jobs",
      CatBigBrands: "Big Brands", CatWFH: "Work From Home", CatPartTime: "Part-time", CatMBA: "MBA", CatEngineering: "Engineering", CatMedia: "Media", CatDesign: "Design", CatDataScience: "Data Science",
      
      // Listings Pages
      EGMarketing: "e.g. Marketing Intern", EGMumbai: "e.g. Mumbai", WFH: "Work from home", PartTime: "Part-time", 
      MonthlyStipend: "Monthly Stipend (₹)", AnnualSalary: "Annual Salary (₹ in lakhs)", Experience: "Experience", 
      InternshipsFound: "Internships found", JobsFound: "Jobs found", StartDate: "Start Date", Stipend: "Stipend", CTC: "CTC", PostedRecently: "Posted recently",
      ActiveApplications: "Active Applications", AcceptedApplications: "Accepted Applications", ViewApplications: "View Applications"
    } 
  },
  fr: { 
    translation: { 
      Internships: 'Stages', Jobs: 'Emplois', Search: 'Rechercher des opportunités...', Logout: 'Déconnexion', ContinueGoogle: 'Continuer avec Google', Admin: 'Administrateur',
      ViewDetails: "Voir les détails", ActivelyHiring: "Recrutement Actif", Filters: "Filtres", ClearAll: "Tout effacer", Category: "Catégorie", Location: "Emplacement", ShowFilters: "Afficher les filtres",
      
      HeroTitle: "Faites de votre carrière de rêve une réalité", HeroSub: "Tendance sur InternArea 🔥",
      Slide1: "Commencez votre carrière", Slide2: "Apprenez des meilleurs", Slide3: "Développez vos compétences", Slide4: "Connectez-vous aux meilleures entreprises",
      LatestInternships: "Derniers stages sur Intern Area", PopularCat: "CATÉGORIES POPULARES:", LatestJobs: "Derniers Emplois",
      CatBigBrands: "Grandes Marques", CatWFH: "Télétravail", CatPartTime: "Temps Partiel", CatMBA: "MBA", CatEngineering: "Ingénierie", CatMedia: "Médias", CatDesign: "Design", CatDataScience: "Science des Données",
      
      EGMarketing: "ex. Stagiaire Marketing", EGMumbai: "ex. Mumbai", WFH: "Télétravail", PartTime: "Temps Partiel", 
      MonthlyStipend: "Indemnité Mensuelle (₹)", AnnualSalary: "Salaire Annuel (₹ en lakhs)", Experience: "Expérience", 
      InternshipsFound: "stages trouvés", JobsFound: "emplois trouvés", StartDate: "Date de début", Stipend: "Indemnité", CTC: "Salaire", PostedRecently: "Publié récemment",
      ActiveApplications: "Candidatures actives", AcceptedApplications: "Candidatures acceptées", ViewApplications: "Voir les candidatures"
    } 
  },
  es: { 
    translation: { 
      Internships: 'Pasantías', Jobs: 'Trabajos', Search: 'Buscar oportunidades...', Logout: 'Cerrar sesión', ContinueGoogle: 'Continuar con Google', Admin: 'Administración',
      ViewDetails: "Ver detalles", ActivelyHiring: "Contratación Activa", Filters: "Filtros", ClearAll: "Borrar todo", Category: "Categoría", Location: "Ubicación", ShowFilters: "Mostrar filtros",
      
      HeroTitle: "Haz realidad la carrera de tus sueños", HeroSub: "Tendencia en InternArea 🔥",
      Slide1: "Comienza tu carrera", Slide2: "Aprende de los mejores", Slide3: "Desarrolla tus habilidades", Slide4: "Conéctate con las mejores empresas",
      LatestInternships: "Últimas pasantías en Intern Area", PopularCat: "CATEGORÍAS POPULARES:", LatestJobs: "Últimos Trabajos",
      CatBigBrands: "Grandes Marcas", CatWFH: "Trabajo Remoto", CatPartTime: "Medio Tiempo", CatMBA: "MBA", CatEngineering: "Ingeniería", CatMedia: "Medios", CatDesign: "Diseño", CatDataScience: "Ciencia de Datos",
      
      EGMarketing: "ej. Pasante de Marketing", EGMumbai: "ej. Bombay", WFH: "Trabajo desde casa", PartTime: "Medio Tiempo", 
      MonthlyStipend: "Estipendio Mensual (₹)", AnnualSalary: "Salario Anual (₹ en lakhs)", Experience: "Experiencia", 
      InternshipsFound: "pasantías encontradas", JobsFound: "trabajos encontrados", StartDate: "Fecha de inicio", Stipend: "Estipendio", CTC: "Salario", PostedRecently: "Publicado recientemente",
      ActiveApplications: "Solicitudes Activas", AcceptedApplications: "Solicitudes Aceptadas", ViewApplications: "Ver Solicitudes"
    } 
  },
  hi: { 
    translation: { 
      Internships: 'इंटर्नशिप', Jobs: 'नौकरियां', Search: 'अवसर खोजें...', Logout: 'लॉग आउट', ContinueGoogle: 'Google के साथ जारी रखें', Admin: 'व्यवस्थापक',
      ViewDetails: "विवरण देखें", ActivelyHiring: "सक्रिय भर्ती", Filters: "फ़िल्टर", ClearAll: "सभी साफ़ करें", Category: "श्रेणी", Location: "स्थान", ShowFilters: "फ़िल्टर दिखाएं",
      
      HeroTitle: "अपने सपनों का करियर हकीकत बनाएं", HeroSub: "InternArea पर ट्रेंडिंग 🔥",
      Slide1: "अपनी करियर यात्रा शुरू करें", Slide2: "सर्वश्रेष्ठ से सीखें", Slide3: "अपने कौशल को बढ़ाएं", Slide4: "शीर्ष कंपनियों से जुड़ें",
      LatestInternships: "Intern Area पर नवीनतम इंटर्नशिप", PopularCat: "लोकप्रिय श्रेणियां:", LatestJobs: "नवीनतम नौकरियां",
      CatBigBrands: "बड़े ब्रांड", CatWFH: "घर से काम", CatPartTime: "अंशकालिक", CatMBA: "एमबीए", CatEngineering: "इंजीनियरिंग", CatMedia: "मीडिया", CatDesign: "डिज़ाइन", CatDataScience: "डेटा साइंस",
      
      EGMarketing: "उदा. मार्केटिंग इंटर्न", EGMumbai: "उदा. मुंबई", WFH: "घर से काम", PartTime: "अंशकालिक", 
      MonthlyStipend: "मासिक वजीफा (₹)", AnnualSalary: "वार्षिक वेतन (लाख ₹ में)", Experience: "अनुभव", 
      InternshipsFound: "इंटर्नशिप मिली", JobsFound: "नौकरियां मिलीं", StartDate: "आरंभ तिथि", Stipend: "वजीफा", CTC: "सीटीसी", PostedRecently: "हाल ही में पोस्ट किया गया",
      ActiveApplications: "सक्रिय आवेदन", AcceptedApplications: "स्वीकृत आवेदन", ViewApplications: "आवेदन देखें"
    } 
  },
  pt: { 
    translation: { 
      Internships: 'Estágios', Jobs: 'Empregos', Search: 'Buscar oportunidades...', Logout: 'Sair', ContinueGoogle: 'Continuar com o Google', Admin: 'Administrador',
      ViewDetails: "Ver detalhes", ActivelyHiring: "Contratação Ativa", Filters: "Filtros", ClearAll: "Limpar tudo", Category: "Categoria", Location: "Localização", ShowFilters: "Mostrar filtros",
      
      HeroTitle: "Torne sua carreira dos sonhos uma realidade", HeroSub: "Em alta no InternArea 🔥",
      Slide1: "Comece sua jornada", Slide2: "Aprenda com os melhores", Slide3: "Desenvolva suas habilidades", Slide4: "Conecte-se com as melhores empresas",
      LatestInternships: "Últimos estágios no Intern Area", PopularCat: "CATEGORIAS POPULARES:", LatestJobs: "Últimos Empregos",
      CatBigBrands: "Grandes Marcas", CatWFH: "Trabalho Remoto", CatPartTime: "Meio Período", CatMBA: "MBA", CatEngineering: "Engenharia", CatMedia: "Mídia", CatDesign: "Design", CatDataScience: "Ciência de Dados",
      
      EGMarketing: "ex. Estagiário de Marketing", EGMumbai: "ex. Bombaim", WFH: "Trabalho remoto", PartTime: "Meio período", 
      MonthlyStipend: "Bolsa Mensal (₹)", AnnualSalary: "Salário Anual (₹ em lakhs)", Experience: "Experiência", 
      InternshipsFound: "estágios encontrados", JobsFound: "empregos encontrados", StartDate: "Data de início", Stipend: "Bolsa", CTC: "Salário", PostedRecently: "Postado recentemente",
      ActiveApplications: "Candidaturas Ativas", AcceptedApplications: "Candidaturas Aceites", ViewApplications: "Ver Candidaturas"
    } 
  },
  zh: { 
    translation: { 
      Internships: '实习', Jobs: '工作', Search: '搜索机会...', Logout: '登出', ContinueGoogle: '使用 Google 继续', Admin: '管理员',
      ViewDetails: "查看详情", ActivelyHiring: "积极招聘", Filters: "筛选", ClearAll: "全部清除", Category: "类别", Location: "位置", ShowFilters: "显示筛选",
      
      HeroTitle: "让你的梦想职业成为现实", HeroSub: "InternArea 上的热门 🔥",
      Slide1: "开始你的职业旅程", Slide2: "向最优秀的人学习", Slide3: "发展你的技能", Slide4: "与顶级公司建立联系",
      LatestInternships: "Intern Area 的最新实习", PopularCat: "热门类别:", LatestJobs: "最新工作",
      CatBigBrands: "大品牌", CatWFH: "在家工作", CatPartTime: "兼职", CatMBA: "MBA", CatEngineering: "工程", CatMedia: "媒体", CatDesign: "设计", CatDataScience: "数据科学",
      
      EGMarketing: "例如：市场实习生", EGMumbai: "例如：孟买", WFH: "在家工作", PartTime: "兼职", 
      MonthlyStipend: "每月津贴 (₹)", AnnualSalary: "年薪 (以万卢比为单位)", Experience: "经验", 
      InternshipsFound: "找到的实习", JobsFound: "找到的工作", StartDate: "开始日期", Stipend: "津贴", CTC: "薪资", PostedRecently: "最近发布",
      ActiveApplications: "活动中的申请", AcceptedApplications: "已接受的申请", ViewApplications: "查看申请"
    } 
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
