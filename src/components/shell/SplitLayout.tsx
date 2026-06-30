interface Props {
  left: React.ReactNode
  right: React.ReactNode
  leftWidth?: string
}

export function SplitLayout({ left, right, leftWidth = '40%' }: Props) {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex-shrink-0 overflow-auto" style={{ width: leftWidth }}>
        {left}
      </div>
      <div className="flex-1 overflow-auto border-l border-zinc-800">
        {right}
      </div>
    </div>
  )
}
