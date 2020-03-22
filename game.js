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

//the following methods assume a 6x6 grid
function checkEmptyLeft(array, index) {
  return (index % 6 == 0 || !array[index-1])
}
function checkEmptyRight(array, index) {
  return ((index + 1) % 6 == 0 || !array[index+1])
}
function checkEmptyTop(array, index) {
  return (index < 6 || !array[index-6]);
}
function checkEmptyBottom(array, index) {
  return (index >= array.length - 6 || !array[index+6]);
}
function checkIsolated(array, index) {
  return checkEmptyTop(array, index) &&
         checkEmptyBottom(array, index) &&
         checkEmptyLeft(array, index) &&
         checkEmptyRight(array, index);
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
  let all = 'an,ar,ch,er,ed,in,le,on,re,sh,st,th'.split(',');
  return all[ Math.floor(Math.random() * all.length) ]
}
function damageCalc(word) {
  var damageChart = [0,5,10,15,20,30,40];
  return damageChart[word.length-1];
}

function assembleBags() {
  let bags = [];
  for(let i = 0; i < 4; i++) {
    bags[i] = []
    bags[i].push(randomVowel());
    bags[i].push(randomVowel());
    bags[i].push(randomDouble());
    bags[i].push(randomCommonConsonant());
    if(i % 2 == 0) {
      bags[i].push(randomCommonConsonant());
    } else {
      bags[i].push(randomConsonant());
    }
    bags[i].push(randomConsonant());
  }
  console.log(bags);
  return bags;
}

/* store */
let State = {
  board: {
    dragging: false,
    previewOn: false,
    previewTimeout: null,
    previewElement: null,
    preivewH: "",
    previewV: "",
    previewHValue: 0,
    previewVValue: 0,
    dragDummy: document.getElementById("dragDummy"),
    tiles: [],
    characters: [],
    words: [],
    bags: assembleBags(),
  },
}

function initializeGame() {
    var tilesArray = [], charsArray = [];
    for(let i = 0; i < 36; i++) {
      tilesArray.push({
        type: "default",
        id: i
      })
      if(i < 3) {
        let randomLetter = i % 2 == 0 ? randomConsonant() : randomVowel();
        if(i >= 2 && Math.random() > 0.5) {
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
    let i = 4;
    while(i > 0) {
      let r = Math.floor(Math.random() * 36);
      if(charsArray[r] == null && tilesArray[r].type == "default") {
        if(i == 2) {
          tilesArray[r].type = "treasure";
        } else if(i == 1) {
          tilesArray[r].type = "monster";
        } else {
          tilesArray[r].type = "blocked";
        }
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
      state: State.board,
    }
  },
  created: function() {
  },
  mounted: function() {
    State.board.previewElement = document.getElementById("wordPreview");
    this.updateWords();
  },
  methods: {
    handleDragStart: function(e) {
      let tile = e.currentTarget;
      let char = tile.querySelector(".char");
      if(char == null) {
        return;
      }
      State.board.dragging = true;
      State.board.dragDummy.classList.add("show");
      State.board.dragDummy.style.top = e.clientY - 35 + "px";
      State.board.dragDummy.style.left = e.clientX - 35 + "px";
      tile.classList.add("dragging")
      State.board.dragDummy.innerHTML = char.innerHTML;
      let id = char.getAttribute('id').replace('char','');
      State.board.dragTarget = id;
      clearTimeout(State.board.previewTimeout);
      State.board.previewOn = false;
    },
    handleDragMove: function(e) {
      if(State.board.dragging) {
        State.board.dragDummy.style.top = e.clientY - 35 + "px";
        State.board.dragDummy.style.left = e.clientX - 35 + "px";
      }
      if(State.board.previewOn) {
        State.board.previewElement.style.top = e.clientY + "px";
        State.board.previewElement.style.left = e.clientX + "px";
      }
    },
    handleDragEnter: function(e) {
      if(State.board.dragging) {
        e.currentTarget.classList.add("over")
      } else {
        //hover
        let lettersArray = State.board.characters.map(c => c == null ? '' : c.letters );
        let spaceID = parseInt(e.currentTarget.id.replace("tile",""));
        if(!lettersArray[spaceID]) {
          State.board.previewOn = false;
          clearTimeout(State.board.previewTimeout);
          return;
        }
        if(checkIsolated(lettersArray, spaceID)) {
          // console.log("isolated:" + spaceID);
          State.board.previewOn = false;
          clearTimeout(State.board.previewTimeout);
          return;
        }
        if(State.board.previewOn) {
          this.wordPreview(spaceID);
        } else {
          clearTimeout(State.board.previewTimeout);
          State.board.previewTimeout = setTimeout(function(){
            State.board.previewOn = true;
            State.board.previewElement.style.top = e.clientY + "px";
            State.board.previewElement.style.left = e.clientX + "px";
            this.wordPreview(spaceID);
          }.bind(this),1000);
        }
      }
    },
    handleDragLeave: function(e) {
      e.target.classList.remove("over");
    },
    handleDrop: function(e) {
      State.board.dragging = false;
      State.board.dragDummy.classList.remove("show");
      let tile = e.currentTarget;
      tile.classList.remove("over");
      document.querySelectorAll(".dragging").forEach(e => e.classList.remove("dragging"));
      if(!State.board.dragTarget) {
        return;
      }
      const dropID = tile.getAttribute("id").replace('tile','');
      //check for validity
      if(!tile.classList.contains("default")) {
        console.log("occupied");
        e.preventDefault();
        return;
      }
      if(tile.childElementCount > 0) {
        const originalID = State.board.dragTarget;
        const charA = State.board.characters[originalID];
        const charB = State.board.characters[dropID];
        State.board.characters.splice(dropID, 1, charA);
        State.board.characters.splice(originalID, 1, charB);
      } else {
        const originalID = State.board.dragTarget;
        const tempChar = State.board.characters[originalID];
        State.board.characters.splice(dropID, 1, tempChar);
        State.board.characters.splice(originalID, 1, null);
      }
      State.board.dragTarget = null;
      this.updateWords();
    },
    updateWords: function() {
      State.board.words = [];
      let lettersArray = State.board.characters.map(c => c == null ? '' : c.letters );
      //horizontal
      for(let i = 0; i < lettersArray.length; i++) {
        let currentWord = "";
        let j = i;
        if(lettersArray[i] && lettersArray[i+1]) {
          if(checkEmptyLeft(lettersArray, i)) {
            while(!checkEmptyRight(lettersArray, j)) {
              currentWord += lettersArray[j];
              j++;
            }
            currentWord += lettersArray[j];
          }
          if(currentWord.length > 1) {
            State.board.words.push({
              direction: 0,
              word: currentWord,
              startIndex: i,
              endIndex: j
            })
          }
        }

      }
      //vertical
      for(let i = 0; i < lettersArray.length; i++) {
        let currentWord = "";
        let j = i;
        if(lettersArray[i] && lettersArray[i+6]) {
          if(checkEmptyTop(lettersArray, i)) {
            while(!checkEmptyBottom(lettersArray, j)) {
              currentWord += lettersArray[j];
              j+=6;
            }
            currentWord += lettersArray[j];
          }
          if(currentWord.length > 1) {
            State.board.words.push({
              direction: 1,
              word: currentWord,
              startIndex: i,
              endIndex: j
            })
          }
        }
      }
    },
    wordPreview: function(id) {
      let index = parseInt(id);
      //horizontal
      State.board.previewH = "";
      State.board.previewV = "";
      State.board.previewHValue = "";
      State.board.previewVValue = "";
      for(let i = 0; i < State.board.words.length; i++) {
        let w = State.board.words[i];
        if(index >= w.startIndex &&
          index <= w.endIndex &&
          w.direction == 0) {
          State.board.previewH = w.word;
        }
        if(index % 6 == w.startIndex % 6 &&
          index >= w.startIndex &&
          index <= w.endIndex &&
          w.direction == 1) {
          State.board.previewV = w.word;
        }
      }
      if(State.board.previewH) {
        if(checkDictionary(State.board.previewH)) {
          State.board.previewHValue = damageCalc(State.board.previewH) + " Damage";
        } else {
          State.board.previewHValue = "Not a word";
        }
        State.board.previewH += ": ";
      }
      if(State.board.previewV) {
        if(checkDictionary(State.board.previewV)) {
          State.board.previewVValue = damageCalc(State.board.previewV) + " Damage";
        } else {
          State.board.previewVValue = "Not a word";
        }
        State.board.previewV += ": ";
      }
    }
  },
  computed: {
  },
  components: {
    'tile': Tile,
    'char': Char
  },
  template: `
    <div @mousemove="handleDragMove">
      <div id="wordPreview" :class="{show: state.previewOn}">
        <p>{{state.previewH}} <span>{{state.previewHValue}}</span> </p>
        <p>{{state.previewV}} <span>{{state.previewVValue}}</span> </p>
      </div>
      <tile
      v-bind:class="[state.tiles[index].type]"
      v-for="(t, index) in state.tiles"
      :key="index"
      :id="'tile'+index"
      @dragover.prevent.native
      @mousedown.native="handleDragStart"
      @mouseover.prevent.native="handleDragEnter"
      @mouseleave.native="handleDragLeave"
      @mouseup.native="handleDrop"
      >
        <char
        v-if="state.characters[index]"
        :id="'char' + index"
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
        case 65:
          this.spawnFromBag(0);
        break;
        case 83:
          this.spawnFromBag(1);
        break;
        case 68:
          this.spawnFromBag(2);
        break;
        case 70:
          this.spawnFromBag(3);
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
    spawnFromBag: function(which) {
      let bag = State.board.bags[which];
      for(let i = 0; i < State.board.characters.length; i++) {
        if(State.board.characters[i] == null && State.board.tiles[i].type == "default") {
          State.board.characters.splice(i,1, {
            id: i,
            letters: bag[ Math.floor(Math.random() * bag.length) ],
            color: 0
          });
          return;
        }
      }
    },
    bagContents: function(which) {
      let outputString = "";
      let bag = State.board.bags[which];
      for(let i = 0; i < bag.length; i++) {
        outputString += bag[i];
        if(i < bag.length - 1) {
          outputString += ", ";
        }
      }
      return outputString;
    },
    executeSpell: function () {
      //isolated letters
      let lettersArray = State.board.characters.map(c => c == null ? '' : c.letters );
      let isolatedLetters = [];
      for(let i = 0; i < lettersArray.length; i++) {
        if(!lettersArray[i]) {
          continue;
        }
        if(checkIsolated(lettersArray, i)) {
          isolatedLetters.push(lettersArray[i]);
        }
      }
      let correct = State.board.words.map( w => checkDictionary(w.word) );
      let damageDealt = 0;
      let damageTaken = 0;
      for(let i = 0; i < State.board.words.length; i++) {
        if(checkDictionary(State.board.words[i].word)) {
          damageDealt += damageCalc(State.board.words[i].word);
        } else {
          damageTaken += State.board.words[i].word.length * 5;
        }
      }
      damageTaken += isolatedLetters.length * 5;
      console.log('you dealt '+damageDealt+' damage');
      console.log('you took '+damageTaken+' damage');
      initializeGame();
    },
  },
  components: {
    'board': Board,
  }
})
