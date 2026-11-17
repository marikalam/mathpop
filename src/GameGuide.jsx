import { CardArt, cardColors } from './GameCards.jsx';
import { GAMES } from './Games.jsx';

// For grown-ups: what each game teaches, side by side with Singapore math
// and Beast Academy. First the ideas in a sentence each, then every game
// with the Singapore math idea and the Beast Academy idea it builds.

const IDEAS = [
  ['sg', 'Concrete → pictorial → abstract', 'Objects first, then a picture of them, then numbers alone. Every hint in MathPop goes in this order.'],
  ['sg', 'Number bonds', 'A whole and its two parts: 10 is 6 and 4. The base for adding and taking away.'],
  ['sg', 'Making ten', 'Fill a ten first to add: 8 + 5 = 8 + 2 + 3 = 13.'],
  ['sg', 'Bar models', 'Bars stand for the amounts in a story problem, so kids see whether to add, take away or multiply.'],
  ['sg', 'Place value', 'A digit is worth more by where it sits: 3 hundreds, 4 tens, 6 ones.'],
  ['sg', 'Equal groups', 'Boxes of 5, rows of 4: how multiplying starts.'],
  ['ba', 'Logic and puzzles', 'Use clues to narrow down the answer, step by step.'],
  ['ba', 'Patterns', 'Find the rule, then keep it going.'],
  ['ba', 'Number sense', 'Estimating on a number line, doubling, and seeing the same value written different ways.'],
];

// game id → [Singapore math idea, Beast Academy idea] ('' = none).
const TEACHES = {
  madminute: ['Fact fluency', 'Mental math'],
  bubbles: ['Adding, taking away, times facts', 'Mental math'],
  make10: ['Number bonds to 10 and 20', ''],
  snake: ['Facts at your level', 'Mental math'],
  bakery: ['Equal groups, bar model', 'Skip counting'],
  logicLock: ['Place value', 'Logic clues'],
  valueSort: ['Same value, different forms', 'Equivalence'],
  doubleUp: ['Doubles', 'Doubling patterns'],
  takeTen: ['Making ten, number bonds', 'Pair puzzles'],
  crossSums: ['Adding', 'Sum puzzles'],
  areaBoxes: ['Area: rows × columns', 'Area puzzles'],
  petSudoku: ['', 'Logic grids'],
  tapMatch: ['Same value, different forms', 'Equivalence'],
  fourInRow: ['Facts', 'Strategy'],
  domino: ['Same value, different forms', 'Equivalence'],
  snipDrop: ['Number bonds', ''],
  pipHop: ['Skip counting', 'Patterns'],
  numberRun: ['Facts', 'Mental math'],
  gardenGuard: ['Facts', 'Mental math'],
  sweetTens: ['Making ten', ''],
  numberKeys: ['Skip counting', 'Patterns'],
  pipLaunch: ['Place value', 'Number line estimating'],
  shapeDash: ['Shapes and their sides', 'Shape attributes'],
  fruitSlice: ['Facts, number bonds', 'Mental math'],
  goFish: ['Number bonds, same value', ''],
  toyShop: ['Money, with coins', ''],
  clock: ['Telling time', ''],
  shapes: ['Shapes', ''],
  bondPop: ['Number bonds', ''],
  makeTen: ['Making ten', 'Mental math'],
  barModel: ['Bar models', ''],
  sumGridRush: ['Number bonds', 'Sum grids'],
  patternStreak: ['', 'Patterns'],
  equalDiff: ['Taking away in your head', 'Equal differences'],
  timesTiles: ['Facts, times tables', ''],
  pizza: ['Fractions as equal parts', 'Equal fractions'],
  chess: ['', 'Strategy, thinking ahead; Chess School: check, skewers, checkmate'],
  checkers: ['', 'Strategy, thinking ahead'],
  carPark: ['', 'Logic, planning moves'],
  shipHunt: ['Position: rows and columns, reading a grid', 'Coordinates, logic and strategy'],
  lavaRun: ['Adding and taking away (× for older grades), number lines counting by 5s, 10s and 50s', 'Mental math'],
  mathIsland: ['Facts, number bonds; hints with ten frames, bonds and bar models; spending shells is subtraction in a story', 'Mental math'],
  shapeFit: ['Shapes, area (counting squares)', 'Spatial reasoning, turning and flipping shapes'],
  reversi: ['Counting', 'Strategy'],
};

const Badge = ({ kind }) => <span className={`gg-badge gg-${kind}`}>{kind === 'sg' ? 'Singapore math' : 'Beast Academy'}</span>;

export default function GameGuide({ titleOf }) {
  const games = [{ id: 'madminute', title: 'Mad Minute', color: ['#ef5b5b'] }, ...GAMES.filter((g) => !g.hidden)];
  return (
    <div className="gg">
      <p className="gg-lead">Every MathPop game practices a real math idea from Singapore math or Beast Academy, at your child's grade.</p>
      <h3 className="gg-h">The ideas</h3>
      <div className="gg-ideas">
        {IDEAS.map(([kind, name, line]) => (
          <div key={name} className="gg-idea">
            <Badge kind={kind} />
            <b>{name}</b>
            <span>{line}</span>
          </div>
        ))}
      </div>
      <h3 className="gg-h">What each game teaches</h3>
      <div className="gg-table" role="table" aria-label="What each game teaches">
        <div className="gg-row gg-head" role="row">
          <span role="columnheader">Game</span>
          <span role="columnheader">
            <Badge kind="sg" />
          </span>
          <span role="columnheader">
            <Badge kind="ba" />
          </span>
        </div>
        {games.map((g) => {
          const [sg, ba] = TEACHES[g.id] || ['', ''];
          return (
            <div key={g.id} className="gg-row" role="row">
              <span className="gg-game" role="cell">
                <span className="gg-thumb" style={{ background: cardColors(g.id, g.color[0]).bg }}>
                  <CardArt id={g.id} />
                </span>
                {g.id === 'madminute' ? g.title : titleOf(g.id)}
              </span>
              <span className={`gg-cell${sg ? '' : ' gg-none'}`} role="cell">
                {sg || '—'}
              </span>
              <span className={`gg-cell${ba ? '' : ' gg-none'}`} role="cell">
                {ba || '—'}
              </span>
            </div>
          );
        })}
      </div>
      <p className="gg-note">Hints in every game go one step at a time: objects, then a picture, then the numbers. You can set think time and the hint pictures in Players &amp; grades.</p>
    </div>
  );
}
