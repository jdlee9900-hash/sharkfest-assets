'use client'

import { useState } from 'react'
import { SharkNavbar } from '@/components/navigation/SharkNavbar/SharkNavbar'
import { SharkFooter } from '@/components/navigation/SharkFooter/SharkFooter'
import { SharkQuickLinks } from '@/components/navigation/SharkQuickLinks/SharkQuickLinks'
import { SharkHeroBanner } from '@/components/display/SharkHeroBanner/SharkHeroBanner'
import { SharkSectionHeader } from '@/components/display/SharkSectionHeader/SharkSectionHeader'
import { SharkStatCard } from '@/components/display/SharkStatCard/SharkStatCard'
import { SharkNavCard } from '@/components/display/SharkNavCard/SharkNavCard'
import { SharkButton } from '@/components/primitives/SharkButton/SharkButton'
import { SharkBadge } from '@/components/primitives/SharkBadge/SharkBadge'
import { SharkCard } from '@/components/primitives/SharkCard/SharkCard'
import { SharkModal } from '@/components/primitives/SharkModal/SharkModal'
import { SharkAccordion } from '@/components/primitives/SharkAccordion/SharkAccordion'
import { SharkTabs } from '@/components/primitives/SharkTabs/SharkTabs'
import { SharkCountdown } from '@/components/live/SharkCountdown/SharkCountdown'
import { SharkLiveFeed } from '@/components/live/SharkLiveFeed/SharkLiveFeed'
import { SharkTimeline } from '@/components/schedule/SharkTimeline/SharkTimeline'
import { SharkPitchGrid } from '@/components/pitches/SharkPitchGrid/SharkPitchGrid'
import { SharkMapViewer } from '@/components/pitches/SharkMapViewer/SharkMapViewer'
import { SharkPhotoGrid } from '@/components/gallery/SharkPhotoGrid/SharkPhotoGrid'
import { SharkRegistrationForm } from '@/components/forms/SharkRegistrationForm/SharkRegistrationForm'
import { Ticket, ArrowRight } from 'lucide-react'

// ── Sample data ──────────────────────────────────────────────────────────────

const FESTIVAL_START = new Date('2028-05-26T12:00:00')
const FESTIVAL_END   = new Date('2028-05-29T23:59:00')

const now = new Date()

const EVENTS = [
  { id: '1', title: 'Opening ceremony',   location: 'Main Stage',  category: 'general', startTime: new Date(now.getTime() - 7200000),  endTime: new Date(now.getTime() - 5400000) },
  { id: '2', title: 'Main Stage set',     subtitle: 'The headliner', location: 'Main Stage', category: 'music', startTime: new Date(now.getTime() - 1800000), endTime: new Date(now.getTime() + 1800000) },
  { id: '3', title: 'DJ Night',           location: 'Lakeside',    category: 'dj',      startTime: new Date(now.getTime() + 3600000),  endTime: new Date(now.getTime() + 7200000) },
  { id: '4', title: 'Saturday rugby',     location: 'Main Pitch',  category: 'rugby',   startTime: new Date(now.getTime() + 10800000), endTime: new Date(now.getTime() + 14400000) },
  { id: '5', title: 'Food village opens', location: 'Village Sq.', category: 'food',    startTime: new Date(now.getTime() + 14400000), endTime: new Date(now.getTime() + 21600000) },
]

const PITCHES = Array.from({ length: 24 }, (_, i) => ({
  id: `p${i}`,
  area: (['A', 'B', 'C'] as const)[Math.floor(i / 8)],
  number: (i % 8) + 1,
  name: i % 3 === 0 ? ['Smith','Davies','Johnson','Williams','Brown','Taylor','Evans','Thomas'][i % 8] : undefined,
  note: i === 5 ? 'Saturday only' : undefined,
}))

const PHOTOS = Array.from({ length: 12 }, (_, i) => ({
  id: String(i),
  src: `https://images.unsplash.com/photo-${['1493225457124-a3eb161ffa5f','1506905925346-21bda4d32df4','1571019613454-1cb2f99b2d8b','1459749411175-04bf5292ceea','1540575467063-178a50c2df87','1501281668745-a7a57abb5d70'][i % 6]}?w=600&q=80`,
  alt: `SharkFest 2027 — photo ${i + 1}`,
  filename: `sharkfest-2027-${String(i + 1).padStart(2, '0')}.jpg`,
}))

const FAQS = [
  { question: 'What time do gates open?',        answer: 'Gates open Friday at 12:00. Saturday and Sunday from 08:00. Late arrival is fine — just slower.' },
  { question: 'Can I bring my own food?',         answer: 'Absolutely. No restrictions on food for camping. Traders are on-site all three days.' },
  { question: 'Is the site dog-friendly?',        answer: 'Dogs welcome in camping areas on a lead. Not permitted in the food village or grandstand.' },
  { question: 'Where do I collect my wristband?', answer: 'Wristbands are issued at the main gate. Bring photo ID and your booking confirmation.' },
  { question: 'Is there parking?',                answer: 'Yes — day and weekend passes available. Book in advance; it sells out by Friday afternoon.' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({ id, children, dark, className }: { id?: string; children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <section id={id} className={`py-16 md:py-20 px-6 ${dark ? 'bg-[#0f172a]' : 'bg-[#fafaf9]'} ${className ?? ''}`}>
      <div className="max-w-[1000px] mx-auto">{children}</div>
    </section>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false)
  const [activeQuickLink, setActiveQuickLink] = useState('what-to-bring')

  return (
    <main className="min-h-screen">
      <SharkNavbar onRegister={() => setModalOpen(true)} />

      {/* Hero */}
      <SharkHeroBanner
        eyebrow="Torbay Sharks RFC · Devon Coast"
        title="SharkFest 2028"
        subtitle="Three days, two stages, one pack of sharks."
        stats={[
          { value: '42',  label: 'acts' },
          { value: '216', label: 'pitches' },
          { value: '3',   label: 'days' },
        ]}
      >
        <SharkButton variant="accent" size="lg" rightIcon={<Ticket className="w-5 h-5" />} onClick={() => setModalOpen(true)}>
          Get tickets
        </SharkButton>
        <SharkButton variant="ghost" size="lg" className="!text-white hover:!bg-white/10">
          See what&apos;s on
        </SharkButton>
      </SharkHeroBanner>

      {/* Quick links */}
      <SharkQuickLinks links={[
        { label: 'Getting here',   active: activeQuickLink === 'getting-here',   onClick: () => setActiveQuickLink('getting-here') },
        { label: 'What to bring',  active: activeQuickLink === 'what-to-bring',  onClick: () => setActiveQuickLink('what-to-bring') },
        { label: 'Site rules',     active: activeQuickLink === 'site-rules',     onClick: () => setActiveQuickLink('site-rules') },
        { label: 'Family camping', active: activeQuickLink === 'family-camping', onClick: () => setActiveQuickLink('family-camping') },
        { label: 'Accessibility',  active: activeQuickLink === 'accessibility',  onClick: () => setActiveQuickLink('accessibility') },
        { label: 'Food village',   active: activeQuickLink === 'food-village',   onClick: () => setActiveQuickLink('food-village') },
      ]} />

      {/* Event info */}
      <Section id="event-info">
        <SharkSectionHeader eyebrow="By the numbers" title="SharkFest 2028" subtitle="Year four sees us doubling the main stage line-up and adding a third long-table tent." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <SharkStatCard value="42"  unit="acts"     label="Across two stages"      accentColor="#fbbf24" />
          <SharkStatCard value="216" unit="pitches"  label="Across areas A, B & C"  accentColor="#38bdf8" />
          <SharkStatCard value="3"                   label="Days of live music"      accentColor="#7c3aed" />
          <SharkStatCard value="4"                   label="Years running"           accentColor="#15803d" />
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <SharkNavCard tag="Programme"  title="Friday → Sunday"   description="Three days, two stages, one pack of sharks." number="01" accentColor="#7c3aed" href="#programme" />
          <SharkNavCard tag="Pitches"    title="Find your spot"    description="Areas A, B and C — sea views go fast."        number="02" accentColor="#15803d" href="#pitches" />
          <SharkNavCard tag="Gallery"    title="See the photos"    description="Shots from SharkFest 2027."                   number="03" accentColor="#0e7490" href="#gallery" />
          <SharkNavCard tag="Food"       title="The Village"       description="Long-table tents, street food, three bars."   number="04" accentColor="#c2410c" />
          <SharkNavCard tag="FAQs"       title="Got questions?"    description="Everything you need before you arrive."       number="05" accentColor="#b45309" href="#faqs" />
          <SharkNavCard tag="Register"   title="Grab your pitch"   description="Camping and day-tickets available now."       number="06" accentColor="#e11d48" onClick={() => setModalOpen(true)} />
        </div>
      </Section>

      {/* Live programme */}
      <Section id="programme" dark>
        <SharkSectionHeader eyebrow="What's on" title="Live programme" subtitle="Full schedule — updated in real time during the festival." className="[&_h2]:text-white [&_p]:text-white/60" />
        <div className="grid md:grid-cols-2 gap-8">
          <SharkLiveFeed events={EVENTS} festivalStart={FESTIVAL_START} festivalEnd={FESTIVAL_END} />
          <div>
            <p className="font-display text-white/50 text-xs tracking-[0.2em] uppercase mb-4">Full timeline</p>
            <SharkTimeline events={EVENTS} phase="live" />
          </div>
        </div>
      </Section>

      {/* Pitches */}
      <Section id="pitches">
        <SharkSectionHeader eyebrow="Pitches" title="Find your spot" subtitle="Areas A, B and C. Sea views go fast — register early." />
        <div className="grid md:grid-cols-[1fr_320px] gap-6 mb-8">
          <SharkPitchGrid pitches={PITCHES} />
          <SharkMapViewer mapUrl="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" alt="SharkFest site map" />
        </div>
      </Section>

      {/* Gallery */}
      <Section id="gallery">
        <SharkSectionHeader eyebrow="Gallery" title="SharkFest 2027" subtitle="Warm, grainy, very Devon. Photos from last year." />
        <SharkPhotoGrid photos={PHOTOS} view="grid" />
      </Section>

      {/* Component showcase */}
      <Section dark>
        <SharkSectionHeader eyebrow="Design system" title="Shark UI" subtitle="Every component used across the festival site." className="[&_h2]:text-white [&_p]:text-white/60" />
        <div className="space-y-10">
          <div>
            <p className="font-display text-white/50 text-xs tracking-[0.2em] uppercase mb-4">Buttons</p>
            <div className="flex flex-wrap gap-3">
              <SharkButton variant="primary">Register now</SharkButton>
              <SharkButton variant="secondary">View map</SharkButton>
              <SharkButton variant="ghost" className="!text-white hover:!bg-white/10">Skip</SharkButton>
              <SharkButton variant="accent" rightIcon={<ArrowRight className="w-4 h-4" />}>Get tickets</SharkButton>
              <SharkButton variant="danger">Cancel</SharkButton>
              <SharkButton loading loadingText="Saving…">Save</SharkButton>
              <SharkButton disabled>Disabled</SharkButton>
            </div>
          </div>
          <div>
            <p className="font-display text-white/50 text-xs tracking-[0.2em] uppercase mb-4">Badges</p>
            <div className="flex flex-wrap gap-2">
              {(['live','soon','past','success','warning','danger','info','brand','cat-music','cat-dj','cat-rugby','cat-food','cat-bar','cat-wellness','cat-kids','area-a','area-b'] as const).map(v => (
                <SharkBadge key={v} variant={v} dot={v === 'live'} pulse={v === 'live'}>{v}</SharkBadge>
              ))}
            </div>
          </div>
          <div>
            <p className="font-display text-white/50 text-xs tracking-[0.2em] uppercase mb-4">Cards</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <SharkCard variant="default" accent="#fbbf24" hover>
                <h3 className="font-display text-2xl text-[#0f172a]">Default</h3>
                <p className="text-sm text-[#64748b] mt-1">White card with gold top accent.</p>
              </SharkCard>
              <SharkCard variant="elevated" hover>
                <h3 className="font-display text-2xl text-[#0f172a]">Elevated</h3>
                <p className="text-sm text-[#64748b] mt-1">No border, deeper shadow.</p>
              </SharkCard>
              <SharkCard variant="glass">
                <h3 className="font-display text-2xl text-white">Glass</h3>
                <p className="text-sm text-white/60 mt-1">Blur over dark backgrounds.</p>
              </SharkCard>
            </div>
          </div>
          <div>
            <p className="font-display text-white/50 text-xs tracking-[0.2em] uppercase mb-4">Countdown to SharkFest 2028</p>
            <SharkCountdown targetDate={FESTIVAL_START} />
          </div>
        </div>
      </Section>

      {/* FAQs */}
      <Section id="faqs">
        <SharkSectionHeader eyebrow="FAQs" title="Got questions?" subtitle="Everything you need to know before you arrive." />
        <div className="max-w-2xl mx-auto mb-12">
          <SharkAccordion items={FAQS} />
        </div>
        <div className="max-w-xl">
          <p className="font-display text-[#0f172a] text-xs tracking-[0.2em] uppercase mb-4">Programme by day</p>
          <SharkTabs variant="pill" items={[
            { id: 'fri', label: 'Friday',   content: <p className="text-sm text-[#64748b]">Gates 12:00. Main Stage from 17:00. Long-table tent from 18:00.</p> },
            { id: 'sat', label: 'Saturday', content: <p className="text-sm text-[#64748b]">Full day from 08:00. Rugby from 10:00, music until midnight.</p> },
            { id: 'sun', label: 'Sunday',   content: <p className="text-sm text-[#64748b]">Finale from 09:00. Final sets 17:00. Site clears 22:00.</p> },
          ]} />
        </div>
      </Section>

      {/* Registration */}
      <Section id="register" dark>
        <SharkSectionHeader eyebrow="Register" title="Grab your pitch" subtitle="Doors open — fill in your details and we'll confirm your spot by email." className="[&_h2]:text-white [&_p]:text-white/60" />
        <div className="max-w-lg mx-auto bg-white rounded-[24px] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.2)]">
          <SharkRegistrationForm />
        </div>
      </Section>

      <SharkFooter />

      {/* Registration modal */}
      <SharkModal open={modalOpen} onClose={() => setModalOpen(false)} title="Register for SharkFest" description="Complete the form below to secure your pitch." size="lg"
        footer={<SharkButton variant="ghost" onClick={() => setModalOpen(false)}>Close</SharkButton>}
      >
        <SharkRegistrationForm onSubmit={() => setModalOpen(false)} />
      </SharkModal>
    </main>
  )
}
