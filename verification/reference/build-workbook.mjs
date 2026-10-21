// Standalone M00 spreadsheet/CSV artifact writer. No dependencies or product imports.
import { writeFile, mkdir } from 'node:fs/promises';
import { deflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { controlRows } from './recalculate.mjs';
const root = fileURLToPath(new URL('../records/M00-2/', import.meta.url));
await mkdir(root, { recursive: true });
const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const text = (address, v) =>
  `<c r="${address}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`;
const number = (address, v, formula) =>
  `<c r="${address}">${formula ? '<f>' + esc(formula) + '</f>' : ''}<v>${v}</v></c>`;
const row = (n, cells) => `<row r="${n}">${cells.join('')}</row>`;
const sheet = (rows) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="13" topLeftCell="A14" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="4" width="13" customWidth="1"/><col min="5" max="13" width="24" customWidth="1"/></cols><sheetData>${rows.join('')}</sheetData></worksheet>`;
const controls = [controlRows(1), controlRows(0.99)];
function controlSheet(control, multiplier) {
  const rs = [
    row(1, [
      text(
        'A1',
        multiplier === 1
          ? 'CONTROL-PV: flat FX'
          : 'CONTROL-FX: 1% annual RMB appreciation',
      ),
    ]),
    row(2, [
      text(
        'A2',
        'M00 reference workbook. Human review NOT RUN. Recalculate after opening; no taxes/medical growth/portfolio risk included.',
      ),
    ]),
  ];
  for (const [n, label, v] of [
    [4, 'Start year', 2026],
    [5, 'Annual CNY today', 250000],
    [6, 'Initial CNY/USD', 6.69],
    [7, 'China CPI', 0.04],
    [8, 'Nominal USD return', 0.03],
    [9, 'Annual FX multiplier', multiplier],
    [10, 'Payments', 50],
    [11, 'Birth year both', 1986],
  ])
    rs.push(row(n, [text('A' + n, label), number('B' + n, v)]));
  const headings = [
    't',
    'Year',
    'Age A',
    'Age B',
    'Spending CNY',
    'CNY/USD',
    'USD payment',
    'Discount factor',
    'PV payment',
    'Cumulative PV',
    'Opening USD',
    'After withdrawal',
    'End USD',
  ];
  rs.push(
    row(
      13,
      headings.map((s, k) => text(String.fromCharCode(65 + k) + '13', s)),
    ),
  );
  for (const r of control.rows) {
    const n = 14 + r.t;
    const formulas = [
      r.t ? `A${n - 1}+1` : null,
      `$B$4+A${n}`,
      `B${n}-$B$11`,
      `B${n}-$B$11`,
      `$B$5*(1+$B$7)^A${n}`,
      `$B$6*$B$9^A${n}`,
      `E${n}/F${n}`,
      `(1+$B$8)^A${n}`,
      `G${n}/H${n}`,
      `SUM($I$14:I${n})`,
      r.t ? `M${n - 1}` : '$B$65',
      `K${n}-G${n}`,
      `L${n}*(1+$B$8)`,
    ];
    const values = [
      r.t,
      r.year,
      r.age_A,
      r.age_B,
      r.spend.number(),
      r.fx.number(),
      r.payment.number(),
      r.discount.number(),
      r.present.number(),
      r.cumulative.number(),
      r.opening.number(),
      r.after.number(),
      r.end.number(),
    ];
    rs.push(
      row(
        n,
        values.map((v, k) =>
          number(String.fromCharCode(65 + k) + n, v, formulas[k]),
        ),
      ),
    );
  }
  rs.push(
    row(65, [
      text('A65', 'Required starting USD'),
      number('B65', control.pv.number(), 'SUM(I14:I63)'),
    ]),
  );
  rs.push(
    row(66, [
      text('A66', 'First payment USD'),
      number('B66', control.initialPayment.number(), 'G14'),
    ]),
  );
  rs.push(
    row(67, [
      text('A67', 'Last payment USD'),
      number('B67', control.rows.at(-1).payment.number(), 'G63'),
    ]),
  );
  rs.push(row(68, [text('A68', 'Final balance USD'), number('B68', 0, 'M63')]));
  rs.push(
    row(69, [
      text('A69', 'Actual row count'),
      number('B69', 50, 'COUNT(A14:A63)'),
    ]),
  );
  rs.push(
    row(71, [text('A71', 'Final balance tolerance'), number('B71', 0.000001)]),
  );
  rs.push(
    row(72, [
      text(
        'A72',
        '50 payments end at89; age90 would be a51st payment. Float64 rounding residual <=1e-6 is numerical zero.',
      ),
    ]),
  );
  return sheet(rs);
}
const summary = sheet([
  row(1, [text('A1', 'Independent 50-payment arithmetic controls')]),
  row(2, [
    text(
      'A2',
      'Human acceptance pending; open the two50-row sheets and inspect/recalculate formulas.',
    ),
  ]),
  row(3, [
    text('A3', 'Flat FX PV USD'),
    number('B3', controls[0].pv.number(), "'Flat FX'!B65"),
  ]),
  row(4, [
    text('A4', 'Appreciation PV USD'),
    number('B4', controls[1].pv.number(), "'RMB appreciation'!B65"),
  ]),
  row(5, [text('A5', 'Flat payment count'), number('B5', 50, "'Flat FX'!B69")]),
  row(6, [
    text('A6', 'Appreciation payment count'),
    number('B6', 50, "'RMB appreciation'!B69"),
  ]),
  row(8, [text('A8', 'Exact flat PV'), text('B8', controls[0].pv.decimal(58))]),
  row(9, [
    text('A9', 'Exact appreciation PV'),
    text('B9', controls[1].pv.decimal(58)),
  ]),
  row(11, [
    text(
      'A11',
      'Tax, retirement access, extra medical costs, shocks, longevity and market sequences are separate cases; these PVs are not funding recommendations.',
    ),
  ]),
]);
const files = [
  [
    '[Content_Types].xml',
    '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      [1, 2, 3]
        .map(
          (n) =>
            `<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
        )
        .join('') +
      '</Types>',
  ],
  [
    '_rels/.rels',
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
  ],
  [
    'xl/workbook.xml',
    '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Flat FX" sheetId="1" r:id="rId1"/><sheet name="RMB appreciation" sheetId="2" r:id="rId2"/><sheet name="Summary" sheetId="3" r:id="rId3"/></sheets><calcPr calcId="191029" calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>',
  ],
  [
    'xl/_rels/workbook.xml.rels',
    '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      [1, 2, 3]
        .map(
          (n) =>
            `<Relationship Id="rId${n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${n}.xml"/>`,
        )
        .join('') +
      '</Relationships>',
  ],
  ['xl/worksheets/sheet1.xml', controlSheet(controls[0], 1)],
  ['xl/worksheets/sheet2.xml', controlSheet(controls[1], 0.99)],
  ['xl/worksheets/sheet3.xml', summary],
];
// Minimal deterministic ZIP writer; no npm/office library required at M00.
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(b) {
  let c = 0xffffffff;
  for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
let offset = 0;
const local = [],
  central = [];
for (const [name, xml] of files) {
  const n = Buffer.from(name),
    raw = Buffer.from(xml),
    compressed = deflateRawSync(raw),
    crc = crc32(raw),
    h = Buffer.alloc(30);
  h.writeUInt32LE(0x04034b50, 0);
  h.writeUInt16LE(20, 4);
  h.writeUInt16LE(8, 8);
  h.writeUInt16LE(0x5d52, 12);
  h.writeUInt32LE(crc, 14);
  h.writeUInt32LE(compressed.length, 18);
  h.writeUInt32LE(raw.length, 22);
  h.writeUInt16LE(n.length, 26);
  local.push(h, n, compressed);
  const c = Buffer.alloc(46);
  c.writeUInt32LE(0x02014b50, 0);
  c.writeUInt16LE(20, 4);
  c.writeUInt16LE(20, 6);
  c.writeUInt16LE(8, 10);
  c.writeUInt16LE(0x5d52, 14);
  c.writeUInt32LE(crc, 16);
  c.writeUInt32LE(compressed.length, 20);
  c.writeUInt32LE(raw.length, 24);
  c.writeUInt16LE(n.length, 28);
  c.writeUInt32LE(offset, 42);
  central.push(c, n);
  offset += h.length + n.length + compressed.length;
}
const centralBuffer = Buffer.concat(central),
  end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralBuffer.length, 12);
end.writeUInt32LE(offset, 16);
await writeFile(
  resolve(root, 'control-calculations.xlsx'),
  Buffer.concat([...local, centralBuffer, end]),
);
for (const [k, control] of controls.entries()) {
  let csv =
    't,year,age_A,age_B,spend_cny,fx_cny_per_usd,usd_payment,discount_factor,pv_payment,cumulative_pv,opening_usd,after_withdrawal_usd,end_usd\n';
  for (const r of control.rows)
    csv +=
      [
        r.t,
        r.year,
        r.age_A,
        r.age_B,
        r.spend.decimal(),
        r.fx.decimal(),
        r.payment.decimal(),
        r.discount.decimal(),
        r.present.decimal(),
        r.cumulative.decimal(),
        r.opening.decimal(),
        r.after.decimal(),
        r.end.decimal(),
      ].join(',') + '\n';
  await writeFile(
    resolve(root, k ? 'control-appreciation.csv' : 'control-flat.csv'),
    csv,
  );
}
console.log(
  JSON.stringify(
    {
      workbook: 'verification/records/M00-2/control-calculations.xlsx',
      sheets: 3,
      payment_rows_per_control: 50,
      cached_values:
        'Independent rational arithmetic; recalculate in spreadsheet for human acceptance',
      human_open_recalculation: 'NOT RUN',
    },
    null,
    2,
  ),
);
