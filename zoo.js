class Animal {
    constructor(sound) {
        this.sound = sound
    }

    speak(string) {
        const animalSpeak = string.replace(/ +/g, ` ${this.sound} `) + ' ' + this.sound
        console.log(animalSpeak);
    };
}

class Lion extends Animal {
    constructor(name) {
        super('roar')
        this.name = name
        // other lion stuff
    }
}

class Tiger extends Animal {
    constructor(name) {
        super('grr')
        this.name = name
        // other tiger stuff
    }
}

const lion = new Lion('Mufasa')
lion.speak("I'm a lion")

const tiger = new Tiger('Richard Parker')
tiger.speak("Lions suck")