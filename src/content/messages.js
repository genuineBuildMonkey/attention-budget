const pickRandom = require('pick-random')

export default {

    messageList: [
        'why did you install this extension?',
        'what are you trying to achieve?',
        'is this the best use of your time?',
        'what makes you truly happy?',
        'why are you here?',
        'is there a better way to relax?',
        'maybe go for a walk?',
        'do you really want to read this?',
        'what are your long term goals?',
        'is this device your servant or the reverse?',
        'will future you regret what current you is doing?',
        'what is really important for you?',
        'is there anything here you actually want to see?',
        'life is short, is this how you spend it?',
        'read a book?',
        'go out in nature?',
        'look for something new and stimulating?',
        'does this matter to you... really?',
        'where do you see yourself in a year?',
        'will this help you get what you want from life?',
        'are you sleepwalking now?',
        'get some real rest instead?',
        'is there something better to look at?'
    ],

    randomMessage: () => {
        return pickRandom(this.a.messageList)
    }
}
