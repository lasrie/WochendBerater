/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This Skill gets the current events in Stuttgart from the OpenGraph MetaData  & additional parsing of the reflect Stuttgart Website.
 * @author: Lasse Riess
 **/

'use strict';

const Alexa = require('alexa-sdk');
const moment = require('moment');
var scrape = require('html-metadata');
var request = require('request');
var rp = require('request-promise');
var cheerio = require('cheerio');
var Promise = require('promise');

const APP_ID = 'amzn1.ask.skill.60239a25-4cc8-4623-b4a4-4a330b158a0c';

const languageStrings = {

    'de-DE': {
        translation: {
            SKILL_NAME: 'Wochenendberater Stuttgart'
            , HELP_MESSAGE: 'Du kannst sagen, „Was geht diese Woche?“, oder du kannst „Beenden“ sagen... Wie kann ich dir helfen?'
            , HELP_REPROMPT: 'Wie kann ich dir helfen?'
            , STOP_MESSAGE: 'Viel Erfolg beim Feiern!'
        , }
    , }
};

const handlers = {
    'LaunchRequest': function () {
        this.emit('GetEvents');
    }
    , 'WochenendBeraterIntent': function (intent, session, response) {
        this.emit('GetEvents', intent, session, response);
    }
    , 'Unhandled': function (intent, session, response) {
        this.emit('GetEvents', intent, session, response);
    }
    , 'GetEvents': function (intent, session, response) {
        //Find out which week we are talking about
        var date = moment();
        if (intent) {
            var dateSlot = intent.slots.Date;
            if (!dateSlot || !dateSlot.value) {
                //Error: no date set in intent: automatically falling back to current week
            } else {
                date = moment(dateSlot.value);
                //Use week from intent
            }
        }

        //Get Web Page Meta Data (OpenGraph) from reflect

        var url = 'http://www.reflect.de/wochenendberater-kw' + date.format("WW") + date.format("YY") + '/';
        var self = this;

        scrape(url).then(function (metadata) {
                var description = metadata.openGraph.description;
                var title = metadata.openGraph.title;
                var speechOutput;

                //Now get the actual event data
                parseSite(url).then(function (result) {
                    console.log(result);
                    if (result) {
                        speechOutput = '';
                        speechOutput = '<p> Donnerstag:';
                        result[0].events.forEach(function (entry) {
                            if (entry.text) {
                                speechOutput = speechOutput + '<s>' + entry.text + '</s>';
                            }
                        });
                        speechOutput = speechOutput + '</p><p>' + 'Freitag:';
                        result[1].events.forEach(function (entry) {
                            if (entry.text) {
                                speechOutput = speechOutput + '<s>' + entry.text + '</s>';
                            }
                        });

                        speechOutput = speechOutput + '</p><p>' + 'Samstag:';
                        result[2].events.forEach(function (entry) {
                            if (entry.text) {
                                speechOutput = speechOutput + '<s>' + entry.text + '</s>';
                            }
                        });

                        speechOutput = speechOutput + '</p><p>' + 'Sonntag:';
                        result[3].events.forEach(function (entry) {
                            if (entry.text) {
                                speechOutput = speechOutput + '<s>' + entry.text + '</s>';
                            }
                        });
                        speechOutput = speechOutput + '</p>';
                    }

                    //Output with card, Card will be shown in Alexa App
                    self.emit(':tellWithCard', speechOutput, title, description);


                });

            }
            , function (error) {
                //Oh, something went wrong, lets have a look at the url!
                console.log(url);
            });
    }
    , 'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    }
    , 'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    }
    , 'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    }
    , 'SessionEndedRequest': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    }
, };

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = 'amzn1.ask.skill.60239a25-4cc8-4623-b4a4-4a330b158a0c';
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function parseSite(url) {
    return new Promise(function (fulfill, reject) {

        rp(url).then(function (body) {
            var result = [{
                events: []
                , day: 'Donnerstag'
    }, {
                events: []
                , day: 'Freitag'
    }, {
                events: []
                , day: 'Samstag'
    }, {
                events: []
                , day: 'Sonntag'
    }];
            var $ = cheerio.load(body);
            var article = $('div .post-entry');
            //article = article('div .post-entry');
            //Selecting the container of the article content

            var currDay, arrInd, childlink;
            article.children().each(function (index, element) {
                //Traversing over the children and putting them into an object
                element = $(element);

                if (element.text() == 'Donnerstag') {
                    currDay = 'Donnerstag';
                    arrInd = 0;
                } else if (element.text() == 'Freitag') {
                    currDay = 'Freitag';
                    arrInd = 1;
                } else if (element.text() == 'Samstag') {
                    currDay = 'Samstag';
                    arrInd = 2;
                } else if (element.text() == 'Sonntag') {
                    currDay = 'Sonntag';
                    arrInd = 3;
                }
                if (currDay) {
                    childlink = element.children('a');
                    if (childlink) {
                        result[arrInd].events.push({
                            text: $(childlink).text()
                        });
                    }
                }
            });

            //Parsing is done
            fulfill(result);
        }, function (err) {
            reject(err);
            console.log('Error while connecting:');
            console.log(err);
        });
    });
}