'use client'

import { useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { BeforeMount, Monaco, OnMount } from '@monaco-editor/react'
import { cn } from '@/app/lib/utils'
import type { JsonSchema } from '@/app/lib/yup-json-schema'

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const THEME_NAME = 'fdcircle-dark'

function defineTheme(monaco: Monaco) {
  monaco.editor.defineTheme(THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: 'a09eff' },
      { token: 'string.value.json', foreground: 'f0f0f5' },
      { token: 'number.json', foreground: '60a5fa' },
      { token: 'keyword.json', foreground: 'fbbf24' },
      { token: 'delimiter.bracket.json', foreground: '52526a' },
      { token: 'delimiter.colon.json', foreground: '52526a' },
      { token: 'delimiter.comma.json', foreground: '52526a' },
    ],
    colors: {
      'editor.background': '#0b0b0f',
      'editor.foreground': '#f0f0f5',
      'editorLineNumber.foreground': '#3a3a4c',
      'editorLineNumber.activeForeground': '#8e8ea8',
      'editorCursor.foreground': '#6d6aff',
      'editor.selectionBackground': '#6d6aff40',
      'editor.inactiveSelectionBackground': '#6d6aff26',
      'editor.lineHighlightBackground': '#00000000',
      'editorIndentGuide.background1': 'rgba(255,255,255,0.05)',
      'editorIndentGuide.activeBackground1': 'rgba(255,255,255,0.09)',
      'editorWidget.background': '#18181f',
      'editorWidget.border': 'rgba(255,255,255,0.09)',
      'editorSuggestWidget.background': '#18181f',
      'editorSuggestWidget.border': 'rgba(255,255,255,0.09)',
      'editorSuggestWidget.selectedBackground': '#1e1e28',
      'editorSuggestWidget.foreground': '#8e8ea8',
      'editorSuggestWidget.highlightForeground': '#a09eff',
      'editorHoverWidget.background': '#18181f',
      'editorHoverWidget.border': 'rgba(255,255,255,0.09)',
      'scrollbarSlider.background': 'rgba(255,255,255,0.07)',
      'scrollbarSlider.hoverBackground': 'rgba(255,255,255,0.14)',
      'scrollbarSlider.activeBackground': 'rgba(255,255,255,0.16)',
    },
  })
}

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  schema?: JsonSchema | null
  path: string
  isValid: boolean | null
  height?: number
}

export default function JsonEditor({ value, onChange, schema, path, isValid, height = 320 }: JsonEditorProps) {
  const monacoRef = useRef<Monaco | null>(null)

  const applySchema = useCallback((monaco: Monaco) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      // Yup already drives validation + the error panel below; the schema here
      // is only for editor intelligence (Ctrl+Space keys, enum suggestions).
      validate: false,
      enableSchemaRequest: false,
      schemas: schema ? [{ uri: `inmemory://schema/${path}`, fileMatch: ['*'], schema }] : [],
    })
  }, [schema, path])

  useEffect(() => {
    if (monacoRef.current) applySchema(monacoRef.current)
  }, [applySchema])

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    defineTheme(monaco)
    applySchema(monaco)
  }, [applySchema])

  const handleMount: OnMount = useCallback((_editor, monaco) => {
    monacoRef.current = monaco
  }, [])

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden transition-colors py-2',
        isValid === false
          ? 'border-[--color-error]/50 focus-within:border-[--color-error]'
          : isValid === true
            ? 'border-[--color-success]/40 focus-within:border-[--color-success]/60'
            : 'border-[--color-border-default] focus-within:border-[--color-brand-500]'
      )}
      style={{ height }}
    >
      <Editor
        path={path}
        defaultLanguage="json"
        theme={THEME_NAME}
        value={value}
        onChange={(val) => onChange(val ?? '')}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        loading={
          <div className="flex h-full items-center justify-center text-xs text-[--color-text-muted]">
            Loading editor…
          </div>
        }
        options={{
          fontSize: 12,
          fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
          fontLigatures: false,
          lineHeight: 20,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          renderLineHighlight: 'none',
          folding: true,
          tabSize: 2,
          wordWrap: 'on',
          automaticLayout: true,
          fixedOverflowWidgets: true,
          padding: { top: 4, bottom: 4 },
          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          quickSuggestions: { other: true, comments: false, strings: true },
          suggestOnTriggerCharacters: true,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          renderWhitespace: 'none',
          guides: { indentation: true },
        }}
      />
    </div>
  )
}
