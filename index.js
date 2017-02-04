/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This Skill gets the current events in Stuttgart from the OpenGraph MetaData of the reflect Stuttgart Website.
 * @author: Lasse Riess
 **/

'use strict';

const Alexa = require('alexa-sdk');
const moment = require('moment');
var scrape = require('html-metadata');

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
        if(intent){
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
            var speechOutput = title + description;
            //Output with card, Card will be shown in Alexa App
            self.emit(':tellWithCard', speechOutput, title, description);
        }, function(error){
            console.log(url);
        }
                        );
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