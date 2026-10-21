/** Test-only literal annual rows. Product configs have no return override or control mode. */
import { references } from '../src/reference/bundle';
import { hashObject,freezePlain } from '../src/model/canonical';
import { calibrateHistory } from '../src/reference/calibration';
import type { HistoricalRow,PublicReferenceBundle } from '../src/model/types';

export function arithmeticReferences(rate=.03,usCpi=.03):PublicReferenceBundle {
  const history:HistoricalRow[]=Array.from({length:98},(_,i)=>({year:1928+i,us_stocks:rate,us_bonds:rate,usd_cash:rate,us_cpi:usCpi,us_home:0}));
  const {market_data:_data,...base}=references;
  const {market_data:_version,...versions}=base.versions,{market_data:_hash,...hashes}=base.hashes;
  return freezePlain({...base,history,versions:{...versions,history:'verification-literal-tape-v1'},
    hashes:{...hashes,history:hashObject(history),calibration:hashObject(calibrateHistory(history))}});
}
export const THREE_PERCENT_TAPE=arithmeticReferences();
export const ZERO_RETURN_TAPE=arithmeticReferences(0,0);
// The PV control retires in USD: its 4% home inflation now comes from the USD leg so the fixed-FX payment stream is unchanged.
export const PV_TAPE=arithmeticReferences(.03,.04);
export function fixtureReferences(name:string):PublicReferenceBundle {
  if(name.startsWith('control-pv'))return PV_TAPE;
  return name.startsWith('control-fx')?THREE_PERCENT_TAPE:ZERO_RETURN_TAPE;
}
