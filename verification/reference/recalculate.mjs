// Independent M00 reference arithmetic. This module must never import src/model or app code.
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const gcd = (a, b) => {
  a = a < 0n ? -a : a;
  while (b) {
    const r = a % b;
    a = b;
    b = r;
  }
  return a;
};
export class Rational {
  constructor(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (!d) throw Error('zero denominator');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }
  add(x) {
    return new Rational(this.n * x.d + x.n * this.d, this.d * x.d);
  }
  sub(x) {
    return new Rational(this.n * x.d - x.n * this.d, this.d * x.d);
  }
  mul(x) {
    return new Rational(this.n * x.n, this.d * x.d);
  }
  div(x) {
    return new Rational(this.n * x.d, this.d * x.n);
  }
  pow(n) {
    return new Rational(this.n ** BigInt(n), this.d ** BigInt(n));
  }
  number() {
    return Number(this.n) / Number(this.d);
  }
  decimal(places = 40) {
    const sign = this.n < 0n ? '-' : '';
    const n = this.n < 0n ? -this.n : this.n;
    const scale = 10n ** BigInt(places);
    let q = (n * scale) / this.d;
    if (((n * scale) % this.d) * 2n >= this.d) q++;
    const s = q.toString().padStart(places + 1, '0');
    return sign + s.slice(0, -places) + '.' + s.slice(-places);
  }
}
export function controlRows(multiplier) {
  const fx0 = new Rational(669, 100),
    inflation = new Rational(104, 100),
    growth = new Rational(103, 100);
  const fxGrowth = multiplier === 1 ? new Rational(1) : new Rational(99, 100);
  const initialPayment = new Rational(250000).div(fx0);
  const pvRatio = inflation.div(growth.mul(fxGrowth));
  let pv = new Rational(0);
  for (let t = 0; t < 50; t++) pv = pv.add(initialPayment.mul(pvRatio.pow(t)));
  let balance = pv,
    cumulative = new Rational(0);
  const rows = [];
  for (let t = 0; t < 50; t++) {
    const spend = new Rational(250000).mul(inflation.pow(t)),
      fx = fx0.mul(fxGrowth.pow(t));
    const payment = spend.div(fx),
      discount = growth.pow(t),
      present = payment.div(discount);
    const opening = balance,
      after = opening.sub(payment);
    balance = after.mul(growth);
    cumulative = cumulative.add(present);
    rows.push({
      t,
      year: 2026 + t,
      age_A: 40 + t,
      age_B: 40 + t,
      spend,
      fx,
      payment,
      discount,
      present,
      cumulative,
      opening,
      after,
      end: balance,
    });
  }
  if (balance.n !== 0n)
    throw Error('Rational control did not end at exact zero');
  return { pv, initialPayment, rows };
}
const table = JSON.parse(
  await readFile(resolve(root, 'fixtures/tax-tables.spec.json'), 'utf8'),
).tables;
const catalog = JSON.parse(
  await readFile(resolve(root, 'fixtures/oracles.json'), 'utf8'),
);
function progressive(income, brackets, rates) {
  let tax = 0;
  for (let k = 0; k < brackets.length; k++)
    tax +=
      Math.max(0, Math.min(income, brackets[k + 1] ?? Infinity) - brackets[k]) *
      rates[k];
  return tax;
}
function regular(income, status) {
  return progressive(income, table.us.brackets[status], table.us.rates);
}
function tentative(income) {
  const b = table.us.estate.brackets;
  return progressive(
    income,
    b.map((x) => x[0]),
    b.map((x) => x[1]),
  );
}
function resident(i) {
  const status = i.filing_status,
    net =
      i.securities_lt + i.property_lt + i.gross_u1250 - i.prior_capital_loss;
  const loss = Math.min(Math.max(-net, 0), table.us.cap_loss_limit[status]);
  const carry = Math.max(-net - loss, 0);
  // These literal cases include full offsets, net losses, or gains without partial offset/lookback.
  // Partial-positive bucket ordering remains a separate primary-worksheet gate.
  if (net > 0 && (i.securities_lt < 0 || i.prior_capital_loss > 0))
    throw Error('Partial positive capital bucket needs source worksheet');
  const U = net > 0 ? i.gross_u1250 : 0,
    LT = net > 0 ? net - U : 0;
  const beforeSS = i.ordinary - loss + i.qd + LT + U,
    prov = beforeSS + 0.5 * i.ss;
  const taxableSS =
    status === 'mfs'
      ? Math.max(0, Math.min(0.85 * i.ss, 0.85 * prov))
      : Math.min(
          0.85 * i.ss,
          0.85 * Math.max(0, prov - 34000) +
            Math.min(
              0.5 * i.ss,
              0.5 * Math.max(0, Math.min(prov, 34000) - 25000),
            ),
        );
  const agi = beforeSS + taxableSS;
  const senior =
    status === 'single' && i.year <= table.us.senior_deduction.last_year
      ? Math.max(0, 6000 - 0.06 * Math.max(0, agi - 75000))
      : 0;
  const deduction =
    table.us.std_deduction[status] +
    (i.age >= 65
      ? table.us.add_65[status === 'single' ? 'single' : 'married']
      : 0) +
    senior;
  const TI = Math.max(0, agi - deduction),
    ANCG = Math.min(TI, i.qd + LT),
    NCG = Math.min(TI, i.qd + LT + U),
    base = TI - ANCG;
  const ceilingIndex = table.us.rates.findIndex(
    (r) => r >= table.us.unrecaptured_1250_max,
  );
  const ceiling =
    ceilingIndex === -1 ? Infinity : table.us.brackets[status][ceilingIndex];
  const A = Math.max(TI - NCG, Math.min(ceiling, base));
  const start = [0, table.us.ltcg_0_top[status], table.us.ltcg_15_top[status]];
  let gains = 0;
  for (let k = 0; k < 3; k++)
    gains +=
      Math.max(
        0,
        Math.min(TI, start[k + 1] ?? Infinity) - Math.max(base, start[k]),
      ) * table.us.ltcg_rates[k];
  const E =
    table.us.unrecaptured_1250_max *
    Math.max(0, Math.min(U, NCG) - Math.max(0, A + NCG - TI));
  const ordinaryTax = regular(TI, status),
    incomeTax = Math.min(ordinaryTax, regular(A, status) + gains + E);
  return {
    net_total: net,
    loss_deduction: loss,
    carry,
    lt_gain: LT,
    u1250_gain: U,
    taxable_ss: taxableSS,
    agi,
    senior_deduction: senior,
    deduction,
    ti: TI,
    regular_tax: ordinaryTax,
    A_amt: A,
    preferential_tax: gains,
    u1250_cap_tax: E,
    income_tax: incomeTax,
    niit:
      0.038 *
      Math.min(
        Math.max(i.nii, 0),
        Math.max(agi - table.us.niit_threshold[status], 0),
      ),
  };
}
function rng(state, n) {
  const s = state.slice();
  const out = [];
  const rot = (x, k) => ((x << k) | (x >>> (32 - k))) >>> 0;
  for (let i = 0; i < n; i++) {
    out.push(Math.imul(rot(Math.imul(s[1], 5) >>> 0, 7), 9) >>> 0);
    const t = (s[1] << 9) >>> 0;
    s[2] = (s[2] ^ s[0]) >>> 0;
    s[3] = (s[3] ^ s[1]) >>> 0;
    s[1] = (s[1] ^ s[2]) >>> 0;
    s[0] = (s[0] ^ s[3]) >>> 0;
    s[2] = (s[2] ^ t) >>> 0;
    s[3] = rot(s[3], 11);
  }
  return out;
}
function quantile(a, q) {
  a = a.filter(Number.isFinite).sort((x, y) => x - y);
  if (!a.length) return null;
  const h = (a.length - 1) * q,
    l = Math.floor(h);
  return a[l] + (a[Math.ceil(h)] - a[l]) * (h - l);
}
function reference(c) {
  const i = c.inputs;
  if (/^US-[1-8]$/.test(c.id) || c.id === 'US-CARRY') return resident(i);
  switch (c.id) {
    case 'NRA-1': {
      const r = regular(i.rental_net, 'mfs'),
        d = i.dividends * 0.1,
        s = i.ss * 0.255;
      return { rental_tax: r, dividend_tax: d, ss_tax: s, total: r + d + s };
    }
    case 'CN-1': {
      const d = i.dividends * 0.2,
        r = i.gross_rent * 0.8 * 0.2,
        b = table.cn.comprehensive,
        p = progressive(
          Math.max(i.trad - 60000, 0),
          b.map((x) => x[0]),
          b.map((x) => x[1]),
        ),
        pre = d + r + p,
        credit = Math.min(pre, i.eligible_final_paid_us_tax_cny);
      return {
        dividend_tax: d,
        rent_tax: r,
        pension_tax: p,
        before_credit: pre,
        credit,
        due: pre - credit,
      };
    }
    case 'CN-2': {
      const pre = i.dividends * 0.2,
        eligible = i.dividend_us_final_paid_tax,
        credit = Math.min(pre, eligible);
      return {
        before_credit: pre,
        eligible_pool: eligible,
        credit,
        due: pre - credit,
        excluded_ss_tax: i.ss_us_final_paid_tax,
      };
    }
    case 'EST-1':
      return { tentative_taxes: i.bases.map(tentative) };
    case 'EST-2':
      return { estate_tax: Math.max(0, tentative(i.us_situs) - i.nra_credit) };
    case 'EST-3':
      return {
        estate_tax: Math.max(
          0,
          tentative(i.gross) - tentative(i.exclusion * i.index),
        ),
      };
    case 'RMD-1': {
      const r = i.prior_year_end_balance / i.divisor;
      return { rmd: r, surplus: r - i.need };
    }
    case 'MORT-1':
      return {
        life_expectancy: i.parameters.map(([m, b]) => {
          const h = i.integration_end / i.intervals,
            survival = (t) =>
              Math.exp(-Math.exp((i.start_age - m) / b) * Math.expm1(t / b));
          let sum = survival(0) + survival(i.integration_end);
          for (let k = 1; k < i.intervals; k++)
            sum += (k % 2 ? 4 : 2) * survival(k * h);
          return (sum * h) / 3;
        }),
        rounded_spec: [20.05, 22.52],
      };
    case 'FIRPTA-1': {
      const pre = i.price * i.foreign_share * i.withholding_rate;
      return {
        cash_at_closing: i.price - i.mortgage - i.costs - pre,
        prepayment: pre,
        refund: Math.max(pre - i.final_liability, 0),
        permanent_tax: i.final_liability,
      };
    }
    case 'FIRPTA-SHARE': {
      const p = i.price * i.foreign_share * i.withholding_rate;
      return {
        withholding: p,
        cash_at_closing: i.price - i.mortgage - i.costs - p,
      };
    }
    case 'DEATH-1':
    case 'DEATH-2':
      return {
        permitted_final_return_deduction: Math.max(
          i.suspended_loss - i.relevant_positive_basis_increase,
          0,
        ),
      };
    case 'TERMINAL-1': {
      const u = Math.max(i.final_income_liability - i.net_remitted, 0),
        s = i.assets - u - i.estate_due;
      return {
        net_to_heirs: Math.max(s, 0),
        unpaid: u,
        actual_paid: i.net_remitted,
        estate_shortfall: Math.max(-s, 0),
      };
    }
    case 'TERMINAL-REFUND': {
      const due = Math.max(i.final_liability - i.net_remitted, 0),
        refund = Math.max(i.net_remitted - i.final_liability, 0);
      return {
        due,
        confirmed_refund: refund,
        net_to_heirs: i.assets - due + refund,
        actual_refund_cash_at_terminal: 0,
      };
    }
    case 'TERMINAL-DEFICIT': {
      const s =
        i.assets -
        Math.max(i.final_liability - i.net_remitted, 0) -
        i.estate_due;
      return {
        signed_net: s,
        net_to_heirs: Math.max(s, 0),
        estate_shortfall: Math.max(-s, 0),
        excluded_conditional_credit: i.conditional_credit,
        actual_paid: i.net_remitted,
      };
    }
    case 'US-EARLY':
      return { penalty: i.early_trad * i.penalty_rate };
    case 'CN-PARTIAL': {
      const p = Math.min(i.source_paid, i.eligible_final_source_liability),
        used = Math.min(i.china_precredit, p);
      return {
        eligible_paid: p,
        used_credit: used,
        china_due: i.china_precredit - used,
        ftc_adjustment: i.projected_credit - used,
      };
    }
    case 'CN-WITHHOLDING': {
      const pool = Math.min(
          i.gross_withholding - i.refund,
          i.final_eligible_source_liability,
        ),
        credit = Math.min(i.china_precredit, pool);
      return {
        eligible_retained_pool: pool,
        credit,
        china_due: i.china_precredit - credit,
      };
    }
    case 'RNG-VECTORS': {
      const bytes = createHash('sha256').update(i.tuple_text, 'utf8').digest(),
        s = [0, 4, 8, 12].map((k) => bytes.readUInt32LE(k));
      const [u, v] = i.normal_uniforms,
        a = Math.sqrt(-2 * Math.log(u)),
        theta = 2 * Math.PI * v;
      return {
        raw_outputs: rng(i.raw_state, 8),
        sha256: bytes.toString('hex'),
        little_endian_state: s,
        seeded_outputs: rng(s, 5),
        uniform_min: 0.5 / 2 ** 32,
        uniform_max: (2 ** 32 - 0.5) / 2 ** 32,
        normal_pair: [a * Math.cos(theta), a * Math.sin(theta)],
      };
    }
    case 'MARKET-JOINT': {
      let k = 0,
        last = Math.floor(i.bootstrap_uniforms[k++] * i.source_rows.length);
      const ids = [last];
      while (k < i.bootstrap_uniforms.length) {
        const jump = i.bootstrap_uniforms[k++],
          candidate = i.bootstrap_uniforms[k++];
        last =
          jump < 1 / i.block_mean_years
            ? Math.floor(candidate * i.source_rows.length)
            : (last + 1) % i.source_rows.length;
        ids.push(last);
      }
      return {
        row_indices: ids,
        all_columns_same_row: true,
        consumed_uniform_count: k,
      };
    }
    case 'MARKET-PROJECTION': {
      const x = i.unit_source,
        m = x.reduce((a, b) => a + b, 0) / x.length,
        s = Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / x.length),
        y = x.map((v) => i.target_mean + ((v - m) * i.target_vol) / s),
        ym = y.reduce((a, b) => a + b, 0) / y.length,
        ys = Math.sqrt(y.reduce((a, b) => a + (b - ym) ** 2, 0) / y.length);
      return {
        source_mean: m,
        source_population_sd: s,
        transformed: y,
        mean: ym,
        sd: ys,
        correlation: 1,
      };
    }
    case 'MARKET-TIMING':
      return {
        cn_index_0: 1,
        us_index_0: 1,
        cn_index_1: 1 + i.cn_cpi,
        us_index_1: 1 + i.us_cpi,
        fx_10: i.fx_spot * i.fx_multiplier ** 10,
        stress_index: i.stress_year - i.start_year,
        stress_ratio: 1 + i.stress_pct,
        deposit_rate: Math.max(i.deposit_floor, i.cn_cpi + i.deposit_real_rate),
        medical_price_factor: 1 + i.cn_cpi + i.medical_excess,
      };
    case 'MARKET-AR': {
      let p = i.start;
      const rates = [];
      for (let k = 0; k < i.years; k++) {
        p = i.mean + i.phi * (p - i.mean);
        rates.push(p);
      }
      return { cn_rates: rates };
    }
    case 'MARKET-INVALID': {
      const p = i.mean + i.sigma * i.z;
      return {
        cn_cpi: p,
        gross_factor: 1 + p,
        error_path_id: i.path_id,
        error_year: i.start_year + i.t,
        whole_job_failed: true,
        partial_probabilities: false,
      };
    }
    case 'BUDGET-1':
      return {
        included_recurring:
          i.ordinary_cny + i.cpi_health_cny + i.medical_base_cny,
        health: i.cpi_health_cny + i.medical_base_cny,
        duplicate_total:
          i.ordinary_cny + i.cpi_health_cny + i.duplicate_medical_base_cny,
        duplicate_run_allowed: false,
      };
    case 'SPENDING-TIMING':
      return {
        care_before_t20: 0,
        care_t20_cny: 12 * i.care_monthly * (1 + i.cn_cpi) ** 20,
        survivor_item_t0: 12 * i.base_monthly,
        survivor_item_t1:
          12 * i.base_monthly * (1 + i.cn_cpi) * i.survivor_factor,
      };
    case 'FLEX-1': {
      const seq = (a) => {
        let m = 1;
        const result = [m];
        for (const r of a) {
          m =
            r < 0
              ? Math.max(i.floor, m * (1 - i.cut))
              : Math.min(i.cap, m * (1 + i.recover));
          result.push(m);
        }
        return result;
      };
      return {
        multipliers: seq(i.prior_returns),
        loss_multipliers: seq(i.loss_returns),
        disabled_multiplier: 1,
      };
    }
    case 'MEDICAL-GROWTH': {
      const nominal = (1 + i.cn_cpi + i.medical_excess) * (1 + i.age_growth),
        real = nominal / (1 + i.cn_cpi),
        medical = i.base * nominal,
        total = i.ordinary * (1 + i.cn_cpi) + medical,
        ceiling = (i.ordinary + i.base) * (1 + i.cn_cpi);
      return {
        nominal_factor: nominal,
        real_factor: real,
        year1_medical_nominal: medical,
        year1_medical_real: medical / (1 + i.cn_cpi),
        year1_included_total: total,
        year1_ceiling: ceiling,
        year1_excess: total - ceiling,
        after50_medical_real: i.base * real ** i.increments,
      };
    }
    case 'MEDICAL-SCOPE': {
      const s =
          i.occurrence_uniform < i.prob_at60
            ? i.median * Math.exp(i.size_normal) * i.medical_index
            : 0,
        base = i.included_recurring;
      return {
        shock: s,
        additional_scope: {
          included: base,
          additional: s,
          total: base + s,
          excess: Math.max(base - i.ceiling, 0),
        },
        included_scope: {
          included: base + s,
          additional: 0,
          total: base + s,
          excess: Math.max(base + s - i.ceiling, 0),
        },
      };
    }
    case 'SS-GATES': {
      const schedule = (cut) =>
        Object.fromEntries(
          [45, 60, 62, 67].map((age) => {
            const own = age >= i.own_claim_age ? 12 * i.own_monthly : 0,
              surv =
                age >= i.survivor_claim_age && age > i.A_start_age
                  ? 12 * i.survivor_monthly
                  : 0;
            return [
              'age' + age,
              Math.max(own, surv) *
                (age >= i.cut_start_age && cut ? 1 - i.cut : 1),
            ];
          }),
        );
      return {
        before_cut_schedule: schedule(false),
        with_cut: schedule(true),
        disabled_all: 0,
        ordinary_claim_age45_allowed: false,
      };
    }
    case 'ACCOUNT-BASIS': {
      const fraction = i.withdrawal / i.opening_value,
        income = i.opening_value * i.separate_return_case.yield;
      return {
        withdrawal_gain: i.withdrawal - i.opening_basis * fraction,
        remaining_value: i.opening_value - i.withdrawal,
        remaining_basis: i.opening_basis * (1 - fraction),
        return_case_value:
          i.opening_value * (1 + i.separate_return_case.total_return),
        return_case_basis: i.opening_basis + income,
      };
    }
    case 'ACCOUNT-REBALANCE': {
      const total = i.stock_value + i.bond_value,
        target = total * i.target_stock,
        sale = i.stock_value - target,
        basisSold = (i.stock_basis * sale) / i.stock_value;
      return {
        stock_sale: sale,
        gain: sale - basisSold,
        ending_stock: target,
        ending_bond: total - target,
        stock_basis: i.stock_basis - basisSold,
        bond_basis: i.bond_basis + sale,
        retirement_taxable_gain: 0,
      };
    }
    case 'CONVERSION-1':
      return {
        usd_to_fund_cny: i.cny_need / (i.fx * (1 - i.spread)),
        cny_to_fund_usd: i.usd_need * i.fx * (1 + i.spread),
      };
    case 'PROPERTY-BOOKS': {
      const gross = 12 * i.rent_monthly * i.index * (1 - i.vacancy),
        fee = i.management_fee * gross,
        maint = i.maintenance_pct * i.value,
        dep = (i.cost_basis * (1 - i.land_share)) / 27.5,
        cash =
          gross -
          fee -
          maint -
          i.property_tax -
          i.insurance -
          12 * i.hoa_monthly;
      return {
        gross_rent: gross,
        management_fee: fee,
        maintenance: maint,
        cash_flow: cash,
        annual_depreciation: dep,
        schedule_e_net: cash - dep,
      };
    }
    case 'PROPERTY-MORTGAGE': {
      const p =
          (i.opening_balance * i.rate) / (1 - (1 + i.rate) ** -i.years_left),
        interest = i.opening_balance * i.rate,
        principal = p - interest;
      return {
        annual_payment: p,
        first_interest: interest,
        first_principal: principal,
        ending_balance: i.opening_balance - principal,
      };
    }
    case 'SALE-FAIL': {
      const cash =
        i.price -
        i.costs -
        i.mortgage -
        i.price * i.foreign_share * i.withholding_rate;
      return {
        quoted_closing_cash: cash,
        required_contribution: Math.max(-cash, 0),
        executed: false,
        realized_gain: 0,
        prepayment: 0,
        property_still_held: true,
      };
    }
    case 'DEATH-SNAPSHOT':
      return {
        simultaneous: i.A_death_t === i.B_death_t,
        B_surviving_citizen_spouse: false,
        B_estate_tax: Math.max(tentative(i.B_us_situs) - i.B_nra_credit, 0),
        permitted_passive_deduction: Math.max(
          i.passive_loss - i.basis_increase,
          0,
        ),
        tax_inputs_before_transfer: true,
        carry_to_survivor: false,
      };
    case 'CONTROL-PV':
    case 'CONTROL-FX': {
      const r = controlRows(i.fx_multiplier);
      const places = c.expected.exact_pv_decimal.split('.')[1].length;
      return {
        payment_count: r.rows.length,
        first_payment: r.initialPayment.number(),
        required_balance: r.pv.number(),
        displayed_pv: r.pv.number().toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        final_balance: r.rows.at(-1).end.number(),
        exact_pv_decimal: r.pv.decimal(places),
        first_age: r.rows[0].age_A,
        last_age: r.rows.at(-1).age_A,
        allocated_rows: i.max_age - (i.start_year - i.birth_year_A) + 1,
      };
    }
    case 'CONTROL-DEPLETION': {
      const annual = (12 * i.spending_monthly_cny) / i.fx,
        t = i.initial_accessible_roth_usd / annual;
      return {
        annual_usd_need: annual,
        t9_end_balance: i.initial_accessible_roth_usd - 10 * annual,
        t9_depleted: false,
        first_shortfall_t: t,
        first_shortfall_year: i.start_year + t,
        first_shortfall_cny: annual * i.fx,
      };
    }
    case 'ENGINE-FINAL-TAX': {
      const a = i.A_trad - i.spending_year0_usd,
        tax = i.spending_year0_usd * i.us_ordinary_flat_rate;
      return {
        year0_trad_withdrawal: i.spending_year0_usd,
        year0_assets: a,
        year0_income_tax: tax,
        actual_paid: 0,
        terminal_unpaid: tax,
        net_to_heirs: a - tax,
      };
    }
    case 'ENGINE-PRIOR-TAX': {
      const tax0 = i.spending_year0_usd * i.us_ordinary_flat_rate,
        assets = i.A_trad - i.spending_year0_usd - tax0,
        tax1 = tax0 * i.us_ordinary_flat_rate;
      return {
        year0_income_tax: tax0,
        year1_trad_withdrawal: tax0,
        year1_actual_paid: tax0,
        year1_assets: assets,
        year1_income_tax: tax1,
        terminal_unpaid: tax1,
        net_to_heirs: assets - tax1,
      };
    }
    case 'ENGINE-FIRPTA': {
      const p = i.B_owned_property,
        gain = p.price * (1 - p.selling_cost) - p.cost_basis,
        held = p.price * p.firpta_rate,
        closing = p.price * (1 - p.selling_cost) - p.mortgage - held,
        fed = gain * i.us_property_gain_rate,
        cn = Math.max(gain * i.china_property_gain_rate - i.eligible_credit, 0),
        refund = held - fed;
      return {
        gain,
        closing_cash: closing,
        withheld: held,
        final_federal_tax: fed,
        final_china_due: cn,
        confirmed_refund: refund,
        terminal_assets: closing,
        net_to_heirs: closing + refund - cn,
      };
    }
    case 'SUMMARY-1': {
      const values = i.active_values.filter((x) => x !== null),
        alive = i.alive.reduce((a, b) => a + b, 0),
        healthy = i.alive.reduce(
          (s, a, k) => s + (a && !i.depleted[k] ? 1 : 0),
          0,
        ),
        success = i.depleted.filter((x) => !x).length;
      return {
        p10: quantile(values, 0.1),
        median: quantile(values, 0.5),
        p90: quantile(values, 0.9),
        alive_probability: alive / i.n_paths,
        alive_not_depleted_probability: healthy / i.n_paths,
        conditional_healthy_given_alive: healthy / alive,
        lifetime_success: success / i.n_paths,
        empty_quantile: quantile([], 0.5),
      };
    }
    case 'RANKING-1': {
      const paths = i.paths.slice().sort((a, b) => {
          const ad = a.depletion_t !== null,
            bd = b.depletion_t !== null;
          if (ad !== bd) return ad ? -1 : 1;
          if (ad && a.depletion_t !== b.depletion_t)
            return a.depletion_t - b.depletion_t;
          return a.terminal - b.terminal || a.id - b.id;
        }),
        ids = paths.map((p) => p.id);
      return {
        ascending_ids: ids,
        worst: ids[0],
        p10: ids[Math.floor(0.1 * (ids.length - 1))],
        median: ids[Math.floor(0.5 * (ids.length - 1))],
      };
    }
    case 'SEQUENCE-1': {
      const result = (returns, w) =>
        returns.reduce((b, r) => (b - w) * (1 + r), i.initial);
      return {
        ending_original: result(i.returns, i.annual_beginning_withdrawal),
        ending_reversed: result(i.reversed, i.annual_beginning_withdrawal),
        no_withdrawal_both: result(i.returns, 0),
      };
    }
    default:
      return null;
  }
}
function compare(
  expected,
  actual,
  tol,
  path = '',
  failures = [],
  exactFields = [],
  fieldTolerances = {},
) {
  if (typeof expected === 'number') {
    const countPath =
      /(?:^|\.)(?:payment_count|allocated_rows|first_age|last_age|first_shortfall_t|first_shortfall_year|error_path_id|error_year|stress_index|row_indices|ascending_ids|worst|p10|median|consumed_uniform_count)(?:\.|$)/.test(
        path,
      );
    const exact =
      (Number.isInteger(expected) && countPath) ||
      exactFields.some((f) => path.startsWith(f));
    const limit = exact ? 0 : (fieldTolerances[path] ?? tol);
    if (
      typeof actual !== 'number' ||
      !Number.isFinite(actual) ||
      Math.abs(expected - actual) > limit
    )
      failures.push({ path, expected, actual, tolerance: limit });
  } else if (expected !== null && typeof expected === 'object') {
    for (const [k, v] of Object.entries(expected))
      compare(
        v,
        actual?.[k],
        tol,
        path ? path + '.' + k : k,
        failures,
        exactFields,
        fieldTolerances,
      );
  } else if (expected !== actual) failures.push({ path, expected, actual });
  return failures;
}
export async function recalculate(options = {}) {
  const records = [];
  for (const c of catalog.cases) {
    if (c.oracle_kind === 'conditional') {
      records.push({
        id: c.id,
        status: 'OPEN',
        reason: c.arithmetic_status,
        implementation_status: 'NOT IMPLEMENTED',
        manual_status: 'NOT RUN',
      });
      continue;
    }
    const actual = reference(c);
    if (actual === null) {
      records.push({
        id: c.id,
        status: 'PREPARED STRUCTURAL ORACLE',
        implementation_status: 'NOT IMPLEMENTED',
        manual_status: 'NOT RUN',
      });
      continue;
    }
    const failures = compare(
      c.expected,
      actual,
      c.tolerance,
      '',
      [],
      c.integer_fields || [],
      c.field_tolerances || {},
    );
    records.push({
      id: c.id,
      status: failures.length ? 'FAIL' : 'PASS: INDEPENDENT REFERENCE ONLY',
      inputs: c.inputs,
      actual,
      expected: c.expected,
      tolerance: c.tolerance,
      field_tolerances: c.field_tolerances || {},
      failures,
      implementation_status: 'NOT IMPLEMENTED',
      manual_status: 'NOT RUN',
      legal_status: c.legal_status,
      source_gate_ids: c.source_gate_ids,
    });
  }
  const hashFile = async (p) =>
    createHash('sha256')
      .update(await readFile(resolve(root, p)))
      .digest('hex');
  const hashes = {};
  for (const p of [
    'fixtures/oracles.json',
    'fixtures/tax-tables.spec.json',
    'reference/recalculate.mjs',
    '../plan/2026-10-18-retirement-sim-design.md',
  ])
    hashes[p] = await hashFile(p);
  const report = {
    record_kind:
      'M00 independent arithmetic verification, not product execution or human acceptance',
    node: process.version,
    input_hashes: hashes,
    reference_imports_product_model: false,
    checked_at: new Date().toISOString(),
    counts: {
      reference_pass: records.filter((r) => r.status.startsWith('PASS')).length,
      reference_fail: records.filter((r) => r.status === 'FAIL').length,
      structural_prepared: records.filter((r) =>
        r.status.startsWith('PREPARED'),
      ).length,
      open: records.filter((r) => r.status === 'OPEN').length,
    },
    records,
  };
  const output = options.report
    ? resolve(root, '..', options.report)
    : resolve(root, 'records/M00-2/arithmetic-report.json');
  if (options.report) {
    report.record_kind =
      'Current independent reference arithmetic; original M00 report preserved';
    report.manual_acceptance = 'RETIRED';
    report.product_execution =
      'Separate product-cases.json and browser-results.json; this calculator never imports the product';
    for (const record of records) {
      record.implementation_status =
        'NOT APPLICABLE: independent reference calculator';
      record.manual_status = 'RETIRED';
    }
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report.counts, null, 2));
  for (const r of records.filter((r) => r.status === 'FAIL'))
    console.error(r.id, JSON.stringify(r.failures));
  if (report.counts.reference_fail) process.exitCode = 1;
  return report;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const i = process.argv.indexOf('--report');
  await recalculate(i >= 0 ? { report: process.argv[i + 1] } : {});
}
