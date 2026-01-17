import { useRef, useState, useEffect } from 'react';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder = 'Start typing...' }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };


  const insertBulletList = () => {
    execCommand('insertUnorderedList');
  };

  const insertNumberedList = () => {
    execCommand('insertOrderedList');
  };

  const setHeading = (level: string) => {
    execCommand('formatBlock', level);
  };

  const setFontSize = (size: string) => {
    execCommand('fontSize', size);
  };

  const setFontColor = (color: string) => {
    execCommand('foreColor', color);
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <select
            onChange={(e) => {
              if (e.target.value) {
                setHeading(e.target.value);
                e.target.value = '';
              }
            }}
            className="toolbar-select"
            title="Heading"
          >
            <option value="">Heading</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="p">Paragraph</option>
          </select>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="toolbar-btn"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="toolbar-btn"
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="toolbar-btn"
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => execCommand('strikeThrough')}
            className="toolbar-btn"
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('subscript')}
            className="toolbar-btn"
            title="Subscript"
          >
            x<sub>2</sub>
          </button>
          <button
            type="button"
            onClick={() => execCommand('superscript')}
            className="toolbar-btn"
            title="Superscript"
          >
            x<sup>2</sup>
          </button>
        </div>

        <div className="toolbar-group">
          <select
            onChange={(e) => {
              if (e.target.value) {
                setFontSize(e.target.value);
                e.target.value = '';
              }
            }}
            className="toolbar-select"
            title="Font Size"
          >
            <option value="">Size</option>
            <option value="1">8px</option>
            <option value="2">10px</option>
            <option value="3">12px</option>
            <option value="4">14px</option>
            <option value="5">16px</option>
            <option value="6">18px</option>
            <option value="7">24px</option>
          </select>
        </div>

        <div className="toolbar-group">
          <select
            onChange={(e) => {
              if (e.target.value) {
                execCommand('fontName', e.target.value);
                e.target.value = '';
              }
            }}
            className="toolbar-select"
            title="Font Family"
          >
            <option value="">Font</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
          </select>
        </div>

        <div className="toolbar-group">
          <input
            type="color"
            onChange={(e) => setFontColor(e.target.value)}
            className="toolbar-color"
            title="Text Color"
            defaultValue="#000000"
          />
          <input
            type="color"
            onChange={(e) => execCommand('backColor', e.target.value)}
            className="toolbar-color"
            title="Background Color"
            defaultValue="#ffffff"
          />
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={insertBulletList}
            className="toolbar-btn"
            title="Bullet List"
          >
            •
          </button>
          <button
            type="button"
            onClick={insertNumberedList}
            className="toolbar-btn"
            title="Numbered List"
          >
            1.
          </button>
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            className="toolbar-btn"
            title="Align Left"
          >
            ⬅
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            className="toolbar-btn"
            title="Align Center"
          >
            ⬌
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyRight')}
            className="toolbar-btn"
            title="Align Right"
          >
            ➡
          </button>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        className={`editor-content ${isFocused ? 'focused' : ''}`}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;
