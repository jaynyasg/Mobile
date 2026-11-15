import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  FeDropShadow,
  Filter,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text,
  SvgProps,
} from "react-native-svg";

const ST_THOMAS =
  "M78 308 C92 286 118 272 142 274 C156 268 168 278 176 286 C186 274 206 270 226 278 C244 284 256 292 250 306 C258 318 246 332 220 334 C196 338 178 326 162 332 C148 342 132 336 118 326 C100 322 84 322 78 308 Z";
const ST_JOHN =
  "M292 312 C300 292 322 276 346 278 C366 274 382 284 388 296 C396 304 386 312 376 310 C386 318 392 326 380 332 C360 340 334 336 314 328 C300 322 288 320 292 312 Z";
const JOST =
  "M286 192 C296 174 324 168 344 174 C360 178 368 190 362 200 C354 212 332 216 312 212 C296 208 278 202 286 192 Z";
const TORTOLA =
  "M392 208 C404 188 436 176 470 176 C508 174 534 182 546 194 C554 188 572 182 588 190 C598 196 596 208 584 212 C572 214 556 208 546 206 C536 220 508 228 476 226 C444 224 412 222 396 214 C388 212 386 210 392 208 Z";
const VIRGIN_GORDA =
  "M652 228 C642 210 646 186 654 164 C658 146 656 124 666 108 C674 96 684 104 686 120 C692 112 704 124 700 146 C706 168 704 196 694 214 C686 230 668 238 652 228 Z";

const coast = { stroke: "#E7C56A", strokeOpacity: 0.38, strokeWidth: 1.15 } as const;

function Land({ d }: { d: string }) {
  return (
    <G>
      <Path d={d} fill="url(#vi-land)" {...coast} />
      <Path d={d} fill="url(#vi-landHi)" />
    </G>
  );
}

function Cay({ cx, cy, rx, ry, rotate = 0 }: { cx: number; cy: number; rx: number; ry: number; rotate?: number }) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#vi-land)" transform={`rotate(${rotate} ${cx} ${cy})`} />;
}

function Palm({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M0 30 C3 18 2 10 1 2" stroke="#C9A24A" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <Ellipse cx={-16} cy={10} rx={14} ry={3.6} fill="#FFE08A" transform="rotate(-38 -16 10)" />
      <Ellipse cx={18} cy={9} rx={14} ry={3.6} fill="#E7C56A" transform="rotate(34 18 9)" />
      <Ellipse cx={-6} cy={-8} rx={13} ry={3.4} fill="#F3E2B0" transform="rotate(-72 -6 -8)" />
      <Ellipse cx={8} cy={-7} rx={12} ry={3.2} fill="#FFE08A" transform="rotate(68 8 -7)" />
      <Ellipse cx={4} cy={14} rx={9} ry={2.8} fill="#C9A24A" transform="rotate(78 4 14)" />
    </G>
  );
}

function Launch({ x, y, rotate }: { x: number; y: number; rotate: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <Path d="M2 14 C6 14 10 10 16 10 H36 C42 10 46 13 46 16 C46 21 41 23 35 23 H10 C5 23 2 19 2 14 Z" fill="#FFE08A" />
      <Path d="M18 10 L20 5 H31 V10 Z" fill="#F3E2B0" />
      <Rect x={22} y={6.4} width={5} height={2.2} rx={0.6} fill="#0E7490" />
      <Path d="M-8 17 H1" stroke="#FFE08A" strokeOpacity={0.75} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M-16 20 H-4" stroke="#FFE08A" strokeOpacity={0.4} strokeWidth={1.3} strokeLinecap="round" />
    </G>
  );
}

function Label({ x, y, w, h, text }: { x: number; y: number; w: number; h: number; text: string }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={12} fill="#071421" fillOpacity={0.84} stroke="#FFE08A" strokeOpacity={0.62} strokeWidth={1.25} />
      <Text
        x={x + w / 2}
        y={y + h * 0.68}
        textAnchor="middle"
        fill="#F7F4EF"
        fontFamily="Manrope-SemiBold"
        fontSize={26}
      >
        {text}
      </Text>
    </G>
  );
}

export function VirginIslandsMap(props: SvgProps) {
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 800 480" preserveAspectRatio="xMidYMid meet" {...props}>
        <Defs>
          <RadialGradient id="vi-sea" cx="48%" cy="52%" r="68%">
            <Stop offset="0%" stopColor="#1A5C72" />
            <Stop offset="28%" stopColor="#0E3C52" />
            <Stop offset="62%" stopColor="#0A2838" />
            <Stop offset="100%" stopColor="#071421" />
          </RadialGradient>
          <RadialGradient id="vi-lagoon" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#1E8A96" stopOpacity={0.55} />
            <Stop offset="55%" stopColor="#0E7490" stopOpacity={0.18} />
            <Stop offset="100%" stopColor="#0E7490" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="vi-land" x1="0" y1="0" x2="0.2" y2="1">
            <Stop offset="0%" stopColor="#3E9A62" />
            <Stop offset="38%" stopColor="#1F6B42" />
            <Stop offset="100%" stopColor="#0E3324" />
          </LinearGradient>
          <LinearGradient id="vi-landHi" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#C9A24A" stopOpacity={0.55} />
            <Stop offset="28%" stopColor="#3E9A62" stopOpacity={0} />
          </LinearGradient>
          <Filter id="vi-isle" x="-30%" y="-30%" width="160%" height="160%">
            <FeDropShadow dx={0} dy={5} stdDeviation={3.5} floodColor="#031018" floodOpacity={0.55} />
          </Filter>
        </Defs>

        <Rect width={800} height={480} fill="url(#vi-sea)" />
        <Ellipse cx={168} cy={300} rx={150} ry={78} fill="url(#vi-lagoon)" />
        <Ellipse cx={340} cy={300} rx={110} ry={70} fill="url(#vi-lagoon)" />
        <Ellipse cx={470} cy={210} rx={160} ry={80} fill="url(#vi-lagoon)" />
        <Ellipse cx={670} cy={180} rx={90} ry={100} fill="url(#vi-lagoon)" />
        <Ellipse cx={320} cy={185} rx={80} ry={48} fill="url(#vi-lagoon)" />

        <G fill="none" stroke="#F5F1E8" strokeOpacity={0.13} strokeWidth={1.25} strokeLinecap="round">
          <Path d="M40 90c40 10 60-8 100 0s50 12 90 2" />
          <Path d="M520 70c36 8 54-6 88 2" />
          <Path d="M48 430c50 12 70-10 120 0s60 10 100-2" />
          <Path d="M560 400c40 10 70-8 110 2" />
          <Path d="M600 340c30 8 40-6 70 0" />
        </G>

        <G fill="#FFE08A">
          <Circle cx={70} cy={64} r={1.3} opacity={0.8} />
          <Circle cx={120} cy={150} r={1.1} opacity={0.55} />
          <Circle cx={430} cy={64} r={1.4} opacity={0.75} />
          <Circle cx={760} cy={48} r={1.2} opacity={0.7} />
          <Circle cx={740} cy={360} r={1.1} opacity={0.5} />
          <Circle cx={40} cy={250} r={1.2} opacity={0.45} />
          <Circle cx={390} cy={420} r={1.3} opacity={0.55} />
          <Circle cx={250} cy={70} r={1} opacity={0.6} />
          <Circle cx={690} cy={400} r={1.4} opacity={0.65} />
          <Circle cx={510} cy={400} r={1} opacity={0.4} />
        </G>

        <Rect x={14} y={14} width={772} height={452} rx={22} fill="none" stroke="#FFE08A" strokeOpacity={0.28} strokeWidth={1.25} />

        <G fill="none" stroke="#FFE08A" strokeWidth={2.4} strokeLinecap="round" strokeDasharray="1.6 7.5" opacity={0.95}>
          <Path d="M236 292 C 262 274, 278 286, 300 300" />
          <Path d="M328 278 C 300 250, 292 220, 318 206" />
          <Path d="M352 184 C 372 170, 386 176, 404 194" />
          <Path d="M520 222 C 570 236, 610 228, 648 206" />
          <Path d="M168 268 C 200 214, 246 176, 292 176" />
        </G>

        <G opacity={0.9}>
          <Ellipse cx={160} cy={306} rx={108} ry={46} fill="#145E72" opacity={0.35} />
          <Ellipse cx={338} cy={306} rx={72} ry={40} fill="#145E72" opacity={0.32} />
          <Ellipse cx={490} cy={208} rx={112} ry={42} fill="#145E72" opacity={0.3} />
          <Ellipse cx={668} cy={172} rx={46} ry={86} fill="#145E72" opacity={0.28} />
          <Ellipse cx={318} cy={192} rx={52} ry={30} fill="#145E72" opacity={0.28} />
        </G>

        <G filter="url(#vi-isle)">
          <Cay cx={86} cy={338} rx={16} ry={11} rotate={-18} />
          <Cay cx={168} cy={236} rx={13} ry={9} rotate={12} />
          <Cay cx={248} cy={338} rx={14} ry={9} rotate={-8} />
          <Cay cx={268} cy={268} rx={13} ry={9} rotate={20} />
          <Cay cx={300} cy={248} rx={12} ry={8} rotate={-16} />
          <Land d={ST_THOMAS} />
          <Path d="M96 318 C110 324 124 322 134 316" fill="none" stroke="#E4C98A" strokeWidth={3} strokeLinecap="round" />
          <Path d="M200 330 C214 334 228 328 238 320" fill="none" stroke="#E4C98A" strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M108 300 C140 292 176 294 214 300" fill="none" stroke="#0C2A1C" strokeOpacity={0.45} strokeWidth={2} strokeLinecap="round" />
          <Land d={ST_JOHN} />
          <Path d="M304 324 C318 330 336 328 350 322" fill="none" stroke="#E4C98A" strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M318 300 C338 294 358 300 372 308" fill="none" stroke="#0C2A1C" strokeOpacity={0.4} strokeWidth={1.8} strokeLinecap="round" />
          <Land d={JOST} />
          <Path d="M300 206 C314 212 332 210 346 202" fill="none" stroke="#E4C98A" strokeWidth={2.4} strokeLinecap="round" />
          <Cay cx={378} cy={170} rx={11} ry={7} rotate={16} />
          <Land d={TORTOLA} />
          <Path d="M418 214 C450 222 490 220 520 210" fill="none" stroke="#E4C98A" strokeWidth={2.8} strokeLinecap="round" />
          <Path d="M430 198 C470 188 520 192 556 200" fill="none" stroke="#0C2A1C" strokeOpacity={0.42} strokeWidth={2.2} strokeLinecap="round" />
          <Cay cx={500} cy={152} rx={16} ry={10} rotate={-8} />
          <Cay cx={548} cy={156} rx={18} ry={9} rotate={6} />
          <Cay cx={608} cy={176} rx={15} ry={10} rotate={-12} />
          <Cay cx={458} cy={328} rx={20} ry={12} rotate={-20} />
          <Cay cx={508} cy={292} rx={17} ry={11} rotate={14} />
          <Cay cx={478} cy={270} rx={12} ry={8} rotate={-10} />
          <Cay cx={548} cy={276} rx={11} ry={8} />
          <Cay cx={530} cy={312} rx={9} ry={6} rotate={12} />
          <Land d={VIRGIN_GORDA} />
          <Path d="M656 220 C666 228 680 224 690 212" fill="none" stroke="#E4C98A" strokeWidth={2.6} strokeLinecap="round" />
          <Cay cx={708} cy={236} rx={10} ry={7} rotate={18} />
          <Cay cx={724} cy={96} rx={9} ry={6} />
        </G>

        <Palm x={124} y={252} />

        <G fill="#071421" stroke="#FFE08A" strokeWidth={1.6}>
          <Circle cx={236} cy={294} r={3.2} />
          <Circle cx={304} cy={304} r={3.2} />
          <Circle cx={324} cy={206} r={3.2} />
          <Circle cx={404} cy={198} r={3.2} />
          <Circle cx={648} cy={204} r={3.2} />
        </G>

        <Launch x={252} y={262} rotate={-12} />
        <Launch x={196} y={198} rotate={-32} />
        <Launch x={528} y={232} rotate={-8} />

        <G transform="translate(742 430)" fill="none" stroke="#FFE08A">
          <Circle r={15} strokeWidth={1.1} opacity={0.8} />
          <Path d="M0 -11 L3.2 -1.2 L0 2.2 L-3.2 -1.2 Z" fill="#FFE08A" stroke="none" />
          <Path d="M0 11 L2.2 2 L0 4 L-2.2 2 Z" fill="#C9A24A" stroke="none" opacity={0.85} />
          <Text x={0} y={-18} textAnchor="middle" fill="#FFE08A" stroke="none" fontFamily="Manrope-SemiBold" fontSize={11}>N</Text>
        </G>

        <Text x={520} y={46} textAnchor="middle" fill="#FFE08A" fontFamily="BodoniModa-SemiBold" fontSize={18} letterSpacing={3.2}>
          VIRGIN ISLANDS
        </Text>

        <G>
          <Label x={78} y={356} w={176} h={36} text="St. Thomas" />
          <Label x={276} y={366} w={148} h={36} text="St. John" />
          <Label x={168} y={112} w={214} h={36} text="Jost Van Dyke" />
          <Label x={412} y={186} w={132} h={34} text="Tortola" />
          <Label x={572} y={250} w={188} h={36} text="Virgin Gorda" />
        </G>
      </Svg>
    </View>
  );
}
