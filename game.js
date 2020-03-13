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

/* store */
let Store = {
  data: {
      tiles: [],
      characters: []
  },
  fetchData: function() {
    return this.data;
  }
}

function initializeGame() {
    console.log("creating");
    var tilesArray = [], charsArray = [];
    for(let i = 0; i < 36; i++) {
      tilesArray.push({
        type: "default",
        id: i
      })
      if(i < 10) {
        let randomLetter = i % 2 == 0 ? randomConsonant() : randomVowel();
        charsArray.push({
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
    Store.data.tiles = tilesArray;
    Store.data.characters = charsArray;
}

/* components */
let Char = {
  props: ['ltrs'],
  data: function(){
    return {}
  },
  template: '<div class="char"><slot></slot></div>'
};

let Tile = {
  data: function(){
    return {
      innerGlyph: {letters: "g"}
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
      store: {}
    }
  },
  created: function() {
    this.store = Store.data;
  },
  methods: {
    handleDragStart: function(e) {
      const char = e.target.closest('.char')
      let id = char.getAttribute('id');
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
      const tile = e.target.closest(".tile");
      tile.classList.remove("over")
      //check for validity
      if(tile.childElementCount > 0
      || tile.classList.contains("blocked")) {
        console.log("occupied");
        e.preventDefault();
        return;
      }
      const id = e.dataTransfer.getData('text');
      const t = document.getElementById(id);
      tile.appendChild(t);
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
      v-bind:class="[store.tiles[index].type]"
      v-for="(t, index) in store.tiles"
      v-bind:key="index"
      @dragover.prevent.native
      @dragenter.prevent.native="handleDragEnter"
      @dragleave.native="handleDragLeave"
      @drop.native="handleDrop"
      >
        <char
        v-if="store.characters[index]"
        :id="'char' + index"
        draggable
        @dragstart.native="handleDragStart"
        >{{store.characters[index].letters}}</char>
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
    initializeGame();
  },
  methods: {
    executeSpell: function () {
      console.table(this.characters);
    }
  },
  components: {
    'board': Board,
  }
})
