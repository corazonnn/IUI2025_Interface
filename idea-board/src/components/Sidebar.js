import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import i18next from '../i18n'; // 追加
import react_i18next from 'i18next';

const Sidebar = ({
  addStickyNote,
  addSeedNote,
  sendToLLM,
  setTheme,
  generateNewIdea,
  generateIdeaSeeds,
  onStartMeasurement,
  onEndMeasurement,
  counts,
  measurementActive,
  generateEmptyIdea,
  generateEmptySeed,
}) => {
  // const { t } = useTranslation(); // 翻訳関数を取得
  const [languageChanged, setLanguageChanged] = useState(false);

  const [isOpen, setIsOpen] = useState(true);  // デフォルトで開いた状態に設定
  const [llmCommand, setLlmCommand] = useState('');
  // const [theme, setLocalTheme] = useState('10年後のコンビニエンスストアはどのように進化しているだろうか？'); // お題のデフォルト
  const [theme, setLocalTheme] = useState('How will convenience stores evolve in 10 years?');
  const [isGenerating, setIsGenerating] = useState(false); // アイデア生成中の状態を管理
  const [name, setName] = useState(''); // 氏名の状態を追加
  const isMeasurement = false;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const [, dragStickyNote] = useDrag(() => ({
    type: 'STICKY_NOTE',
    item: { shape: 'square' },
  }));

  const [, dragSeedNote] = useDrag(() => ({
    type: 'STICKY_NOTE',
    item: { shape: 'circle' },
  }));

    // Drag setup for AI-generated idea
  const [, dragAIIdea] = useDrag({
    type: 'AI_IDEA',
    item: { shape: 'idea' }, // You can customize this item if needed
  });

  // Drag setup for AI-generated seed
  const [, dragAISeed] = useDrag({
    type: 'AI_IDEA',
    item: { shape: 'seed' },
  });

  // const handleSendToLLM = () => {
  //   sendToLLM(llmCommand);
  //   setLlmCommand(''); // テキストエリアをクリア
  // };

  // const handleThemeChange = (e) => {
  //   const newTheme = e.target.value;
  //   setLocalTheme(newTheme);  // ローカルステート更新
  //   setTheme(newTheme);  // 親コンポーネントにお題を送信
  // };

  // StickyNote生成用関数
  const handleAddStickyNote = async () => {
    setIsGenerating(true); // フィードバック開始
    await generateEmptyIdea(); // 実際の付箋生成関数の呼び出し
    setIsGenerating(false); // フィードバック終了
  };

  // SeedNote生成用関数
  const handleAddSeedNote = async () => {
    setIsGenerating(true); // フィードバック開始
    await generateEmptySeed(); // 実際の付箋生成関数の呼び出し
    setIsGenerating(false); // フィードバック終了
  };

  // LLMを使用した新しいアイデア生成
  const handleGenerateNewIdea = async () => {
    setIsGenerating(true); // フィードバック開始
    await generateNewIdea(); // 実際の生成処理
    setIsGenerating(false); // フィードバック終了
  };

  // LLMを使用した新しい概念生成
  const handleGenerateIdeaSeeds = async () => {
    setIsGenerating(true); // フィードバック開始
    await generateIdeaSeeds(); // 実際の生成処理
    setIsGenerating(false); // フィードバック終了
  };
  
  // measurementActive の変化を監視し、計測終了時に氏名をリセット
  useEffect(() => {
    if (!measurementActive) {
      setName('');
    }
  }, [measurementActive]);

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

  return (
    <div style={{
      position: 'fixed',
      top: '30px',  // Headerの高さに合わせて配置
      left: '10px',  // 左端から少し離す
      height: '90vh', // 高さを調整 height: '700px',
      width: isOpen ? '350px' : '50px',  // 閉じた状態でも幅を残してボタンを表示
      backgroundColor: '#ffffff',  // 背景色をグレーに
      color: 'black',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',  // ドロップシャドウを追加
      transition: 'width 0.3s ease',  // スムーズな開閉アニメーション
      zIndex: 1000,
      overflow: 'hidden',  // 開閉時の中身を隠す
    }}>
      {/* 計測中の緑の丸を表示 */}
      {measurementActive && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '10px',
            width: '15px',
            height: '15px',
            backgroundColor: '#55DF3F',
            borderRadius: '50%',
          }}
        />
      )}
      <button onClick={toggleSidebar} style={{
        backgroundColor: 'transparent',
        border: 'none',
        color: 'black',
        fontSize: '20px',
        padding: '10px',
        cursor: 'pointer',
        position: 'absolute',
        top: '10px',
        right: '10px',
      }}>
        {isOpen ? '×' : '+'}
      </button>
      {isOpen && (
        <div
          style={{
            padding: '20px',
            overflowY: 'auto', // スクロールを可能にする
            height: '100%',    // 高さを親要素に合わせる
            boxSizing: 'border-box', // パディングを含めて高さを計算
          }}
        >
          <h3 style={{ marginBottom: '0px' }}>{i18next.t('Theme')}</h3>
          <hr style={{
            border: 'none',  // デフォルトの境界線を消す
            borderTop: '1px solid #ddd',  // グレーの線を上部に追加
            marginBottom: '10px',  // 上下の余白
          }} />
          {/* テキストエリアから通常のテキスト表示に変更 */}
          <div style={{
            width: '100%',
            padding: '10px',
            boxSizing: 'border-box',
            marginBottom: '20px',
            borderRadius: '5px',
            backgroundColor: '#F8F9FA',  // 少しグレーの背景色にして視認性を高める  
            border: '1px solid #ddd',
            color: '#333',
            lineHeight: '1.8',  // 行間を広げて読みやすくする
            maxHeight: '200px',
            overflowY: 'auto', // テキストが長い場合のスクロール対応
            whiteSpace: 'pre-wrap',  // テキストの改行を保持
            fontSize: '12px',
          }}>
            {theme}
          </div>
          {/* Divider */}
          
          {/* <textarea
            value={theme}
            onChange={handleThemeChange}  // お題変更時にテーマをセット
            style={{
              width: '100%',
              height: '150px',
              padding: '10px',
              boxSizing: 'border-box',
              marginBottom: '10px',
              borderRadius: '5px',
            }}
            placeholder="お題を入力してください..."
          /> */}
          {/* 新しい付箋の作成、以下の付箋をキャンバス内にドラッグ&ドロップして新しい付箋を追加しよう */}
          <h3 style={{ marginBottom: '0px' }}>{i18next.t('Create a new sticky note')}</h3>
          <hr style={{
            border: 'none',  // デフォルトの境界線を消す
            borderTop: '1px solid #ddd',  // グレーの線を上部に追加
            marginBottom: '10px',  // 上下の余白
          }} />
          <div style={{ marginBottom: '10px', fontSize: '12px' }}>{i18next.t('Create Function Description')}</div>
          {/* 見本の付箋を横並びに配置 */}
          <div style={{
            display: 'flex',  // 横並びに配置
            gap: '30px',  // 付箋同士の間隔
            marginBottom: '0px',
            alignItems: 'flex-end',
          }}>
            {/* 見本の付箋（square） */}
            <div ref={dragStickyNote} style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#FCF281',
              border: '1px solid #ddd',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '10px',
              cursor: 'pointer',
              boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.2s ease', // ホバー時のアニメーションを追加
              opacity: isGenerating ? 0.5 : 1, // ボタン無効時の視覚的な変化
              pointerEvents: isGenerating ? 'none' : 'auto', // ボタン無効化
            }}
              onClick={handleAddStickyNote} // 見本クリックで四角の付箋を追加
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} // ホバーで拡大
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isGenerating ? '...' : i18next.t('Ideas')}
            </div>
            {/* 見本の付箋（circle） */}
            <div  ref={dragSeedNote} style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#9EDCFA',
              borderRadius: '50%',
              border: '1px solid #ddd',
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.2s ease', // ホバー時のアニメーションを追加
              opacity: isGenerating ? 0.5 : 1, // ボタン無効時の視覚的な変化
              pointerEvents: isGenerating ? 'none' : 'auto', // ボタン無効化
            }}
              onClick={handleAddSeedNote} // 見本クリックで丸い付箋を追加
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} // ホバーで拡大
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isGenerating ? '...' : i18next.t('Elements')}
            </div>
          </div>
          <div style={{
            width: '100%',
            padding: '10px',
            boxSizing: 'border-box',
            marginBottom: '20px',
            borderRadius: '5px',
            backgroundColor: '#F8F9FA',  // 少しグレーの背景色にして視認性を高める
            // border: '1px solid #ddd',
            color: '#333',
            lineHeight: '1.8',  // 行間を広げて読みやすくする
            maxHeight: '200px',
            overflowY: 'auto', // テキストが長い場合のスクロール対応
            whiteSpace: 'pre-wrap',  // テキストの改行を保持
            fontSize: '12px',
          }}>
            <strong>{i18next.t('Ideas')}:</strong> {i18next.t('Ideas Description')}<br />
            <strong>{i18next.t('Elements')}:</strong> {i18next.t('Elements Description')}
          </div>
          {/* AIによるアイデア生成
          以下の付箋をキャンバス内にドラッグ&ドロップしてAIアイデアを追加しよう */}
          <h3 style={{ marginBottom: '0px' }}>{i18next.t('AI-generated ideas')}</h3>
          <hr style={{
            border: 'none',  // デフォルトの境界線を消す
            borderTop: '1px solid #ddd',  // グレーの線を上部に追加
            marginBottom: '10px',  // 上下の余白
          }} />
          <div style={{ marginBottom: '10px', fontSize: '12px' }}>{  i18next.t('Drag and drop the following sticky note into the canvas to add an AI-generated idea')}</div>
          {/* 見本の付箋を横並びに配置 */}
          <div style={{
            display: 'flex',  // 横並びに配置
            gap: '30px',  // 付箋同士の間隔
            marginBottom: '0px',
            alignItems: 'flex-end',
          }}>
            {/* 見本の付箋（square） */}
            <div ref={dragAIIdea} style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#FCF281',
              border: '2px solid #000000',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '10px',
              cursor: 'pointer',
              boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.2s ease', // ホバー時のアニメーションを追加
              opacity: isGenerating ? 0.5 : 1, // ボタン無効時の視覚的な変化
              pointerEvents: isGenerating ? 'none' : 'auto', // ボタン無効化
            }}
              onClick={handleGenerateNewIdea} // 見本クリックで四角の付箋を追加
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} // ホバーで拡大
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isGenerating ? '...' : i18next.t('Ideas')}
            </div>
            {/* 見本の付箋（circle） */}
            <div ref={dragAISeed} style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#9EDCFA',
              borderRadius: '50%',
              border: '2px solid #000000',
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.2s ease', // ホバー時のアニメーションを追加
              opacity: isGenerating ? 0.5 : 1, // ボタン無効時の視覚的な変化
              pointerEvents: isGenerating ? 'none' : 'auto', // ボタン無効化
            }}
              onClick={handleGenerateIdeaSeeds} // 見本クリックで丸い付箋を追加
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} // ホバーで拡大
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isGenerating ? '...' : i18next.t('Elements')}
            </div>
          </div>
          {/* 実験の計測セクション */}
          <h3 style={{ marginBottom: '0px' }}>{i18next.t('Measurement of experiment')}</h3>
          <hr
            style={{
              border: 'none',
              borderTop: '1px solid #ddd',
              marginBottom: '10px',
            }}
          />
          <div style={{ marginBottom: '10px' }}>
            <label>
              {i18next.t('Name')}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  boxSizing: 'border-box',
                }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <button
              onClick={() => onStartMeasurement(name)} // 氏名を渡して計測開始
              style={{
                padding: '10px',
                marginRight: '10px',
                cursor: 'pointer',
              }}
            >
              {i18next.t('Start measurement')}
            </button>
            <button
              onClick={onEndMeasurement}
              style={{ padding: '10px', cursor: 'pointer' }}
            >
              {i18next.t('End measurement')}
            </button>
          </div>

          {/* カウント結果の表示 */}
          <div
            style={{
              backgroundColor: '#F8F9FA',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '20px',
              fontSize: '12px',
            }}
          >
            <h4>{i18next.t('Count results')}</h4>
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              <li>{i18next.t('Number of idea combinations')}: {counts.combineStickyNotes}</li>
              <li>{i18next.t('Number of idea decompositions')}: {counts.handleResize}</li>
              <li>{i18next.t('Number of AI idea generations')}: {counts.generateNewIdea}</li>
              <li>{i18next.t('Number of AI element generations')}: {counts.generateIdeaSeeds}</li>
              <li>{i18next.t('Number of new idea sticky notes added')}: {counts.addStickyNote}</li>
              <li>{i18next.t('Number of new element sticky notes added')}: {counts.addSeedNote}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;





          
          {/* <h3 style={{ marginBottom: '10px' }}>新しい付箋の作成</h3>
          <button onClick={() => addStickyNote()} style={{
            backgroundColor: '#3859FF',
            color: 'white',
            border: 'none',
            padding: '10px',
            marginBottom: '20px',
            cursor: 'pointer',
            width: '100%',
            borderRadius: '5px',
          }}>
            付箋を追加
          </button>
          <button onClick={() => addSeedNote()} style={{
            backgroundColor: '#FF5733',
            color: 'white',
            border: 'none',
            padding: '10px',
            marginBottom: '20px',
            cursor: 'pointer',
            width: '100%',
            borderRadius: '5px',
          }}>
            アイデアの種を追加
          </button> */}
          {/* <h3 style={{ marginBottom: '10px' }}>AIによるアイデア生成</h3>
          <button onClick={generateNewIdea} style={{
            backgroundColor: '#28A745',
            color: 'white',
            border: 'none',
            padding: '10px',
            cursor: 'pointer',
            width: '100%',
            borderRadius: '5px',
            marginBottom: '20px',
          }}>
            AIによるアイデア生成
          </button>
          <button onClick={generateIdeaSeeds} style={{
            backgroundColor: 'orange',
            color: 'white',
            border: 'none',
            padding: '10px',
            cursor: 'pointer',
            width: '100%',
            borderRadius: '5px',
            marginBottom: '20px',
          }}>
            AIによるアイデアの種生成
          </button>
          <h3 style={{ marginBottom: '10px' }}>LLMに質問する</h3>
          <textarea
            value={llmCommand}
            onChange={(e) => setLlmCommand(e.target.value)}
            style={{
              width: '100%',
              height: '100px',
              padding: '10px',
              boxSizing: 'border-box',
              marginBottom: '10px',
              borderRadius: '5px',
            }}
            placeholder="LLMに詳細な指示を送信..."
          />
          <button onClick={handleSendToLLM} style={{
            backgroundColor: '#3859FF',
            color: 'white',
            border: 'none',
            padding: '10px',
            cursor: 'pointer',
            width: '100%',
            borderRadius: '5px',
          }}>
            送信
          </button> */}