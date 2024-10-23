import React, { useState, useEffect } from 'react';
import StickyNote from './components/StickyNote';
import Header from './components/Header';  // ヘッダーのインポート
import Sidebar from './components/Sidebar';  // サイドバーのインポート
import { useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';


function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null); // 選択された付箋のIDを管理
  const [lastPair, setLastPair] = useState({ draggedId: null, targetId: null });
  // const [theme, setTheme] = useState('USJのマリオカートの待ち時間60分をお客さんに楽しんでもらうためには？');  // ブレストのお題を管理
  // const [theme, setTheme] = useState('USJのマリオカートのアトラクションには、90分の待ち時間があります。待っている人は座ることができず、来場者のほとんどが一緒に来た人と話して待つなどしています。しかし、その待ち時間の長さから退屈している来場者もちらほら見られます。パーク責任者であるあなたは『来場者が今より退屈しない待ち時間の体験』をデザインしてください。実現可能性はさほど考えず、自由な発想をしてください。');  // ブレストのお題を管理
  const [theme, setTheme] = useState('10年後のコンビニエンスストアはどのように進化しているだろうか？'); // お題のデフォルト
  
  const [idCounter, setIdCounter] = useState(1);  // 追加するためのIDカウンター
  const [lastXPosition, setLastXPosition] = useState(null); // 振る基準位置のX座標

  const [resizedNotes, setResizedNotes] = useState([]); // リサイズされた付箋のIDを追跡

  const [loading, setLoading] = useState(false); // State to control the progress indicator

  const [lines, setLines] = useState([]); // 表示する線のリストを管理

  const [alertMessage, setAlertMessage] = useState(""); // アラートメッセージの状態
  const [showAlert, setShowAlert] = useState(false); // アラート表示の状態

  // 新たに生成されたアイデアやコンセプトを保持するステートを追加
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const [generatedConcepts, setGeneratedConcepts] = useState([]);

  // 計測関連のステートを追加
  const [measurementActive, setMeasurementActive] = useState(false);
  const [userName, setUserName] = useState('');
  const [counts, setCounts] = useState({
    combineStickyNotes: 0,
    handleResize: 0,
    generateNewIdea: 0,
    generateIdeaSeeds: 0,
    addStickyNote: 0,
    addSeedNote: 0,
  });

  const [, dropRef] = useDrop({
    accept: ['STICKY_NOTE','AI_IDEA'],
    drop: (item, monitor) => {
      const { x, y } = monitor.getSourceClientOffset();
      const shape = item.shape;

      // キャンバスのスクロール量を取得
      const container = document.querySelector('.canvas-container'); // キャンバスのクラス名が 'canvas-container' であると仮定しています
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;

      const correctX = x + scrollLeft;
      const correctY = y + scrollTop;

      if (shape === 'square') {
        generateEmptyIdea(correctX, correctY)
        // addStickyNote("", "", '#FCF281', correctX, correctY);        
      } else if (shape === 'circle') {
        generateEmptySeed(correctX, correctY)
        // addSeedNote("", "", '#9EDCFA', correctX, correctY);
      } else if(shape === 'idea'){
        generateNewIdea(correctX, correctY);
      }else if(shape === 'seed'){
        generateIdeaSeeds(correctX, correctY);
      }
    },
  });

  const generateEmptyIdea = (correctX, correctY) => {
    addStickyNote("", "", '#FCF281', correctX, correctY);

    // カウントを増やす
    if (measurementActive) {
      setCounts((prevCounts) => ({
        ...prevCounts,
        addStickyNote: prevCounts.addStickyNote + 1,
      }));
    }
  }

  const generateEmptySeed = (correctX, correctY) => { 
    addSeedNote("", "", '#9EDCFA', correctX, correctY);

    // カウントを増やす
    if (measurementActive) {
      setCounts((prevCounts) => ({
        ...prevCounts,
        addSeedNote: prevCounts.addSeedNote + 1,
      }));
    }
  }


  const addStickyNote = (content = "", description = "", bkcolor = '#FCF281', x = 450, y = 100, borderLine = 'none') => {
    const newNote = {
      id: idCounter,
      content,
      description,
      x,
      y,
      bkcolor,
      borderLine,
      shape: 'square'
    };
    setNotes([...notes, newNote]);
    setSelectedNoteId(idCounter); // Set the newly added note as selected
    setIdCounter(idCounter + 1);  // IDカウンターをインクリメント
  };

    // 丸いアイデアの種を追加する関数
  const addSeedNote = (content = "", description = "", bkcolor = '#9EDCFA', x = 450, y = 100, borderLine = 'none') => {
    const newNote = {
      id: idCounter,
      content,
      description,
      x,
      y,
      bkcolor,
      borderLine,
      shape: 'circle'  // 丸い付箋を表現
    };
    setNotes([...notes, newNote]);
    setSelectedNoteId(idCounter); // Set the newly added note as selected
    setIdCounter(idCounter + 1);
  };

  // 異なる付箋をドラッグ&ドロップした際に、両方の内容を結合した新しい付箋を作成
  const combineStickyNotes = async (draggedNote, targetNote) => {
    const isAlreadyCombined = notes.some(note =>
        note.sourceIds &&
        note.sourceIds.includes(draggedNote.id) &&
        note.sourceIds.includes(targetNote.id)
    );

    if (isAlreadyCombined) {
      console.log("This idea has already been combined.");// このアイデアは既に組み合わされています。
      setAlertMessage("This idea has already been combined."); // このアイデアは既に組み合わされています。
      setShowAlert(true); // アラートを表示
      setTimeout(() => setShowAlert(false), 3000); // 3秒後にアラートを自動的に非表示に
      return;
    }

    // draggedNoteかtargetNoteのいずれかが空の場合
    if (!draggedNote.content.trim() || !targetNote.content.trim()) {
        console.log("One of the ideas is empty."); // どちらかのアイデアが空です。
        setAlertMessage("One of the ideas to combine is empty."); // 組み合わせるアイデアのどちらかが空です。
        setShowAlert(true); // アラートを表示
        setTimeout(() => setShowAlert(false), 3000); // 3秒後にアラートを自動的に非表示に
        return;
    }

    // PENDING: DBに新しい付箋を保存する、現状の付箋だと枚数が増えると文字が消えてきたりするから?
    setLoading(true); // Start the loading indicator

    console.log(theme);
    const combinedContent = `
次のタスクでは、与えられたお題:「${theme}」に対して、2つのアイデア（アイデアAとアイデアB）を組み合わせて、新しいアイデアを1つ生成してください。

### タスクの目的
アメリカの実業家ジェームズ・W・ヤング氏が述べたように、「アイデアとは既存の要素の新しい組み合わせ以外の何物でもない」と考えられます。今回のタスクでは、2つの異なるアイデアを組み合わせて、お題:「${theme}」に対する新しい視点や価値を生み出す独創的なアイデアを生成してください。

### お題
${theme}

### 定義と組み合わせ基準
- Title（タイトル）: アイデアの内容が具体的に想像できるような短い文章で表現してください。例：「待ち時間に他の来場者とクイズ対決」「スマホでアトラクションの様子をリアルタイム視聴」
- Description（説明）: タイトルをより具体的に説明する1～3文。例：「他者の感情や体験を共有しながら楽しむ新しいエンターテイメント」「リアルタイムで体験を共有し、みんなで楽しむ新しいライブイベント」

### 組み合わせの際のポイント
- お題を解決するアイデアになっていることを確認してください。
- アイデアAとアイデアBのそれぞれの強みや特徴を組み合わせ、新しい価値や体験を生み出してください。
- 組み合わせは直感的でも、意外性を持たせたものでも構いません。専門家として、独自の視点を取り入れてください。
- どちらか一方に偏らず、両方のアイデアがうまく融合したアイデアを作り出してください。

### 出力フォーマット
出力は英語で、以下のフォーマットに従ってください。
idea: { "Title": "新しいアイデアの英語タイトル（具体的かつ短い文章）", "Description": "新しいアイデアの詳細な説明（1～3文）" }


### 出力例
- アイデアA: { "Title": "バーチャル観戦", "Description": "スマホを使ってアトラクションの様子をリアルタイムで観戦できるサービス" }
- アイデアB: { "Title": "クイズラリー", "Description": "アトラクション待ち時間中に楽しめるクイズラリーイベント" }
- 出力:
idea: { "Title": "待ち時間中にスマホでクイズ観戦を楽しむ", "Description": "スマホでアトラクションのリアルタイム観戦をしながらクイズに挑戦できる新しい待ち時間体験。正解数に応じてポイントが貯まり、特典がもらえるシステムです。" }


### 入力アイデア
- アイデアA: ${draggedNote.content}${draggedNote.description ? ` - ${draggedNote.description}` : ""}
- アイデアB: ${targetNote.content}${targetNote.description ? ` - ${targetNote.description}` : ""}

**注意:** 出力フォーマットに厳密に従い、必ず1つの新しいアイデアを生成してください。
  `;
    // アイデアA: ${draggedNote.content}
    // アイデアB: ${targetNote.content}
    try {

      // draggedNote と targetNote の位置を少し離す処理を追加
      const separationOffset = 30; // 分離させるオフセット

      const updatedNotes = notes.map(note => {
        if (note.id === draggedNote.id) {
          return {
            ...note,
            x: note.x + separationOffset, // draggedNoteの位置を右へ
            y: note.y + separationOffset  // draggedNoteの位置を下へ
          };
        } else if (note.id === targetNote.id) {
          return {
            ...note,
            x: note.x - separationOffset, // targetNoteの位置を左へ
            y: note.y - separationOffset  // targetNoteの位置を上へ
          };
        } else {
          return note;
        }
      });

      setNotes(updatedNotes); // 変更を保存
      
      // sendToLLM の結果を待機して受け取る
      const generatedText = await sendToLLM(combinedContent);

      // Extract the idea object from the LLM response
      const match = generatedText.match(/idea:\s*(\{.*\})/);
      if (!match) {
        console.error("Invalid response format from LLM:", generatedText);
        return;
      }
      
      const ideaObject = JSON.parse(match[1]);

      // Check if Title and Description are properly parsed
      if (!ideaObject.Title || !ideaObject.Description) {
        console.error("Invalid idea format from LLM:", ideaObject);
        return;
      }

      // 付箋の幅と高さを考慮
      const stickyNoteWidth = 120;  // 付箋の幅 (仮に200pxとします)
      const stickyNoteHeight = 120;  // 付箋の高さ (仮に100pxとします)
      const offset = 20;  // 最低限の距離を保つオフセット

      // 2つの付箋の中心位置を計算
      const centerX = (draggedNote.x + targetNote.x) / 2;
      const centerY = (draggedNote.y + targetNote.y) / 2;

      // ランダムな方向に少しずらして新しい位置を決定
      let newX = centerX + (Math.random() > 0.5 ? stickyNoteWidth + offset : -(stickyNoteWidth + offset));
      let newY = centerY + (Math.random() > 0.5 ? stickyNoteHeight + offset : -(stickyNoteHeight + offset));


      // Create the new combined sticky note
      const newNote = {
        id: idCounter,
        content: ideaObject.Title,
        description: ideaObject.Description,
        x: newX,
        y: newY,
        bkcolor: '#FCF281',
        borderLine: '2px solid #000000',
        shape: 'square',
        sourceIds: [draggedNote.id, targetNote.id] // Track the source IDs
      };

      setNotes([...updatedNotes, newNote]);
      setSelectedNoteId(idCounter);
      setIdCounter(idCounter + 1);

      // Add a line for the relationship between the source notes and the new note
      setLines([...lines, { from: draggedNote.id, to: newNote.id, type: 'combine' }, { from: targetNote.id, to: newNote.id, type: 'combine' }]);
    } catch (error) {
      console.error(error);
    } finally {
      // カウントを増やす
      if (measurementActive) {
        setCounts((prevCounts) => ({
          ...prevCounts,
          combineStickyNotes: prevCounts.combineStickyNotes + 1,
        }));
      }
      setLoading(false); // Ensure loading is stopped even if there's an error
    }
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const moveNote = (id, x, y) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, x, y } : note
    ));
    
    // ドラッグ終了後に選択状態にする
    setSelectedNoteId(id);
  };

  const updateNoteContent = (id, newContent, newDescription = null,  newBkcolor = null) => {
    setNotes(prevNotes => {
    // 配列のコピーを作成し、該当するIDのノートだけ更新する
      return prevNotes.map(note => 
      note.id === id ? { ...note, content: newContent, description: newDescription || note.description, bkcolor: newBkcolor || note.bkcolor } : note
    );
  });
  };

  // Function to draw lines between consecutive sticky notes
  const renderLinesBetweenNotes = () => {
    const linesToRender = [];

    // Iterate through the lines state to find lines connected to the selected sticky note
    for (const line of lines) {
      const { from, to, type } = line;

      // Check if the selected sticky note is either the source or target of this line
      // if (selectedNoteId === to || (selectedNoteId === from && type === 'decomposition')) { // 選択してる付箋が先（結合先、分解先）、または分解元の時
        const note1 = notes.find(note => note.id === from);
        const note2 = notes.find(note => note.id === to);

        if (note1 && note2) {
          const x1 = note1.x + 50; // Adjust this to get the center of the sticky note
          const y1 = note1.y + 50; // Adjust this to get the center of the sticky note
          const x2 = note2.x + 50; // Adjust this to get the center of the sticky note
          const y2 = note2.y + 50; // Adjust this to get the center of the sticky note

          // Calculate the midpoint of the line
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          linesToRender.push(
            <g key={`group-line-${from}-${to}`}> {/* Grouping line and text together */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="gray"
                strokeWidth="1"
                strokeDasharray={type === 'combine' ? "0" : "5,5"}
                style={{ pointerEvents: 'none' }}
              />
              {/* Display "結合" or "分解" text based on the type */}
              <text
                x={midX}
                y={midY}
                fill="black"
                fontSize="12px"
                textAnchor="middle" // Centers the text horizontally
                alignmentBaseline="middle" // Centers the text vertically
                style={{ pointerEvents: 'none', userSelect: 'none' }} // Ensure text doesn't interfere with drag-and-drop
              >
                {type === 'combine' ? 'Combine' : 'Decompose'}
              </text>
            </g>
          );
        }
      // }
    }

    return linesToRender;
    // const linesToRender = [];

    // // Iterate through the lines state to find lines connected to the selected sticky note
    // for (const line of lines) {
    //   const { from, to, type } = line;
      
    //   if (selectedNoteId === to) { //selectedNoteId === from || selectedNoteId === to
    //     const note1 = notes.find(note => note.id === from);
    //     const note2 = notes.find(note => note.id === to);

    //     if (note1 && note2) {
    //       const x1 = note1.x + 50; // Adjust this to get the center of the sticky note
    //       const y1 = note1.y + 50; // Adjust this to get the center of the sticky note
    //       const x2 = note2.x + 50; // Adjust this to get the center of the sticky note
    //       const y2 = note2.y + 50; // Adjust this to get the center of the sticky note

    //       // Calculate the midpoint of the line
    //       const midX = (x1 + x2) / 2;
    //       const midY = (y1 + y2) / 2;

    //       linesToRender.push(
    //         <g key={`group-line-${from}-${to}`}> {/* Grouping line and text together */}
    //           <line
    //             x1={x1}
    //             y1={y1}
    //             x2={x2}
    //             y2={y2}
    //             stroke="gray"
    //             strokeWidth="2"
    //             strokeDasharray="5,5"
    //             style={{ pointerEvents: 'none' }}
    //           />
    //           {/* Add "結合" text at the center of the line */}
    //           <text
    //             x={midX}
    //             y={midY}
    //             fill="black"
    //             fontSize="12px"
    //             textAnchor="middle" // Centers the text horizontally
    //             alignmentBaseline="middle" // Centers the text vertically
    //             style={{ pointerEvents: 'none', userSelect: 'none' }} // Ensure text doesn't interfere with drag-and-drop
    //           >
    //             {type === 'combine' ? '結合' : '分解'}
    //           </text>
    //         </g>
    //       );
    //     }
    //   }
    // }
    // return linesToRender;
  };
  

  const handleDrop = (draggedId, targetId) => {
    if (draggedId !== targetId) {
      setLastPair({ draggedId, targetId });
    }
  };

  // // OpenAI APIとの連携
  const sendToLLM = async (command) => {
    // console.log(`API Key: ${process.env.REACT_APP_OPENAI_API_KEY}`);

    try {
      // fetch で OpenAI API にリクエスト
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
              model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: "あなたはクリエイティブな人間です。質問には簡潔に答えてください。" },
              { role: 'user', content: command }
            ]
          })
      });

      // レスポンスボディを JSON として取り出す
      const rdata = await response.json();


      // 応答メッセージを抜き出してコンソールに出力
      console.log(rdata.choices[0].message.content);

      const generatedText = rdata.choices[0].message.content

      return generatedText;
    } catch (error) {
      alert(error);
      console.error("Error with OpenAI API: ", error);
    }
  };

  // // ドラッグ&ドロップが行われた際の処理
  useEffect(() => {
    if (lastPair.draggedId && lastPair.targetId) {

      const draggedNote = notes.find(note => note.id === lastPair.draggedId);
      const targetNote = notes.find(note => note.id === lastPair.targetId);

      // alert(`付箋A: ${draggedNote.content}, 付箋B: ${targetNote.content}`);

      if (draggedNote && targetNote) {
        combineStickyNotes(draggedNote, targetNote);  // 内容を結合して新しい付箋を生成
      }
    }
  }, [lastPair]);

  const handleShakeDetected = async (id) => {
    console.log(`付箋${id}が振られました!`);
    const note = notes.find(note => note.id === id);
    
    if (note) {
      console.log(`Note content: ${note.content}`);
      if (note.content.trim() === "") {
        // content が空の場合は LLM に新しいアイデアをリクエスト
        console.log(theme);

        // 20文字以内の新しいアイデアを1つ完結に出してください。テーマは「${theme}」です。
        const command = `
次のタスクでは、与えられたお題:「${theme}」に基づいて、新しいアイデアを1つ生成してください。

### タスクの目的
${theme}に対するアイデアを創出することが目的です。実現可能性はさほど考えなくて構いません。実現可能性が高いアイデアでも独創的で斬新なアイデアでも歓迎します。

### お題
${theme}

### 出力フォーマット
アイデアは英語で、次のフォーマットに従って出力してください。
idea: { "Title": "アイデアのタイトル（英語）", "Description": "アイデアの詳細な説明（1～3文）" }


### 出力例
- お題: 「子供たちが自然の中で学べる新しい遊びを考えてください」
- 出力: idea: { "Title": "虫探しビンゴ", "Description": "待ち時間中に周りの自然の中から指定された虫や植物を見つけるビンゴゲーム。見つけたらスタッフに報告してスタンプをもらうことができ、全て見つけると小さなプレゼントがもらえます。" }


### お題
「USJのマリオカートのアトラクションには、90分の待ち時間があります。待っている人は座ることができず、来場者のほとんどが一緒に来た人と話して待つなどしています。しかし、その待ち時間の長さから退屈している来場者もちらほら見られます。パーク責任者であるあなたは『来場者が今より退屈しない待ち時間の体験』をデザインしてください。実現可能性はさほど考えず、自由な発想をしてください。」

**注意:** 出力フォーマットに厳密に従い、斬新で魅力的な体験アイデアを1つ提案してください。
        `;
        const responseText = await sendToLLM(command);

        // レスポンスからideaをパース
        const match = responseText.match(/idea:\s*(\{.*\})/);
        if (!match) {
            console.error("Invalid response format from LLM:", responseText);
            return;
        }

        const ideaObject = JSON.parse(match[1]);
        console.log("Extracted idea:", ideaObject);

        // content を更新
        updateNoteContent(id, ideaObject.Title, ideaObject.Description, '#F6D745');

        // Descriptionを今後使う準備（使わないなら、この部分は削除してもOKです）
        console.log("Idea Description:", ideaObject.Description);
      } else { 
        console.log("すでに内容が記入されています");
      }
    }
  };

  const handleResize = async (id, newHeight) => {
    
    if (resizedNotes.includes(id)) { 
      setAlertMessage("This idea has already been decomposed."); // このアイデアは既に分解されています。
      setShowAlert(true); // アラートを表示
      setTimeout(() => setShowAlert(false), 3000); // 3秒後にアラートを自動的に非表示に
      return;
    }

    // 1. 該当する付箋のアイデア内容（content）を取得
    const note = notes.find(note => note.id === id);
    
    // 付箋の内容が空だったらアラートを表示して終了
    if (!note || note.content.trim() === "") {
        setAlertMessage("There is no idea to decompose. Please enter the content of the sticky note."); // 分解するアイデアがありません。付箋の内容を入力してください。
        setShowAlert(true); // アラートを表示
        setTimeout(() => setShowAlert(false), 3000); // 3秒後にアラートを自動的に非表示に
        return;
    }

    setLoading(true); // Start the loading indicator
    setResizedNotes([...resizedNotes, id]); // リサイズされたIDを追加

    // 2. LLMにリクエストを送信して内容を構成要素に分解する
    const command = `
次のタスクでは、入力アイデアに含まれる抽象的な「概念」を最大3つ抽出し、それぞれをTitle（英語タイトル）とDescription（英語の説明）に分けて出力してください。

### タスクの目的
「概念」は、アイデアの背後にあるテーマや価値、根本的な考え方、技術、学問を指します。私たちは、アイデアの本質を理解し、新しい視点を生み出すためのインスピレーションを得たいと考えています。

### 定義と抽出基準
- Title（タイトル）: 概念を簡潔に表す短い言葉またはフレーズ。例：「共感」「ライブ体験」「一体感」「自動運転技術」「エンターテインメント」
- Description（説明）: タイトルをより具体的に説明する一文または短い説明。例：「他者の感情や体験を共有することで、互いに理解し合うこと」「リアルタイムでの体験を全員で共有し、一緒に楽しむ」

### 出力フォーマット
出力は英語で、以下のフォーマットに従ってください。概念が3つ未満の場合は、存在する分だけ列挙してください。
concepts: [ { "Title": "Title1", "Description": "Description1" }, { "Title": "Title2", "Description": "Description2" }, { "Title": "Title3", "Description": "Description3" } ]


### 出力例
- アイデア: 「誰もが自由に意見を共有し、共感し合うオンラインプラットフォーム（英語）」
- 出力: concepts: [ { "Title": "自由な意見交換（英語）", "Description": "誰もが自分の意見を自由に表現できること（英語）" }, { "Title": "共感", "Description": "他者の意見や感情に対して理解を深めること" }, { "Title": "交流", "Description": "さまざまな人々と意見を共有し合うこと" } ]


### 入力アイデア
アイデア: ${note.content}${note.description ? ` - ${note.description}` : ""}

**注意:** 出力フォーマットに厳密に従い、必要な情報のみを含めてください。 
    `;
    try {
      const responseText = await sendToLLM(command);

      // 3. レスポンスから概念をパース
      const match = responseText.match(/concepts:\s*(\[[^\]]+\])/);
      if (!match) {
        console.error("Invalid response format from LLM:", responseText);
        return;
      }

      const conceptsArray = JSON.parse(match[1]);
      console.log("Extracted concepts:", conceptsArray);

      // 4. それぞれの概念に対して新しい付箋を追加
      const newNotes = conceptsArray.map((concept, index) => {
        let offset = 0;
        if (index === 0) offset = -90;
        if (index === 1) offset = 10;
        if (index === 2) offset = 130;
        return {
          id: idCounter + index, // ユニークなIDを設定
          content: `${concept.Title}`, // TitleとDescriptionを結合→${concept.Title}\n${concept.Description}
          description: `${concept.Description}`,
          x: note.x + offset,
          y: note.y + 150,
          bkcolor: '#9EDCFA',
          shape: 'circle', // 丸い付箋として追加,
          borderLine: '2px solid #000000'
        };
      });
      // アイデアの分解 2C99FF

      // 5. 既存の付箋に新しい付箋を追加して状態を更新
      setNotes((prevNotes) => [...prevNotes, ...newNotes]);
      setIdCounter((prevCounter) => prevCounter + newNotes.length); // IDカウンターを更新

      const newLines = newNotes.map(newNote => ({
        from: id, // Original note ID
        to: newNote.id, // Newly created decomposed note ID
        type: 'decomposition'
      }));

      // Add the new lines to the existing lines
      setLines([...lines, ...newLines]);

    } catch (error) {
      console.error("Error in handleResize while sending request to LLM:", error);
    } finally {
      // カウントを増やす
      if (measurementActive) {
        setCounts((prevCounts) => ({
          ...prevCounts,
          handleResize: prevCounts.handleResize + 1,
        }));
      }
      setLoading(false); // Ensure loading is stopped even if there's an error
    }
  };

  const handleDetach = (id) => {
    console.log(`Note ${id}'s detachable element was dragged away.`);
  };

  const handleNoteClick = (id) => {
    setSelectedNoteId(id); // クリックされた付箋のIDを保存
  };

  // AIによる新しいアイデアを生成する関数
  const generateNewIdea = async (x = 450, y = 100) => {
    console.log('AIによるアイデア生成を開始します...');
    setLoading(true); // Start the loading indicator

    // 既存のアイデアのタイトルをリスト化
    const existingIdeasTitles = generatedIdeas.map(idea => idea.Title);
    // console.log(generatedIdeas);

    const command = `
次のタスクでは、与えられたお題に基づいて、これまでに出てきたアイデアと異なる新しいアイデアを1つ生成してください。

### タスクの目的
お題に対する新たなアイデアを創出することが目的です。これまでに出てきた## 既存のアイデアと重複しないようにしてください。実現可能性はさほど考えなくて構いません。実現可能性が高いアイデア、独創的なアイデア、斬新なアイデア、精密なアイデアなど多様なアイデアを歓迎します。


### お題
${theme}

### 既存のアイデア
- ${existingIdeasTitles.join('\n- ')}

### 要求事項と期待されるアイデアの特徴
- お題と調和していると望ましいですが、自由な発想で考えてください。
- 既存のアイデアと重複しない新しいアイデアを提案してください。

### 出力フォーマット
アイデアは英語で、次のフォーマットに従って出力してください。
idea: { "Title": "アイデアのタイトル（英語）", "Description": "アイデアの詳細な説明（1～3文）" }

### 出力例
- お題: 「子供たちが自然の中で学べる新しい遊びを考えてください」
- 出力: idea: { "Title": "虫探しビンゴ", "Description": "待ち時間中に周りの自然の中から指定された虫や植物を見つけるビンゴゲーム。見つけたらスタッフに報告してスタンプをもらうことができ、全て見つけると小さなプレゼントがもらえます。" }

**注意:** 出力フォーマットに厳密に従い、斬新で魅力的な体験アイデアを1つ提案してください。
    `;

    try {
      const responseText = await sendToLLM(command);

      // レスポンスからアイデアをパース
      const match = responseText.match(/idea:\s*(\{.*\})/);
      if (!match) {
        console.error("Invalid response format from LLM:", responseText);
        return;
      }

      const ideaObject = JSON.parse(match[1]);
      console.log("Generated idea from AI:", ideaObject);

      // 新しい付箋をキャンバスに追加
      addStickyNote(ideaObject.Title, ideaObject.Description, '#FCF281', x, y, '2px solid #000000'); //#FCD300

      // 生成されたアイデアをステートに追加
      setGeneratedIdeas(prevIdeas => [...prevIdeas, ideaObject]);

    } catch (error) {
      console.error("Error generating new idea with AI:", error);
    } finally {
    // カウントを増やす
    if (measurementActive) {
      setCounts((prevCounts) => ({
        ...prevCounts,
        generateNewIdea: prevCounts.generateNewIdea + 1,
      }));
    }
    setLoading(false); // Ensure loading is stopped even if there's an error
    }
  };



  const generateIdeaSeeds = async (x = 450, y = 100) => {
    console.log('AIによるアイデアの種生成を開始します...');
    setLoading(true); // Start the loading indicator

    // 既存のコンセプトのタイトルをリスト化
    const existingConceptsTitles = generatedConcepts.map(concept => concept.Title);

    const command = `
次のタスクでは、与えられたお題に基づいて、これまでに出てきた要素と重複しない新しい**「アイデアの種」**を1つ生成してください。


### タスクの目的
- **アイデアの種（Idea Seeds）**とは、具体的なアイデアを生み出すための出発点となる抽象的なテーマ、価値観、洞察、トレンド、技術、メタファーなどを指します。
- 目的は、既存の要素と重複しない新しい視点やインスピレーションを提供し、創造的なアイデアの発想を促進することです。

### 定義と要求事項
アイデアの種は以下のいずれかに該当する必要があります。
- 抽象的なテーマ: 例「共創」「持続可能性」「エンパワーメント」
- 価値観: 例「信頼」「多様性」「透明性」
- 洞察（インサイト）: ユーザーの潜在的なニーズや行動から得られる理解。
- トレンド: 社会や技術の最新動向。例「人工知能の民主化」「リモートワークの普及」
- 技術: 新しい技術や手法。例「ブロックチェーン」「拡張現実（AR）」
- メタファー: 他の領域からの比喩や類推。例「旅としての学び」「ゲーム化された体験」

要求事項:
- 具体的なアイデアやソリューションではなく、抽象的で広範な視点を提供してください。
- 既存の要素と重複しない新しい「アイデアの種」を提案してください。

### お題
${theme}

### 既存の概念
- ${existingConceptsTitles.join('\n- ')}

### 定義
- Title（タイトル）: アイデアの種を簡潔に表す短い言葉またはフレーズ。例：「共創」「ブロックチェーン」「ゲーム化された体験」
- Description（説明）: タイトルをより具体的に説明する一文または短い説明。例：「他者の感情や体験を共有することで、互いに理解し合うこと」「リアルタイムでの体験を全員で共有し、一緒に楽しむ」

### 出力フォーマット
アイデアは英語で、次のフォーマットに従って出力してください。
idea: { "Title": "アイデアの種の英語タイトル（短い単語やフレーズ）", "Description": "アイデアの種の詳細な説明（1～3文）" }

**注意:** 出力フォーマットに厳密に従い、指定された要件を満たす「アイデアの種」を1つ提案してください。
    `;

    try {
      const responseText = await sendToLLM(command);

      // レスポンスからアイデアをパース
      const match = responseText.match(/idea:\s*(\{.*\})/);
      if (!match) {
        console.error("Invalid response format from LLM:", responseText);
        return;
      }

      const ideaObject = JSON.parse(match[1]);
      console.log("Generated idea from AI:", ideaObject);

      // 新しい付箋をキャンバスに追加
      // アイデアの概念 2C99FF
      addSeedNote(ideaObject.Title, ideaObject.Description, '#9EDCFA', x, y, '2px solid #000000');
      
      // 生成されたコンセプトをステートに追加
      setGeneratedConcepts(prevConcepts => [...prevConcepts, ideaObject]);

      console.log(generatedConcepts);

    } catch (error) {
      console.error("Error generating new idea with AI:", error);
    } finally {
      // カウントを増やす
      if (measurementActive) {
        setCounts((prevCounts) => ({
          ...prevCounts,
          generateIdeaSeeds: prevCounts.generateIdeaSeeds + 1,
        }));
      }
      setLoading(false); // Ensure loading is stopped even if there's an error
    }
  };
   // 計測開始の関数
  const handleStartMeasurement = (name) => {
    if (!name.trim()) {
      alert('氏名を入力してください。');
      return;
    }
    setUserName(name);
    setMeasurementActive(true);
    // カウンターをリセット
    setCounts({
      combineStickyNotes: 0,
      handleResize: 0,
      generateNewIdea: 0,
      generateIdeaSeeds: 0,
      addStickyNote: 0,
      addSeedNote: 0,
    });
    alert('計測を開始しました。');
  };

  // 計測終了の関数
  const handleEndMeasurement = () => {
    if (!measurementActive) {
      alert('計測は開始されていません。');
      return;
    }

    // 最終的なアイデアと要素の数をカウント
    const finalIdeaCount = notes.filter(note => note.shape === 'square').length;
    const finalSeedCount = notes.filter(note => note.shape === 'circle').length;

    setMeasurementActive(false);
    alert('計測を終了しました。CSVファイルをダウンロードします。');

    // CSVファイルを生成してダウンロード
    const csvContent = generateCSV(finalIdeaCount, finalSeedCount);
    downloadCSV(csvContent);

    // カウンターと氏名をリセット
    setCounts({
      combineStickyNotes: 0,
      handleResize: 0,
      generateNewIdea: 0,
      generateIdeaSeeds: 0,
      addStickyNote: 0,
      addSeedNote: 0,
    });
    setUserName('');
  };

  // CSVファイルの生成
  const generateCSV = (finalIdeaCount, finalSeedCount) => {
    const header = [
      '氏名',
      'アイデア結合回数',
      'アイデア分解回数',
      'AIアイデア生成回数',
      'AI要素生成回数',
      '新しいアイデア付箋追加数',
      '新しい要素付箋追加数',
      'アイデア付箋総数',
      '要素付箋総数',
    ];
    const data = [
      userName,
      counts.combineStickyNotes,
      counts.handleResize,
      counts.generateNewIdea,
      counts.generateIdeaSeeds,
      counts.addStickyNote,
      counts.addSeedNote,
      finalIdeaCount,
      finalSeedCount,
    ];
    const csvRows = [];
    csvRows.push(header.join(','));
    csvRows.push(data.join(','));
    return csvRows.join('\n');
  };

  // CSVファイルのダウンロード
  const downloadCSV = (csvContent) => {
    const date = new Date();
    const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `${userName}_${dateString}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <>
      {showAlert && (
        <div style={{
          position: 'fixed',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#F95959',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 9999
        }}>
          {alertMessage}
        </div>
      )}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div className="progress-indicator">Loading...</div>
        </div>
      )}
      <Header />
      <Sidebar
        addStickyNote={addStickyNote}
        sendToLLM={sendToLLM}
        setTheme={setTheme}
        addSeedNote={addSeedNote}
        generateNewIdea={generateNewIdea}
        generateIdeaSeeds={generateIdeaSeeds}
        generateEmptyIdea={generateEmptyIdea}
        generateEmptySeed={generateEmptySeed}
        onStartMeasurement={handleStartMeasurement} // 追加
        onEndMeasurement={handleEndMeasurement}     // 追加
        counts={counts}                             // 追加
        measurementActive={measurementActive} // 追加
      />
      <div 
        ref={dropRef}
        className="canvas-container"  // クラス名を追加
        style={{
          padding: '0px', 
          position: 'relative', 
          width: '100%', 
          height: '100vh', 
          overflow: 'auto',
          backgroundColor: '#F2F2F2',
          backgroundImage: 'radial-gradient(#D2D2D2 1px, transparent 1px)', // グレードット柄
          backgroundSize: '20px 20px', // ドット間隔の設定
          border: '1px solid #ddd',
          boxSizing: 'border-box',
        }}
      >
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '3000px', height: '2000px', zIndex: 0 }}>
          {renderLinesBetweenNotes()}
        </svg>
        <div
          style={{ 
              position: 'relative', 
              width: '3000px',  // Large width
              height: '2000px', // Large height
          }}>
          {notes.map(note => (
            <StickyNote 
              key={note.id} 
              id={note.id} 
              content={note.content}
              description={note.description} // Added this line
              x={note.x} 
              y={note.y} 
              borderLine={note.borderLine}  // Ensure this line is added
              shape={note.shape}
              lastX={lastXPosition} // 最後の位置を渡す
              setLastX={setLastXPosition} // 振る基準の位置をセットする
              bkcolor={note.bkcolor}
              onDelete={deleteNote} 
              onMove={moveNote} 
              onDrop={handleDrop} 
              onContentChange={updateNoteContent}  // 付箋内容の変更を反映する
              onShakeDetected={handleShakeDetected} 
              onClick={handleNoteClick}  // クリックイベントを渡す
              isSelected={note.id === selectedNoteId}  // 選択されているかどうかを渡す
              onDetach={handleDetach}
              onResize={handleResize} // リサイズ情報を受け取るコールバック関数を渡す
              resetResize={() => setResizedNotes([])} // 別の付箋がリサイズされた際にリセット
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;





/*
今日やること
DONE: Overleaf整えてから、先生に報告
DONE: isSelected時は最前面に表示されないとDescriptionが隠れちゃう
DONE: 実験のインタラクション回数の計測&csv出力
DONE: 実験の流れをデモ
DONE: プロンプトエンジニアリングの確認
DONE: お題を決める


TODO（最優先）: Related Workの執筆を進める。2.3アイデアを編集すること、結合分解することの意味、試行錯誤を加速させると何がいいのか？
TODO: アイデアの結合と分解のフレームワークがあるなら、それを使ってアイデアを結合してみる


*/