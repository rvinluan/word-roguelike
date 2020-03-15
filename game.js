/* utils */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function loadDictionary() {
  function reqListener () {
    // console.log(this.responseText);
    window.dictionary = this.responseText.split("\n");
  }

  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener);
  oReq.open("GET", "wordlist.txt");
  oReq.send();
}

function checkDictionary(word) {
  return window.dictionary.includes(word.toLowerCase());
}

/* helpers */
function randomVowel() {
  let all = 'aeiou'.split('');
  return all[ Math.floor(Math.random() * all.length) ]
}
function randomVowelWithY() {
  let all = 'aeiouy'.split('');
  return all[ Math.floor(Math.random() * all.length) ]
}
function randomConsonant() {
  let all = 'bcdfghjklmnprstvwy'.split('');
  return all[ Math.floor(Math.random() * all.length) ]
}
function randomCommonConsonant() {
  let all = 'nrtlsdgbcmp'.split('');
  return all[ Math.floor(Math.random() * all.length) ]
}
function randomDouble() {
  let all = 'th,er,ie,st,on'.split(',');
  return all[ Math.floor(Math.random() * all.length) ]
}

/* store */
let State = {
  board: {
    tiles: [],
    characters: []
  }
}

function initializeGame() {
    var tilesArray = [], charsArray = [];
    for(let i = 0; i < 36; i++) {
      tilesArray.push({
        type: "default",
        id: i
      })
      if(i < 10) {
        let randomLetter = i % 2 == 0 ? randomConsonant() : randomVowel();
        if(i >= 8 && Math.random() > 0.5) {
          randomLetter = randomDouble();
          // if(Math.random() > 0.5) {
          //   randomLetter = randomConsonant();
          // } else {
          //   randomLetter = randomVowel();
          // }
        }
        charsArray.push({
          id: i,
          letters: randomLetter,
          color: 0
        })
      } else {
        charsArray.push(null)
      }
    }
    charsArray = shuffle(charsArray);
    let i = 3;
    while(i > 0) {
      let r = Math.floor(Math.random() * 36);
      if(charsArray[r] == null && tilesArray[r].type == "default") {
        tilesArray[r].type = "blocked";
        i--;
      }
    }
    State.board.tiles = tilesArray;
    State.board.characters = charsArray;
}

/* components */
let Char = {
  props: ['ltrs'],
  data: function(){
    return {}
  },
  template: '<p class="char"><slot></slot></p>'
};

let Tile = {
  data: function(){
    return {
      innerGlyph: {}
    }
  },
  components: {
    'char': Char
  },
  template: '<div class="tile"> <slot></slot> </div>'
};


let Board = {
  data: function(){
    return {
      state: State.board
    }
  },
  created: function() {
  },
  methods: {
    handleDragStart: function(e) {
      let char;
      if(e.target.closest) {
        // console.log(e.target);
        char = e.target.closest('.char')
      } else {
        // console.log("couldn't get closest, here was the target:");
        // console.log(e.target);
        // debugger;
        char = e.target.parentElement;
      }
      let id = char.getAttribute('id').replace('char','');
      e.dataTransfer.setData('text/plain', id);
      // console.log(e);
    },
    handleDragEnter: function(e) {
      e.target.classList.add("over")
    },
    handleDragLeave: function(e) {
      e.target.classList.remove("over")
    },
    handleDrop: function(e) {
      let tile;
      if(e.target.closest) {
        tile = e.target.closest(".tile");
      } else {
        debugger;
      }
      tile.classList.remove("over")
      const dropID = tile.getAttribute("id").replace('tile','');
      //check for validity
      if(tile.childElementCount > 0
      || tile.classList.contains("blocked")) {
        console.log("occupied");
        e.preventDefault();
        return;
      }
      const originalID = e.dataTransfer.getData('text');
      const tempChar = State.board.characters[originalID];
      State.board.characters.splice(dropID, 1, tempChar);
      State.board.characters.splice(originalID, 1, null);
      // console.log(State.board.characters);
      // console.log(this.State.characters);
    }
  },
  computed: {
  },
  components: {
    'tile': Tile,
    'char': Char
  },
  template: `
    <div>
      <tile
      v-bind:class="[state.tiles[index].type]"
      v-for="(t, index) in state.tiles"
      :key="index"
      :id="'tile'+index"
      @dragover.prevent.native
      @dragenter.prevent.native="handleDragEnter"
      @dragleave.native="handleDragLeave"
      @drop.native="handleDrop"
      >
        <char
        v-if="state.characters[index]"
        :id="'char' + index"
        draggable
        @dragstart.stop.native="handleDragStart"
        >{{state.characters[index].letters}}</char>
      </tile>
    </div>`
};

var vm = new Vue({
  el: "#game",
  data: {
    health: 100,
    mana: 25
  },
  created: function (){
    window.addEventListener('keydown', this.keypress);
    loadDictionary();
    initializeGame();
  },
  beforeDestroy: function () {
    window.removeEventListener('keydown', this.keypress);
  },
  methods: {
    keypress: function (e) {
      switch(e.keyCode) {
        case 90:
          this.spawnVowel();
        break;
        case 88:
          this.spawnConsonant();
        break;
      }
    },
    spawnVowel: function () {
      for(let i = 0; i < State.board.characters.length; i++) {
        if(State.board.characters[i] == null && State.board.tiles[i].type == "default") {
          State.board.characters.splice(i,1, {
            id: i,
            letters: randomVowel(),
            color: 0
          });
          return;
        }
      }
      console.log("no empty spaces");
    },
    spawnConsonant: function () {
      for(let i = 0; i < State.board.characters.length; i++) {
        if(State.board.characters[i] == null && State.board.tiles[i].type == "default") {
          State.board.characters.splice(i,1, {
            id: i,
            letters: randomCommonConsonant(),
            color: 0
          });
          return;
        }
      }
    },
    //the following methods assume a 6x6 grid
    checkEmptyLeft: function(array, index) {
      return (index % 6 == 0 || !array[index-1])
    },
    checkEmptyRight: function(array, index) {
      return ((index + 1) % 6 == 0 || !array[index+1])
    },
    checkEmptyTop: function(array, index) {
      return (index < 6 || !array[index-6]);
    },
    checkEmptyBottom: function(array, index) {
      return (index >= array.length - 6 || !array[index+6]);
    },
    executeSpell: function () {
      // console.table(State.board.characters);
      let lettersArray = State.board.characters.map(c => c == null ? '' : c.letters );
      let wordsArray = [];
      //horizontal
      for(let i = 0; i < lettersArray.length; i++) {
        let currentWord = "";
        if(lettersArray[i] && lettersArray[i+1]) {
          if(this.checkEmptyLeft(lettersArray, i)) {
            let j = i;
            while(!this.checkEmptyRight(lettersArray, j)) {
              currentWord += lettersArray[j];
              j++;
            }
            currentWord += lettersArray[j];
          }
        }
        if(currentWord.length > 1) {
          wordsArray.push(currentWord);
        }
      }
      //vertical
      console.log("vertical------");
      for(let i = 0; i < lettersArray.length; i++) {
        let currentWord = "";
        if(lettersArray[i] && lettersArray[i+6]) {
          if(this.checkEmptyTop(lettersArray, i)) {
            let j = i;
            while(!this.checkEmptyBottom(lettersArray, j)) {
              currentWord += lettersArray[j];
              j+=6;
            }
            currentWord += lettersArray[j];
          }
        }
        if(currentWord.length > 1) {
          wordsArray.push(currentWord);
        }
      }
      //isolated letters
      console.log("isolated------");
      let isolatedLetters = [];
      for(let i = 0; i < lettersArray.length; i++) {
        if(!lettersArray[i]) {
          continue;
        }
        if(this.checkEmptyTop(lettersArray, i) &&
           this.checkEmptyBottom(lettersArray, i) &&
           this.checkEmptyLeft(lettersArray, i) &&
           this.checkEmptyRight(lettersArray, i)) {
                isolatedLetters.push(lettersArray[i]);
        }
      }
      let correct = wordsArray.map( w => checkDictionary(w) );
      let damageDealt = 0;
      let damageTaken = 0;
      for(let i = 0; i < wordsArray.length; i++) {
        if(checkDictionary(wordsArray[i])) {
          damageDealt += this.dealDamage(wordsArray[i]);
        } else {
          damageTaken += wordsArray[i].length * 5;
        }
      }
      damageTaken += isolatedLetters.length * 5;
      console.log('you dealt '+damageDealt+' damage');
      console.log(wordsArray);
      console.log(correct);
      console.log(isolatedLetters);
      console.log('you took '+damageTaken+' damage');
      initializeGame();
    },
    dealDamage(word) {
      var damageChart = [0,5,10,15,20,30,40];
      return damageChart[word.length-1];
    },
  },
  components: {
    'board': Board,
  }
})
