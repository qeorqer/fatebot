export const inline_keyboard = [
  [
    { text: 'Узнать погоду', callback_data: '/weather' },
  ],
  [
    { text: 'Оформить подписку', callback_data: '/subscribe' },
    { text: 'Отменить подписку', callback_data: '/unsubscribe' }
  ]

]

export const signs_keyboard = [
  [
    { text: '♑ Козерог', callback_data: 'Capricorn' },
    { text: '♉ Телец', callback_data: 'Taurus' },
    { text: '♊ Близнецы', callback_data: 'Gemini' },
  ],
  [
    { text: '♋ Рак', callback_data: 'Cancer' },
    { text: '♌ Лев', callback_data: 'Leo' },
    { text: '♍ Дева', callback_data: 'Virgo' },
  ],
  [
    { text: '♎ Весы', callback_data: 'Libra' },
    { text: '♏ Скорпион', callback_data: 'Scorpio' },
    { text: '♈ Овен', callback_data: 'Aries' },
  ],
  [
    { text: '♐ Стрелец', callback_data: 'Sagittarius' },
    { text: '♒ Водолей', callback_data: 'Aquarius' },
    { text: '♓ Рыбы', callback_data: 'Pisces' },
  ]
]
