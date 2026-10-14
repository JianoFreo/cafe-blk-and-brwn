import { CSSProperties, ElementType, Fragment, ReactNode } from "react";

interface SplitProps {
  as?: ElementType;
  title?: string;
  accent?: string;
  /** line break between the title and the accent words (hero) */
  br?: boolean;
  className?: string;
  id?: string;
  style?: CSSProperties;
  ariaHidden?: boolean;
}

/** Heading whose words rise out of a mask one after another (the engine adds .is-in on scroll).
 *  Renders exactly the markup the original script produced, but as React elements. */
export function Split({ as: Tag = "h2", title, accent, br, className, id, style, ariaHidden }: SplitProps) {
  if (!title && !accent) return null;
  let i = 0;
  const words = (text: string, cls?: string): ReactNode =>
    text
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => {
        const idx = i++;
        return (
          <Fragment key={idx}>
            <span className="w">
              <span className={cls} style={{ "--i": idx } as CSSProperties}>
                {w}
              </span>
            </span>{" "}
          </Fragment>
        );
      });

  return (
    <Tag data-split="" className={className} id={id} style={style} aria-hidden={ariaHidden ? true : undefined}>
      {title ? words(title) : null}
      {br && title && accent ? <br /> : null}
      {accent ? <span className="accent is-split">{words(accent, "accent-w")}</span> : null}
    </Tag>
  );
}
