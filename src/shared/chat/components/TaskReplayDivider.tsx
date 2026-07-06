interface Props {
  text?: string
}

export default function TaskReplayDivider({ text = '可继续上传新文件' }: Props) {
  return (
    <div className="task-replay-divider" role="separator" aria-label={text}>
      <span>{text}</span>
    </div>
  )
}
