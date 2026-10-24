import QRCode from "qrcode";
import Svg, { Rect } from "react-native-svg";
import { colors } from "@/theme";

export function QrMark({ value, size = 196 }: { value: string; size?: number }) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const modules = qr.modules.size;
  const quiet = 2;
  const total = modules + quiet * 2;
  const cells: { x: number; y: number }[] = [];
  for (let row = 0; row < modules; row += 1) {
    for (let col = 0; col < modules; col += 1) {
      if (qr.modules.get(row, col)) cells.push({ x: col + quiet, y: row + quiet });
    }
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${total} ${total}`}>
      <Rect width={total} height={total} fill={colors.paperRaised} />
      {cells.map((cell) => (
        <Rect key={`${cell.x}-${cell.y}`} x={cell.x} y={cell.y} width={1} height={1} fill={colors.ink} />
      ))}
    </Svg>
  );
}
