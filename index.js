import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import schedule from 'node-schedule';
import { fetcher } from './utils.js';
import { inline_keyboard, signs_keyboard } from './keyboards.js';

dotenv.config();

const port = process.env.PORT || 3333;
const bot = new TelegramBot(process.env.TOKEN, {
  webHook: {
    port: process.env.PORT
  }
});

bot.setWebHook(`${process.env.URL}/bot${process.env.TOKEN}`)

let city;
let hours;
let minutes;
let sign;

const handleStart = (chatId) => {
  bot.sendMessage(chatId, `Доброй ночи(у меня сейчас ночь, что там у тебя я без понятия, но в целом мне и все равно, я же бот).
Моя миссия в том, чтобы дать тебе информацию о погоде и даже немного больше.
А теперь выбирай🤠`, { reply_markup: { inline_keyboard } });
}

const handleWeather = async (chatId) => {
  const msgInfo = await bot.sendMessage(chatId, 'Напиши город, в котором нужно узнать погоду',
    {
      reply_markup: {
        force_reply: true
      }
    })

  bot.onReplyToMessage(msgInfo.chat.id, msgInfo.message_id, async (msg) => {
    const weatherInfo = await fetcher(`https://api.openweathermap.org/data/2.5/weather?q=${msg.text}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=ru`);

    if (weatherInfo.cod === '404') {
      return bot.sendMessage(chatId, 'Я хз что это за город');
    }

    const response =
      `И так, ${weatherInfo.name}:
Температура сейчас — ${Math.round(weatherInfo.main.temp)}° (ощущается как ${Math.round(weatherInfo.main.feels_like)}°)
Минимальная — ${Math.round(weatherInfo.main.temp_min)}°, максимальная — ${Math.round(weatherInfo.main.temp_max)}°
В общем и целом сегодня ${weatherInfo.weather[0].description}`
    bot.sendMessage(chatId, response)
  })
}

const handleSubscribe = async (chatId) => {
  const msgCityInfo = await bot.sendMessage(chatId, 'И так, погнали впишем тебя. Напиши город, в котором тебе нужно регулярно получать погоду',
    {
      reply_markup: {
        force_reply: true
      }
    })

  bot.onReplyToMessage(msgCityInfo.chat.id, msgCityInfo.message_id, async (msg) => {
    const weatherInfo = await fetcher(`https://api.openweathermap.org/data/2.5/weather?q=${msg.text}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=ru`);

    if (weatherInfo.cod === '404') {
      return bot.sendMessage(chatId, 'Я хз что это за город. В следующий раз не выпендривайся и вводи нормальные значения.');
    }

    city = msg.text;

    const weatherTimeInfo = await bot.sendMessage(chatId, 'Принято, едем дальше. Сейчас введи время, в которое хочешь регулярно получать уведомления(в формате HH:mm)', {
      reply_markup: {
        force_reply: true
      }
    })

    bot.onReplyToMessage(weatherTimeInfo.chat.id, weatherTimeInfo.message_id, async (msg) => {
      const time = msg.text.split(':');
      const isHoursIncorrect = !time[0] || time[0].length > 2 || time[0] >= 24 || time[0] < 0;
      const isMinutesIncorrect = !time[1] || time[1].length > 2 || time[1] >= 60 || time[1] < 0;

      if (isHoursIncorrect || isMinutesIncorrect) {
        return bot.sendMessage(chatId, 'Ну просил же нормально ввести, давай заново теперь.');
      }

      hours = time[0];
      minutes = time[1];

      await bot.sendMessage(chatId, 'А теперь приятный непрошенный бонус, в обличии судьбы на каждый день. Тыкай свой знак зодиака.\nОтказаться, кстати, нельзя.', {
        reply_markup: {
          inline_keyboard: signs_keyboard
        }
      })
    })
  })
}

const handleUnsubscribe = (chatId) => {
  const subscription = schedule.scheduledJobs[`subscription-${chatId}`];
  if (subscription) {
    subscription.cancel();
    bot.sendMessage(chatId, 'Подписка отменена');
  } else {
    bot.sendMessage(chatId, 'И так не подписан');
  }
}

const startSubscription = (chatId, city, hours, minutes, sign) => {
  console.log(chatId, city, hours, minutes, sign, 'chatId, city, hours, minutes, sign')
  if (!city || !hours || !minutes || !sign) {
    return bot.sendMessage(chatId, 'Введи все и по порядку потому что так работать я не хочу и не буду', { reply_markup: { inline_keyboard } })
  }

  schedule.scheduleJob(`subscription-${chatId}`, `${minutes} ${hours} * * *`, async () => {
    const weatherInfo = await fetcher(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=ru`);

    if (weatherInfo.cod === '404') {
      return bot.sendMessage(chatId, 'без поянтия, как ты меня поломал, но я все таки без понятия, что это за дыра.');
    }

    const prediction = await fetcher(`https://aztro.sameerkumar.website/?sign=${sign}&day=today`, {
      method: 'POST'
    });

    const response =
      `И так чекнем ${weatherInfo.name} а потом и твою судьбу на сегодня:
Температура сейчас — ${Math.round(weatherInfo.main.temp)}° (ощущается как ${Math.round(weatherInfo.main.feels_like)}°)
Минимальная — ${Math.round(weatherInfo.main.temp_min)}°, максимальная — ${Math.round(weatherInfo.main.temp_max)}°
В общем и целом сегодня ${weatherInfo.weather[0].description}

А еще, вот тебе твой ежедневный урок английского: ${prediction.description}`

    bot.sendMessage(chatId, response)
  })
  bot.sendMessage(chatId, 'Отлично, теперь ты мой пипищик');
}

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  console.log(schedule.scheduledJobs[`subscription-${chatId}`], 'subscription')

  switch (text) {
    case '/start':
      return handleStart(chatId);
    case '/weather':
      return handleWeather(chatId);
    case '/subscribe':
      return handleSubscribe(chatId);
    case '/unsubscribe':
      return handleUnsubscribe(chatId);
  }

  if (Boolean(!msg.reply_to_message && (msg.entities && msg.entities[0].type !== 'bot_command'))) {
    bot.sendMessage(chatId, 'Да ну ты серьезно? Нажми на кнопку, получишь результат. По другому не работаем', { reply_markup: { inline_keyboard } })
  }
})

bot.on('callback_query', msg => {
  const data = msg.data;
  const chatId = msg.message.chat.id;

  switch (data) {
    case '/weather':
      return handleWeather(chatId);
    case '/subscribe':
      return handleSubscribe(chatId);
    case '/unsubscribe':
      return handleUnsubscribe(chatId);
    default:
      sign = data;
      return startSubscription(chatId, city, hours, minutes, sign)
  }
})
