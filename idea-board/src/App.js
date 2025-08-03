import React, { useState, useEffect } from 'react';
import StickyNote from './components/StickyNote';
import Header from './components/Header';  // ヘッダーのインポート
import Sidebar from './components/Sidebar';  // サイドバーのインポート
import { useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import i18next from './i18n'; // 追加
import react_i18next from 'i18next';

import {
  combineIdeasPrompt,
  generateNewIdeaPrompt,
  decomposeIdeaPrompt,
  generateIdeaSeedPrompt,
  generateIdeaOnShakePrompt,
  rebuildIdeaPrompt,
  replaceElementPrompt,
} from './prompts'; // プロンプトをインポート


function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null); // 選択された付箋のIDを管理
  const [lastPair, setLastPair] = useState({ draggedId: null, targetId: null });
  // const [theme, setTheme] = useState('USJのマリオカートの待ち時間60分をお客さんに楽しんでもらうためには？');  // ブレストのお題を管理
  // const [theme, setTheme] = useState('USJのマリオカートのアトラクションには、90分の待ち時間があります。待っている人は座ることができず、来場者のほとんどが一緒に来た人と話して待つなどしています。しかし、その待ち時間の長さから退屈している来場者もちらほら見られます。パーク責任者であるあなたは『来場者が今より退屈しない待ち時間の体験』をデザインしてください。実現可能性はさほど考えず、自由な発想をしてください。');  // ブレストのお題を管理
  const [theme, setTheme] = useState('10年後のコンビニエンスストアはどのように進化しているだろうか？（How will convenience stores evolve in the next 10 years?）'); // お題のデフォルト
  
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

  // 言語設定の検知のため
  const [languageChanged, setLanguageChanged] = useState(false);

  // 現在の言語を取得
  const currentLanguage = i18next.language;

  const [replaceFlag, setReplaceFlag] = useState(false);

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


  // 削減モード中かどうかの判定
  const handleIfReducingModeActive = () => {
    if (isReducingModeActive) {
      console.log(i18next.t('isReducingModeActive Alert'));
      setAlertMessage(i18next.t('isReducingModeActive Alert'));
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return true; // 削減モード中であることを示す
    }
    return false; // 削減モード中でなければfalseを返す
  };

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
    
    if (handleIfReducingModeActive()) return; // trueが返ってきたらここで処理中断

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
    if (handleIfReducingModeActive()) return; // trueが返ってきたらここで処理中断

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

  // ######################   アイデアの結合 ######################
  // 異なる付箋をドラッグ&ドロップした際に、両方の内容を結合した新しい付箋を作成
  const combineStickyNotes = async (draggedNote, targetNote) => {
    const isAlreadyCombined = notes.some(note =>
        note.sourceIds &&
        note.sourceIds.includes(draggedNote.id) &&
        note.sourceIds.includes(targetNote.id)
    );

    if (handleIfReducingModeActive()) return; // trueが返ってきたらここで処理中断

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

    // 指示プロンプト作成
    const language = i18next.language === 'en' ? '英語' : '日本語';
    const combinedContent = combineIdeasPrompt(theme, draggedNote, targetNote, language);

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
                {type === 'combine' ? i18next.t('Relationship Combine') : i18next.t('Relationship Decompose')}
              </text>
            </g>
          );
        }
      // }
    }
    return linesToRender;
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

  useEffect(() => {
    const handleLanguageChanged = () => {
      setLanguageChanged(prevState => !prevState);
    };

    react_i18next.on('languageChanged', handleLanguageChanged);

    // クリーンアップ関数でイベントリスナーを解除
    return () => {
      react_i18next.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  // ######################   アイデアの分解 ######################
  const handleResize = async (id, newHeight) => {
    if (handleIfReducingModeActive()) return; // trueが返ってきたらここで処理中断
    
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
    const language = i18next.language === 'en' ? '英語' : '日本語';
    const command = decomposeIdeaPrompt(note.content, note.description, language);

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
        if (index === 0) offset = -140;
        if (index === 1) offset = 10;
        if (index === 2) offset = 180;
        return {
          id: idCounter + index, // ユニークなIDを設定
          content: `${concept.Title}`, // TitleとDescriptionを結合→${concept.Title}\n${concept.Description}
          description: `${concept.Description}`,
          x: note.x + offset,
          y: note.y + 200,
          bkcolor: '#9EDCFA',
          shape: 'circle', // 丸い付箋として追加,
          borderLine: '2px solid #000000',
          isReducing: true // ★追加：この要素は削減モード対象
        };
      });
      // アイデアの分解 2C99FF

      // 元のアイデア付箋にもisReducingを付与
      const updatedNotes = notes.map(n => 
        n.id === id ? { ...n, isReducing: true } : n
      );

      setNotes(updatedNotes); // 変更を保存

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

  const handleNoteClick = (id) => {
    setSelectedNoteId(id); // クリックされた付箋のIDを保存
  };

  // ######################   アイデアの生成 ######################
  // AIによる新しいアイデアを生成する関数
  const generateNewIdea = async (x = 450, y = 100) => {
    if (handleIfReducingModeActive()) return; // trueが返ってきたらここで処理中断

    console.log('AIによるアイデア生成を開始します...');
    setLoading(true); // Start the loading indicator

    // 既存のアイデアのタイトルをリスト化
    const existingIdeasTitles = generatedIdeas.map(idea => idea.Title);
    // console.log(generatedIdeas);

    const language = i18next.language === 'en' ? '英語' : '日本語';
    const command = generateNewIdeaPrompt(theme, existingIdeasTitles, language);

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


  // ######################   要素アイデアの生成 ######################
  const generateIdeaSeeds = async (x = 450, y = 100) => {
    if (handleIfReducingModeActive()) return; // trueが返ってきたらここで処理中断

    console.log('AIによるアイデアの種生成を開始します...');
    setLoading(true); // Start the loading indicator

    // 既存のコンセプトのタイトルをリスト化
    const existingConceptsTitles = generatedConcepts.map(concept => concept.Title);

    const language = i18next.language === 'en' ? '英語' : '日本語';
    const command = generateIdeaSeedPrompt(theme, existingConceptsTitles, language);

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

    // 全てのアイデアを別のCSVファイルとして出力
    generateIdeasCSV();

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

  // アイデアのリストをCSVとしてエクスポートする関数
  const generateIdeasCSV = () => {
    const header = ['ID', 'Content', 'Description', 'Shape', 'X', 'Y', 'Color'];
    const csvRows = [header.join(',')]; // ヘッダーを追加

    // notes配列をループして行を作成
    notes.forEach(note => {
      const row = [
        note.id,
        `"${note.content.replace(/"/g, '""')}"`, // CSVエスケープ
        `"${note.description.replace(/"/g, '""')}"`, // CSVエスケープ
        note.shape,
        note.x,
        note.y,
        note.bkcolor,
      ];
      csvRows.push(row.join(','));
    });

    // CSVデータをBlobとして生成
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // ファイル名を設定
    const date = new Date();
    const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `Ideas_${userName}_${dateString}.csv`;

    // ダウンロードリンクを作成してクリック
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // 削減モードかどうかを判定
  const isReducingModeActive = notes.some(n => n.isReducing === true);

  // 削減モード用バウンディングボックス計算
  let boxX = 0, boxY = 0, boxWidth = 0, boxHeight = 0;
  if (isReducingModeActive) {
    const reducingNotes = notes.filter(n => n.isReducing);
    if (reducingNotes.length > 0) {
      const padding = 10; // 枠線周囲の余白

      // 各ノートのBounding Boxを計算
      const noteBounds = reducingNotes.map(n => {
        const noteW = (n.shape === 'circle') ? 80 : 120; 
        const noteH = (n.shape === 'circle') ? 80 : 120;
        return {
          x1: n.x,
          y1: n.y,
          x2: n.x + noteW,
          y2: n.y + noteH
        };
      });

      const minX = Math.min(...noteBounds.map(b => b.x1));
      const minY = Math.min(...noteBounds.map(b => b.y1));
      const maxX = Math.max(...noteBounds.map(b => b.x2));
      const maxY = Math.max(...noteBounds.map(b => b.y2));

      boxX = minX - padding;
      boxY = minY - padding;
      boxWidth = (maxX - minX) + padding * 2;
      boxHeight = (maxY - minY) + padding * 2;
    }
  }

  // 要素の入れ替え機能
  const onReplaceElement = async (id) => {
    console.log(`onReplaceElement called with id: ${id}`);

    // 1. 対象要素付箋を取得
    const note = notes.find(n => n.id === id && n.isReducing && n.shape === 'circle');
    if (!note) {
      console.error("No valid element found for replacement.");
      return;
    }

    // 2. プロンプト準備
    const language = i18next.language === 'en' ? '英語' : '日本語';
    const prompt = replaceElementPrompt(theme, note.content, note.description || "", language);

    setLoading(true); // LLM問い合わせ前にローディング開始

    try {
      const responseText = await sendToLLM(prompt);

      // 3. レスポンス解析
      const match = responseText.match(/idea:\s*(\{.*\})/);
      if (!match) {
        console.error("Invalid response format from LLM:", responseText);
        // この段階ではエラー時に何もしないで戻るのみ
        return;
      }

      const ideaObject = JSON.parse(match[1]);
      if (!ideaObject.Title || !ideaObject.Description) {
        console.error("Invalid idea format from LLM:", ideaObject);
        return;
      }

      // 4. ノートを更新: 該当ノートのcontentとdescriptionを新要素に置き換える
      setNotes(prevNotes => prevNotes.map(n => 
        n.id === id ? { ...n, content: ideaObject.Title, description: ideaObject.Description } : n
      ));


    } catch (error) {
      console.error("Error in onReplaceElement LLM call:", error);
    } finally {
      setReplaceFlag(true); // replaceFlagをtrueに設定
      setLoading(false); // LLM問い合わせ終了後にローディング停止
    }
  };

  const handleConfirmReduction = async () => {
    console.log('replaceFlag:', replaceFlag);
    console.log('確定ボタンが押されました（LLM連携）');

    // 削減モード中のノートを検索
    const reducingNotes = notes.filter(n => n.isReducing);

    console.log('削減モード中のノート:', reducingNotes);

    if (reducingNotes.length === 0) {
      // 削減モードじゃない場合は何もしない
      return;
    }

    // 元のアイデア付箋（黄色、shapeがsquareでisReducing=trueなものを想定）
    const originalIdeaNote = reducingNotes.find(n => n.shape === 'square');

    if (!originalIdeaNote) {
      console.warn("元のアイデア付箋が見つかりません。");
      // isReducingフラグ解除して終了
      setNotes(prevNotes => prevNotes.map(n => ({ ...n, isReducing: false })));
      return;
    }

    // 残った要素付箋（circleかつisReducing=true）を取得
    const remainingElements = reducingNotes.filter(n => n.shape === 'circle');

    

    // 「要素が1つも削除されない」状態を判定: 初期の要素数と現在残っている要素数が同じ
    if (remainingElements.length === 3 && !replaceFlag) {
      console.log('要素が削除されていないため、何も変更せず終了');
      setReplaceFlag(false);
      setNotes(prevNotes => prevNotes.map(n => ({ ...n, isReducing: false, initialElementCount: undefined })));
      return;
    }

    // remainingElementsが空でも正常動作とする仕様に基づき、そのままLLM呼び出し可
    // TitleとDescriptionを利用するため、オブジェクト構造を整える
    const elementsForPrompt = remainingElements.map(el => ({
      Title: el.content,
      Description: el.description || ""
    }));

    const language = i18next.language === 'en' ? '英語' : '日本語';
    const prompt = rebuildIdeaPrompt(theme, elementsForPrompt, language);

    console.log("Prompt for LLM:", prompt);

    setLoading(true); // LLM問い合わせ前にローディング開始（既存のloading stateを想定）

    try {
      const responseText = await sendToLLM(prompt);

      // LLM応答からideaオブジェクトを抽出
      const match = responseText.match(/idea:\s*(\{.*\})/);
      if (!match) {
        console.error("Invalid response format from LLM:", responseText);
        // isReducingフラグ解除して通常モードへ
        setNotes(prevNotes => prevNotes.map(n => ({ ...n, isReducing: false })));
        return;
      }

      const ideaObject = JSON.parse(match[1]);
      if (!ideaObject.Title || !ideaObject.Description) {
        console.error("Invalid idea format from LLM:", ideaObject);
        // isReducingフラグ解除して通常モードへ
        setNotes(prevNotes => prevNotes.map(n => ({ ...n, isReducing: false })));
        return;
      }

      // もとのアイデア付箋を更新
      setNotes(prevNotes => prevNotes.map(n => {
        if (n.id === originalIdeaNote.id) {
          return {
            ...n,
            content: ideaObject.Title,
            description: ideaObject.Description,
            isReducing: false
          };
        } else {
          // 他のノートからもisReducingフラグを外す
          return { ...n, isReducing: false };
        }
      }));

    } catch (error) {
      console.error("Error in handleConfirmReduction with LLM:", error);
      // エラーハンドリング時もisReducingは外して終了
      setNotes(prevNotes => prevNotes.map(n => ({ ...n, isReducing: false })));
    } finally {
      setLoading(false); // LLM問い合わせ終了後にローディング停止
    }

  };

  const onDeleteElement = (id) => {
    // idが一致するノートを削除
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
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
        theme={theme}
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
          // border: '1px solid #ddd',
          // border: isReducingModeActive ? '2px solid blue' : '1px solid #ddd', // ★削減モード時に青い枠線
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
              onDeleteElement={onDeleteElement} // 新たに追加
              onMove={moveNote} 
              onDrop={handleDrop} 
              onContentChange={updateNoteContent}  // 付箋内容の変更を反映する
              onClick={handleNoteClick}  // クリックイベントを渡す
              isSelected={note.id === selectedNoteId}  // 選択されているかどうかを渡す
              onResize={handleResize} // リサイズ情報を受け取るコールバック関数を渡す
              resetResize={() => setResizedNotes([])} // 別の付箋がリサイズされた際にリセット
              isReducing={note.isReducing}  // 付箋にisReducing情報を渡す
              onReplaceElement={onReplaceElement}
            />
          ))}
          {/* 削減モードアクティブ時のみ、青い枠線と確定ボタンを表示 */}
          {isReducingModeActive && (
            <div style={{
              position: 'absolute',
              left: `${boxX}px`,
              top: `${boxY}px`,
              width: `${boxWidth}px`,
              height: `${boxHeight}px`,
              border: '2px solid #0B99FF',
              boxSizing: 'border-box',
              pointerEvents: 'none', // 枠線自身は操作しない
              zIndex: 999 // 枠線をノートより前面へ
            }}>
              {/* 枠線内部に確定ボタンを配置（右下） */}
              <div style={{
                position: 'absolute',
                right: '-80px',
                bottom: '0px',
                pointerEvents: 'auto' // ボタンはクリック可能
              }}>
                <button
                  onClick={handleConfirmReduction}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#fff',
                    color: '#1E1E1E',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    boxShadow: '0px 0px 5px rgba(0,0,0,0.2)',
                    fontSize: '14px'
                  }}
                >
                  {i18next.t('DONE button')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default App;