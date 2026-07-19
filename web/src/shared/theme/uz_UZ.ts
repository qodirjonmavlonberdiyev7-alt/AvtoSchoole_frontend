import type { Locale } from 'antd/es/locale';

const typeTemplate = "${label} to'g'ri ${type} emas";

/**
 * Ant Design rasman o'zbekcha locale bilan kelmaydi (faqat ~70 til bor, uz yo'q),
 * shu sababli AntD komponentlarining ichki matnlari (Table/DatePicker/Modal/Popconfirm
 * va h.k.) uchun qo'lda tarjima qilingan locale.
 */
const datePickerLocale: NonNullable<Locale['DatePicker']> = {
  lang: {
    placeholder: 'Sanani tanlang',
    yearPlaceholder: 'Yilni tanlang',
    quarterPlaceholder: 'Chorakni tanlang',
    monthPlaceholder: 'Oyni tanlang',
    weekPlaceholder: 'Haftani tanlang',
    rangePlaceholder: ['Boshlanish sanasi', 'Tugash sanasi'],
    rangeYearPlaceholder: ['Boshlanish yili', 'Tugash yili'],
    rangeQuarterPlaceholder: ['Boshlanish chorak', 'Tugash chorak'],
    rangeMonthPlaceholder: ['Boshlanish oyi', 'Tugash oyi'],
    rangeWeekPlaceholder: ['Boshlanish haftasi', 'Tugash haftasi'],
    yearFormat: 'YYYY',
    dayFormat: 'D',
    cellMeridiemFormat: 'A',
    monthBeforeYear: true,
    locale: 'uz_UZ',
    today: 'Bugun',
    now: 'Hozir',
    backToToday: "Bugungi kunga qaytish",
    ok: 'OK',
    clear: 'Tozalash',
    week: 'Hafta',
    month: 'Oy',
    year: 'Yil',
    timeSelect: 'vaqtni tanlash',
    dateSelect: 'sanani tanlash',
    weekSelect: 'Haftani tanlang',
    monthSelect: 'Oyni tanlang',
    yearSelect: 'Yilni tanlang',
    decadeSelect: "O'n yillikni tanlang",
    dateFormat: 'YYYY-MM-DD',
    dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
    previousMonth: 'Oldingi oy (PageUp)',
    nextMonth: 'Keyingi oy (PageDown)',
    previousYear: "O'tgan yil (Control + chap)",
    nextYear: 'Keyingi yil (Control + o\'ng)',
    previousDecade: "O'tgan o'n yillik",
    nextDecade: "Keyingi o'n yillik",
    previousCentury: "O'tgan asr",
    nextCentury: 'Keyingi asr',
  },
  timePickerLocale: {
    placeholder: 'Vaqtni tanlang',
    rangePlaceholder: ['Boshlanish vaqti', 'Tugash vaqti'],
  },
};

const uzUZ: Locale = {
  locale: 'uz',
  Pagination: {
    items_per_page: '/ sahifa',
    jump_to: "O'tish",
    jump_to_confirm: 'tasdiqlash',
    page: 'Sahifa',
    prev_page: 'Oldingi sahifa',
    next_page: 'Keyingi sahifa',
    prev_5: 'Oldingi 5 sahifa',
    next_5: 'Keyingi 5 sahifa',
    prev_3: 'Oldingi 3 sahifa',
    next_3: 'Keyingi 3 sahifa',
    page_size: 'Sahifa hajmi',
  },
  DatePicker: datePickerLocale,
  TimePicker: {
    placeholder: 'Vaqtni tanlang',
    rangePlaceholder: ['Boshlanish vaqti', 'Tugash vaqti'],
  },
  /** AntD's own locale bundles alias Calendar straight to DatePicker's locale - mirrored here.
   * A previous version left this as `{ lang: {}, timePickerLocale: {} }`, which crashed
   * rc-picker's internal formatter (`locale.locale.split(...)` on undefined) the moment a
   * TimePicker/RangePicker panel tried to format a selected value under the uz locale. */
  Calendar: datePickerLocale,
  global: {
    placeholder: 'Tanlang',
    close: 'Yopish',
  },
  Table: {
    filterTitle: 'Filtr menyusi',
    filterConfirm: 'OK',
    filterReset: 'Tozalash',
    filterEmptyText: 'Filtrlar yo\'q',
    filterCheckAll: "Barchasini tanlash",
    filterSearchPlaceholder: 'Filtrlarda qidirish',
    emptyText: "Ma'lumot yo'q",
    selectAll: 'Joriy sahifani tanlash',
    selectInvert: 'Joriy sahifani teskari tanlash',
    selectNone: "Barcha ma'lumotni tozalash",
    selectionAll: "Barcha ma'lumotni tanlash",
    sortTitle: 'Saralash',
    expand: 'Qatorni yoyish',
    collapse: 'Qatorni yig\'ish',
    triggerDesc: "Kamayish tartibida saralash uchun bosing",
    triggerAsc: "O'sish tartibida saralash uchun bosing",
    cancelSort: 'Saralashni bekor qilish uchun bosing',
  },
  Tour: {
    Next: 'Keyingi',
    Previous: 'Oldingi',
    Finish: 'Tugatish',
  },
  Modal: {
    okText: 'OK',
    cancelText: 'Bekor qilish',
    justOkText: 'OK',
  },
  Popconfirm: {
    okText: 'OK',
    cancelText: 'Bekor qilish',
  },
  Transfer: {
    titles: ['', ''],
    searchPlaceholder: 'Bu yerdan qidiring',
    itemUnit: 'ta',
    itemsUnit: 'ta',
    remove: "O'chirish",
    selectCurrent: 'Joriy sahifani tanlash',
    removeCurrent: 'Joriy sahifani olib tashlash',
    selectAll: "Barchasini tanlash",
    deselectAll: 'Tanlovni bekor qilish',
    removeAll: 'Barchasini olib tashlash',
    selectInvert: 'Teskari tanlash',
  },
  Upload: {
    uploading: 'Yuklanmoqda...',
    removeFile: 'Faylni olib tashlash',
    uploadError: 'Yuklashda xatolik',
    previewFile: "Faylni ko'rish",
    downloadFile: 'Faylni yuklab olish',
  },
  Empty: {
    description: "Ma'lumot yo'q",
  },
  Text: {
    edit: 'Tahrirlash',
    copy: 'Nusxalash',
    copied: 'Nusxalandi',
    expand: 'Yoyish',
    collapse: "Yig'ish",
  },
  Form: {
    optional: '(ixtiyoriy)',
    defaultValidateMessages: {
      default: "${label} uchun tekshirish xatosi",
      required: "Iltimos, ${label} kiriting",
      enum: '${label} quyidagilardan biri bo\'lishi kerak: [${enum}]',
      whitespace: "${label} bo'sh belgi bo'lishi mumkin emas",
      date: {
        format: "${label} sana formati noto'g'ri",
        parse: "${label} sanaga aylantirib bo'lmadi",
        invalid: "${label} yaroqsiz sana",
      },
      types: {
        string: typeTemplate,
        method: typeTemplate,
        array: typeTemplate,
        object: typeTemplate,
        number: typeTemplate,
        date: typeTemplate,
        boolean: typeTemplate,
        integer: typeTemplate,
        float: typeTemplate,
        regexp: typeTemplate,
        email: typeTemplate,
        url: typeTemplate,
        hex: typeTemplate,
      },
      string: {
        len: '${label} ${len} ta belgidan iborat bo\'lishi kerak',
        min: "${label} kamida ${min} ta belgidan iborat bo'lishi kerak",
        max: "${label} ko'pi bilan ${max} ta belgidan iborat bo'lishi kerak",
        range: '${label} ${min}-${max} ta belgi oralig\'ida bo\'lishi kerak',
      },
      number: {
        len: "${label} ${len} ga teng bo'lishi kerak",
        min: "${label} kamida ${min} bo'lishi kerak",
        max: "${label} ko'pi bilan ${max} bo'lishi kerak",
        range: '${label} ${min}-${max} oralig\'ida bo\'lishi kerak',
      },
      array: {
        len: '${label} soni ${len} ta bo\'lishi kerak',
        min: "Kamida ${min} ta ${label}",
        max: "Ko'pi bilan ${max} ta ${label}",
        range: '${label} soni ${min}-${max} oralig\'ida bo\'lishi kerak',
      },
      pattern: {
        mismatch: "${label} ${pattern} shabloniga mos kelmadi",
      },
    },
  },
  Image: {
    preview: "Ko'rish",
  },
  QRCode: {
    expired: 'QR-kod muddati tugagan',
    refresh: 'Yangilash',
    scanned: 'Skanerlandi',
  },
  ColorPicker: {
    presetEmpty: "Bo'sh",
    transparent: 'Shaffof',
    singleColor: 'Yagona',
    gradientColor: 'Gradient',
  },
};

export default uzUZ;
