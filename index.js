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

const APP_ID = undefined; // TODO replace with your app ID (OPTIONAL).

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
    , 'GetEvents': function (intent, session, response) {
        //Find out which week we are talking about
        var dateSlot = intent.slots.Date;
        var date = moment();
        if (!dateSlot || !dateSlot.value) {
            //Error: no date set in intent: automatically falling back to current week
        } else {
            date = moment(dateSlot.value);
            //Use week from intent
        }
        var week = date.isoWeek();
        var year = date.year().substring(2);
        
        
        //Get Web Page Meta Data (OpenGraph) from reflect

        var url = 'http://www.reflect.de/wochenendberater-kw' + week + year + '/';
        scrape(url, function (error, metadata) {
            var description = metadata.openGraph.description;
            var title = metadata.openGraph.title;
            var speechOutput = title + description;
            //Output with card, Card will be shown in Alexa App
            this.emit(':tellWithCard', speechOutput, title, description);
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
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
