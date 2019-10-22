/*
 *  Copyright (c) 2019 LambdAurora <aurora42lambda@gmail.com>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const Twit = require('twit');
const minimist = require('minimist');
const fs = require('fs');
const french_dictionary = require('an-array-of-french-words');
const config = require('./config.json');

function main() {
  const argv = minimist(process.argv.slice(2));
  let consumer_key = config.consumer_key;
  if (consumer_key === '$TWITTER_CONSUMER_KEY')
    consumer_key = argv.consumer_key;
  let consumer_key_secret = config.consumer_key_secret;
  if (consumer_key_secret === '$TWITTER_CONSUMER_KEY_SECRET')
    consumer_key_secret = argv.consumer_key_secret;
  let access_token = config.access_token;
  if (access_token === '$TWITTER_ACCESS_TOKEN')
    access_token = argv.access_token;
  let access_token_secret = config.access_token_secret;
  if (access_token_secret === '$TWITTER_ACCESS_TOKEN_SECRET')
    access_token_secret = argv.access_token_secret;

  const T = new Twit({
    consumer_key: consumer_key,
    consumer_secret: consumer_key_secret,
    access_token: access_token,
    access_token_secret: access_token_secret
  });

  function on_auth(err, res) {
    if (err)
      throw err;

    console.log('Authentication successful. Now running the bot...');

    if (!fs.existsSync('./run'))
      fs.mkdirSync('./run', {recursive: true});

    let bot = {
      current_word: 1
    };

    if (!fs.existsSync('./run/bot.json'))
      fs.writeFileSync('./run/bot.json', JSON.stringify(bot));

    fs.readFile('./run/bot.json', 'utf-8', (err, content) => {
      if (err) {
        throw err
      }

      try {
        bot = JSON.parse(content);
      } catch (err) {
        console.error(err);
      }

      setInterval(() => {
        let date = new Date();
        if (date.getMinutes() === 0) {
          // pick a word and tweet it.
          if (bot.current_word === french_dictionary.length)
            return;
          let status = build_status(french_dictionary[bot.current_word]);
          while (status == null) {
            bot.current_word++;
            status = build_status(french_dictionary[bot.current_word]);
          }
          T.post('statuses/update', {
            status: status
          }, on_tweeted);
          bot.current_word++;
          save_bot_data(bot);
        }
      }, 60000);
    });
  }

  T.get('account/verify_credentials', {
    include_entities: false,
    include_email: false,
    skip_status: true
  }, on_auth);
}

function build_status(word) {
  if (word.match(/(homophobe.?)|(transphobe.?)|(raciste.?)/g)) {
    if (word.endsWith('s'))
      return `Hey les ${word}, retournez dans votre grotte!`;
    return `Être ${word} c'est un peu de la merde.`;
  } else if (word.match(/(racisme.?)/g))
    return `Le ${word} c'est pas ouf, soyez ouverts d'esprit!`;
  else if (word.match(/(transsexu.*)/g)) {
    if (word.endsWith('ualité'))
      return 'Ne rejetez pas la transidentité!';
    else if (word.match(/(transsexuel(le)?s)/g))
      return word.match(/(lle)/g) ? 'TRANS RIGHTS!' : 'Toutes les personnes trans sont valides!';
    else if (word.match(/(transsexuel(le)?)/g))
      return word.match(/(lle)/g) ? 'Transgenre salée.' : 'Transgenre salé';
  } else if (word.match(/(homosexu.*)|(bisexu.*)/g)) {
    if (word.match(/(.*sexualité.?)/g)) {
      if (word.endsWith('s')) return null;
      else if (word.startsWith('h')) return `Ne rejetez pas l'${word}!`;
      else return `Ne rejetez pas la ${word}!`
    } else if (word.endsWith('el'))
      return `${word} salé.`;
    else if (word.endsWith('elle'))
      return `${word} salée.`;
    else
      return `Respectez les ${word}!`;
  } else if (word.match(/(hétérosexu.*)/g)) {
    if (word.endsWith('els') || word.endsWith('elles'))
      return `Plop les ${word}, souvenez vous juste de pas harcelez les personnes ayant une orientation sexuelle différente de la votre!`;
    else if (word.endsWith('lle'))
      return `${word} salée.`;
    else
      return `${word} salé.`
  } else
    return `${word} salé.`
}

function save_bot_data(data) {
  fs.writeFile('./run/bot.json', JSON.stringify(data), err => {
    if (err)
      console.log(err);
  });
}

function on_follow(event) {
  console.log(`New follower: ${event.source.name} (@${event.source.screen_name}).`)
}

function on_tweeted(err, reply) {
  if (err !== undefined) {
    console.error(`Error: ${err}`);
    return;
  }
  console.log(`Tweeted: ${reply.text}`)
}

function on_error(err) {
  console.error("An error happened!");
  throw err
}

main();
