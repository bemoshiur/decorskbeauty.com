// src/lib/accounting — posting rules, journal writer, balance enforcement (§12).
// Full double-entry: every financial event posts a balanced journal (#5). Pre-order money is a
// liability (2030) released to revenue at delivery (#6, [[revenue-recognition-delivered]]).
export { CHART, ACCT, ensureAccounts, resolveAccountIds, type AccountType } from './accounts'
export * from './postings'
export { postJournal, validateBalance, type PostJournalInput, type JournalSource } from './postJournal'
export { computeTrialBalance, type TrialBalance, type TrialBalanceRow } from './trialBalance'
