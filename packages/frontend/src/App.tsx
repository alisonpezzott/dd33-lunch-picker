import { useRef, useState, type FormEvent } from 'react';
import {
  ArrowDown, ArrowRight, Check, ChevronDown, CircleHelp, Clock3, Coffee,
  Heart, Leaf, MapPin, Moon, Pencil, Plus, RefreshCw, Search, Sparkles,
  Sun, ThumbsUp, Trash2, Trophy, Users, Utensils, X,
} from 'lucide-react';
import type { LunchPlaceRecord } from '@rayfin-app/shared';
import { useAppTheme } from '@/hooks/use-theme';
import { useLunch } from '@/hooks/use-lunch';
import { dailyResults, TEAM_TIMEZONE, teamDay } from '@/lib/lunch';
import type { PlaceInput } from '@/lib/lunch-service';

const primaryButton = 'inline-flex min-h-touch items-center justify-center gap-200 rounded-full bg-primary px-500 py-300 text-300 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50';
const quietButton = 'inline-flex min-h-touch items-center justify-center gap-200 rounded-full border border-border px-400 py-200 text-300 font-medium transition-colors hover:bg-muted';
const inputClass = 'min-h-touch w-full rounded-xl border border-input bg-card px-400 py-300 text-400 text-foreground placeholder:text-muted-foreground';
const cuisines = ['Anything tasty', 'Brazilian', 'Burgers', 'Pizza', 'Asian', 'Mexican', 'Salads', 'Cafe', 'Other'];

function PlateArt({ small = false }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 220 180" className={small ? 'h-art-small w-art-small' : 'h-art-small w-art-small sm:h-art sm:w-art'} fill="none" aria-hidden="true">
      <path d="M37 24l-4 40m11-39-4 40m-17-42-3 29q-1 14 13 16l-8 79m155-122q-21 22-16 65l11 1-7 58 13-1 12-123" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="105" cy="89" r="63" className="fill-card" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="105" cy="89" r="49" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" />
      <path d="M80 91q23 27 47-1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M86 75v4m36-4v4" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="m161 12 3 8 8 2-8 4-2 8-4-7-8-2 7-5zm-97 129 3 6 7 1-6 4-1 7-5-6-7-1 6-4z" className="fill-accent" stroke="currentColor" strokeWidth="1.5" />
      <path d="M68 162q33 12 66-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FoodIcon({ cuisine }: { cuisine: string }) {
  if (cuisine === 'Salads') return <Leaf className="icon-size-500" />;
  if (cuisine === 'Cafe') return <Coffee className="icon-size-500" />;
  return <Utensils className="icon-size-500" />;
}

function SuggestionForm({ editing, onSave, onClose, pending }: {
  editing?: LunchPlaceRecord;
  onSave: (input: PlaceInput) => Promise<boolean>;
  onClose: () => void;
  pending: boolean;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [cuisine, setCuisine] = useState(editing?.cuisine ?? cuisines[0]);
  const [budget, setBudget] = useState(editing?.budget ?? '$$');
  const [note, setNote] = useState(editing?.note ?? '');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    if (await onSave({ name: name.trim(), cuisine, budget, note: note.trim() })) onClose();
  }
  return (
    <form onSubmit={(event) => { void submit(event); }} className="mb-600 rounded-3xl border border-primary/30 bg-card p-600" aria-label={editing ? 'Edit suggestion' : 'Suggest a lunch spot'}>
      <div className="mb-500 flex items-center justify-between gap-300">
        <div>
          <h3 className="font-heading text-500 font-semibold">{editing ? 'A little menu update' : 'Know a good spot?'}</h3>
          <p className="mt-100 text-muted-foreground">Share your go-to. It might be the team&apos;s next favorite.</p>
        </div>
        <button type="button" className="flex min-h-touch min-w-touch items-center justify-center rounded-full hover:bg-muted" aria-label="Close suggestion form" onClick={onClose} disabled={pending}><X className="icon-size-300" /></button>
      </div>
      <label className="block font-medium" htmlFor="place-name">Place name <span className="text-muted-foreground">(required)</span></label>
      <input id="place-name" autoFocus required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Where should we eat?" className={`${inputClass} mt-200`} disabled={pending} />
      <div className="mt-400 grid grid-cols-2 gap-400">
        <label className="font-medium">Cuisine
          <select className={`${inputClass} mt-200`} value={cuisine} onChange={(event) => setCuisine(event.target.value)} disabled={pending}>
            {cuisines.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="font-medium">Budget
          <select className={`${inputClass} mt-200`} value={budget} onChange={(event) => setBudget(event.target.value)} disabled={pending}>
            <option value="$">$ · Budget-friendly</option><option value="$$">$$ · Everyday treat</option><option value="$$$">$$$ · A little fancy</option>
          </select>
        </label>
      </div>
      <label htmlFor="place-note" className="mt-400 block font-medium">The inside scoop <span className="text-muted-foreground">(optional)</span></label>
      <textarea id="place-note" rows={2} maxLength={240} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Location, a must-try dish, or why you love it..." className={`${inputClass} mt-200 resize-y`} disabled={pending} />
      <div className="mt-500 flex justify-end gap-200">
        <button type="button" className={quietButton} onClick={onClose} disabled={pending}>Cancel</button>
        <button type="submit" className={primaryButton} disabled={pending || !name.trim()}><Plus className="icon-size-200" />{pending ? 'Saving...' : editing ? 'Save changes' : 'Add to the menu'}</button>
      </div>
    </form>
  );
}

function App() {
  const lunch = useLunch();
  const { isDark, toggleTheme } = useAppTheme();
  const [query, setQuery] = useState('');
  const [cuisine, setCuisine] = useState('All cuisines');
  const [sort, setSort] = useState('Most votes');
  const [form, setForm] = useState<'new' | LunchPlaceRecord | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const formRegion = useRef<HTMLDivElement>(null);
  // Use the current team day even while a midnight refresh is in flight.
  const day = teamDay();
  const results = dailyResults(lunch.data?.places ?? [], lunch.data?.ballots ?? [], day);
  const myVote = lunch.data?.ballots.find((ballot) => ballot.owner_id === lunch.data?.userId && ballot.day === day);
  const winner = results.leaders[0];
  const tied = results.leaders.length > 1;
  const disabled = lunch.pending || lunch.loading || Boolean(lunch.error) || !lunch.data;
  const choices = ['All cuisines', ...new Set((lunch.data?.places ?? []).map((place) => place.cuisine))];
  const visible = results.ranked.filter((place) =>
    (cuisine === 'All cuisines' || place.cuisine === cuisine) &&
    `${place.name} ${place.cuisine} ${place.note ?? ''}`.toLowerCase().includes(query.toLowerCase()),
  );
  if (sort === 'A to Z') visible.sort((a, b) => a.name.localeCompare(b.name));
  const date = new Intl.DateTimeFormat('en-US', { timeZone: TEAM_TIMEZONE, weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());

  function openForm(value: 'new' | LunchPlaceRecord = 'new') {
    setForm(value);
    setTimeout(() => formRegion.current?.scrollIntoView({ behavior: 'instant', block: 'center' }), 0);
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-board items-center justify-between gap-400 px-500 py-500 sm:px-800">
          <a href="#" className="flex items-center gap-300" aria-label="Lunch Picker home">
            <span className="flex h-touch w-touch items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Utensils className="icon-size-400" strokeWidth={1.7} /></span>
            <span className="font-heading text-600 font-bold tracking-tight">lunch<span className="font-regular">picker</span><span className="text-primary">.</span></span>
          </a>
          <nav className="hidden items-center gap-800 md:flex" aria-label="Main navigation">
            <a href="#menu" className="font-semibold text-primary">Today&apos;s vote</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground">How it works</a>
          </nav>
          <div className="flex items-center gap-300">
            <span className="hidden items-center gap-200 border-r border-border pr-500 text-200 text-muted-foreground lg:flex"><Users className="icon-size-200" />Good food, together</span>
            <button type="button" onClick={toggleTheme} className="flex h-touch w-touch items-center justify-center rounded-full border border-border hover:bg-muted" aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>{isDark ? <Sun className="icon-size-300" /> : <Moon className="icon-size-300" />}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-board px-500 pb-800 sm:px-800">
        <div className="flex flex-wrap items-center justify-between gap-300 pb-600 pt-800">
          <span className="inline-flex items-center gap-200 rounded-full border border-border bg-card px-400 py-200 text-200 font-medium"><span className="h-200 w-200 rounded-full bg-primary" />{date}</span>
          <span className="hidden items-center gap-200 text-200 text-muted-foreground sm:flex"><Clock3 className="icon-size-200" />Fresh day. Fresh cravings.</span>
        </div>

        <section className="grid items-stretch gap-800 pb-800 lg:grid-cols-2" aria-label="Today's lunch">
          <div className="relative flex flex-col justify-center py-500 lg:py-800">
            <div className="mb-500 flex items-center gap-200 text-200 font-bold tracking-label text-primary"><span className="h-px w-800 bg-primary" />THE DAILY LUNCH DILEMMA, SOLVED.</div>
            <h1 className="font-heading text-hero-900 leading-hero-900 font-bold tracking-tight sm:text-hero-1000 sm:leading-tight">Less debating.<br /><span className="relative inline-block">More eating.<svg className="absolute -bottom-200 left-0 h-300 w-full text-accent" viewBox="0 0 360 12" preserveAspectRatio="none" aria-hidden="true"><path d="M3 8Q165-3 356 5" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" /></svg></span></h1>
            <p className="mt-700 max-w-sm text-400 leading-500 text-muted-foreground">Your team. Your favorite spots. One delicious decision.<br className="hidden sm:block" /> Drop a suggestion and let the lunch votes roll in.</p>
            <div className="mt-600 flex flex-wrap items-center gap-400">
              <button type="button" className={primaryButton} onClick={() => openForm()} disabled={disabled}><Plus className="icon-size-300" />Suggest a spot</button>
              <a href="#menu" className="inline-flex min-h-touch items-center gap-200 font-medium">See the menu <ArrowDown className="icon-size-200" /></a>
            </div>
            <div className="mt-700 hidden items-center gap-200 text-200 text-muted-foreground sm:flex"><Heart className="icon-size-200" />Less &quot;anything is fine.&quot; More &quot;let&apos;s go!&quot;</div>
          </div>

          <aside className="relative flex flex-col overflow-hidden rounded-4xl border border-primary/10 bg-winner p-600 text-winner-foreground sm:p-800" aria-label="Today's winner">
            <div className="flex items-center justify-between gap-300">
              <span className="flex items-center gap-200 text-200 font-bold tracking-label"><Trophy className="icon-size-200" />TODAY&apos;S PICK</span>
              <span className="flex items-center gap-200 rounded-full bg-card/70 px-300 py-100 text-200 font-medium"><span className={`h-200 w-200 rounded-full ${lunch.error ? 'bg-muted-foreground' : 'bg-primary'}`} />{lunch.error ? 'Updates paused' : lunch.pending ? 'Saving...' : 'Live results'}</span>
            </div>
            <div className="flex flex-1 items-center justify-between gap-200 py-500">
              <div className="relative min-w-0 flex-1">
                <p className="mb-200 text-200 font-medium">{lunch.loading ? 'Setting the table...' : lunch.error && !lunch.data ? 'A small pause before lunch' : tied ? 'A delicious deadlock!' : winner ? 'The team has good taste' : 'A little hungry. A little undecided.'}</p>
                <h2 className="break-words font-heading text-600 leading-600 font-bold sm:text-hero-800 sm:leading-hero-800">{lunch.loading ? 'Good things are coming.' : lunch.error && !lunch.data ? 'Let’s reconnect.' : tied ? 'It’s a tie!' : winner ? winner.name : <>The table<br />is still open.</>}</h2>
                {winner && <p className="mt-300 text-300">{tied ? `${results.leaders.length} spots tied with` : 'Leading with'} <strong>{winner.votes} {winner.votes === 1 ? 'vote' : 'votes'}</strong></p>}
              </div>
              <div className="pointer-events-none absolute right-200 bottom-300 -rotate-6 opacity-10 sm:static sm:shrink-0 sm:opacity-100"><PlateArt /></div>
            </div>
            {tied && <p className="mb-400 break-words text-300">{results.leaders.map((place) => place.name).join(' + ')}</p>}
            <div className="flex flex-wrap items-center justify-between gap-300 border-t border-primary/15 pt-400 text-200">
              <span className="flex items-center gap-200"><Users className="icon-size-200" />{lunch.loading || (!lunch.data && lunch.error) ? 'Waiting for the lunch board' : `${results.total} ${results.total === 1 ? 'teammate has' : 'teammates have'} voted today`}</span>
              <span>{winner ? 'Every vote can change the menu.' : 'Your vote could start something tasty.'}</span>
            </div>
          </aside>
        </section>

        <div className="mb-800 flex flex-wrap items-center justify-between gap-300 rounded-2xl border border-border bg-card px-500 py-400">
          <span className="flex items-center gap-300"><span className="flex h-touch w-touch shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><ThumbsUp className="icon-size-300" /></span><span><strong className="font-semibold">{myVote ? 'Your vote is on the menu!' : 'One teammate. One vote. Zero lunch drama.'}</strong><span className="mt-100 block text-200 text-muted-foreground">{myVote ? `You picked ${lunch.data?.places.find((place) => place.id === myVote.place_id)?.name ?? 'a spot'}. Changed your mind? Pick another spot below.` : 'Pick your craving below. You can change your vote anytime today.'}</span></span></span>
          {myVote ? <button className={`${quietButton} shrink-0 text-muted-foreground`} onClick={() => { void lunch.withdraw(); }} disabled={disabled}>Undo my vote</button> : <span className="hidden rounded-full bg-muted px-300 py-200 text-200 text-muted-foreground sm:inline">Resets at midnight · São Paulo</span>}
        </div>

        <div className="grid items-start gap-800 lg:grid-cols-3">
          <section id="menu" className="min-w-0 scroll-mt-600 lg:col-span-2" aria-labelledby="menu-heading">
            <div className="mb-500 flex flex-wrap items-center justify-between gap-300">
              <div className="flex items-center gap-300"><h2 id="menu-heading" className="font-heading text-600 font-bold tracking-tight">What&apos;s on the menu?</h2>{lunch.data && <span className="rounded-full bg-secondary px-300 py-100 font-numeric text-200 text-secondary-foreground">{lunch.data.places.length}</span>}</div>
              <button className="flex min-h-touch items-center gap-200 text-200 font-semibold text-primary" type="button" onClick={() => openForm()} disabled={disabled}><Plus className="icon-size-200" />Add a spot</button>
            </div>
            <div className="mb-500 flex flex-wrap items-center gap-200">
              <label className="relative min-w-0 flex-1 basis-full sm:basis-0"><span className="sr-only">Search lunch spots</span><Search className="pointer-events-none absolute top-300 left-300 icon-size-300 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find your next craving..." className="min-h-touch w-full rounded-xl border border-input bg-card py-300 pr-300 pl-touch text-300" /></label>
              <label className="relative"><span className="sr-only">Filter by cuisine</span><select className="min-h-touch max-w-art appearance-none rounded-xl border border-input bg-card py-300 pr-800 pl-300 text-200" value={cuisine} onChange={(event) => setCuisine(event.target.value)}>{choices.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute top-400 right-300 icon-size-100 text-muted-foreground" /></label>
              <label className="sr-only" htmlFor="sort">Sort lunch spots</label><select id="sort" value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-touch rounded-xl border border-input bg-card px-300 text-200"><option>Most votes</option><option>A to Z</option></select>
            </div>

            <div ref={formRegion}>{form && <SuggestionForm key={typeof form === 'string' ? form : form.id} editing={typeof form === 'string' ? undefined : form} pending={lunch.pending} onClose={() => setForm(null)} onSave={async (input) => {
              const saved = await lunch.suggest(input, typeof form === 'string' ? undefined : form);
              if (saved) { setQuery(''); setCuisine('All cuisines'); }
              return saved;
            }} />}</div>
            {lunch.error && <div role="alert" className="mb-500 rounded-2xl border border-destructive/30 bg-card p-500"><h3 className="font-semibold text-destructive">We hit a little lunch snag.</h3><p className="mt-200 text-300 text-muted-foreground">{lunch.error}</p><button className={`${quietButton} mt-400`} onClick={() => { void lunch.refresh(); }} disabled={lunch.pending}><RefreshCw className="icon-size-200" />Refresh the board</button></div>}
            <p role="status" aria-live="polite" className={lunch.notice ? 'mb-400 flex items-center gap-200 text-300 text-primary' : 'sr-only'}>{lunch.notice && <Check className="icon-size-200" />}{lunch.notice}</p>
            {lunch.loading ? <div role="status" aria-label="Loading lunch spots" className="grid gap-400 sm:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-loading motion-safe:animate-pulse rounded-3xl border border-border bg-muted" />)}</div> : lunch.data && visible.length > 0 ? (
              <div className="grid gap-400 sm:grid-cols-2">
                {visible.map((place) => {
                  const selected = myVote?.place_id === place.id;
                  const own = place.owner_id === lunch.data?.userId;
                  const palette = place.cuisine === 'Salads' ? 'bg-secondary text-secondary-foreground' : place.cuisine === 'Cafe' || place.cuisine === 'Asian' ? 'bg-lavender text-lavender-foreground' : place.cuisine === 'Pizza' || place.cuisine === 'Mexican' ? 'bg-peach text-peach-foreground' : 'bg-sunshine text-sunshine-foreground';
                  return (
                    <article key={place.id} className={`flex min-w-0 flex-col rounded-3xl border bg-card p-500 transition-colors ${selected ? 'border-primary shadow-sm' : 'border-border hover:border-primary/30'}`}>
                      <div className="flex items-start justify-between gap-300">
                        <span className={`flex h-hero w-hero shrink-0 items-center justify-center rounded-2xl ${palette}`}><FoodIcon cuisine={place.cuisine} /></span>
                        <div className="flex min-w-0 flex-wrap items-center justify-end gap-100">
                          {selected && <span className="flex items-center gap-100 rounded-full bg-secondary px-200 py-100 text-200 font-medium text-secondary-foreground"><Check className="icon-size-100" />Your pick</span>}
                          {own && <><button className="flex h-touch w-touch shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label={`Edit ${place.name}`} onClick={() => openForm(place)} disabled={disabled}><Pencil className="icon-size-200" /></button><button className="flex h-touch w-touch shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label={`Delete ${place.name}`} onClick={() => setDeleting(place.id)} disabled={disabled || place.votes > 0} title={place.votes ? 'A spot with votes stays on the menu' : 'Remove your suggestion'}><Trash2 className="icon-size-200" /></button></>}
                        </div>
                      </div>
                      <h3 className="mt-400 break-words font-heading text-500 leading-500 font-bold">{place.name}</h3>
                      <p className="mt-100 flex items-center gap-200 text-200 text-muted-foreground"><span>{place.cuisine}</span><span aria-hidden="true">·</span><span aria-label={`Budget: ${place.budget}`}>{place.budget}</span></p>
                      {place.note && <p className="mt-300 flex items-start gap-100 break-words text-200 leading-300 text-muted-foreground"><MapPin className="mt-100 icon-size-100 shrink-0" /><span className="min-w-0">{place.note}</span></p>}
                      <div className="mt-auto pt-500">
                        {deleting === place.id ? <div role="alert" className="rounded-xl bg-muted p-300"><p className="text-200">Remove <strong>{place.name}</strong> from the menu?</p><div className="mt-200 flex gap-200"><button className={quietButton} onClick={() => setDeleting(null)} disabled={lunch.pending}>Keep it</button><button className={`${quietButton} text-destructive`} disabled={lunch.pending} onClick={async () => { if (await lunch.remove(place.id)) setDeleting(null); }}>Remove</button></div></div> : <div className="flex items-center justify-between gap-200 border-t border-border pt-400"><span className="flex items-center gap-200 text-200 text-muted-foreground"><Users className="icon-size-200" /><strong className="font-numeric text-400 text-foreground">{place.votes}</strong>{place.votes === 1 ? 'vote' : 'votes'}</span><button className={selected ? `${quietButton} border-primary/20 bg-secondary text-secondary-foreground` : `${quietButton} hover:border-primary hover:bg-secondary`} disabled={disabled || selected || place.id.startsWith('pending-')} onClick={() => { void lunch.vote(place.id); }} aria-label={selected ? `Voted for ${place.name}` : `Vote for ${place.name}`} aria-pressed={selected}>{selected ? <Check className="icon-size-200" /> : <Plus className="icon-size-200" />}{selected ? 'Voted' : 'Vote'}</button></div>}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : lunch.data && !lunch.error ? <div className="flex flex-col items-center rounded-3xl border border-dashed border-input bg-card/50 px-500 py-800 text-center"><span className="mb-400 flex h-art-small w-art-small items-center justify-center rounded-full bg-secondary text-secondary-foreground"><PlateArt small /></span><h3 className="font-heading text-500 font-semibold">{lunch.data.places.length ? 'No cravings found.' : 'Every great lunch starts with a suggestion.'}</h3><p className="mt-200 max-w-sm text-muted-foreground">{lunch.data.places.length ? 'Try another search or cuisine. Your next favorite is out there.' : 'Be the first to put a place on the menu. The team can take it from there.'}</p><button className={`${primaryButton} mt-500`} disabled={disabled} onClick={() => { if (lunch.data?.places.length) { setQuery(''); setCuisine('All cuisines'); } else openForm(); }}>{lunch.data.places.length ? 'Clear filters' : 'Suggest the first spot'}<ArrowRight className="icon-size-200" /></button></div> : null}
          </section>

          <aside className="space-y-500 lg:pt-200">
            <section id="how-it-works" className="rounded-3xl border border-border bg-card p-600" aria-labelledby="how-heading">
              <span className="mb-500 inline-flex items-center gap-200 rounded-full bg-muted px-300 py-100 text-200 text-muted-foreground"><CircleHelp className="icon-size-100" />THE LUNCH LOWDOWN</span>
              <h2 id="how-heading" className="font-heading text-500 font-bold">From &quot;where?&quot; to &quot;let&apos;s go.&quot;</h2>
              <ol className="mt-600 space-y-600">
                {[['01', 'Drop a delicious idea', 'That neighborhood gem? Put it on the menu.'], ['02', 'Vote with your appetite', 'One vote a day. Change it if a new craving hits.'], ['03', 'Follow the lunch leader', 'Most votes takes the top spot. Tied? Rally a teammate!']].map(([number, title, description]) => <li key={number} className="flex gap-300"><span className="pt-100 font-numeric text-200 text-primary">{number}</span><div><h3 className="text-300 font-semibold">{title}</h3><p className="mt-100 text-200 leading-300 text-muted-foreground">{description}</p></div></li>)}
              </ol>
              <div className="mt-600 flex items-start gap-200 border-t border-border pt-400 text-200 leading-300 text-muted-foreground"><Clock3 className="mt-100 icon-size-200 shrink-0" /><p>New day, clean slate. Votes reset at midnight in São Paulo. Your favorite spots stick around.</p></div>
            </section>
            <div className="relative overflow-hidden rounded-3xl bg-peach p-600 text-peach-foreground">
              <Sparkles className="mb-300 icon-size-400" strokeWidth={1.5} />
              <p className="max-w-xs font-heading text-600 leading-600 font-medium">The best part of lunch?<br />The company.</p>
              <p className="mt-300 text-200">Step away from the screen. Grab a bite together.</p>
              <Heart className="absolute top-500 right-500 icon-size-500 rotate-12" strokeWidth={1.3} />
            </div>
          </aside>
        </div>
        <footer className="mt-800 flex flex-wrap items-center justify-between gap-300 border-t border-border py-600 text-200 text-muted-foreground"><span className="flex items-center gap-200"><Utensils className="icon-size-100" />A little less deciding. A little more dining.</span><span>Made for your hungry team <Heart className="ml-100 inline icon-size-100" /></span></footer>
      </main>
    </div>
  );
}

export default App;
