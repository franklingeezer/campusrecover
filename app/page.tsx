
import Link from "next/link";
import {
  ArrowRight,
  Search,
  PackageCheck,
  ShieldCheck,
  MapPin,
  Clock3,
  HeartHandshake,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Easy Discovery",
    description:
      "Search lost and found reports by item, category, date and campus location.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Recovery",
    description:
      "A structured claim process helps protect belongings and prevent false claims.",
  },
  {
    icon: HeartHandshake,
    title: "Community Powered",
    description:
      "Help fellow students reconnect with the belongings they have misplaced.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F6F8F7]">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#176B55] text-white">
              <Search size={21} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#173D32]">
                CampusRecover
              </h1>
              <p className="text-[10px] tracking-widest text-slate-500">
                DIU COMMUNITY SERVICES
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#176B55] px-4 py-2 text-sm font-medium text-white hover:bg-[#125642]"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E6EFEA] px-4 py-2 text-sm font-medium text-[#176B55]">
            <span className="h-2 w-2 rounded-full bg-[#176B55]" />
            A better campus recovery experience
          </span>

          <h2 className="mt-7 text-4xl font-bold leading-tight tracking-tight text-[#173D32] md:text-6xl">
            Lost something?
            <br />
            <span className="text-[#176B55]">
              Let's bring it back.
            </span>
          </h2>

          <p className="mt-6 max-w-lg text-base leading-8 text-slate-600">
            CampusRecover makes it easier for the DIU community
            to report lost belongings, discover found items and
            reconnect people with what matters.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#176B55] px-6 py-3.5 font-semibold text-white transition hover:bg-[#125642]"
            >
              Report an item
              <ArrowRight size={18} />
            </Link>

            <a
              href="#how-it-works"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              How it works
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <ShieldCheck size={17} className="text-[#176B55]" />
              Secure access
            </span>
            <span className="flex items-center gap-2">
              <Clock3 size={17} className="text-[#176B55]" />
              Simple reporting
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={17} className="text-[#176B55]" />
              Campus focused
            </span>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Welcome to</p>
              <h3 className="mt-1 text-2xl font-bold text-[#173D32]">
                CampusRecover
              </h3>
            </div>
            <div className="rounded-2xl bg-[#E6EFEA] p-3 text-[#176B55]">
              <PackageCheck size={28} />
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            What brings you here today?
          </p>

          <div className="mt-6 grid gap-4">
            <Link
              href="/register"
              className="group flex items-center justify-between rounded-2xl border border-slate-200 p-5 transition hover:border-[#176B55] hover:bg-[#F6F8F7]"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-[#E6EFEA] p-3 text-[#176B55]">
                  <Search size={23} />
                </div>
                <div>
                  <h4 className="font-semibold text-[#173D32]">
                    I lost something
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Find your missing belongings
                  </p>
                </div>
              </div>
              <ArrowRight className="text-slate-400 transition group-hover:text-[#176B55]" />
            </Link>

            <Link
              href="/register"
              className="group flex items-center justify-between rounded-2xl border border-slate-200 p-5 transition hover:border-[#176B55] hover:bg-[#F6F8F7]"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-[#E6EFEA] p-3 text-[#176B55]">
                  <PackageCheck size={23} />
                </div>
                <div>
                  <h4 className="font-semibold text-[#173D32]">
                    I found something
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Help return an item to its owner
                  </p>
                </div>
              </div>
              <ArrowRight className="text-slate-400 transition group-hover:text-[#176B55]" />
            </Link>
          </div>

          <div className="mt-6 rounded-xl bg-[#F6F8F7] p-4">
            <p className="text-sm font-medium text-[#173D32]">
              Your campus. Your community.
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Every recovered item is one less worry for someone.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="how-it-works"
        className="border-t border-slate-200 bg-white px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#176B55]">
              Why CampusRecover
            </p>
            <h3 className="mt-3 text-3xl font-bold text-[#173D32]">
              Recovery made simpler.
            </h3>
            <p className="mt-3 leading-7 text-slate-500">
              A centralized platform designed to make lost and
              found management more organized, secure and accessible.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 p-7"
                >
                  <div className="inline-flex rounded-xl bg-[#E6EFEA] p-3 text-[#176B55]">
                    <Icon size={24} />
                  </div>
                  <h4 className="mt-5 text-lg font-semibold text-[#173D32]">
                    {feature.title}
                  </h4>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-[#F6F8F7] px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-slate-500 md:flex-row">
          <p>© 2026 CampusRecover · DIU Community Services</p>
          <p>Helping belongings find their way home.</p>
        </div>
      </footer>
    </main>
  );
}
