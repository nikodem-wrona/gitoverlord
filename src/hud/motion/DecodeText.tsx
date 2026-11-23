import { useDecodedText } from "./useDecodedText";

interface DecodeTextProps {
  text: string;
  /** The time to decode the text, in milliseconds. */
  duration?: number;
  className?: string;
}

/**
 * Text that decodes from random glyphs. Assistive technology reads only the real text.
 *
 * Give the element a new `key` to decode it again.
 */
export function DecodeText({
  text,
  duration = 600,
  className,
}: DecodeTextProps) {
  const shown = useDecodedText(text, duration);

  if (shown === text) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      <span aria-hidden="true">{shown}</span>
      <span className="visually-hidden">{text}</span>
    </span>
  );
}
