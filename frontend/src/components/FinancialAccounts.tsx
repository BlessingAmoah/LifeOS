import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import EmptyState from './EmptyState';
import { financialCurrencies as currencies, financeErrorMessage as message } from '../utils/finance';
import './FinancialAccounts.css';

const accountTypes = [
  ['checking', 'Checking'], ['savings', 'Savings'], ['cash', 'Cash'],
  ['credit_card', 'Credit card'], ['investment', 'Investment'], ['loan', 'Loan'], ['other', 'Other'],
] as const;
type AccountType = typeof accountTypes[number][0];
const institutions = [
  { group: 'US banks and credit-card issuers', names: ['Ally Bank', 'American Express', 'Bank of America', 'Barclays US', 'Capital One', 'Chase', 'Citi', 'Discover (Capital One)', 'PNC Bank', 'SoFi Bank', 'Synchrony', 'Truist', 'U.S. Bank', 'Wells Fargo'] },
  { group: 'Ghanaian banks', names: [
    'Absa Bank Ghana', 'Access Bank Ghana', 'Agricultural Development Bank (Ghana)',
    'Bank of Africa Ghana', 'CalBank', 'Consolidated Bank Ghana', 'Ecobank Ghana',
    'Fidelity Bank Ghana', 'First Atlantic Bank', 'First Bank Ghana', 'First National Bank Ghana',
    'GCB Bank', 'Guaranty Trust Bank Ghana', 'OmniBSIC Bank Ghana', 'Prudential Bank Ghana',
    'Republic Bank Ghana', 'Stanbic Bank Ghana', 'Standard Chartered Bank Ghana',
    'United Bank for Africa Ghana', 'Universal Merchant Bank Ghana', 'Zenith Bank Ghana',
  ] },
  { group: 'Credit unions', names: ['Alliant Credit Union', 'Navy Federal Credit Union', 'PenFed Credit Union'] },
  { group: 'Brokerages', names: ['Charles Schwab', 'Fidelity', 'Vanguard'] },
  { group: 'Financial apps and account products', names: ['OnePay', 'OnePay Invest', 'Apple Card', 'Apple Savings (Apple Card)'] },
  { group: 'Mobile money', names: ['MTN MoMo (Ghana)'] },
];
const institutionHints: Record<string, string> = {
  OnePay: 'OnePay is a financial app with partner-bank services. Checking and savings share a deposit account: record each section balance separately, not the combined balance twice.',
  'OnePay Invest': 'Choose Investment for this brokerage account. Track its value separately from OnePay checking and savings.',
  'Apple Savings (Apple Card)': 'Choose Savings for the Apple Card Savings deposit account. Track its balance separately from the Apple Card amount owed.',
  'Apple Card': 'Choose Credit card for Apple Card. Track the amount owed separately from Apple Savings.',
  'MTN MoMo (Ghana)': 'For your mobile-money wallet balance, choose Cash or Other and GHS. This is not a bank connection.',
};
const knownInstitutions = institutions.flatMap(group => group.names);
const today = () => new Date().toISOString().slice(0, 10);

interface Account {
  id: string;
  name: string;
  account_type: AccountType;
  currency: string;
  institution_name: string | null;
  account_suffix: string | null;
  source: 'manual';
  is_archived: boolean;
  is_stale: boolean;
  balance: string | null;
  balance_as_of: string | null;
  balance_recorded_at: string | null;
}
interface Balance {
  id: string;
  balance: string;
  balance_as_of: string;
  recorded_at: string;
}
interface AccountForm {
  name: string;
  account_type: AccountType;
  currency: string;
  institution: string;
  custom_institution: string;
  account_suffix: string;
  is_stale: boolean;
  balance: string;
  balance_as_of: string;
}
const newForm = (): AccountForm => ({
  name: '', account_type: 'checking', currency: 'USD', institution: '', custom_institution: '',
  account_suffix: '', is_stale: false, balance: '', balance_as_of: today(),
});
function balanceStatus(account: Account) {
  if (!account.balance_as_of) return 'No recorded balance';
  if (account.is_stale) return 'Manually marked outdated';
  const age = Math.floor((Date.now() - Date.parse(`${account.balance_as_of}T00:00:00Z`)) / 86400000);
  if (age < 0) return 'Future-dated observation';
  return age > 30 ? 'Balance older than 30 days' : 'Dated manual balance';
}

export default function FinancialAccounts() {
  const client = useQueryClient();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(newForm);
  const [observation, setObservation] = useState({ balance: '', balance_as_of: today() });
  const [notice, setNotice] = useState('');
  const accounts = useQuery<Account[]>({
    queryKey: ['financial-accounts', includeArchived],
    queryFn: () => api.get(`/financial-accounts?include_archived=${includeArchived}`).then(response => response.data),
  });
  const detail = useQuery<{ account: Account; balance_history: Balance[] }>({
    queryKey: ['financial-account', selectedId],
    queryFn: () => api.get(`/financial-accounts/${selectedId}`).then(response => response.data),
    enabled: selectedId !== null,
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['financial-accounts'] });
    void client.invalidateQueries({ queryKey: ['financial-account'] });
  };
  const save = useMutation({
    mutationFn: () => {
      const metadata = {
        name: form.name, account_type: form.account_type,
        institution_name: (form.institution === 'other' ? form.custom_institution.trim() : form.institution) || null,
        account_suffix: form.account_suffix || null, is_stale: form.is_stale,
      };
      return editing ? api.put(`/financial-accounts/${editing.id}`, metadata) :
        api.post('/financial-accounts', { ...metadata, currency: form.currency, balance: form.balance, balance_as_of: form.balance_as_of });
    },
    onSuccess: () => { refresh(); setShowForm(false); setEditing(null); setNotice('Account saved.'); },
  });
  const status = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) => api.patch(`/financial-accounts/${id}`, { is_archived: archived }),
    onSuccess: (_, variables) => { refresh(); setNotice(variables.archived ? 'Account archived. Balance history is preserved.' : 'Account restored.'); },
  });
  const record = useMutation({
    mutationFn: ({ id, balance, balance_as_of }: { id: string; balance: string; balance_as_of: string }) =>
      api.post(`/financial-accounts/${id}/balances`, { balance, balance_as_of }),
    onSuccess: () => { refresh(); setObservation({ balance: '', balance_as_of: today() }); setNotice('Balance observation recorded. Earlier observations are preserved.'); },
  });
  const openForm = (account: Account | null) => {
    save.reset();
    setNotice('');
    setEditing(account);
    setForm(account ? {
      ...newForm(), name: account.name, account_type: account.account_type, currency: account.currency,
      institution: account.institution_name ? (knownInstitutions.includes(account.institution_name) ? account.institution_name : 'other') : '',
      custom_institution: account.institution_name ?? '', account_suffix: account.account_suffix ?? '', is_stale: account.is_stale,
    } : newForm());
    setShowForm(true);
  };
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate(); };

  return (
    <section className="financial-accounts" aria-label="Manual financial accounts">
      <div className="account-actions">
        <h2>Accounts</h2>
        <button className="btn-primary" disabled={save.isPending} onClick={() => openForm(null)}>Add Account</button>
        <label><input type="checkbox" checked={includeArchived} onChange={event => setIncludeArchived(event.target.checked)} /> Include archived accounts</label>
      </div>
      <p>Manual balances only. No bank connection, transaction linking, or automatic net-worth updates. Currencies are kept separate.</p>
      <p role="status">{notice}</p>
      {status.error && <ErrorMessage message={message(status.error)} />}
      {showForm && (
        <form className="financial-form" onSubmit={submit}>
          <fieldset disabled={save.isPending} className="account-fieldset">
          <h3>{editing ? 'Edit Account' : 'New Account'}</h3>
          <div className="account-fields">
            <div className="form-group"><label htmlFor="account-name">Account name</label><input id="account-name" required maxLength={100} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></div>
            <div className="form-group"><label htmlFor="account-type">Account type</label><select id="account-type" value={form.account_type} onChange={event => setForm({ ...form, account_type: event.target.value as AccountType })}>{accountTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><p>Create a separate entry for each checking, savings, credit-card, or investment account, even at the same institution.</p></div>
            <div className="form-group"><label htmlFor="account-currency">Currency</label><select id="account-currency" disabled={editing !== null} value={form.currency} onChange={event => setForm({ ...form, currency: event.target.value })}>{currencies.map(currency => <option key={currency} value={currency}>{currency === 'GHS' ? 'GHS - Ghanaian cedi' : currency}</option>)}</select>{editing && <p>Currency cannot change once balance history exists.</p>}</div>
            <div className="form-group"><label htmlFor="account-institution">Institution (optional)</label><select id="account-institution" value={form.institution} onChange={event => setForm({ ...form, institution: event.target.value })}><option value="">None / cash account</option>{institutions.map(group => <optgroup key={group.group} label={group.group}>{group.names.map(name => <option key={name}>{name}</option>)}</optgroup>)}<option value="other">Other / enter manually</option></select><p>Curated US and Ghanaian institutions, financial apps, and mobile-money providers; not a complete directory.</p>{institutionHints[form.institution] && <p>{institutionHints[form.institution]}</p>}</div>
            {form.institution === 'other' && <div className="form-group"><label htmlFor="account-custom-institution">Other institution name</label><input id="account-custom-institution" required maxLength={100} value={form.custom_institution} onChange={event => setForm({ ...form, custom_institution: event.target.value })} /></div>}
            <div className="form-group"><label htmlFor="account-suffix">Last four digits (optional)</label><input id="account-suffix" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={form.account_suffix} onChange={event => setForm({ ...form, account_suffix: event.target.value })} /><p>Never enter a full account/card number or CVV.</p></div>
            {!editing && <>
              <div className="form-group"><label htmlFor="account-balance">Initial balance / amount owed</label><input id="account-balance" type="number" required step="0.01" value={form.balance} onChange={event => setForm({ ...form, balance: event.target.value })} /></div>
              <div className="form-group"><label htmlFor="account-balance-date">Balance as of</label><input id="account-balance-date" type="date" required value={form.balance_as_of} onChange={event => setForm({ ...form, balance_as_of: event.target.value })} /></div>
            </>}
          </div>
          <p>For credit cards and loans, enter the amount owed. A negative value indicates a credit or overpayment.</p>
          <label><input type="checkbox" checked={form.is_stale} onChange={event => setForm({ ...form, is_stale: event.target.checked })} /> Mark balance outdated</label>
          {save.error && <ErrorMessage message={message(save.error)} />}
          <div className="account-actions"><button className="btn-primary" disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save Account'}</button><button type="button" className="btn-secondary" disabled={save.isPending} onClick={() => setShowForm(false)}>Cancel</button></div>
          </fieldset>
        </form>
      )}
      {accounts.isLoading ? <LoadingSpinner message="Loading accounts..." /> :
        accounts.error ? <ErrorMessage message={message(accounts.error)} onRetry={() => { void accounts.refetch(); }} /> :
          accounts.data?.length ? [...new Set(accounts.data.map(account => account.currency))].map(currency => (
            <section key={currency} aria-label={`${currency} accounts`}>
              <h3>{currency} accounts</h3>
              <div className="account-list">{accounts.data?.filter(account => account.currency === currency).map(account => (
                <article className="account-card" key={account.id}>
                  <h4>{account.name}{account.is_archived ? ' (Archived)' : ''}</h4>
                  <p>{account.institution_name ?? 'No institution'}{account.account_suffix ? ` - ending ${account.account_suffix}` : ''}</p>
                  <p>{accountTypes.find(([value]) => value === account.account_type)?.[1]}</p>
                  <p><strong>{account.account_type === 'credit_card' || account.account_type === 'loan' ? 'Amount owed' : 'Balance'}: {account.balance === null ? 'No recorded balance' : `${account.currency} ${account.balance}`}</strong></p>
                  <p>Manual balance as of <time dateTime={account.balance_as_of ?? undefined}>{account.balance_as_of ?? 'unknown date'}</time></p>
                  {account.balance_recorded_at && <p>Recorded {new Date(account.balance_recorded_at).toLocaleString()}</p>}
                  <p>{balanceStatus(account)}</p>
                  <div className="account-actions">
                    <button className="btn-secondary" disabled={record.isPending} aria-label={`View ${account.name}`} onClick={() => { setSelectedId(account.id); record.reset(); setObservation({ balance: '', balance_as_of: today() }); }}>View details / update balance</button>
                    <button className="btn-secondary" disabled={account.is_archived || save.isPending} aria-label={`Edit ${account.name}`} onClick={() => openForm(account)}>Edit</button>
                    <button className="btn-secondary" disabled={status.isPending || save.isPending || record.isPending} aria-label={`${account.is_archived ? 'Restore' : 'Archive'} ${account.name}`} onClick={() => status.mutate({ id: account.id, archived: !account.is_archived })}>{account.is_archived ? 'Restore' : 'Archive'}</button>
                  </div>
                </article>
              ))}</div>
            </section>
          )) : <EmptyState title="No accounts yet" message="Add a manually tracked account. Existing transactions and savings goals are unchanged." />}
      {selectedId && (
        <section className="account-detail" aria-label="Account balance history">
          <button className="btn-secondary" onClick={() => setSelectedId(null)}>Close details</button>
          {detail.isLoading ? <LoadingSpinner message="Loading account history..." /> :
            detail.error ? <ErrorMessage message={message(detail.error)} onRetry={() => { void detail.refetch(); }} /> :
              detail.data && <>
                <h3>{detail.data.account.name}: balance history</h3>
                <p>The latest balance-as-of date is authoritative. A newer entry for the same date takes precedence; backdated entries do not replace a later balance.</p>
                {!detail.data.account.is_archived && <form className="financial-form" onSubmit={event => { event.preventDefault(); record.mutate({ id: detail.data.account.id, ...observation }); }}>
                  <fieldset disabled={record.isPending} className="account-fieldset">
                  <h4>Record balance observation</h4>
                  <div className="form-group"><label htmlFor="observation-balance">New balance / amount owed ({detail.data.account.currency})</label><input id="observation-balance" type="number" required step="0.01" value={observation.balance} onChange={event => setObservation({ ...observation, balance: event.target.value })} /></div>
                  <div className="form-group"><label htmlFor="observation-date">Observation date</label><input id="observation-date" type="date" required value={observation.balance_as_of} onChange={event => setObservation({ ...observation, balance_as_of: event.target.value })} /></div>
                  {record.error && <ErrorMessage message={message(record.error)} />}
                  <button className="btn-primary" disabled={record.isPending}>{record.isPending ? 'Recording...' : 'Record Balance'}</button>
                  </fieldset>
                </form>}
                <ul>{detail.data.balance_history.map(balance => <li key={balance.id}><time dateTime={balance.balance_as_of}>{balance.balance_as_of}</time>: {detail.data.account.currency} {balance.balance} (recorded {new Date(balance.recorded_at).toLocaleString()})</li>)}</ul>
              </>}
        </section>
      )}
    </section>
  );
}
