import React, { useState, useRef, useEffect } from 'react';
import { useDrag, useDragLayer, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { createPortal } from 'react-dom';

// 死蔵された付箋のスタイル
// 1.付箋のシェイク（マジシャンみたいに付箋を振ったら内容が変化する）
// 2.付箋の分離（LEGOブロックを取り外す際に実装した）

const StickyNote = ({ id, content,description, x, y, onDelete, onMove, onDrop, bkcolor, onContentChange, shape, onShakeDetected, isSelected, onClick, onResize, resetResize, borderLine, isReducing, onDeleteElement }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteContent, setNoteContent] = useState(content);
  const [zIndex, setZIndex] = useState(1);  // 初期状態のz-indexは低い値に設定
  const [height, setHeight] = useState(shape === 'circle' ? 80 : 120); // shapeによって初期値を設定
  const [width, setWidth] = useState(shape === 'circle' ? 80 : 120); // 幅の初期値も追加
  const [fontSize, setFontSize] = useState(14); // 文字サイズの初期値
  const [showPopup, setShowPopup] = useState(false); // Pop-up visibility state
  const [showAddDescription, setShowAddDescription] = useState(false); // State for showing 'Add Description'
  const [newDescription, setNewDescription] = useState(description || ""); // State for editing new description

  const contentRef = useRef(null); // 高さ自動調整のために内容を参照

  const stickyNoteRef = useRef(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  // 一度のリサイズ操作でonResizeが呼ばれたかどうかを追跡するフラグ
  const hasResized = useRef({}); // フラグをオブジェクトで管理

  // 新しい付箋IDのたびにhasResizedフラグをリセット
  useEffect(() => {
    hasResized.current[id] = false; // IDに対応するリサイズフラグをfalseで初期化
  }, [id]);



  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: 'STICKY',
    item: { id, x, y, bkcolor },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [x, y]);


  const [{ isOver }, drop] = useDrop(() => ({
  accept: 'STICKY',
    drop: (draggedItem) => {
      if (draggedItem.id !== id) {
        onDrop(draggedItem.id, id);  // ドロップされた付箋とこの付箋のIDを渡す
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.getItem().id !== id, // 自分自身には重ならないようにする
    }),
  }), [id]);

  const { currentOffset } = useDragLayer((monitor) => ({
    currentOffset: monitor.getSourceClientOffset(),
  }));

  // 親から渡される `content` プロパティの変更を監視し、`noteContent` に反映
  React.useEffect(() => {
    setNoteContent(content);
  }, [content]);

  React.useEffect(() => {
    // カスタムプレビューを無効化
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  useEffect(() => {
    const updatePosition = () => {
      if (stickyNoteRef.current) {
        const rect = stickyNoteRef.current.getBoundingClientRect();
        setPopupPosition({
          top: rect.top + window.scrollY + rect.height,
          left: rect.left + window.scrollX + rect.width / 2,
        });
      }
    };

    if (showPopup) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showPopup]);


  React.useEffect(() => {
    if (isDragging && currentOffset) {
    
    // キャンバスのスクロール量を取得
    const container = document.querySelector('.canvas-container'); // キャンバスのクラス名が 'canvas-container' であると仮定しています
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    // スクロール量を考慮して付箋の位置を補正
    const correctedX = currentOffset.x + scrollLeft;
    const correctedY = currentOffset.y + scrollTop;
      
    onMove(id, correctedX, correctedY);
  }
}, [isDragging, currentOffset]);


  React.useEffect(() => {
    if (isDragging) {
      setZIndex(1);  // ドラッグ中は適度に低くする。他の付箋を検知できるようにする
    } else {
      setZIndex(10);  // ドラッグが終了したら全面に戻す
    }
  }, [isDragging]);

  // noteContentの内容に応じて高さと幅を自動調整
  useEffect(() => {
    const contentElement = contentRef.current;
    if (contentElement) {
      const scrollHeight = contentElement.scrollHeight;
      const padding = shape === 'circle' ? 1 : 10;

      // 1. まずフォントサイズを調整
      if (scrollHeight > height - padding * 2) {
        if (fontSize > 10) {
          setFontSize((prevFontSize) => prevFontSize - 1); // フォントサイズを1ずつ減らす
          return; // フォントサイズの調整が優先されるので、ここで終了
        }
      }

      // 2. フォントサイズを下げても収まらない場合、高さと幅を増やす
      if (scrollHeight > height - padding) {
        setHeight(scrollHeight + padding * 4); // 余裕を持たせて高さを調整
        setWidth(scrollHeight + padding * 4); // 余裕を持たせて幅を調整
      }
    }
  }, [noteContent, shape, fontSize, height, width]); // noteContentが変更されるたびに実行

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    setNoteContent(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onContentChange(id, noteContent, description);  // 親コンポーネントに内容の変更を通知
  };

  const handleClick = (e) => {
    onClick(id);  // クリックされた際に親コンポーネントに通知
    e.stopPropagation(); // イベントの伝播を防ぐ
    setShowPopup(true);  // クリック時にポップアップを表示
  };

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startHeight = height;
    const threshold = 20; // 動いた距離の閾値
    hasResized.current[id] = false; // リサイズ開始時にフラグをリセット

    const handleMouseMove = (event) => {
      const newHeight = Math.max(startHeight + (event.clientY - startY), 50);
      setHeight(newHeight);

      // リサイズが一定距離（threshold）以上下方向に動いた場合、まだonResizeが呼ばれていないなら呼び出す
      if (event.clientY - startY >= threshold && !hasResized.current[id]) {
        onResize(id, newHeight); // App.jsにリサイズ情報を渡す
        hasResized.current[id] = true; // 呼び出し済みフラグをセット
      } else {
        console.log('Already decomposed!');//既に分解済みです!
      }
    };

    const handleMouseUp = () => {
      if (hasResized.current[id]) {
        setHeight(startHeight); // 初期位置に戻す
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const closePopup = (e) => {
    e.stopPropagation(); // イベントの伝播を防ぐ
    setShowPopup(false);  // ポップアップを閉じる
  };

  const handleAddDescriptionClick = () => {
    setShowAddDescription(true);
  };

  const handleDescriptionChange = (e) => {
    setNewDescription(e.target.value);
  };

  const handleDescriptionSubmit = () => {
    onContentChange(id, noteContent, newDescription); // Save the new description
    setShowAddDescription(false); // Hide the popup
  };

  // Hoverイベントハンドラ
  const handleMouseEnter = () => {
    setShowPopup(true);
    // if (description) {
      
    // }
  };

  const handleMouseLeave = () => {
    setShowPopup(false);
  };

  return (
    <div
      ref={(node) => {
        drag(drop(node));
        stickyNoteRef.current = node;
      }}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}  // クリックイベントを追加
      onMouseEnter={handleMouseEnter} // ホバー時にPopupを表示
      onMouseLeave={handleMouseLeave} // ホバー解除時にPopupを非表示
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: `${width}px`, // width を状態から取得
        height: `${height}px`, // 高さを状態から取得
        borderRadius: shape === 'circle' ? '50%' : '50%',  // 丸い付箋にするための設定
        border: (isSelected || isDragging) ? '6px solid #E0C1FF' : borderLine ? borderLine : 'none', // #3859FF  // 元：B972FF
        opacity: isDragging ? 0.8 : 1,
        // padding: (shape === 'square') ? '20px 20px 20px 20px' : '20px',
        padding:'0px',
        margin: '5px',
        backgroundColor: (isSelected || isDragging) ? '#E0C1FF' : isOver ? '#FFD2E3' : bkcolor, // ドロップ可能なエリアに重なっている場合に色を変更
        boxShadow: isDragging 
          ? '5px 5px 15px rgba(0, 0, 0, 0.3)'  // ドラッグ中は強調されたシャドウ
          : '2px 2px 10px rgba(0, 0, 0, 0.2)',  // 通常時のドロップシャドウ  影つけたいなら、→2px 2px 10px rgba(0, 0, 0, 0.2)
        cursor: 'move',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxSizing: 'border-box',  // パディングとボーダーを含めたサイズ計算
        wordWrap: 'break-word',
        overflowWrap: 'break-word',  // テキストがコンテナをはみ出さないようにする
        zIndex: isOver ? 1000 : zIndex,  // ドラッグ中は最前面に表示
        transition: 'box-shadow 0.3s ease, background-color 0.3s ease',  // スムーズなアニメーション
      }}
    >
      {/* <div style={{ position: 'absolute', top: '2px', left: '2px', fontSize: '12px', color: 'black' }}>
        ID: {id}
      </div> */}
      {isEditing ? (
      <textarea
          ref={contentRef}
          value={noteContent}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus
          style={{
            width: '100%',
            minHeight: '100px',
            boxSizing: 'border-box',
            resize: 'none',  // リサイズを無効化
            border: 'none',
            backgroundColor: 'transparent',
            fontFamily: 'inherit',
            padding: '0',
            fontSize: `${fontSize}px`,
          }}
        />
      ) : (
          <div
            ref={contentRef}
            style={{
              fontSize: `${fontSize}px`,
              margin: '0px', // Ensure no extra margin
              padding: '0px', // Ensure no extra padding
              width: '100%',  // Set to 100% to fill the container width
              height: '100%', // Ensure the height also fills
              display: 'flex', 
              alignItems: 'center', // Center the content vertically
              justifyContent: 'center', // Center the content horizontally
              wordWrap: 'break-word', // Ensure text wraps properly
              overflowWrap: 'break-word',  // Prevent overflow of text
              textAlign: 'center', // Center text alignment
              boxSizing: 'border-box', // Ensure padding and borders are considered in the width/height
            }}>
            {noteContent}
          </div>
      )}
      {/* リサイズハンドルを白い丸に変更し、リサイズ操作に対応 */}
      {isSelected && shape !== 'circle' && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px', // StickyNote の下に表示
            left: '50%',
            transform: 'translateX(-50%)', // 中央揃え
            width: '16px',
            height: '16px',
            backgroundColor: 'none',
            borderRadius: '50%', // 丸にする
            border: '2px solid #717171',
            cursor: 'ns-resize', // 上下リサイズのカーソル
            zIndex: 1001,
          }}
          onMouseDown={handleResizeMouseDown} // リサイズ操作を割り当て
        />
      )}
      {isSelected && (
        <button
          onClick={() => onDelete(id)}
          style={{
            position: 'absolute',
            top: '0px',
            right: '-20px',
            backgroundColor: isOver ? '#FFD2E3' : bkcolor, // ドロップ可能なエリアに重なっている場合に色を変更
            color: 'black',
            border: 'none',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      )}
      {isReducing && shape === 'circle' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteElement(id); // 要素削除コールバック呼び出し
          }}
          style={{
            position: 'absolute',
            top: '-25px',
            right: '5px',
            backgroundColor: '#FFEFEF',
            border: '1px solid #FF0000',
            borderRadius: '10px',
            width: '60px',
            height: '20px',
            fontSize: '12px',
            lineHeight: '18px',
            color: '#FF0000',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          削減
        </button>
      )}
      {/* Display the popup if 'showPopup' is true and 'description' exists */}
      {showPopup && description && createPortal(
        <div
          style={{
            position: 'absolute',
            top: popupPosition.top,
            left: popupPosition.left,
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            // border: '1px solid #000',
            borderRadius: '5px',
            padding: '10px',
            width: '300px',
            zIndex: 9999,
            boxShadow: '0px 0px 10px rgba(0,0,0,0.2)',
            fontSize: '12px',
          }}
        >
          {/* <strong>Description:</strong> */}
          <p>{description}</p>
          <button 
            onClick={closePopup} 
            style={{
              position: 'absolute',
              bottom: '5px', // 下に寄せる
              right: '5px', // 右に寄せる
              backgroundColor: '#EFEFF0',
              borderRadius: '5px',
              color: '#848488',
              border: 'none', 
              fontSize: '12px', 
              cursor: 'pointer'
            }}
          >
            Closed
          </button>
        </div>,
        document.body
      )}

      {(isSelected || showPopup) && !description && (
        <button
          onClick={handleAddDescriptionClick}
          style={{
            position: 'absolute',
            right: '-10px',
            bottom: '-30px',
            padding: '4px 8px',
            fontSize: '10px',
            cursor: 'pointer',
            backgroundColor: '#EFEFF0',
            borderRadius: '5px',
            color: '#848488',
            border: 'none',
          }}
        >
          Add a note
        </button>
      )}
      {/* Show the Add Description Popup */}
      {showAddDescription && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            border: '1px solid #000',
            padding: '10px',
            width: '200px',
            zIndex: 1000,
            boxShadow: '0px 0px 10px rgba(0,0,0,0.2)',
            
          }}
        >
          <textarea
            value={newDescription}
            onChange={handleDescriptionChange}
            style={{ width: '100%', height: '60px' }}
          />
          <button onClick={handleDescriptionSubmit}
            style={{
              marginTop: '5px',
              cursor: 'pointer',
              backgroundColor: '#EFEFF0',
              borderRadius: '5px',
              color: '#3F88F6',
              border: 'none',
            }}>
            Complete
          </button>
        </div>
      )}
    </div>
  );
};

export default StickyNote;

// LEGO風のデザイン↓
// {/* 突起のデザイン */}
// <div style={{
//   position: 'absolute',
//   top: '-9px',  // ブロックの上に突起を表示
//   left: '0',
//   right: '0',
//   height: '12px',  // 突起の高さ
//   display: 'flex',
//   justifyContent: 'space-evenly',
//   padding: '0 10px',
// }}>
//   {/* 4つの突起 */}
//   {[...Array(4)].map((_, index) => (
//     <div key={index} style={{
//       width: '20px',
//       height: '6px',
//       backgroundColor: isOver ? '#B9F9FF' : bkcolor, // ドロップ可能なエリアに重なっている場合に色を変更
//       borderRadius: '0%',
//       border: '2px solid rgba(0, 0, 0, 0.2)', // LEGO風の境界線
//     }} />
//   ))}
// </div>
// {/* 横線を追加 */}
// <div style={{
//   position: 'absolute',
//   top: '33%',  // 高さの中央に配置
//   left: '0',
//   right: '0',
//   height: '1px',  // 線の太さ
//   backgroundColor: 'rgba(217, 217, 217, 0.4)',  // 薄い黒で線を描画
// }} />
// <div style={{
//   position: 'absolute',
//   top: '66%',  // 高さの中央に配置
//   left: '0',
//   right: '0',
//   height: '1px',  // 線の太さ
//   backgroundColor: 'rgba(217, 217, 217, 0.4)',  // 薄い黒で線を描画
// }} />
// {/* ドラッグ可能な要素（shapeがsquareのときだけ表示） */}
// {shape === 'square' && (
//   <div
//     ref={dragHandle}
//     style={{
//       position: 'absolute',
//       bottom: '-27px',
//       right: '-1px',
//       width: '198px',
//       height: '25px',
//       backgroundColor: isOver ? '#B9F9FF' : bkcolor, // ドロップ可能なエリアに重なっている場合に色を変更
//       border: (isSelected || isDragging) ? '3px solid #3859FF' : '2px solid rgba(0, 0, 0, 0.2)',  // 選択された付箋は青い枠線と、LEGO風の境界線
//       cursor: 'grab',
//       display: 'flex',  // 要素を中央揃えにするためにflexboxを使用
//       alignItems: 'center',  // 縦方向に中央揃え
//       justifyContent: 'center',  // 横方向に中央揃え
//     }}
//   >
//     {isSelected && (  // ドラッグハンドルがドラッグ中のみ表示
//       <span style={{ fontSize: '20px', color: 'rgba(128, 128, 128, 0.6)' }}>↓</span>
//     )}
//   </div>
  
// )}