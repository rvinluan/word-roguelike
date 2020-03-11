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
      tiles: [],
      characters: []
    }
  },
  created: function() {
    var tilesArray = [], charsArray = [];
    for(let i = 0; i < 36; i++) {
      tilesArray.push({
        type: "default",
        id: i
      })
      if(i < 10) {
        let randomLetter = i % 2 == 0 ? this.randomCommonConsonant() : this.randomVowel();
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
    this.tiles = tilesArray;
    this.characters = charsArray;
  },
  methods: {
    /* helpers */
    randomVowel: function() {
      let all = 'aeiou'.split('');
      return all[ Math.floor(Math.random() * all.length) ]
    },
    randomVowelWithY: function() {
      let all = 'aeiouy'.split('');
      return all[ Math.floor(Math.random() * all.length) ]
    },
    randomConsonant: function() {
      let all = 'bcdfghjklmnpqrstvwxyz'.split('');
      return all[ Math.floor(Math.random() * all.length) ]
    },
    randomCommonConsonant: function() {
      let all = 'nrtlsdgbcmp'.split('');
      return all[ Math.floor(Math.random() * all.length) ]
    },
    handleDragStart: function(e) {
      let id = e.target.getAttribute('id');
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
      e.target.classList.remove("over")
      const id = e.dataTransfer.getData('text');
      const t = document.getElementById(id);
      e.target.appendChild(t);
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
      v-bind:class="[tiles[index].type]"
      v-for="(t, index) in tiles"
      v-bind:key="index"
      @dragover.prevent.native
      @dragenter.prevent.native="handleDragEnter"
      @dragleave.native="handleDragLeave"
      @drop.native="handleDrop"
      >
        <char
        v-if="characters[index]"
        :id="'char' + index"
        draggable
        @dragstart.native="handleDragStart"
        >{{characters[index].letters}}</char>
      </tile>
    </div>`
};

var vm = new Vue({
  el: "#game",
  data: {
    health: 100,
    mana: 25
  },
  components: {
    'board': Board,
  }
})
