interface StyleDecl {
  overflow: string;
  position: string;
  top: string;
  width: string;
  left: string;
  right: string;
}

export interface ScrollHost {
  scrollY: number;
  documentElement: { style: { overflow: string } };
  body: { style: StyleDecl };
  scrollTo: (x: number, y: number) => void;
}

export function lockScroll(host: ScrollHost): () => void {
  const y = host.scrollY;
  const body = host.body.style;
  const root = host.documentElement.style;
  const previous = {
    overflow: body.overflow,
    position: body.position,
    top: body.top,
    width: body.width,
    left: body.left,
    right: body.right,
    rootOverflow: root.overflow,
  };
  root.overflow = "hidden";
  body.overflow = "hidden";
  body.position = "fixed";
  body.top = `-${y}px`;
  body.left = "0";
  body.right = "0";
  body.width = "100%";
  return () => {
    body.overflow = previous.overflow;
    body.position = previous.position;
    body.top = previous.top;
    body.width = previous.width;
    body.left = previous.left;
    body.right = previous.right;
    root.overflow = previous.rootOverflow;
    host.scrollTo(0, y);
  };
}
