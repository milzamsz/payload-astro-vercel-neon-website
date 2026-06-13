'use client'

import React from 'react'

type CheckboxCellProps = {
  cellData?: unknown
}

export const CheckboxCell: React.FC<CheckboxCellProps> = ({ cellData }) => {
  const checked = Boolean(cellData)

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        border: checked
          ? '2px solid var(--theme-success-500)'
          : '2px solid var(--theme-elevation-250)',
        background: checked ? 'var(--theme-success-500)' : 'transparent',
        color: '#fff',
        fontSize: '12px',
        lineHeight: 1,
      }}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}
