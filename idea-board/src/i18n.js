// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 翻訳リソースは後で追加します
// 翻訳リソースの定義
const resources = {
  en: {
    translation: {
      'Theme': 'Theme',
      'Create a new sticky note': 'Create a new sticky note',
      'Create Function Description': 'Drag and drop the following sticky note into the canvas to add a new one',
      'Ideas': 'Ideas',
      'Elements': 'Elements',
      'Ideas Description': 'Concrete solutions to the topic',
      'Elements Description':'New perspectives or inspiration for idea generation (e.g., well-being, empathy, environmental consideration...)',
      'AI-generated ideas': 'AI-generated ideas',
      'Drag and drop the following sticky note into the canvas to add an AI-generated idea': 'Drag and drop the following sticky note into the canvas to add an AI-generated idea',
      'Measurement of experiment': 'Measurement of experiment',
      'Name': 'Name',
      'Start measurement': 'Start measurement',
      'End measurement': 'End measurement',
      'Count results': 'Count results',
      'Number of idea combinations': 'idea combinations',
      'Number of idea decompositions': 'idea decompositions',
      'Number of AI idea generations': 'AI idea generations',
      'Number of AI element generations': 'AI element generations',
      'Number of new idea sticky notes added': 'new idea sticky notes added',
      'Number of new element sticky notes added': 'new element sticky notes added',
      'Relationship Combine': 'Combine',
      'Relationship Decompose': 'Decompose',
      'isReducingModeActive Alert': 'You cannot add new sticky notes while in reduction mode. Please press the DONE button',
      'DONE button' : 'Done',
      // 他の必要な翻訳キーをここに追加
    },
  },
  ja: {
    translation: {
      'Theme': 'お題',
      'Create a new sticky note': '新しい付箋の作成',
      'Create Function Description': '以下の付箋をキャンバス内にドラッグ＆ドロップして新しい付箋を追加しよう',
      'Ideas': 'アイデア',
      'Elements': '要素',
      'Ideas Description': 'お題に対する具体的な解決策',
      'Elements Description':'アイデア発想のための新しい視点やインスピレーション（例: ウェルビーイング、共感、環境配慮...） ',
      'AI-generated ideas': 'AIによるアイデア生成',
      'Drag and drop the following sticky note into the canvas to add an AI-generated idea': '以下の付箋をキャンバス内にドラッグ＆ドロップしてAIアイデアを追加しよう',
      'Measurement of experiment': '実験の計測',
      'Name': '氏名',
      'Start measurement': '計測開始',
      'End measurement': '計測終了',
      'Count results': 'カウント結果',
      'Number of idea combinations': 'アイデア結合回数',
      'Number of idea decompositions': 'アイデア分解回数',
      'Number of AI idea generations': 'AIアイデア生成回数',
      'Number of AI element generations': 'AI要素生成回数',
      'Number of new idea sticky notes added': '新しいアイデア付箋追加数',
      'Number of new element sticky notes added': '新しい要素付箋追加数',
      'Relationship Combine': '結合',
      'Relationship Decompose': '分解',
      'isReducingModeActive Alert': '削減モード中は新しい付箋を追加できません。確定ボタンを押してください。',
      'DONE button' : '確定',
      // 他の必要な翻訳キーをここに追加
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ja', // デフォルトの言語を日本語に設定
    keySeparator: false, // キーの区切り文字を無効化
    interpolation: {
      escapeValue: false, // Reactではエスケープは不要
    },
  });

export default i18n;
