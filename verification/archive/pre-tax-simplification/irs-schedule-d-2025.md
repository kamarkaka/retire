# IRS Schedule D: supported long-term §1250 loss ordering

The original IRS PDF is saved beside this note. Its SHA-256, retrieval time and independently entered numeric cases are in `irs-schedule-d-2025.json`. This checks the scope listed there; it does not verify every capital/Section 1231 or cross-border rule.

## Reduced worksheet for this model

- Unrecaptured-gain worksheet line 13: the already classified gross unrecaptured §1250 gain.
- Lines 14 and 15: zero, because the model has no collectibles or short-term pool.
- Line 16: prior long-term capital-loss carryover, entered as a loss.
- Lines 17 and 18: subtract that carryover from the gross §1250 bucket, floored at zero.
- Schedule D Tax Worksheet lines 7–13: cap the effective §1250 bucket at the positive net long-term gain. The remaining net gain receives the ordinary long-term capital-gain rates.

Current-year ordinary long-term securities losses first reduce other current long-term gains and then constrain the effective §1250 gain through the net-gain cap. Prior long-term carryovers reduce the §1250 worksheet amount first. Therefore simply capping the gross §1250 amount at net gain would be incorrect when a carryover exists.

For securities −$10,000, other property LT +$30,000, §1250 +$50,000 and prior LT carryover $20,000: net gain is $50,000; worksheet §1250 is $30,000; effective §1250 is $30,000; other LT gain is $20,000.

## Original IRS text: unrecaptured-gain worksheet

Instructions for the Unrecaptured Section 1250 Gain Worksheet
Lines 1 through 3.
If you had more than one property described on line 1, complete lines 1 through 3 for each property on a separate worksheet. Enter the total of the line 3 amounts for all properties on line 3 and go to line 4.
Line 4.
To figure the amount to enter on line 4, follow the steps below for each installment sale of trade or business property held more than 1 year.
Step 1.
Figure the smaller of (a) the depreciation allowed or allowable, or (b) the total gain for the sale. This is the smaller of line 22 or line 24 of your 2025 Form 4797 (or the comparable lines of Form 4797 for the year of sale) for the property.
Step 2.
Reduce the amount figured in Step 1 by any section 1250 ordinary income recapture for the sale. This is the amount from line 26g of your 2025 Form 4797 (or the comparable line of Form 4797 for the year of sale) for the property. The result is your total unrecaptured section 1250 gain that must be allocated to the installment payments received from the sale.
Step 3.
Generally, the entire amount of gain from the sale of trade or business property included in each installment payment is treated as unrecaptured section 1250 gain until the total unrecaptured section 1250 gain figured in Step 2 has been used in full. Figure the amount of gain treated as unrecaptured section 1250 gain for installment payments received in 2025 as the smaller of (a) the amount from line 26 or line 37 of your 2025 Form 6252, whichever applies; or (b) the amount of unrecaptured section 1250 gain remaining to be reported. This amount is generally the total unrecaptured section 1250 gain for the sale reduced by all gain reported in prior years (excluding section 1250 ordinary income recapture). However, if you chose not to treat all of the gain from payments received after May 6, 1997, and before August 24, 1999, as unrecaptured section 1250 gain, use only the amount you chose to treat as unrecaptured section 1250 gain for those payments to reduce the total unrecaptured section 1250 gain remaining to be reported for the sale. Include this amount on line 4.
Unrecaptured Section 1250 Gain Worksheet—Line 19
 |  
 | If you aren’t reporting a gain on Form 4797, line 7, skip lines 1 through 9 and go to line 10.
 |  
 | 1.
 | If you have a section 1250 property in Part III of Form 4797 for which you made an entry in Part I of Form 4797 (but not on Form 6252), enter the smaller of line 22 or line 24 of Form 4797 for that property. If you didn’t have any such property, go to line 4. If you had more than one such property, see instructions
 | 1.
 |  
 | _____
 |  
 | 2.
 | Enter the amount from Form 4797, line 26g, for the property for which you made an entry on line 1
 | 2.
 |  
 | _____
 |  
 | 3.
 | Subtract line 2 from line 1
 | 3.
 |  
 | _____
 |  
 | 4.
 | Enter the total unrecaptured section 1250 gain included on line 26 or line 37 of Form(s) 6252 from installment sales of trade or business property held more than 1 year. See instructions
 | 4.
 |  
 | _____
 |  
 | 5.
 | Enter the total of any amounts reported to you on a Schedule K-1 from a partnership or an S corporation as “unrecaptured section 1250 gain”
 | 5.
 |  
 | _____
 |  
 | 6.
 | Add lines 3 through 5
 | 6.
 |  
 | _____
 |  
 | 7.
 | Enter the smaller of line 6 or the gain from Form 4797, line 7
 | 7.
 |  
 | _____
 |  
 | 8.
 | Enter the amount, if any, from Form 4797, line 8
 | 8.
 |  
 | _____
 |  
 | 9.
 | Subtract line 8 from line 7. If zero or less, enter -0-
 | 9.
 |  
 | _____
 |  
 | 10.
 | Enter the amount of any gain from the sale or exchange of an interest in a partnership attributable to unrecaptured section 1250 gain. See instructions
 | 10.
 |  
 | _____
 |  
 | 11.
 | Enter the total of any amounts reported to you as “unrecaptured section 1250 gain” on a Schedule K-1, Form 1099-DIV, or Form 2439 from an estate, a trust, a real estate investment trust, or a mutual fund (or other regulated investment company) or in connection with a Form 1099-R
 | 11.
 |  
 | _____
 |  
 | 12.
 | Enter the total of any unrecaptured section 1250 gain from sales (including installment sales) or other dispositions of section 1250 property held more than 1 year for which you didn’t make an entry in Part I of Form 4797 for the year of sale. See instructions
 | 12.
 |  
 | _____
 |  
 | 13.
 | Add lines 9 through 12
 | 13.
 |  
 | _____
 |  
 | 14.
 | If you had any section 1202 gain or collectibles gain or (loss), enter the total of lines 1 through 4 of the 28% Rate Gain Worksheet. Otherwise, enter -0-
 | 14.
 |  
 | _____
 |  
 | 15.
 | Enter the (loss), if any, from Schedule D, line 7. If Schedule D, line 7, is zero or a gain, enter -0-
 | 15.
 |  
 | (_____)
 |  
 | 16.
 | Enter your long-term capital loss carryovers from Schedule D, line 14; and Schedule K-1 (Form 1041), box 11, code D*
 | 16.
 |  
 | (_____)
 |  
 | 17.
 | Combine lines 14 through 16. If the result is a (loss), enter it as a positive amount. If the result is zero or a gain, enter -0-
 | 17.
 |  
 | _____
 |  
 | 18.
 | Unrecaptured section 1250 gain. Subtract line 17 from line 13. If zero or less, enter -0-. If more than zero, enter the result here and on Schedule D, line 19
 | 18.
 |  
 | _____
 |  
 |  
 |  
 |  
 |  
 |  
 |  
 |  
 | * If you are filing Form 2555 (relating to foreign earned income), see the footnote in the Foreign Earned Income Tax Worksheet in the Instructions for Form 1040 before completing this line.
 |  
 |  
 |  
 |  


## Original IRS text: Schedule D Tax Worksheet through line 14


Schedule D Tax Worksheet
 |  
 | Complete this worksheet only if line 18 or line 19 of Schedule D is more than zero and lines 15 and 16 of Schedule D are gains or if you file Form 4952 and you have an amount on line 4g, even if you don’t need to file Schedule D. Otherwise, complete the Qualified Dividends and Capital Gain Tax Worksheet in the instructions for Form 1040, line 16, (or in the instructions for Form 1040-NR, line 16) to figure your tax. Before completing this worksheet, complete Form 1040, 1040-SR, or 1040-NR through line 15.
 |  
 |  
 | 
 Exception: Don’t use the Qualified Dividends and Capital Gain Tax Worksheet or this worksheet to figure your tax if:
Line 15 or line 16 of Schedule D is zero or less and you have no qualified dividends on Form 1040, 1040-SR, or 1040-NR, line 3a; or 
Form 1040, 1040-SR, or 1040-NR, line 15, is zero or less.
 Instead, see the instructions for Form 1040, line 16 (or Form 1040-NR, line 16).
 |  
 |  
 |  
 | 1.
 |  
 | Enter your taxable income from Form 1040, 1040-SR, or 1040-NR, line 15. (However, if you are filing Form 2555 (relating to foreign earned income), enter instead the amount from line 3 of the Foreign Earned Income Tax Worksheet in the instructions for Form 1040, line 16.)
 | 1.
 |  
 | _____
 |  
 |  
 | 2.
 |  
 | Enter your qualified dividends from Form 1040, 1040-SR, or 1040-NR, line 3a
 | 2.
 |  
 | _____
 |  
 |  
 |  
 | 3.
 |  
 | Enter the amount from Form 4952 (used to figure investment interest expense deduction), line 4g
 | 3.
 |  
 | _____
 |  
 |  
 |  
 | 4.
 |  
 | Enter the amount from Form 4952, line 4e*
 | 4.
 |  
 | _____
 |  
 |  
 |  
 | 5.
 |  
 | Subtract line 4 from line 3. If zero or less, enter -0-
 | 5.
 |  
 | _____
 |  
 |  
 |  
 | 6.
 |  
 | Subtract line 5 from line 2. If zero or less, enter -0-**
 | 6.
 |  
 | _____
 |  
 |  
 |  
 | 7.
 |  
 | Enter the smaller of line 15 or line 16 of Schedule D
 | 7.
 |  
 | _____
 |  
 |  
 |  
 | 8.
 |  
 | Enter the smaller of line 3 or line 4
 | 8.
 |  
 | _____
 |  
 |  
 |  
 | 9.
 |  
 | Subtract line 8 from line 7. If zero or less, enter -0-**
 | 9.
 |  
 | _____
 |  
 |  
 |  
 | 10.
 |  
 | Add lines 6 and 9
 | 10.
 |  
 | _____
 |  
 |  
 |  
 | 11.
 |  
 | Add lines 18 and 19 of Schedule D**
 | 11.
 |  
 | _____
 |  
 |  
 |  
 | 12.
 |  
 | Enter the smaller of line 9 or line 11
 | 12.
 |  
 | _____
 |  
 |  
 |  
 | 13.
 |  
 | Subtract line 12 from line 10
 | 13.
 |  
 | _____
 |  
 |  
 | 14.
 |  
 | Subtract line 13 from line 1. If zero or less, enter -0-
 | 14.
 |  
 | _____
 |  
 |  

