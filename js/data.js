/* =========================================================
   サイトの内容はこのファイルだけ編集すればOK
   - 文字列の中で改行したいときは \n を入れる
   - 項目を増やすときは { ... }, をコピーして増やす（最後のカンマはあってもOK）
   ========================================================= */
window.SITE = {
  // 名前（大きく表示される）
  name: "むつき",
  // ブラウザのタブに出る英語名（空でもOK）
  nameEn: "Mutsuki",

  // 誕生日 "YYYY-MM-DD"
  birthday: "2013-10-15",
  showAge: true,        // 「26th」のような年齢表示を出すか
  showBirthYear: true,  // プロフィールに生まれ年を出すか
  // age: 26,           // 年齢を手動で指定したいときだけコメントを外す

  // オープニング
  openingTitle: "Happy Birthday",
  openingMessage: "お誕生日おめでとう！",

  // BGM（任意）。例: "audio/bgm.mp3"。空なら音なし
  bgm: "",

  // 効果音（ろうそくを消す音・お祝いの音）。false で無音
  sound: true,
  // 好きな音源に差し替えたいときはファイルを指定（空なら内蔵の合成音）
  // 例: blow: "audio/blow.mp3"
  sounds: {
    light: "./audio/火炎魔法1.mp3", // 火を灯したとき（空なら無音）
    fire: "./audio/たき火.mp3", // 火が灯っている間ずっと流れる（空なら無音）
    blow: "./audio/マッチの火を吹き消す.mp3",
    pop: "./audio/キラッ1.mp3",
    warp: "",    // ワープ中の音（空なら内蔵の合成音）
    song: "",    // Happy Birthday の曲（空なら内蔵のオルゴール演奏）
    cracker: "", // 曲が終わったときのクラッカー（空なら pop の音）
  },
  // 音量（0〜1。0 で無音、1 が元の大きさ）
  volumes: {
    light: 0.4,    // 火を灯したとき
    fire: 0.2,  // たき火
    blow: 1,     // 火を消したとき
    pop: 1,      // お祝い（キラッ）
    warp: 0.7,   // ワープ
    song: 0.8,   // Happy Birthday の曲
    cracker: 1,  // クラッカー
  },

  // プロフィール
  profile: {
    photo: "images/profile.jpg",
    catchphrase: "外から見たイメージ",
    items: [
      { label: "特技", value: "屁" },
      { label: "特技２", value: "友達を作る" },
      { label: "特徴", value: "うんち（うたおんち）" },
      { label: "特徴２", value: "珍解答量産機" },
      { label: "チャームポイント", value: "えくぼ" },
    ],
  },

  // スライドショー（上から順に表示）
  slideInterval: 10000, // 自動で次に進む間隔（ミリ秒）
  slideRatio: "9:16",  // 写真の縦横比（横:縦）。横長の写真なら "4:3" など
  // ワープ中に流す写真（ファイル名を書く）。2つ目のスライドショー「アルバム」にも使われる
  // ※アルバムにコメントを付けたいときは photos2: [{ src: "...", text: "..." }, ...] を書くとそちらが使われる
  // 空 [] ならスライドショーの写真を使う。false にすると写真を流さない
  warpPhotos: [
    "./images/0C85A70F-8AA1-48F7-B039-3A809973B6E0.jpg",
    "./images/15FAAFCE-1480-441D-9A42-76668DE70B73.jpg",
    "./images/1A50E535-9865-4BE1-A632-2EF4308070DF.jpg",
    "./images/27143592-B646-403A-A375-D9D94EC51A94.jpg",
    "./images/4B6E51F1-C168-4CB8-B1F1-DF6FDBD0E0E6.jpg",
    "./images/4F58145B-32AC-4D50-8EA4-65DDA3B55D07.jpg",
    "./images/54AF8439-0FDF-422B-A09D-FA0775184EF8.jpg",
    "./images/5BA2241F-FF4A-4975-8C32-A1A8D17ED2E7.jpg",
    "./images/61BB307A-7800-41CD-B825-FEC7CA53945D.jpg",
    "./images/6D5A3C63-4A55-46C9-9957-D06F1FA940B2.jpg",
    "./images/6FC6CCAB-79D9-46BA-974A-7313F6E5B1CE.jpg",
    "./images/8480B178-2EC6-42B6-ADBC-5B0FAD27BA87.jpg",
    "./images/8B32CE59-1893-498D-A52B-EE4BA90F074B.jpg",
    "./images/A381ED1D-80C4-483E-AFDA-1305ECE39F35.jpg",
    "./images/AD9377FF-A2C1-46EF-A5C8-E4E99C7982EF.jpg",
    "./images/B54CAA01-3112-4729-9A5A-4DEA22A612C2.jpg",
    "./images/D640BE46-B6E3-4664-8C8C-668B5392AFEB.jpg",
    "./images/EECA06F2-B434-46B3-AAFE-9BEB51B209C5.jpg",
    "./images/EEF9BF87-2615-4D37-97D7-6B1B96F63A01.jpg",
  ],
  warpPhotoOpacity: 0.3, // ワープ中の写真の濃さ（0〜1。0.4 = 60%透明）
  // warpDuration: 5000, // ワープの長さ（ミリ秒）。指定しなければ5秒
  photos: [
    { src: "./images/IMG_5417.jpg", title: "", text: "いつになったら起きていられるんでしょうか" },
    { src: "./images/IMG_5974.jpg", title: "", text: "福島？" },
    { src: "./images/IMG_6023.jpg", title: "", text: "うんち" },
    { src: "./images/IMG_7837.jpg", title: "", text: "だっさいのぉ" },
    { src: "./images/image.jpg", title: "", text: "これぞ" },
    { src: "./images/image2.jpg", title: "", text: "焼肉の後のこれ。わけわかめ" },
  ],

  // メッセージ（不要なら messages: [] にするとセクションごと消える）
  messages: [
    { from: "サリバン海より", text: "誕生日おめでとう！！\nこれからちょっとずつ色んな事ができるようになると思うけど勉強も遊びもどっちも頑張れ！！13歳楽しんでね！！" },
    { from: "みゆより", text: "むーくんお誕生日おめでとう🎂\n久々会った時、大きくなってるし、しっかり者のお兄さんになっててとっても驚いたよー！！\n勝手に成長感じてました🥲🩷 お家に遊びに行く時また会えたらいいなー！\nこの1年も楽しく健康に過ごせますよーに‼️" },
    { from: "るかより", text: "むー誕生日おめでとう！\n勉強頑張れよ〜💪葉月にバカにされないようにねw" },
  ],

  // 最後のひとこと
  closing: "すてきな一年になりますように。",
};
